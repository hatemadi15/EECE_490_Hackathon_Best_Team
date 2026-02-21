import pandas as pd
import numpy as np

def run_full_forecast(cleaned_data_dict, features_df):
    """
    Placeholder for skforecast logic since fitting XGB/LGB depends heavily on
    the exact structure of aggregated sales data over 13 months.
    Returns dummy format expected by frontend.
    """
    # Expected output:
    return {
        "historical": {
            "dates": ["2025-01-01", "2025-02-01", "2025-03-01", "2025-04-01", "2025-05-01"],
            "actual_sales": [1234, 1456, 1300, 1600, 1550]
        },
        "forecast": {
            "dates": ["2026-02-01", "2026-03-01", "2026-04-01"],
            "predicted_sales": [1500, 1620, 1580],
            "lower_bound": [1350, 1450, 1400],
            "upper_bound": [1650, 1790, 1750]
        },
        "metrics": {
            "mae": 123.4,
            "mape": 8.5
        },
        "feature_importance": [
            {"feature": "avg_temp", "importance": 0.25},
            {"feature": "is_summer", "importance": 0.18}
        ],
        "external_factors_used": ["weather"]
    }
