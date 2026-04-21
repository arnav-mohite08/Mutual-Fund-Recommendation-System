A full-stack web application that recommends personalised mutual fund portfolios using machine learning models.

## Project Structure

```
fundwise/
├── backend/
│   ├── app.py              ← Flask API server
│   ├── fund.py             ← FundRecommender class (copy your file here)
│   ├── requirements.txt
│   ├── risk_model.pkl      ← Copy your .pkl files here
│   ├── category_model.pkl
│   ├── ranking_model.pkl
│   └── dataset/
│       └── fund_features.csv  ← Copy your dataset here
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── InputForm.jsx
│   │   │   ├── RiskMeter.jsx
│   │   │   ├── AllocationChart.jsx
│   │   │   ├── FundCard.jsx
│   │   │   └── Results.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── start.sh
└── README.md
```

---

## Setup Instructions

### Step 1 — Copy your ML files into the backend folder

```
backend/
├── fund.py               ← your fund.py
├── risk_model.pkl
├── category_model.pkl
├── ranking_model.pkl
└── dataset/
    └── fund_features.csv
```

### Step 2 — Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3 — Install Node.js dependencies

```bash
cd frontend
npm install
```

### Step 4 — Start the servers

**Terminal 1 — Flask Backend:**
```bash
cd backend
python app.py
# Runs on http://localhost:5000
```

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

Then open **http://localhost:3000** in your browser.

---

## How It Works

| Input | → | Model | → | Output |
|-------|---|-------|---|--------|
| Age, Salary, Expenses, Horizon | → | `risk_model.pkl` | → | Risk Score (0–1) |
| Age, Risk Score, Horizon, Salary, SIP | → | `category_model.pkl` | → | Equity/Debt/Hybrid % |
| Fund features + allocation | → | `ranking_model.pkl` (XGBoost) | → | Top 3 Fund Picks |

## API Endpoint

**POST** `/api/recommend`

Request body:
```json
{
  "age": 28,
  "salary": 12.5,
  "expenses": 4.0,
  "horizon": 10,
  "monthly_investment": 20000
}
```

Response:
```json
{
  "success": true,
  "risk_score": 0.714,
  "risk_label": "Aggressive",
  "risk_color": "red",
  "allocation": { "Equity": 55.2, "Debt": 24.8, "Hybrid": 20.0 },
  "funds": {
    "Equity": { "fund_name": "...", "score": 3.142, "allocation": 11040.0 },
    "Debt":   { "fund_name": "...", "score": 2.891, "allocation": 4960.0 },
    "Hybrid": { "fund_name": "...", "score": 2.643, "allocation": 4000.0 }
  }
}
```
