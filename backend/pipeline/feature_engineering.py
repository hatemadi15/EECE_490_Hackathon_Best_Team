import requests
import pandas as pd
import calendar

# As defined in the prompt:
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

def get_holiday_features(month: int) -> dict:
    info = LEBANON_HOLIDAYS_2025.get(month, {"count": 0, "has_ramadan": False})
    return {
        "num_holidays": info["count"],
        "has_ramadan": int(info["has_ramadan"]),
        "is_festive_season": int(month in [12, 1, 3, 4]),
    }

def get_calendar_features(month: int, year: int = 2025) -> dict:
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

def fetch_weather_data():
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
    try:
        response = requests.get(url, params=params)
        data = response.json()
        df = pd.DataFrame(data["daily"])
        df["date"] = pd.to_datetime(df["time"])
        df = df.drop(columns=["time"])
        # Aggregate to monthly
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        monthly = df.groupby(['year', 'month']).agg(
            avg_temp=('temperature_2m_mean', 'mean'),
            max_temp=('temperature_2m_max', 'max'),
            total_rain_days=('precipitation_sum', lambda x: (x > 0).sum()),
            total_precipitation_mm=('precipitation_sum', 'sum'),
            avg_humidity=('relative_humidity_2m_mean', 'mean')
        ).reset_index()
        monthly['is_hot_month'] = (monthly['avg_temp'] > 28).astype(int)
        
        annual_mean = monthly['avg_temp'].mean()
        monthly['temp_deviation'] = monthly['avg_temp'] - annual_mean
        
        return monthly
    except Exception as e:
        print("Error fetching weather:", e)
        return pd.DataFrame()

def build_feature_table(cleaned_data_dict):
    # This function expects cleaned data frames and builds the features
    # returning a comprehensive exogen features table.
    file1 = cleaned_data_dict.get("file1", pd.DataFrame())
    weather = fetch_weather_data()
    return weather
