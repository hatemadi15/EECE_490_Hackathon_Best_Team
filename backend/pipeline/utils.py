import pandas as pd

BRANCH_NAME_MAP = {
    'stories alay': 'Stories Aley',
    'Stories alay': 'Stories Aley',
    'Stories Ain El Mreisseh': 'Stories Ain El Mreisseh',
    'Stories.': 'Stories Unknown',
    'Stories zalka': 'Stories Zalka',
    'Stories batroun': 'Stories Batroun',
    # We will expand this as needed during EDA, but we must normalize based on the mapping rules.
}

def normalize_branch_name(name):
    if pd.isna(name):
        return name
    name = str(name).strip()
    # Apply direct mapping if available
    for key, val in BRANCH_NAME_MAP.items():
        if key.lower() == name.lower():
            return val
    # Fallback to Title Case
    return name.title()
