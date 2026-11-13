
import pandas as pd
import numpy as np
import joblib

from catboost import CatBoostRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# Load and prepare dataset
df = pd.read_excel("estate.xlsx")

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["locality", "date"]
).reset_index(drop=True)

# Keep localities with sufficient records
counts = df.groupby("locality").size()

good_localities = counts[counts >= 12].index

df = df[df["locality"].isin(good_localities)].copy()

# Historical features
df["previous_price"] = (
    df.groupby("locality")["price_per_sqft"].shift(1)
)

df["previous_price_2"] = (
    df.groupby("locality")["price_per_sqft"].shift(2)
)

df["price_growth"] = (
    (df["price_per_sqft"] - df["previous_price"])
    / df["previous_price"]
)

df["target_price"] = (
    df.groupby("locality")["price_per_sqft"].shift(-1)
)

df = df.dropna(
    subset=[
        "previous_price",
        "previous_price_2",
        "price_growth",
        "target_price"
    ]
)

# Same chronological split
train = df[df["date"] < "2026-01-01"].copy()
test = df[df["date"] >= "2026-01-01"].copy()

features = [
    "locality",
    "zone",
    "property_type",
    "year",
    "month",
    "price_per_sqft",
    "previous_price",
    "previous_price_2",
    "price_growth"
]

X_test = test[features]
y_test = test["target_price"]

# Load models
rf_model = joblib.load("future_price_model.pkl")

xgb_model = joblib.load(
    "xgboost_future_price_model.pkl"
)

cat_model = CatBoostRegressor()

cat_model.load_model(
    "catboost_future_price_model.cbm"
)

# Evaluate models
models = {
    "Random Forest": rf_model,
    "XGBoost": xgb_model,
    "CatBoost": cat_model
}

results = []

for name, model in models.items():

    predictions = model.predict(X_test)

    results.append({
        "Model": name,
        "R2 Score": round(
            r2_score(y_test, predictions), 4
        ),
        "MAE": round(
            mean_absolute_error(y_test, predictions), 2
        ),
        "RMSE": round(
            np.sqrt(mean_squared_error(y_test, predictions)), 2
        )
    })

# Display results
result_df = pd.DataFrame(results)

print("\n========== FUTURE PRICE MODEL COMPARISON ==========")
print(result_df.to_string(index=False))

print("\nBest model by R2:")
print(
    result_df.loc[
        result_df["R2 Score"].idxmax(), "Model"
    ]
)
