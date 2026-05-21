import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

# ==========================================
# LOAD CLEANED DATASET
# ==========================================

df = pd.read_csv("cleaned_housing.csv")

print("\nDataset Loaded Successfully!")
print(df.head())

# ==========================================
# FEATURES AND TARGET
# ==========================================

X = df.drop("price", axis=1)

y = df["price"]

# ==========================================
# TRAIN TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining Data:", X_train.shape)
print("Testing Data:", X_test.shape)

# ==========================================
# CREATE RANDOM FOREST MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

# ==========================================
# TRAIN MODEL
# ==========================================

print("\nTraining Model...")

model.fit(X_train, y_train)

print("Model Trained Successfully!")

# ==========================================
# TEST MODEL
# ==========================================

y_pred = model.predict(X_test)

accuracy = r2_score(y_test, y_pred)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "house_price_model.pkl"
)

print("\nModel Saved Successfully!")
print("Saved as: house_price_model.pkl")