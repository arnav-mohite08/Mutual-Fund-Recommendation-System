from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import sys, os, traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fund import FundRecommender

app = Flask(__name__)
CORS(app)

# ── Load once ─────────────────────────────────────────────────────────────────
risk_model     = joblib.load('risk_model.pkl')
category_model = joblib.load('category_model.pkl')
df_funds       = pd.read_csv("dataset/fund_features.csv")

ranking_model = FundRecommender()
ranking_model.load()

# ── Helpers ───────────────────────────────────────────────────────────────────
def clamp(v, lo, hi): return max(lo, min(hi, v))

def sanitize_rate(rate):
    """
    Ensure rate is a realistic annual % figure (e.g. 12.5, not 0.125 or 1250).
    - If stored as a fraction < 2  (e.g. 0.12) → multiply by 100
    - If absurdly large (>60)      → cap at 40 (still generous for equity)
    - Floor at -30 (worst crash)
    """
    if rate is None or (isinstance(rate, float) and np.isnan(rate)):
        return 10.0
    rate = float(rate)
    if abs(rate) < 2.0:          # stored as 0.12 → convert to 12.0
        rate *= 100.0
    return float(np.clip(rate, -30.0, 40.0))

def get_allocation(age, risk_score, horizon, salary, investment):
    inp = pd.DataFrame([{
        "age": age, "risk_score": risk_score,
        "investment_horizon_years": horizon,
        "salary_lpa": salary, "monthly_investment": investment,
    }])
    inp = inp[category_model.feature_names_in_]
    raw = category_model.predict(inp)[0]
    alloc = {"Equity": float(raw[0]), "Debt": float(raw[1]), "Hybrid": float(raw[2])}
    total = sum(alloc.values())
    return {k: v / total for k, v in alloc.items()} if total > 0 else alloc

def interpolate_rate(row, horizon):
    """Linearly interpolate sanitized annual return % at any horizon (years)."""
    bps = [(y, c) for y, c in [
        (1,"return_1y"),(3,"return_3y"),(5,"return_5y"),
        (10,"return_10y"),(15,"return_15y"),(20,"return_20y")
    ] if c in row.index]
    if not bps:
        return sanitize_rate(float(row.get("cagr", 10.0)))
    ys = [b[0] for b in bps]
    rs = [sanitize_rate(float(row[b[1]])) for b in bps]
    if horizon <= ys[0]: return rs[0]
    if horizon >= ys[-1]: return rs[-1]
    for i in range(len(ys)-1):
        if ys[i] <= horizon <= ys[i+1]:
            t = (horizon - ys[i]) / (ys[i+1] - ys[i])
            return rs[i] + t*(rs[i+1]-rs[i])
    return rs[-1]

def build_fv_series(funds_result, alloc, monthly_investment, horizon, df):
    """Year-by-year SIP future value using interpolated rates."""
    fund_rates = {}
    fund_annual_rates = {}
    for cat, info in funds_result.items():
        row = df[df["fund_name"] == info["fund_name"]]
        if row.empty:
            cat_rows = df[df["category"] == cat]
            raw_rate = float(cat_rows["cagr"].median()) if not cat_rows.empty else 10.0
            rate = sanitize_rate(raw_rate)
        else:
            rate = interpolate_rate(row.iloc[0], horizon)
        fund_rates[cat] = rate / 100.0          # convert % → decimal for math
        fund_annual_rates[cat] = round(rate, 2)  # keep % for display

    monthly_alloc = {c: alloc.get(c, 0) * monthly_investment for c in ["Equity","Debt","Hybrid"]}

    series = []
    for yr in range(0, int(horizon) + 1):
        pt = {"year": yr}
        total = 0.0
        for cat in ["Equity","Debt","Hybrid"]:
            r_annual  = fund_rates.get(cat, 0.10)
            r_monthly = r_annual / 12.0
            n = yr * 12
            P = monthly_alloc.get(cat, 0.0)
            if n == 0:
                fv = 0.0
            elif abs(r_monthly) < 1e-9:
                fv = P * n
            else:
                fv = P * (((1 + r_monthly)**n - 1) / r_monthly) * (1 + r_monthly)
            pt[cat] = round(fv, 2)
            total += fv
        pt["Total"]    = round(total, 2)
        pt["Invested"] = round(monthly_investment * yr * 12, 2)
        series.append(pt)
    return series, fund_annual_rates

def risk_meta(score):
    if score < 0.35: return "Conservative", "blue"
    elif score < 0.65: return "Moderate", "amber"
    else: return "Aggressive", "red"

def full_response(age, salary, horizon, investment, risk_score, alloc, funds):
    fv_series, rates = build_fv_series(funds, alloc, investment, horizon, df_funds)
    label, color = risk_meta(risk_score)
    return {
        "success":      True,
        "risk_score":   round(risk_score, 3),
        "risk_label":   label,
        "risk_color":   color,
        "allocation":   {k: round(v*100, 1) for k, v in alloc.items()},
        "funds":        funds,
        "future_value": fv_series,
        "fund_rates":   rates,
    }

@app.route('/api/debug/fund-rates', methods=['GET'])
def debug_fund_rates():
    return_cols = ["cagr","return_1y","return_3y","return_5y","return_10y","return_15y","return_20y"]
    present = [c for c in return_cols if c in df_funds.columns]
    sample = df_funds[["fund_name","category"] + present].head(20).to_dict(orient="records")
    stats  = df_funds[present].describe().to_dict()
    return jsonify({"columns": present, "sample": sample, "stats": stats})

@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        d = request.get_json()
        age = float(d['age']); salary = float(d['salary'])
        expenses = float(d['expenses']); horizon = float(d['horizon'])
        investment = float(d['monthly_investment'])

        risk_inp = pd.DataFrame([{"age":age,"income_lpa":salary,"expenses_lpa":expenses,"investment_horizon_years":horizon}])
        risk_inp = risk_inp[risk_model.feature_names_in_]
        risk_score = clamp(float(risk_model.predict(risk_inp)[0]), 0.0, 1.0)

        alloc = get_allocation(age, risk_score, horizon, salary, investment)
        funds = ranking_model.recommend(df_funds, risk_score=risk_score, allocation=alloc, horizon=horizon, monthly_investment=investment)

        resp = full_response(age, salary, horizon, investment, risk_score, alloc, funds)
        resp["model_risk_score"] = round(risk_score, 3)
        return jsonify(resp)
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/api/rebalance', methods=['POST'])
def rebalance():
    try:
        d = request.get_json()
        age = float(d['age']); salary = float(d['salary'])
        horizon = float(d['horizon']); investment = float(d['monthly_investment'])
        risk_score = clamp(float(d['risk_score']), 0.0, 1.0)

        alloc = get_allocation(age, risk_score, horizon, salary, investment)
        funds = ranking_model.recommend(df_funds, risk_score=risk_score, allocation=alloc, horizon=horizon, monthly_investment=investment)

        return jsonify(full_response(age, salary, horizon, investment, risk_score, alloc, funds))
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
