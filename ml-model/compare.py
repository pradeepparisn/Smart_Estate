import pandas as pd
import joblib

from sklearn.model_selection import train_test_split

# ==========================================
# LOAD DATASET
# ==========================================

df = pd.read_csv("cleaned_housing.csv")

# ==========================================
# FEATURES & TARGET
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

# ==========================================
# LOAD MODEL
# ==========================================

model = joblib.load("house_price_model.pkl")

# ==========================================
# TAKE ONE TEST SAMPLE
# ==========================================

sample = X_test.iloc[[0]]

actual_price = y_test.iloc[0]

predicted_price = model.predict(sample)[0]

# ==========================================
# RESULTS
# ==========================================

print("\nActual Price:")
print(round(actual_price, 2), "Lakhs")

print("\nPredicted Price:")
print(round(predicted_price, 2), "Lakhs")