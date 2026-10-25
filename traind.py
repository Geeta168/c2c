
import pandas as pd
import numpy as np
import joblib
import json

from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# ==================================================
# 1. PATHS AND CONFIGURATION
# ==================================================

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data" / "clean_traffic.csv"
MODEL_FILE = BASE_DIR / "traffic_model.pkl"
METRICS_FILE = BASE_DIR / "data" / "model_metrics.json"
IMPORTANCE_FILE = BASE_DIR / "data" / "feature_importance.csv"

RANDOM_STATE = 42
TEST_SIZE = 0.20

# Update these candidates to match your CSV
TARGET_CANDIDATES = [
    "traffic_volume",
    "vehicle_count",
    "vehicles",
    "traffic_volume_clean"
]

TIME_CANDIDATES = [
    "timestamp",
    "date_time",
    "datetime",
    "date"
]


# ==================================================
# 2. LOAD DATASET
# ==================================================

def load_dataset():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}\n"
            "Run clean_model.py first."
        )

    df = pd.read_csv(DATA_FILE)

    # Normalize column names
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9]+", "_", regex=True)
        .str.strip("_")
    )

    df = df.drop_duplicates()

    print("\nDataset loaded")
    print("Rows:", len(df))
    print("Columns:", df.columns.tolist())

    return df


# ==================================================
# 3. FIND TARGET COLUMN
# ==================================================

def find_target(df):
    for column in TARGET_CANDIDATES:
        if column in df.columns:
            return column

    raise ValueError(
        "Traffic-volume target not found.\n"
        f"Available columns: {df.columns.tolist()}\n"
        "Update TARGET_CANDIDATES to match your dataset."
    )


# ==================================================
# 4. FEATURE ENGINEERING
# ==================================================

def engineer_features(df):
    df = df.copy()

    # Detect timestamp column
    time_col = next(
        (c for c in TIME_CANDIDATES if c in df.columns),
        None
    )

    if time_col:
        timestamp = pd.to_datetime(
            df[time_col], errors="coerce"
        )

        df["hour"] = timestamp.dt.hour
        df["day_of_week"] = timestamp.dt.dayofweek
        df["month"] = timestamp.dt.month
        df["is_weekend"] = (
            timestamp.dt.dayofweek >= 5
        ).astype(float)

        # Cyclic encoding preserves time relationships
        df["hour_sin"] = np.sin(
            2 * np.pi * df["hour"] / 24
        )
        df["hour_cos"] = np.cos(
            2 * np.pi * df["hour"] / 24
        )

        df["weekday_sin"] = np.sin(
            2 * np.pi * df["day_of_week"] / 7
        )
        df["weekday_cos"] = np.cos(
            2 * np.pi * df["day_of_week"] / 7
        )

        # Remove raw timestamp to avoid invalid model input
        df = df.drop(columns=[time_col])

    # Convert numeric-looking columns
    for col in df.columns:
        if df[col].dtype == "object":
            converted = pd.to_numeric(
                df[col], errors="coerce"
            )

            if converted.notna().mean() >= 0.8:
                df[col] = converted

    return df


# ==================================================
# 5. PREPARE TRAINING DATA
# ==================================================

def prepare_data(df, target):
    df = engineer_features(df)

    # Ensure target is numeric
    df[target] = pd.to_numeric(
        df[target], errors="coerce"
    )

    # Target must be available
    df = df.dropna(subset=[target])

    y = df[target].astype(float)

    # Numeric predictors only
    X = df.drop(columns=[target])
    X = X.select_dtypes(include=["number"])

    # Remove infinite values
    X = X.replace(
        [np.inf, -np.inf], np.nan
    )

    # Exclude constant columns
    X = X.loc[:, X.nunique(dropna=True) > 1]

    # Fill missing values using training data later
    if X.shape[1] == 0:
        raise ValueError(
            "No useful numeric features found. "
            "Add relevant features such as hour, "
            "road capacity, or historical traffic."
        )

    if len(X) < 20:
        raise ValueError(
            "At least 20 valid records are recommended."
        )

    return X, y


# ==================================================
# 6. SPLIT DATA
# ==================================================

def split_data(X, y):
    return train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )


# ==================================================
# 7. TRAIN MODEL
# ==================================================

def train_model(X_train, y_train, X_test):
    # Fit imputation values using training data only
    medians = X_train.median().fillna(0)

    X_train = X_train.fillna(medians)
    X_test = X_test.fillna(medians)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    return model, X_train, X_test, medians


# ==================================================
# 8. EVALUATE MODEL
# ==================================================

def evaluate_model(model, X_test, y_test):
    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test, predictions
    )

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    r2 = (
        r2_score(y_test, predictions)
        if len(y_test) >= 2 else None
    )

    metrics = {
        "mae": round(float(mae), 3),
        "rmse": round(float(rmse), 3),
        "r2": round(float(r2), 4) if r2 is not None else None,
        "test_records": int(len(y_test)),
        "model": "RandomForestRegressor",
        "target": "traffic volume"
    }

    print("\nModel evaluation")
    print("----------------")
    print("MAE:", metrics["mae"])
    print("RMSE:", metrics["rmse"])
    print("R²:", metrics["r2"])

    return predictions, metrics


# ==================================================
# 9. SAVE MODEL AND REPORTS
# ==================================================

def save_outputs(
    model, features, medians,
    metrics, y_test, predictions
):
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_FILE.parent.mkdir(
        parents=True, exist_ok=True
    )

    # Save everything required for inference
    joblib.dump(
        {
            "model": model,
            "features": list(features),
            "medians": medians.to_dict(),
            "target": "traffic_volume"
        },
        MODEL_FILE
    )

    with open(
        METRICS_FILE, "w", encoding="utf-8"
    ) as file:
        json.dump(metrics, file, indent=2)

    importance = pd.DataFrame({
        "feature": features,
        "importance": model.feature_importances_
    }).sort_values(
        "importance", ascending=False
    )

    importance.to_csv(
        IMPORTANCE_FILE, index=False
    )

    predictions_df = pd.DataFrame({
        "actual": y_test.to_numpy(),
        "predicted": predictions
    })

    predictions_df.to_csv(
        BASE_DIR / "data" / "test_predictions.csv",
        index=False
    )

    print("\nSaved files:")
    print("Model:", MODEL_FILE)
    print("Metrics:", METRICS_FILE)
    print("Feature importance:", IMPORTANCE_FILE)
    print("Test predictions: test_predictions.csv")


# ==================================================
# 10. MAIN PIPELINE
# ==================================================

def main():
    df = load_dataset()
    target = find_target(df)

    X, y = prepare_data(df, target)

    print("\nTarget column:", target)
    print("Training features:", X.columns.tolist())

    X_train, X_test, y_train, y_test = split_data(X, y)

    model, X_train, X_test, medians = train_model(
        X_train, y_train, X_test
    )

    predictions, metrics = evaluate_model(
        model, X_test, y_test
    )

    save_outputs(
        model,
        X_train.columns,
        medians,
        metrics,
        y_test,
        predictions
    )

    print("\nTraffic model training completed!")


if __name__ == "__main__":
    main()
