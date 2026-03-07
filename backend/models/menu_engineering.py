import pandas as pd
import numpy as np

def classify_products(file2_df, scope="global"):
    """
    BCG Menu Engineering Matrix
    Needs product description, popularity (quantity), and profitability (margin %).
    """
    if file2_df.empty:
        return pd.DataFrame(), 0, 0
        
    products = file2_df.copy()
    
    if "product_desc" not in products.columns:
        return pd.DataFrame(), 0, 0
        
    # Group by product description to aggregate total across the entire chain or specific scope
    product_agg = products.groupby("product_desc").agg(
        total_qty=("qty", "sum"),
        total_revenue=("total_price", "sum"),
        total_cost=("total_cost", "sum"),
        total_profit=("total_profit", "sum")
    ).reset_index()
    
    # Calculate Profit Percentage (Margin) safely
    # If revenue is 0, protect from division by zero
    product_agg["profit_pct"] = np.where(
        product_agg["total_revenue"] > 0,
        (product_agg["total_profit"] / product_agg["total_revenue"] * 100),
        0
    ).round(2)
    
    # Calculate Popularity Percentage based on standard BCG logic (Item Qty / Total Qty)
    total_qty = product_agg["total_qty"].sum()
    if total_qty > 0:
        product_agg["popularity_pct"] = (product_agg["total_qty"] / total_qty * 100).round(4)
    else:
        product_agg["popularity_pct"] = 0.0

    # According to classical Menu Engineering, the thresholds are usually the median
    # or mean of popularity and profit contribution.
    pop_threshold = product_agg["popularity_pct"].median()
    
    # In some methods profit threshold is based on absolute profit, 
    # but the prompt specifically states "Profitability (%)", so we use that.
    profit_threshold = product_agg["profit_pct"].median()
    
    # We filter out ultra-low volume items (e.g. less than 50 sold across the year) to declutter the chart
    product_agg = product_agg[product_agg["total_qty"] > 50].copy()
    
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
    
    # Generate explicit reasons for the category placement
    def generate_reason(row):
        pop_status = "High Volume" if row["popularity_pct"] >= pop_threshold else "Low Volume"
        prof_status = "High Margin" if row["profit_pct"] >= profit_threshold else "Low Margin"
        return f"Placed as {row['classification']} because it is {pop_status} & {prof_status}."

    product_agg["reason"] = product_agg.apply(generate_reason, axis=1)
    
    RECOMMENDATIONS = {
        "Star": "PRICING: Premium. Action: Increase price by 2-5% to maximize margin. Feature prominently.",
        "Plowhorse": "PRICING: Value. Action: Target 3-5% price increase or subtly reduce portion sizes. Do not alter perceived value.",
        "Puzzle": "PRICING: Discount/Combo. Action: Promote heavily via staff upselling or rename on menu.",
        "Dog": "PRICING: Evaluate. Action: Phase out to reduce inventory costs and streamline operations."
    }
    product_agg["recommendation"] = product_agg["classification"].map(RECOMMENDATIONS)
    
    return product_agg, pop_threshold, profit_threshold

def run_full_menu_analysis(cleaned_data_dict, clustering_results):
    f2 = cleaned_data_dict.get("file2", pd.DataFrame())
    
    global_products, pop_t, prof_t = classify_products(f2)
    
    summary = {
        "stars": 0, "plowhorses": 0, "puzzles": 0, "dogs": 0
    }
    
    if not global_products.empty:
        summary["stars"] = len(global_products[global_products['classification'] == 'Star'])
        summary["plowhorses"] = len(global_products[global_products['classification'] == 'Plowhorse'])
        summary["puzzles"] = len(global_products[global_products['classification'] == 'Puzzle'])
        summary["dogs"] = len(global_products[global_products['classification'] == 'Dog'])
        
        # Sort by popularity descending to put biggest items first
        global_products = global_products.sort_values(by="total_qty", ascending=False)
        
    return {
        "global_matrix": {
            "products": global_products.to_dict(orient="records") if not global_products.empty else [],
            "pop_threshold": float(pop_t),
            "profit_threshold": float(prof_t),
            "summary": summary
        },
        "per_cluster": {}, # Could be built later to compare Branch Profiles
        "modifier_analysis": {} 
    }
