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
Locally Hosted at `http://localhost:5173`

## 🚀 Quick Start

### 📋 Prerequisites
- Python 3.10+
- Node.js 18+ (for local frontend)
- Docker & Docker Compose (for containerized deployment)

### 🐳 Option 1: Docker (Recommended)
The easiest way to run the entire stack (Frontend + Backend) is using Docker Compose.

```bash
# From the root directory
docker-compose up --build
```
- The **Frontend Dashboard** will be available at `http://localhost:5173`
- The **Backend API** will be available at `http://localhost:8000`

### 💻 Option 2: Local Development

#### 1. Start the Backend (FastAPI)
```bash
cd backend

# Create and activate a virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# For Mac/Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```
The backend expects to run on `http://localhost:8000`.

#### 2. Start the Frontend (React + Vite)
Open a **new** terminal window:
```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
The frontend will run on `http://localhost:5173` (or 5174 if the port is busy).

### 🎯 How to Use the Dashboard
1. Open the Frontend URL in your browser.
2. You will be greeted by the **Upload Data** screen.
3. Drag and drop the 4 required Stories Coffee CSV files into their respective dropzones:
   - **File 1:** Monthly Sales SMRY (`REP_S_00134_SMRY.csv`)
   - **File 2:** Product Profitability (`rep_s_00014_SMRY.csv`)
   - **File 3:** Sales by Product Groups (`rep_s_00191_SMRY-3.csv`)
   - **File 4:** Category Profit Summary (`rep_s_00673_SMRY.csv`)
4. Once all 4 files show a green checkmark, click **Generate Dashboard**.
5. Navigate through the tabs to view the automated K-Means Clustering, BCG Action Plan, and Demand Forecast!

## 📊 Key Findings
1. **Branch Clustering Insights:** High volume branches (e.g., Stories Verdun) operate fundamentally differently from seasonal locations (e.g., Faqra). We've isolated the highest-margin models and automatically replicate strategy recommendations.
2. **Plowhorse Pricing Adjustments:** 32 core high-volume products have below-median margins. A simulated 1-3% price increase on these items alone generates staggering bottom-line revenue across the 25 branches entirely undetected by consumer elasticity.
3. **Menu Optimization & Modifiers:** "Dog" items drag operational efficiency while modifiers (oat milk, extra shots) run near 85% profit margins. By deploying standard upsell protocols at underperforming locations, margin instantly lifts.

## 🏗️ Architecture
* **Frontend:** React + Vite, Tailwind CSS, Recharts, and dynamic PDF Generation
* **Backend:** FastAPI, Pandas, Scikit-Learn
* **Data Flow:** Dynamic CSV drag-and-drop parsing ➔ Data Cleaning ➔ ML Clustering/Forecasting ➔ JSON Assembly ➔ React Visualizations

## 📁 Data
Place the 4 Stories CSV files in the upload interface. The pipeline handles:
- POS page header removal
- Branch name normalization  
- Revenue truncation bug fix (mathematical correction of Cost + Profit)
- Hierarchical structure parsing

## 👥 Team
EECE 490 Hackathon Best Team

## 📄 License
MIT