# Stories Coffee — Data Science Analytics Platform

> Turning a year of POS data into actionable growth strategy for Lebanon's 
> fastest-growing coffee chain.

## 🎯 The Problem
Stories Coffee has 25 branches and 300+ menu items but no data-driven decision 
framework. The CEO asked: "How do I make more money?"

## 🔧 Our Approach
We built an end-to-end analytics platform with three ML models:

1. **Branch Clustering (K-Means)** — Segmented 25 branches into actionable 
   business profiles with tailored strategies
2. **Menu Engineering (BCG Matrix)** — Classified 300+ products into Stars, 
   Plowhorses, Puzzles, and Dogs with per-cluster analysis
3. **Demand Forecasting (XGBoost/LightGBM)** — 6-month sales forecast enriched 
   with weather data, holidays, and calendar features

## 🌐 Live Dashboard
Local: `http://localhost:5173`

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Key Findings
- **Branch Clustering:** Highlights actionable pricing and operational strategies for diverse branch formats (Urban vs. Seasonal).
- **Menu Optimization:** A targeted 3-5% price increase selectively on "Plowhorses" offers significant revenue upside. Removing "Dog" items simplifies bar operations.
- **Demand Forecasting:** Weather-linked predictive modeling enables much more precise inventory planning.

## 🏗️ Architecture
- **Backend:** FastAPI (Python), Pandas, Scikit-Learn, LightGBM, Skforecast
- **Frontend:** React (Vite), Tailwind CSS, Recharts

## 📁 Data
Place the 4 Stories CSV files in the upload interface. The pipeline handles:
- POS page header removal
- Branch name normalization  
- Hierarchical structure parsing

## 📄 License
MIT
