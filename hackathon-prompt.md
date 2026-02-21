# Stories Coffee Hackathon — Full Build Prompt

## Context

You are building a full-stack data science project for a 12-hour hackathon. The client is **Stories**, a Lebanese coffee chain with 25 branches. You have 4 CSV files of real POS data covering Jan 2025 – Jan 2026. The CEO's brief: *"Tell me how to make more money."*

The deliverables are:
1. A **React frontend** dashboard the CEO can use (upload CSVs, see insights)
2. A **FastAPI Python backend** that handles data cleaning, ML models, and serves results
3. A **2-page Executive Summary PDF**
4. A clean **GitHub repo** with README, requirements.txt, and organized code

---

## Project Architecture

```
stories-coffee-analytics/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt           # Pinned dependencies
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── cleaning.py            # Data preprocessing pipeline
│   │   ├── feature_engineering.py # External data + feature creation
│   │   └── utils.py               # Branch name mapping, helpers
│   ├── models/
│   │   ├── __init__.py
│   │   ├── clustering.py          # K-Means branch clustering
│   │   ├── menu_engineering.py    # BCG matrix classification
│   │   └── forecasting.py         # XGBoost/LightGBM demand forecast
│   └── data/
│       └── (uploaded CSVs go here at runtime)
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── FileUpload.jsx      # CSV drag-and-drop upload
│   │   │   ├── BranchDashboard.jsx # Cluster viz + leaderboard
│   │   │   ├── MenuMatrix.jsx      # BCG scatter plot (interactive)
│   │   │   ├── ForecastView.jsx    # Time series forecast with toggles
│   │   │   └── ExecutiveSummary.jsx # Auto-generated summary view
│   │   └── styles/
│   └── public/
├── notebooks/
│   └── eda.ipynb                  # Exploratory analysis (for GitHub)
├── executive_summary.pdf
├── README.md
└── docker-compose.yml             # (bonus) Docker setup
```

---

## PART 1: BACKEND — Data Preprocessing Pipeline (`pipeline/cleaning.py`)

### File Descriptions

| File | Variable Name | Contents |
|------|--------------|----------|
| `REP_S_00134_SMRY.csv` | `file1` | Monthly sales by branch, 2025 vs 2026 YoY |
| `rep_s_00014_SMRY.csv` | `file2` | Product-level profitability (~14,600 rows) |
| `rep_s_00191_SMRY-3.csv` | `file3` | Sales by product groups & categories (~14,100 rows) |
| `rep_s_00673_SMRY.csv` | `file4` | Category profit summary by branch (~110 rows) |

### Cleaning Steps (apply to ALL files)

1. **Remove POS page headers**: Filter out any row where any cell contains a regex match for `Page \d+ of \d+`. These are repeated throughout every file.

2. **Remove empty/spacer rows**: Drop rows where all values are NaN or empty strings.

3. **Remove empty/spacer columns**: Drop columns where all values are NaN or empty strings.

4. **Normalize branch names**: Use this mapping dictionary to standardize all branch name references across all files:
```python
BRANCH_NAME_MAP = {
    'stories alay': 'Stories Aley',
    'Stories alay': 'Stories Aley',
    'Stories Ain El Mreisseh': 'Stories Ain El Mreisseh',
    'Stories.': 'Stories Unknown',
    # Add more as discovered during EDA — strip whitespace,
    # title-case normalize, and fuzzy-match remaining names
}

def normalize_branch_name(name):
    if pd.isna(name):
        return name
    name = str(name).strip()
    if name in BRANCH_NAME_MAP:
        return BRANCH_NAME_MAP[name]
    # Fallback: title case
    return name.title()
```

5. **Fix the Total Price truncation bug (Files 2 & 4 ONLY)**:
   - For **aggregate/summary rows** (branch totals, category totals — NOT individual product rows), the `Total Price` column is silently divided by 10 or 100 by the POS system.
   - Fix: For these rows, compute `True Revenue = Total Cost + Total Profit` and replace the `Total Price` value.
   - Individual product-level rows are NOT affected — leave them as-is.
   - Detection heuristic: If a row's `Total Price` is significantly less than `Total Cost + Total Profit` (e.g., ratio < 0.5), it's likely a truncated aggregate row.

6. **Parse numeric columns**: Strip commas, convert to float. Handle any non-numeric values gracefully.

7. **Parse File 1 structure**: File 1 has months as columns (January through December). Melt/unpivot into long format: `branch, year, month, sales`.

8. **Parse File 2 hierarchical structure**: File 2 is nested:
   ```
   Branch Name (header row)
     └── Service Type: TAKE AWAY / TABLE
           └── Category: BEVERAGES / FOOD
                 └── Section: HOT BAR / COLD BAR / DONUTS / etc.
                       └── Product rows with Qty, Total Price, Total Cost, etc.
   ```
   You need to parse this hierarchy and add `branch`, `service_type`, `category`, `section` columns to each product row. The hierarchy is indicated by indentation or by rows that contain only a name in the first column with no numeric data.

9. **Parse File 3 structure**: Similar hierarchical nesting by product group. Add a `product_group` column to each product row.

10. **Parse File 4 structure**: Branch → Category (BEVERAGES/FOOD) with aggregated metrics. Add `branch` column to each category row.

### Output
Each cleaned file should be a flat pandas DataFrame ready for analysis. Store them and serve via API.

---

## PART 2: BACKEND — Feature Engineering (`pipeline/feature_engineering.py`)

### External Data: Weather

Use the **Open-Meteo Historical Weather API** (free, no API key needed) to fetch daily weather data for Beirut from Jan 1, 2025 to Jan 31, 2026.

```python
import requests
import pandas as pd

def fetch_weather_data():
    """Fetch daily weather for Beirut from Open-Meteo API."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": 33.8938,
        "longitude": 35.5018,
        "start_date": "2025-01-01",
        "end_date": "2026-01-31",
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "rain_sum",
            "relative_humidity_2m_mean",
            "wind_speed_10m_max"
        ],
        "timezone": "Asia/Beirut"
    }
    response = requests.get(url, params=params)
    data = response.json()
    
    df = pd.DataFrame(data["daily"])
    df["date"] = pd.to_datetime(df["time"])
    df = df.drop(columns=["time"])
    return df
```

**Engineer these features from weather data** (aggregate to monthly to match File 1 granularity):
- `avg_temp` — monthly mean temperature
- `max_temp` — monthly max temperature
- `total_rain_days` — count of days with precipitation > 0
- `total_precipitation_mm` — sum of monthly precipitation
- `avg_humidity` — monthly mean relative humidity
- `is_hot_month` — binary: 1 if avg_temp > 28°C
- `temp_deviation` — how far avg_temp deviates from the annual mean

### External Data: Lebanese Holidays (Hardcoded)

```python
LEBANON_HOLIDAYS_2025 = {
    1: {"count": 1, "names": ["New Year's Day"], "has_ramadan": False},
    2: {"count": 1, "names": ["St. Maroun's Day (Feb 9)"], "has_ramadan": False},
    3: {"count": 2, "names": ["Ramadan Start (~Mar 1)", "Eid al-Fitr (~Mar 30-31)"], "has_ramadan": True},
    4: {"count": 3, "names": ["Eid al-Fitr cont.", "Good Friday", "Easter Monday"], "has_ramadan": False},
    5: {"count": 2, "names": ["Labour Day", "Liberation Day (May 25)"], "has_ramadan": False},
    6: {"count": 1, "names": ["Eid al-Adha (~Jun 6-7)"], "has_ramadan": False},
    7: {"count": 1, "names": ["Islamic New Year (~Jun 27)"], "has_ramadan": False},
    8: {"count": 1, "names": ["Assumption of Mary (Aug 15)"], "has_ramadan": False},
    9: {"count": 1, "names": ["Prophet's Birthday (~Sep 5)"], "has_ramadan": False},
    10: {"count": 0, "names": [], "has_ramadan": False},
    11: {"count": 2, "names": ["Independence Day (Nov 22)", "All Saints' Day"], "has_ramadan": False},
    12: {"count": 1, "names": ["Christmas Day"], "has_ramadan": False},
}

# Note: Exact Islamic holiday dates for 2025 depend on lunar calendar.
# Verify dates and adjust if needed. Ramadan 2025 was approximately March 1 – March 30.

def get_holiday_features(month: int) -> dict:
    """Return holiday features for a given month."""
    info = LEBANON_HOLIDAYS_2025.get(month, {"count": 0, "has_ramadan": False})
    return {
        "num_holidays": info["count"],
        "has_ramadan": int(info["has_ramadan"]),
        "is_festive_season": int(month in [12, 1, 3, 4]),  # Christmas, NY, Easter, Eid
    }
```

### External Data: Google Trends (Optional / Nice-to-Have)

```python
from pytrends.request import TrendReq

def fetch_google_trends():
    """Fetch Google Trends data for coffee-related terms in Lebanon."""
    pytrends = TrendReq(hl='en-US', tz=120)  # Lebanon = UTC+2
    
    keywords = ["coffee", "iced coffee", "stories coffee"]
    pytrends.build_payload(keywords, cat=0, timeframe='2025-01-01 2026-01-31', geo='LB')
    
    trends_df = pytrends.interest_over_time()
    # Resample to monthly and return
    if not trends_df.empty:
        monthly = trends_df.resample('M').mean()
        return monthly
    return pd.DataFrame()
```

**Note**: pytrends can be flaky. Wrap in try/except. If it fails, skip gracefully — the model works without it.

### Calendar Features (Computed, No API)

```python
def get_calendar_features(month: int, year: int = 2025) -> dict:
    """Generate calendar-based features for a given month."""
    import calendar
    
    # Number of weekend days (Friday + Saturday in Lebanon)
    cal = calendar.Calendar()
    days = list(cal.itermonthdays2(year, month))
    weekend_days = sum(1 for day, weekday in days if day != 0 and weekday in [4, 5])
    total_days = calendar.monthrange(year, month)[1]
    
    return {
        "month": month,
        "quarter": (month - 1) // 3 + 1,
        "is_summer": int(month in [6, 7, 8, 9]),
        "is_winter": int(month in [12, 1, 2]),
        "num_weekend_days": weekend_days,
        "num_weekdays": total_days - weekend_days,
        "is_school_month": int(month in [10, 11, 12, 1, 2, 3, 4, 5]),
        "is_peak_tourist": int(month in [7, 8]),
    }
```

### Master Feature Table

Combine all external features into one DataFrame indexed by `(year, month)` and merge with the monthly sales data from File 1. This becomes the input for the forecasting model.

---

## PART 3: BACKEND — Model 1: Branch Clustering (`models/clustering.py`)

### Goal
Segment the 25 branches into meaningful business profiles using K-Means clustering.

### Data Preparation
Merge features from File 1 and File 4 to create a feature vector per branch:

```python
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np

def prepare_branch_features(file1_df, file4_df):
    """
    Create feature matrix for branch clustering.
    
    Features per branch:
    1. total_annual_revenue — from File 1 (sum of monthly sales)
    2. revenue_seasonality — std(monthly_sales) / mean(monthly_sales) — coefficient of variation
    3. summer_winter_ratio — sum(Jun-Sep sales) / sum(Dec-Feb sales)
    4. beverage_food_ratio — beverage revenue / food revenue from File 4
    5. avg_profit_margin — weighted average profit % from File 4
    6. beverage_margin — beverage profit % from File 4
    7. food_margin — food profit % from File 4
    8. yoy_growth — Jan 2026 vs Jan 2025 growth rate (from File 1)
    9. takeaway_ratio — if available from File 2 aggregation, proportion of takeaway revenue
    """
    # Build features dataframe with one row per branch
    # ... (implement based on actual data structure)
    
    return branch_features_df

def run_clustering(branch_features_df, k_range=range(2, 8)):
    """
    Run K-Means with elbow method and silhouette score to select optimal k.
    """
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(branch_features_df)
    
    results = []
    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        inertia = kmeans.inertia_
        sil_score = silhouette_score(X_scaled, labels)
        results.append({"k": k, "inertia": inertia, "silhouette": sil_score})
    
    # Select k with highest silhouette score
    best_k = max(results, key=lambda x: x["silhouette"])["k"]
    
    # Fit final model
    final_model = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    branch_features_df["cluster"] = final_model.fit_predict(X_scaled)
    
    return branch_features_df, results, final_model

def label_clusters(branch_features_df):
    """
    Assign business-meaningful names to clusters based on feature profiles.
    
    Example logic:
    - High revenue + high seasonality → "Seasonal Hotspots" (Batroun, Faqra)
    - High revenue + low seasonality → "Urban Powerhouses" (Verdun, Ain El Mreisseh)
    - Moderate revenue + high food margin → "Food-Forward" (Mall branches)
    - Low revenue + low margin → "Underperformers" (needs attention)
    - University-adjacent + high takeaway → "Grab-and-Go Hubs" (LAU)
    """
    # Analyze cluster centroids and assign labels
    # Return dict mapping cluster_id → label + strategy recommendation
    pass
```

### Output for Frontend
Return JSON:
```json
{
    "clusters": [
        {
            "id": 0,
            "label": "Urban Powerhouses",
            "strategy": "Maximize upselling, premium modifiers, loyalty programs",
            "branches": ["Stories Verdun", "Stories Ain El Mreisseh", ...],
            "avg_revenue": 12345,
            "avg_margin": 0.65
        },
        ...
    ],
    "branch_data": [...],  // Each branch with features + cluster assignment
    "elbow_data": [...],   // For elbow chart
    "silhouette_data": [...] // For silhouette chart
}
```

---

## PART 4: BACKEND — Model 2: Menu Engineering / BCG Matrix (`models/menu_engineering.py`)

### Goal
Classify every product into Stars, Plowhorses, Puzzles, or Dogs using a BCG-style menu engineering matrix.

### Implementation

```python
import pandas as pd
import numpy as np

def classify_products(file2_df, scope="global"):
    """
    BCG Menu Engineering Matrix.
    
    Axes:
    - X-axis: Popularity (Qty sold, as % of category total)
    - Y-axis: Profitability (Total Profit %)
    
    Quadrants:
    - Star: High Popularity + High Profitability → Protect, feature prominently
    - Plowhorse: High Popularity + Low Profitability → Increase margin (raise price, reduce cost)
    - Puzzle: Low Popularity + High Profitability → Promote more, test as specials
    - Dog: Low Popularity + Low Profitability → Consider removing from menu
    
    Args:
        file2_df: Cleaned product-level data with columns:
                  [branch, service_type, category, section, product_desc, qty, 
                   total_price, total_cost, total_profit, total_profit_pct]
        scope: "global" for all branches combined, or a branch_cluster label
               to filter by cluster before classifying
    """
    # Filter to individual product rows only (not subtotals/totals)
    products = file2_df[file2_df["is_product_row"] == True].copy()
    
    if scope != "global":
        products = products[products["cluster"] == scope]
    
    # Aggregate across all branches (or cluster) per product
    product_agg = products.groupby("product_desc").agg(
        total_qty=("qty", "sum"),
        total_revenue=("total_price", "sum"),
        total_cost=("total_cost", "sum"),
        total_profit=("total_profit", "sum"),
    ).reset_index()
    
    product_agg["profit_pct"] = (product_agg["total_profit"] / product_agg["total_revenue"] * 100).round(2)
    
    # Compute popularity as percentage of total qty within category
    total_qty = product_agg["total_qty"].sum()
    product_agg["popularity_pct"] = (product_agg["total_qty"] / total_qty * 100).round(4)
    
    # Set thresholds at median (or 70th percentile for stricter classification)
    pop_threshold = product_agg["popularity_pct"].median()
    profit_threshold = product_agg["profit_pct"].median()
    
    # Classify
    def classify(row):
        high_pop = row["popularity_pct"] >= pop_threshold
        high_profit = row["profit_pct"] >= profit_threshold
        if high_pop and high_profit:
            return "Star"
        elif high_pop and not high_profit:
            return "Plowhorse"
        elif not high_pop and high_profit:
            return "Puzzle"
        else:
            return "Dog"
    
    product_agg["classification"] = product_agg.apply(classify, axis=1)
    
    # Add actionable recommendations
    RECOMMENDATIONS = {
        "Star": "Protect and feature prominently. Do not change pricing. Place at top of menu.",
        "Plowhorse": "High volume = high impact from small margin changes. Test 3-5% price increase or reduce ingredient cost. Even 1% margin improvement on these items has outsized impact.",
        "Puzzle": "Hidden gems. Promote via staff recommendations, limited-time features, social media. Test at prime menu position.",
        "Dog": "Evaluate for removal. Each Dog item adds menu complexity, inventory cost, and barista training overhead. Phase out lowest performers first."
    }
    product_agg["recommendation"] = product_agg["classification"].map(RECOMMENDATIONS)
    
    return product_agg, pop_threshold, profit_threshold

def per_cluster_analysis(file2_df, branch_cluster_map):
    """
    Run menu engineering per branch cluster.
    A product may be a Star in urban branches but a Dog in seasonal branches.
    This cross-reference is the key insight.
    """
    results = {}
    for cluster_label in branch_cluster_map["cluster"].unique():
        cluster_branches = branch_cluster_map[branch_cluster_map["cluster"] == cluster_label]["branch"].tolist()
        cluster_data = file2_df[file2_df["branch"].isin(cluster_branches)]
        classified, pop_t, prof_t = classify_products(cluster_data, scope=cluster_label)
        results[cluster_label] = {
            "products": classified,
            "pop_threshold": pop_t,
            "profit_threshold": prof_t
        }
    return results

def modifier_analysis(file2_df):
    """
    Analyze modifiers (extra shot, oat milk, almond milk, sugar-free syrup, etc.)
    
    Modifiers are nearly pure profit. Compute:
    - Modifier attachment rate per branch (% of orders with at least one modifier)
    - Revenue contribution of modifiers
    - Most/least popular modifiers
    - Branches with low modifier attachment = upsell opportunity
    
    Modifiers can be identified by keywords in product_desc:
    "Extra", "Add", "Oat Milk", "Almond Milk", "Coconut Milk", 
    "Sugar Free", "Syrup", "Whipped Cream", "Extra Shot"
    """
    modifier_keywords = [
        "extra shot", "oat milk", "almond milk", "coconut milk",
        "sugar free", "syrup", "whipped cream", "add", "extra"
    ]
    
    file2_df["is_modifier"] = file2_df["product_desc"].str.lower().apply(
        lambda x: any(kw in str(x) for kw in modifier_keywords)
    )
    
    # Per-branch modifier stats
    branch_modifier_stats = file2_df.groupby("branch").apply(
        lambda g: pd.Series({
            "total_items": g["qty"].sum(),
            "modifier_items": g[g["is_modifier"]]["qty"].sum(),
            "modifier_revenue": g[g["is_modifier"]]["total_price"].sum(),
            "modifier_profit": g[g["is_modifier"]]["total_profit"].sum(),
        })
    ).reset_index()
    
    branch_modifier_stats["attachment_rate"] = (
        branch_modifier_stats["modifier_items"] / branch_modifier_stats["total_items"] * 100
    ).round(2)
    
    return branch_modifier_stats
```

### Output for Frontend
```json
{
    "global_matrix": {
        "products": [...],       // Each product with classification, qty, profit%, recommendation
        "pop_threshold": 0.15,
        "profit_threshold": 45.2,
        "summary": {
            "stars": 45,
            "plowhorses": 38,
            "puzzles": 52,
            "dogs": 67
        }
    },
    "per_cluster": {
        "Urban Powerhouses": { ... },
        "Seasonal Hotspots": { ... },
        ...
    },
    "modifier_analysis": {
        "branch_stats": [...],
        "top_modifiers": [...],
        "upsell_opportunities": [...]  // Branches with lowest attachment rates
    }
}
```

---

## PART 5: BACKEND — Model 3: Demand Forecasting (`models/forecasting.py`)

### Goal
Forecast monthly sales per branch (or aggregated) using XGBoost/LightGBM with exogenous variables, via the **skforecast** library.

### Implementation

```python
import pandas as pd
import numpy as np
from skforecast.ForecasterAutoreg import ForecasterAutoreg
from skforecast.model_selection import backtesting_forecaster, grid_search_forecaster
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

def prepare_forecast_data(file1_long_df, weather_df, holiday_features, calendar_features, trends_df=None):
    """
    Merge monthly sales with all exogenous features.
    
    file1_long_df: Long format — columns: [branch, year, month, sales]
    weather_df: Monthly aggregated weather — columns: [month, avg_temp, total_rain_days, ...]
    holiday_features: Dict per month from get_holiday_features()
    calendar_features: Dict per month from get_calendar_features()
    trends_df: Optional Google Trends monthly data
    
    Returns: DataFrame with one row per (branch, year, month) with all features
    """
    # Create a complete features table
    months = file1_long_df[["year", "month"]].drop_duplicates()
    
    # Add weather features (already monthly)
    # Add holiday features
    holiday_df = pd.DataFrame([
        {"month": m, **get_holiday_features(m)} for m in range(1, 13)
    ])
    
    # Add calendar features
    cal_df = pd.DataFrame([
        {"month": m, **get_calendar_features(m)} for m in range(1, 13)
    ])
    
    # Merge everything
    features = months.merge(weather_df, on="month", how="left")
    features = features.merge(holiday_df, on="month", how="left")
    features = features.merge(cal_df, on="month", how="left")
    
    if trends_df is not None and not trends_df.empty:
        features = features.merge(trends_df, on=["year", "month"], how="left")
    
    # Merge with sales
    full_df = file1_long_df.merge(features, on=["year", "month"], how="left")
    
    return full_df

def build_forecaster(full_df, target_col="sales", lags=3):
    """
    Build XGBoost/LightGBM forecaster using skforecast.
    
    Since we have monthly data (13 data points per branch), we:
    1. Aggregate across all branches for a single time series, OR
    2. Use a global model across all branches (more data points)
    
    Using option 2 (global model) is better — gives us 25 * 13 = 325 rows.
    """
    # For global model approach: create panel time series
    # skforecast supports this via ForecasterAutoregMultiSeries
    
    from skforecast.ForecasterAutoregMultiSeries import ForecasterAutoregMultiSeries
    
    # Pivot to wide format: index=date, columns=branch, values=sales
    full_df["date"] = pd.to_datetime(
        full_df["year"].astype(str) + "-" + full_df["month"].astype(str) + "-01"
    )
    
    sales_wide = full_df.pivot_table(
        index="date", columns="branch", values="sales"
    )
    
    # Exogenous features (same for all branches, or branch-specific if available)
    exog_cols = [
        "avg_temp", "total_rain_days", "total_precipitation_mm", "avg_humidity",
        "is_hot_month", "temp_deviation",
        "num_holidays", "has_ramadan", "is_festive_season",
        "quarter", "is_summer", "is_winter", "num_weekend_days",
        "is_school_month", "is_peak_tourist"
    ]
    
    exog_df = full_df.drop_duplicates(subset=["date"])[["date"] + exog_cols].set_index("date")
    
    # --- Option A: Aggregated single series (simpler, use this if time is short) ---
    agg_series = sales_wide.sum(axis=1)
    agg_series.name = "total_sales"
    agg_series.index.freq = "MS"  # Month start frequency
    
    forecaster = ForecasterAutoreg(
        regressor=LGBMRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            verbose=-1
        ),
        lags=lags  # 3 months of lags
    )
    
    # Fit
    forecaster.fit(
        y=agg_series,
        exog=exog_df[exog_cols]
    )
    
    return forecaster, agg_series, exog_df

def forecast_future(forecaster, exog_future, steps=6):
    """
    Generate 6-month forward forecast.
    
    IMPORTANT: Exogenous variables must be known for the forecast horizon.
    - Weather: Use historical monthly averages for the same months as proxy
    - Holidays: Known in advance (hardcoded)
    - Calendar: Known in advance (computed)
    - Google Trends: Not known — exclude from forecast exog or use last known value
    """
    predictions = forecaster.predict(
        steps=steps,
        exog=exog_future
    )
    
    # Get prediction intervals (if using skforecast >= 0.12)
    # predictions_interval = forecaster.predict_interval(
    #     steps=steps,
    #     exog=exog_future,
    #     interval=[10, 90]  # 80% prediction interval
    # )
    
    return predictions

def evaluate_model(forecaster, agg_series, exog_df, exog_cols):
    """
    Backtest: train on first 10 months, test on last 3.
    Report MAE and MAPE.
    """
    from skforecast.model_selection import backtesting_forecaster
    
    metric, predictions = backtesting_forecaster(
        forecaster=forecaster,
        y=agg_series,
        exog=exog_df[exog_cols],
        initial_train_size=10,  # Train on 10 months
        steps=1,                # 1-step-ahead rolling forecast
        metric="mean_absolute_error",
        verbose=False
    )
    
    return metric, predictions

def feature_importance(forecaster):
    """
    Extract and return feature importance from the fitted model.
    Shows which external factors drive sales most.
    """
    importance = forecaster.get_feature_importances()
    return importance.sort_values(ascending=False)
```

### Output for Frontend
```json
{
    "historical": {
        "dates": ["2025-01-01", "2025-02-01", ...],
        "actual_sales": [1234, 1456, ...],
    },
    "forecast": {
        "dates": ["2026-02-01", "2026-03-01", ...],
        "predicted_sales": [1500, 1620, ...],
        "lower_bound": [1350, 1450, ...],
        "upper_bound": [1650, 1790, ...]
    },
    "metrics": {
        "mae": 123.4,
        "mape": 8.5
    },
    "feature_importance": [
        {"feature": "avg_temp", "importance": 0.25},
        {"feature": "is_summer", "importance": 0.18},
        {"feature": "has_ramadan", "importance": 0.15},
        ...
    ],
    "external_factors_used": ["weather", "holidays", "calendar", "google_trends"]
}
```

---

## PART 6: BACKEND — FastAPI Endpoints (`main.py`)

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
from io import StringIO

app = FastAPI(title="Stories Coffee Analytics", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
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
    """
    Accept 4 CSV files, clean them, run all models, return full analysis.
    
    This is the main endpoint. It:
    1. Reads and cleans all 4 files
    2. Fetches external data (weather, trends)
    3. Runs branch clustering
    4. Runs menu engineering (global + per-cluster)
    5. Runs demand forecasting
    6. Returns comprehensive JSON response
    """
    try:
        # Read CSVs
        df1 = pd.read_csv(StringIO((await file1.read()).decode("utf-8")))
        df2 = pd.read_csv(StringIO((await file2.read()).decode("utf-8")))
        df3 = pd.read_csv(StringIO((await file3.read()).decode("utf-8")))
        df4 = pd.read_csv(StringIO((await file4.read()).decode("utf-8")))
        
        # Run pipeline
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
            "executive_summary": generate_executive_summary(
                clustering_results, menu_results, forecast_results
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
```

---

## PART 7: FRONTEND — React Application

### Tech Stack
- React (Vite for fast setup)
- Recharts for all visualizations
- Tailwind CSS for styling (fast, clean, professional)
- Axios for API calls

### Setup
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install recharts axios tailwindcss @headlessui/react react-dropzone
npx tailwindcss init
```

### Component Details

#### `FileUpload.jsx`
- Drag-and-drop zone using `react-dropzone`
- Accept 4 CSV files with labels matching the file names
- Show upload progress and validation
- On submit, POST all 4 files to `/api/upload`
- Show loading spinner while backend processes

#### `BranchDashboard.jsx`
- **Branch Leaderboard**: Sortable table of all 25 branches ranked by revenue, margin, growth
- **Cluster Visualization**: Scatter plot (Recharts ScatterChart) showing branches plotted on 2 key dimensions (e.g., revenue vs. margin), colored by cluster
- **Cluster Cards**: For each cluster, show card with label, strategy, member branches, and key metrics
- **Elbow Chart**: Line chart showing inertia vs. k (to justify cluster count)
- **Map View** (bonus): If time permits, show Lebanon map with branch pins colored by cluster

#### `MenuMatrix.jsx`
- **BCG Scatter Plot**: Interactive 4-quadrant scatter (Recharts ScatterChart with reference lines at thresholds)
  - X-axis: Popularity (Qty %)
  - Y-axis: Profitability (Profit %)
  - Color-coded by quadrant: Stars=gold, Plowhorses=blue, Puzzles=purple, Dogs=red
  - Hover tooltip shows product name, qty, profit%, recommendation
- **Filter controls**: Dropdown to switch between Global / Cluster-specific views
- **Category filter**: Toggle BEVERAGES / FOOD / ALL
- **Action Table**: Below the chart, sortable table grouped by classification with columns: Product, Category, Qty, Profit%, Classification, Recommendation
- **Modifier Insights Panel**: Bar chart of modifier attachment rates per branch, highlighting low-adoption branches as upsell opportunities

#### `ForecastView.jsx`
- **Time Series Chart**: Recharts LineChart showing:
  - Historical actual sales (solid line)
  - Forecasted future sales (dashed line)
  - Confidence interval (shaded area using Recharts Area)
- **External Factor Toggles**: Checkboxes to enable/disable weather, holidays, calendar features — re-runs forecast on toggle (shows impact of each factor)
- **Feature Importance Bar Chart**: Horizontal bar chart showing which factors drive the forecast most
- **Metrics Display**: Cards showing MAE, MAPE, and model description

#### `ExecutiveSummary.jsx`
- Auto-generated text summary from analysis results
- Sections: Problem Statement, Key Findings (top 5), Recommendations, Expected Impact
- "Download as PDF" button (use browser print or a library like `react-to-print` or `jspdf`)
- Styled to look like a consulting report

### Layout
```jsx
// App.jsx — Main layout with tab navigation
function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  
  // Tabs: Upload → Branch Performance → Menu Engineering → Forecast → Summary
  // Only show analysis tabs after successful upload
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-900 text-white p-4">
        <h1>Stories Coffee — Analytics Dashboard</h1>
        <p className="text-amber-200">Data-Driven Decisions for Growth</p>
      </header>
      
      <nav className="flex border-b bg-white">
        {/* Tab buttons */}
      </nav>
      
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === "upload" && <FileUpload onComplete={setData} />}
        {activeTab === "branches" && <BranchDashboard data={data.clustering} />}
        {activeTab === "menu" && <MenuMatrix data={data.menu_engineering} />}
        {activeTab === "forecast" && <ForecastView data={data.forecast} />}
        {activeTab === "summary" && <ExecutiveSummary data={data} />}
      </main>
    </div>
  );
}
```

### Color Scheme
Use coffee-inspired palette:
- Primary: `amber-900` (#78350f) — dark coffee brown
- Secondary: `amber-600` (#d97706) — caramel/gold
- Accent: `emerald-600` (#059669) — for positive metrics
- Danger: `rose-600` (#e11d48) — for negative metrics / Dogs
- Background: `gray-50` / `white`

---

## PART 8: Deployment

### Backend (Railway or Render — free tier)
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel — free)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Docker Compose (bonus)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## PART 9: Executive Summary (2-Page PDF)

Generate this auto-content (also served via the React app):

```
STORIES COFFEE — DATA-DRIVEN GROWTH STRATEGY
Prepared by [Team Name] | Stories Hackathon 2026

PROBLEM STATEMENT
Stories Coffee operates 25 branches with 300+ menu items but lacks data-driven 
decision-making tools. We were asked: "How do we make more money?"

KEY FINDINGS

1. [Branch Clustering Insight] — Your 25 branches fall into [X] distinct profiles.
   [Specific example, e.g., "Mountain/seasonal branches (Faqra, Batroun) show 3x 
   revenue variance vs. urban branches — they need seasonal pricing strategies."]

2. [Menu Engineering Insight — Plowhorses] — [X] high-volume items have below-median 
   margins. A 3% price increase on these items alone would generate an estimated 
   [Y] additional profit per month across all branches.

3. [Modifier Insight] — Modifier add-ons (oat milk, extra shot) carry 80%+ margins 
   but attachment rates vary from [A]% (best branch) to [B]% (worst branch). 
   Standardizing upselling training could capture [Z] in additional monthly profit.

4. [Seasonal Insight] — Summer months drive [X]% more iced beverage revenue, but 
   [Y] branches don't adjust their menu promotion accordingly.

5. [Forecast Insight] — Our demand model (MAPE: X%) predicts [growth/decline] over 
   the next 6 months, driven primarily by [top feature].

RECOMMENDATIONS
1. Implement cluster-specific strategies (detailed in dashboard)
2. Raise prices on [X] Plowhorse items by 3-5%
3. Launch modifier upselling program at [lowest attachment branches]
4. Retire [X] Dog items to simplify operations
5. Use our forecasting tool monthly for cash flow planning

METHODOLOGY
- K-Means Clustering (k=[X], silhouette score: [Y])
- BCG Menu Engineering Matrix (300+ products classified)
- XGBoost/LightGBM demand forecasting with weather, holiday, and calendar features
- External data: Open-Meteo weather API, Lebanese holiday calendar, Google Trends

INTERACTIVE DASHBOARD: [deployed URL]
```

---

## PART 10: README.md

```markdown
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
[Deployed URL here]

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

## 📊 Key Findings
[Top 3 insights with supporting charts]

## 🏗️ Architecture
[Architecture diagram]

## 📁 Data
Place the 4 Stories CSV files in the upload interface. The pipeline handles:
- POS page header removal
- Branch name normalization  
- Revenue truncation bug fix
- Hierarchical structure parsing

## 👥 Team
[Names]

## 📄 License
MIT
```

---

## Requirements (`backend/requirements.txt`)

```
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
pandas==2.2.0
numpy==1.26.3
scikit-learn==1.4.0
xgboost==2.0.3
lightgbm==4.3.0
skforecast==0.14.0
requests==2.31.0
pytrends==4.9.2
```

---

## Critical Reminders

1. **The data is in arbitrary units** — never present absolute numbers as real revenue. Always talk about patterns, ratios, percentages, and relative comparisons.

2. **The Total Price bug**: In Files 2 and 4, aggregate rows have truncated Total Price. Always use `Total Cost + Total Profit` for true revenue on aggregate rows.

3. **Time constraint**: This is a 12-hour hackathon. Build the MVP first (cleaning + clustering + BCG matrix + basic React dashboard), then layer on forecasting and polish.

4. **The "CEO test"**: Every screen should answer a question the CEO would ask. "Which branches need help?" → Branch Dashboard. "What should I change on the menu?" → Menu Matrix. "What's coming next?" → Forecast. "What do I do Monday morning?" → Executive Summary.

5. **Ship > Perfect**: A working dashboard with 3 solid insights beats a perfect notebook with 10 half-baked analyses.
