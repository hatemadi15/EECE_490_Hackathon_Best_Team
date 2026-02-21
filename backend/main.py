from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
import json

app = FastAPI(title="Stories Coffee Analytics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_files(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    file3: UploadFile = File(...),
    file4: UploadFile = File(...)
):
    try:
        content1 = await file1.read()
        content2 = await file2.read()
        content3 = await file3.read()
        content4 = await file4.read()
        
        df1 = pd.read_csv(StringIO(content1.decode("utf-8")))
        df2 = pd.read_csv(StringIO(content2.decode("utf-8")))
        df3 = pd.read_csv(StringIO(content3.decode("utf-8")))
        df4 = pd.read_csv(StringIO(content4.decode("utf-8")))
        
        from pipeline.cleaning import clean_all
        from pipeline.feature_engineering import build_feature_table
        from models.clustering import run_full_clustering
        from models.menu_engineering import run_full_menu_analysis
        from models.forecasting import run_full_forecast
        
        cleaned = clean_all(df1, df2, df3, df4)
        features = build_feature_table(cleaned)
        
        clustering_results = run_full_clustering(cleaned, features)
        menu_results = run_full_menu_analysis(cleaned, clustering_results)
        forecast_results = run_full_forecast(cleaned, features)
        
        return {
            "status": "success",
            "clustering": clustering_results,
            "menu_engineering": menu_results,
            "forecast": forecast_results,
            "executive_summary": "Summary text here"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
