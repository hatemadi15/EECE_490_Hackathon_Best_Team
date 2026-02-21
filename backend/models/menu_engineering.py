import pandas as pd
import numpy as np

def classify_products(file2_df, scope="global"):
    """
    BCG Menu Engineering Matrix based on the prompt's specifications.
    We just use placeholders for now since prompt's specific columns need verification.
    """
    if file2_df.empty:
        return pd.DataFrame(), 0, 0
        
    products = file2_df.copy()
    
    # Generic aggregation logic based on assumed columns
    # We will refine this once data is loaded
    
    if "product_desc" not in products.columns:
        # Dummy structure
        return pd.DataFrame(), 0, 0
        
    product_agg = products.groupby("product_desc").agg(
        total_qty=("qty", "sum"),
        total_revenue=("total_price", "sum"),
        total_cost=("total_cost", "sum"),
        total_profit=("total_profit", "sum")
    ).reset_index()
    
    product_agg["profit_pct"] = (product_agg["total_profit"] / product_agg["total_revenue"] * 100).round(2)
    
    total_qty = product_agg["total_qty"].sum()
    product_agg["popularity_pct"] = (product_agg["total_qty"] / total_qty * 100).round(4)
    
    pop_threshold = product_agg["popularity_pct"].median()
    profit_threshold = product_agg["profit_pct"].median()
    
    def classify(row):
        high_pop = row["popularity_pct"] >= pop_threshold
        high_profit = row["profit_pct"] >= profit_threshold
        if high_pop and high_profit: return "Star"
        elif high_pop and not high_profit: return "Plowhorse"
        elif not high_pop and high_profit: return "Puzzle"
        else: return "Dog"
        
    product_agg["classification"] = product_agg.apply(classify, axis=1)
    
    RECOMMENDATIONS = {
        "Star": "Protect and feature prominently.",
        "Plowhorse": "High volume - increase price slightly.",
        "Puzzle": "Promote via staff recommendations.",
        "Dog": "Evaluate for removal."
    }
    product_agg["recommendation"] = product_agg["classification"].map(RECOMMENDATIONS)
    
    return product_agg, pop_threshold, profit_threshold

def run_full_menu_analysis(cleaned_data_dict, clustering_results):
    f2 = cleaned_data_dict.get("file2", pd.DataFrame())
    
    global_products, pop_t, prof_t = classify_products(f2)
    
    summary = {
        "stars": len(global_products[global_products['classification'] == 'Star']) if not global_products.empty else 0,
        "plowhorses": len(global_products[global_products['classification'] == 'Plowhorse']) if not global_products.empty else 0,
        "puzzles": len(global_products[global_products['classification'] == 'Puzzle']) if not global_products.empty else 0,
        "dogs": len(global_products[global_products['classification'] == 'Dog']) if not global_products.empty else 0
    }
    
    return {
        "global_matrix": {
            "products": global_products.to_dict(orient="records") if not global_products.empty else [],
            "pop_threshold": pop_t,
            "profit_threshold": prof_t,
            "summary": summary
        },
        "per_cluster": {},
        "modifier_analysis": {}
    }
