import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor


class FundRecommender:

    def __init__(self, model_path="ranking_model.pkl"):
        self.model_path = model_path
        self.model = None

        self.features = [
            "cagr", "volatility", "sharpe",
            "expense_ratio", "aum"
        ]

    def train(self, df):
        df = df.copy()

        df["score"] = (
            0.4 * df["sharpe"] +
            0.3 * df["cagr"] -
            0.2 * df["volatility"] -
            0.1 * df["expense_ratio"]
        )

        X = df[self.features]
        y = df["score"]

        self.model = XGBRegressor()
        self.model.fit(X, y)

        joblib.dump(self.model, self.model_path)
        print("Model trained successfully")

    def load(self):
        self.model = joblib.load(self.model_path)

    def get_return_col(self, horizon):
        if horizon <= 2:
            return "return_1y"
        elif horizon <= 5:
            return "return_3y"
        elif horizon <= 8:
            return "return_5y"
        elif horizon <= 12:
            return "return_10y"
        elif horizon <= 17:
            return "return_15y"
        else:
            return "return_20y"

    def recommend(self, df, risk_score, allocation, horizon, monthly_investment):

        df = df.copy()
        original_df = df.copy()

        df["base_score"] = self.model.predict(df[self.features])

        return_col = self.get_return_col(horizon)

        if return_col not in df.columns:
            return_col = "return_5y"

        df["time_score"] = df[return_col] / df[return_col].max()

        df["score"] = 0.5 * df["base_score"] + 0.5 * df["time_score"]

        df.loc[df["category"] == "Equity", "score"] *= (1 + risk_score)
        df.loc[df["category"] == "Debt", "score"] *= (1 + (1 - risk_score))
        df.loc[df["category"] == "Hybrid", "score"] *= 1.1

        result = {}

        for category in ["Equity", "Debt", "Hybrid"]:

            category_df = df[df["category"] == category].copy()

            if category_df.empty:
                category_df = original_df[original_df["category"] == category].copy()

            if category_df.empty:
                continue

            weight = allocation.get(category, 0.33)
            category_df["final_score"] = category_df["score"] * (1 + weight)

            category_df["final_score"] += np.random.normal(
                0, 0.03, len(category_df)
            )

            ranked = category_df.sort_values(by="final_score", ascending=False)

            top_k = ranked.head(5)

            if top_k.empty:
                continue

            selected = top_k.sample(1).iloc[0]

            result[category] = {
                "fund_name": selected["fund_name"],
                "score": round(selected["final_score"], 3),
                "allocation": round(weight * monthly_investment, 2)
            }

        return result