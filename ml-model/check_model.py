import pandas as pd
import joblib

# ==========================================
# LOAD TRAINED MODEL
# ==========================================

model = joblib.load("house_price_model.pkl")

# ==========================================
# LOAD DATASET COLUMNS
# ==========================================

df = pd.read_csv("cleaned_housing.csv")

# Remove target column
X = df.drop("price", axis=1)

# ==========================================
# TAKE ONE SAMPLE ROW
# ==========================================

sample = X.iloc[[0]]

print("\nSample Input:\n")
print(sample)

# ==========================================
# PREDICT PRICE
# ==========================================

prediction = model.predict(sample)

print("\nPredicted Price:")
print(round(prediction[0], 2), "Lakhs")