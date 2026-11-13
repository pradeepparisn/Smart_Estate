
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
import numpy as np

# LOAD DATASET
df = pd.read_csv("cleaned_housing.csv")

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

# FEATURES AND TARGET
X = df.drop("price", axis=1)
y = df["price"]

# TRAIN TEST SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training Data:", X_train.shape)
print("Testing Data:", X_test.shape)

# CREATE XGBOOST MODEL
model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=-1
)

# TRAIN MODEL
print("\nTraining XGBoost Model...")

model.fit(X_train, y_train)

print("Model Trained Successfully!")

# EVALUATE MODEL
y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print("\n========== XGBOOST RESULTS ==========")
print("R2 Score:", round(r2, 4))
print("R2 Percentage:", round(r2 * 100, 2), "%")
print("MAE:", round(mae, 2))
print("RMSE:", round(rmse, 2))

# SAVE MODEL
joblib.dump(model, "xgboost_house_price_model.pkl")

# SAVE FEATURE ORDER
joblib.dump(list(X.columns), "xgboost_model_columns.pkl")

print("\nXGBoost Model Saved Successfully!")
