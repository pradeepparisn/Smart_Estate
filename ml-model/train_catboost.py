
import pandas as pd
import numpy as np

from catboost import CatBoostRegressor

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv("cleaned_housing.csv")

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

# ==========================================
# 2. FEATURES AND TARGET
# ==========================================

X = df.drop("price", axis=1)
y = df["price"]

# Convert boolean columns into integers
bool_columns = X.select_dtypes(include=["bool"]).columns

X[bool_columns] = X[bool_columns].astype(int)

# ==========================================
# 3. TRAIN TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training Data:", X_train.shape)
print("Testing Data:", X_test.shape)

# ==========================================
# 4. CREATE CATBOOST MODEL
# ==========================================

model = CatBoostRegressor(
    iterations=500,
    learning_rate=0.05,
    depth=8,
    loss_function="RMSE",
    random_seed=42,
    verbose=100,
    allow_writing_files=False
)

# ==========================================
# 5. TRAIN MODEL
# ==========================================

print("\nTraining CatBoost Model...")

model.fit(X_train, y_train)

print("\nCatBoost Training Completed!")

# ==========================================
# 6. EVALUATE MODEL
# ==========================================

y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)

mae = mean_absolute_error(y_test, y_pred)

rmse = np.sqrt(
    mean_squared_error(y_test, y_pred)
)

print("\n========== CATBOOST RESULTS ==========")

print("R2 Score:", round(r2, 4))
print("R2 Percentage:", round(r2 * 100, 2), "%")
print("MAE:", round(mae, 2))
print("RMSE:", round(rmse, 2))

# ==========================================
# 7. SAVE MODEL
# ==========================================

model.save_model("catboost_house_price_model.cbm")

print("\nCatBoost Model Saved Successfully!")
print("Saved as: catboost_house_price_model.cbm")
