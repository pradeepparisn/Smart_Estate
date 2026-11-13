
import pandas as pd
import numpy as np

from catboost import CatBoostRegressor
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
# 4. CREATE HISTORICAL FEATURES
# ==========================================

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

# ==========================================
# 5. CREATE TARGET
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
# 6. TIME-BASED SPLIT
# ==========================================

train = df[df["date"] < "2026-01-01"].copy()
test = df[df["date"] >= "2026-01-01"].copy()

print("Training rows:", len(train))
print("Testing rows:", len(test))

# ==========================================
# 7. FEATURES AND TARGET
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

categorical_features = [
    "locality",
    "zone",
    "property_type"
]

X_train = train[features].copy()
X_test = test[features].copy()

y_train = train["target_price"]
y_test = test["target_price"]

# ==========================================
# 8. CATBOOST MODEL
# ==========================================

model = CatBoostRegressor(
    iterations=500,
    learning_rate=0.03,
    depth=5,
    loss_function="RMSE",
    random_seed=42,
    verbose=100,
    allow_writing_files=False
)

# ==========================================
# 9. TRAIN
# ==========================================

print("\nTraining Future Price CatBoost Model...")

model.fit(
    X_train,
    y_train,
    cat_features=categorical_features
)

print("Training completed!")

# ==========================================
# 10. EVALUATE
# ==========================================

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)

rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)

r2 = r2_score(y_test, predictions)

print("\n========== CATBOOST RESULTS ==========")

print(f"MAE  : ₹{mae:,.2f}")
print(f"RMSE : ₹{rmse:,.2f}")
print(f"R²   : {r2:.4f}")

# ==========================================
# 11. SAVE MODEL
# ==========================================

model.save_model("catboost_future_price_model.cbm")

print("\nCatBoost Future Price Model Saved!")
