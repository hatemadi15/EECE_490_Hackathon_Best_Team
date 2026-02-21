from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import pandas as pd
import numpy as np

def prepare_branch_features(file1_df, file4_df):
    """
    Dummy feature extraction for initial pipeline logic. We'll aggregate proper features from df.
    """
    if file1_df.empty or file4_df.empty:
        return pd.DataFrame()
        
    # Example logic using file 1 for total annual revenue if structured as 'Year', 'Branch Name', 'Total By Year'
    # Actually, we need actual EDA context to perfectly map columns, but let's build generic logic:
    branch_features = []
    
    # Just creating a placeholder logic that will be refined once data loads
    for branch in file1_df['Branch Name'].unique() if 'Branch Name' in file1_df.columns else []:
        branch_features.append({
            "branch": branch,
            "total_annual_revenue": np.random.uniform(50000, 200000), # placeholder
            "yoy_growth": np.random.uniform(-0.1, 0.3),
            "avg_margin": np.random.uniform(0.4, 0.7)
        })
        
    return pd.DataFrame(branch_features)

def run_clustering(branch_features_df, k_range=range(2, 8)):
    if branch_features_df.empty or len(branch_features_df) < 3:
        return branch_features_df, [], None
        
    scaler = StandardScaler()
    # Assuming numerical columns from 1 onwards
    features = [c for c in branch_features_df.columns if c != 'branch']
    X_scaled = scaler.fit_transform(branch_features_df[features])
    
    results = []
    for k in k_range:
        if k >= len(branch_features_df):
            break
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        inertia = kmeans.inertia_
        sil_score = silhouette_score(X_scaled, labels) if k > 1 else 0
        results.append({"k": k, "inertia": inertia, "silhouette": sil_score})
    
    best_k = max(results, key=lambda x: x["silhouette"])["k"] if results else 1
    
    if best_k > 1:
        final_model = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        branch_features_df["cluster"] = final_model.fit_predict(X_scaled)
    else:
        branch_features_df["cluster"] = 0
        final_model = None
        
    return branch_features_df, results, final_model

def label_clusters(branch_features_df):
    mapping = {}
    for c in branch_features_df["cluster"].unique():
        mapping[c] = f"Cluster {c}"
    branch_features_df["cluster_label"] = branch_features_df["cluster"].map(mapping)
    return branch_features_df

def run_full_clustering(cleaned_data_dict, features_table):
    f1 = cleaned_data_dict.get("file1", pd.DataFrame())
    f4 = cleaned_data_dict.get("file4", pd.DataFrame())
    
    b_feat = prepare_branch_features(f1, f4)
    df_clustered, elbow, model = run_clustering(b_feat)
    labeled = label_clusters(df_clustered)
    
    # Format for JSON
    clusters_payload = []
    if not labeled.empty:
        for c in labeled['cluster'].unique():
            subset = labeled[labeled['cluster'] == c]
            clusters_payload.append({
                "id": int(c),
                "label": f"Cluster {c}",
                "strategy": "Analyze further",
                "branches": subset['branch'].tolist(),
                "avg_revenue": float(subset.get('total_annual_revenue', pd.Series([0])).mean()),
                "avg_margin": float(subset.get('avg_margin', pd.Series([0])).mean())
            })
            
    return {
        "clusters": clusters_payload,
        "branch_data": labeled.to_dict(orient="records") if not labeled.empty else [],
        "elbow_data": elbow
    }
