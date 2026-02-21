import pandas as pd
import numpy as np
import re
from .utils import normalize_branch_name

def clean_file1(df):
    """Monthly sales by branch YoY"""
    # Remove rows where any cell contains 'Page X of Y' pattern
    df = df[~df.apply(lambda row: row.astype(str).str.contains(r'Page \d+ of \d+').any(), axis=1)]
    # Drop empty rows and cols
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    
    # Identify the branch column (usually the 2nd col or named 'Branch Name')
    # Assuming standard structure based on prompt
    
    df.columns = df.columns.astype(str).str.strip()
    return df

def clean_file2(df):
    """Product-level profitability"""
    df = df[~df.apply(lambda row: row.astype(str).str.contains(r'Page \d+ of \d+').any(), axis=1)]
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    return df

def clean_file3(df):
    """Sales by product groups"""
    df = df[~df.apply(lambda row: row.astype(str).str.contains(r'Page \d+ of \d+').any(), axis=1)]
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    return df

def clean_file4(df):
    """Category summary"""
    df = df[~df.apply(lambda row: row.astype(str).str.contains(r'Page \d+ of \d+').any(), axis=1)]
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    return df

def clean_all(df1, df2, df3, df4):
    c1 = clean_file1(df1)
    c2 = clean_file2(df2)
    c3 = clean_file3(df3)
    c4 = clean_file4(df4)
    return {
        "file1": c1,
        "file2": c2,
        "file3": c3,
        "file4": c4
    }
