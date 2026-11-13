
import pandas as pd
import numpy as np
import joblib

from xgboost import XGBRegressor

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# ==========================================
# 1. LOAD DATA
# ==========================================

df = pd.read_excel("estate.xlsx")

print("Original rows:", len(df))

# ==========================================
# 2. CONVERT DATE
# ==========================================

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["locality", "date"]
).reset_index(drop=True)

# ==========================================
# 3. KEEP LOCALITIES WITH ENOUGH DATA
# ==========================================

locality_counts = df.groupby("locality").size()

good_localities = locality_counts[
    locality_counts >= 12
].index

df = df[
    df["locality"].isin(good_localities)
].copy()

print("Localities used:", len(good_localities))

# ==========================================
# 4. CREATE PREVIOUS PRICE FEATURES
# ==========================================

df["previous_price"] = (
    df.groupby("locality")["price_per_sqft"].shift(1)
)

df["previous_price_2"] = (
    df.groupby("locality")["price_per_sqft"].shift(2)
)

# ==========================================
# 5. CREATE PRICE GROWTH
# ==========================================

df["price_growth"] = (
    (df["price_per_sqft"] - df["previous_price"])
    / df["previous_price"]
)

# ==========================================
# 6. CREATE TARGET
# ==========================================

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

print("Usable rows:", len(df))

# ==========================================
# 7. TIME-BASED TRAIN / TEST SPLIT
# ==========================================

train = df[df["date"] < "2026-01-01"].copy()
test = df[df["date"] >= "2026-01-01"].copy()

print("Training rows:", len(train))
print("Testing rows:", len(test))

# ==========================================
# 8. FEATURES
# ==========================================

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

target = "target_price"

X_train = train[features]
y_train = train[target]

X_test = test[features]
y_test = test[target]

# ==========================================
# 9. PREPROCESSING
# ==========================================

categorical_features = [
    "locality",
    "zone",
    "property_type"
]

numeric_features = [
    "year",
    "month",
    "price_per_sqft",
    "previous_price",
    "previous_price_2",
    "price_growth"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)

# ==========================================
# 10. XGBOOST MODEL
# ==========================================

model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=-1
)

# ==========================================
# 11. PIPELINE
# ==========================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)

# ==========================================
# 12. TRAIN
# ==========================================

print("\nTraining Future Price XGBoost Model...")

pipeline.fit(X_train, y_train)

print("Training completed!")

# ==========================================
# 13. EVALUATION
# ==========================================

predictions = pipeline.predict(X_test)

mae = mean_absolute_error(y_test, predictions)

rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)

r2 = r2_score(y_test, predictions)

print("\n========== XGBOOST RESULTS ==========")

print(f"MAE  : ₹{mae:,.2f}")
print(f"RMSE : ₹{rmse:,.2f}")
print(f"R²   : {r2:.4f}")

# ==========================================
# 14. SAVE MODEL
# ==========================================

joblib.dump(
    pipeline,
    "xgboost_future_price_model.pkl"
)

print("\nXGBoost Future Price Model Saved!")
