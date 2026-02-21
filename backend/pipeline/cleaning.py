import pandas as pd
import numpy as np

def clean_file1(df):
    """
    Cleans REP_S_00134_SMRY.csv (Comparative Monthly Sales)
    Extracts 2025 and 2026 sales per branch.
    """
    if df.empty:
        return df

    # We need to extract the actual rows containing data.
    # The file has a structured format with years in column 0, Branches in column 1, and Months in columns 3+.
    
    # Forward fill the 'Year' column
    df.iloc[:, 0] = df.iloc[:, 0].replace(r'^\s*$', np.nan, regex=True)
    df.iloc[:, 0] = df.iloc[:, 0].ffill()
    
    # Rename columns manually since header is split across multiple rows
    columns = ["Year", "Branch"] + [str(i) for i in range(2, len(df.columns))]
    df.columns = columns
    
    # Filter rows that look like branch data (Branch cell not empty and not 'Total', 'Total By Year' etc)
    branch_rows = df[
        df['Branch'].notna() & 
        ~df['Branch'].str.contains('Total|January|October|Stories$|Stories\.', case=False, na=False) &
        (df['Year'].isin(['2025', '2026', 2025, 2026]))
    ].copy()
    
    # The monthly data is usually in columns 3 to 14 for Jan-Dec, but the CSV is split horizontally
    # It has multiple blocks of months. We need to handle this carefully.
    
    # Since we are focusing on K-Means feature extraction (Annual Revenue, YoY), we can use the 'Total By Year'
    # which is present in the file for 2025.
    
    return branch_rows

def clean_file4(df):
    """
    Cleans rep_s_00673_SMRY.csv (Theoretical Profit By Category)
    Extracts margin per branch.
    """
    if df.empty:
        return df
        
    branch_margins = []
    current_branch = None
    
    # First column is Category, second is Qty, third is Total Price, fifth is Total Cost
    # "Total By Branch:" rows contain the aggregate.
    
    col_category = df.columns[0]
    col_revenue = df.columns[2]
    col_cost = df.columns[4]
    
    for _, row in df.iterrows():
        cat = str(row[col_category]) if pd.notna(row[col_category]) else ""
        
        if cat.startswith("Stories"):
            current_branch = cat.strip()
        elif cat.startswith("Total By Branch:"):
            try:
                # Remove commas
                rev_str = str(row[col_revenue]).replace(',', '')
                cost_str = str(row[col_cost]).replace(',', '')
                
                rev = float(rev_str) if rev_str.replace('.','',1).isdigit() else 0.0
                cost = float(cost_str) if cost_str.replace('.','',1).isdigit() else 0.0
                
                if rev > 0:
                    margin = (rev - cost) / rev
                else:
                    margin = 0.0
                    
                branch_margins.append({
                    "branch_raw": current_branch,
                    "total_revenue": rev,
                    "avg_margin": margin
                })
            except Exception as e:
                pass

    return pd.DataFrame(branch_margins)

def clean_file2(df):
    """
    Cleans rep_s_00014_SMRY.csv (Theoretical Profit By Item)
    Extracts item level profitability. The file is structured hierarchically.
    """
    if df.empty:
        return df

    # Core logic to extract products will go here, handling the hierarchy.
    # The file has: Category -> Group -> Product.
    # We will identify product rows as those having numeric values in Qty/Price columns
    
    col_desc = df.columns[0]
    col_qty = df.columns[1]
    col_price = df.columns[2]
    col_cost = df.columns[4]
    col_profit = df.columns[6]
    
    products = []
    current_category = "OTHER"
    
    for _, row in df.iterrows():
        desc = str(row[col_desc]).strip() if pd.notna(row[col_desc]) else ""
        qty_str = str(row[col_qty]).replace(',', '') if pd.notna(row[col_qty]) else ""
        
        # Update Category Tracking (rows where desc exists but qty is empty and no Total)
        if desc and not qty_str and "Total By" not in desc:
            # Check if this looks like a top-level category like BEVERAGES, FOOD, MERCHANDISE
            if desc.isupper():
                current_category = desc
                
        # Check if qty is a number (identifying a product row)
        if desc and qty_str.replace('.', '', 1).isdigit() and "Total By" not in desc:
            try:
                qty = float(qty_str)
                price_str = str(row[col_price]).replace(',', '')
                cost_str = str(row[col_cost]).replace(',', '')
                profit_str = str(row[col_profit]).replace(',', '')
                
                price = float(price_str) if price_str.replace('.', '', 1).replace('-', '', 1).isdigit() else 0.0
                cost = float(cost_str) if cost_str.replace('.', '', 1).replace('-', '', 1).isdigit() else 0.0
                profit = float(profit_str) if profit_str.replace('.', '', 1).replace('-', '', 1).isdigit() else 0.0
                
                # Apply the prompt's truncation fix if Total Price is truncated: 
                # (Revenue = Profit + COGS)
                # But Omega pos file already defines profit explicitly. If price looks truncated compared to cost+profit.
                calc_revenue = profit + cost
                if calc_revenue > price and price > 0:
                    price = calc_revenue # Fix the truncation visually mentioned in prompt if applicable
                
                products.append({
                    "product_desc": desc,
                    "category": current_category,
                    "qty": qty,
                    "total_price": price,
                    "total_cost": cost,
                    "total_profit": profit
                })
            except Exception as e:
                pass
                
    return pd.DataFrame(products)

def clean_file3(df):
    """
    Cleans rep_s_00191_SMRY-3.csv (Sales by Items By Group)
    Useful for group level mapping, but skipping detailed for now based on needs.
    """
    return df

def clean_all(df1, df2, df3, df4):
    cleaned1 = clean_file1(df1)
    cleaned2 = clean_file2(df2)
    cleaned3 = clean_file3(df3)
    cleaned4 = clean_file4(df4)
    return {
        "file1": cleaned1,
        "file2": cleaned2,
        "file3": cleaned3,
        "file4": cleaned4
    }
