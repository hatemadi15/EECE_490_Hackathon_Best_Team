# Stories Coffee - AI Command Center (Hackathon Prototype)

![Stories Dashboard Mockup](https://via.placeholder.com/1000x400?text=Stories+Coffee+Command+Center)

## The Vision
This project, developed for the **EECE 490 Hackathon**, empowers **Stories Coffee** executives by transforming raw OMEGA POS data and external signals into actionable AI-driven strategies. 

## Features
* **Intelligent File Intake:** Upload raw Omega POS exports (Product Profitability, Monthly Sales, etc.). The backend automatically detects the format, cleans the data, parses the nested headers, and fixes truncation bugs.
* **K-Means Branch Clustering:** Machine learning segments branches based on performance, automatically assigning operational strategies (e.g., *Flagship*, *Underperforming*).
* **BCG Matrix Classification:** We evaluate the entire menu corpus to categorize items into Stars, Plowhorses, Puzzles, and Dogs based on popularity and profit margins.
* **Demand Forecasting:** Simulates advanced regressor (LightGBM/XGBoost) predictions utilizing purely external factors (Open-Meteo Weather API + local Lebanese calendar events) to predict volume 6-months into the future.
* **Executive Summary:** A dynamic PDF or printable view summarizing the above insights for the C-Suite.

## Quick Start (Docker)

Ensure Docker Desktop is running.

```bash
# Clone the repository
git clone https://github.com/hatemadi15/Purpigal_Prototype.git
cd Purpigal_Prototype

# Start the application bundle
docker-compose up --build
```
> The Frontend will run on `http://localhost:5173`
> The Backend API will run on `http://localhost:8000`

## Tech Stack
* **Frontend:** React + Vite, Tailwind CSS, Recharts, Lucide Icons, React Dropzone.
* **Backend:** FastAPI, Pandas, Scikit-Learn, Uvicorn, Python 3.11.

## Architecture & Data Flow
1. **Frontend Dropzone:** User uploads 4 specific CSV files.
2. **FastAPI Upload Endpoint:** Receives files, buffers them in memory.
3. **Data Cleaning Pipeline:** `pipeline/cleaning.py` standardizes column names, drops POS header fluff, and parses numeric strings safely.
4. **Feature Engineering:** `pipeline/feature_engineering.py` pulls external, open-source weather data via Open-Meteo and creates timeline vectors.
5. **Model Execution (On-The-Fly):** Data is routed to `clustering.py`, `menu_engineering.py`, and `forecasting.py`. 
6. **Unified JSON:** Results are synthesized into a single highly-structured JSON payload returned to the frontend.
7. **Interactive Dashboards:** React renders the data beautifully.
