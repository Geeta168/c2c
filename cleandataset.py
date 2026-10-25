
import pandas as pd
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "data" / "bengaluru_traffic.csv"
OUTPUT_FILE = BASE_DIR / "data" / "clean_traffic.csv"

def clean_traffic_data():
    # 1. Load dataset
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE)
    print("Original shape:", df.shape)

    # 2. Standardize column names
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9]+", "_", regex=True)
        .str.strip("_")
    )

    # 3. Remove duplicate rows
    df = df.drop_duplicates()

    # 4. Replace infinite values with missing values
    df = df.replace([float("inf"), float("-inf")], float("nan"))

    # 5. Remove completely empty rows and columns
    df = df.dropna(how="all")
    df = df.dropna(axis=1, how="all")

    # 6. Clean text columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype("string").str.strip()
        df[col] = df[col].replace("", pd.NA)

    # 7. Convert numeric-looking columns
    for col in df.columns:
        if df[col].dtype == "object":
            converted = pd.to_numeric(df[col], errors="coerce")
            if converted.notna().mean() >= 0.8:
                df[col] = converted

    # 8. Fill missing values
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            median = df[col].median()
            if pd.notna(median):
                df[col] = df[col].fillna(median)
        else:
            mode = df[col].mode(dropna=True)
            if not mode.empty:
                df[col] = df[col].fillna(mode.iloc[0])

    # 9. Save cleaned dataset
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print("Cleaned shape:", df.shape)
    print("Remaining missing values:", int(df.isna().sum().sum()))
    print("Saved to:", OUTPUT_FILE)

if __name__ == "__main__":
    clean_traffic_data()
