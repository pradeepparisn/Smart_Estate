
import pandas as pd
import joblib
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Load dataset
df = pd.read_csv("cleaned_housing.csv")

X = df.drop("price", axis=1)
y = df["price"]

# Same test split for both models
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Load models
rf_model = joblib.load("house_price_model.pkl")
xgb_model = joblib.load("xgboost_house_price_model.pkl")

models = {
    "Random Forest": rf_model,
    "XGBoost": xgb_model
}

results = []

for name, model in models.items():

    predictions = model.predict(X_test)

    results.append({
        "Model": name,
        "R2 Score": round(r2_score(y_test, predictions), 4),
        "MAE": round(mean_absolute_error(y_test, predictions), 2),
        "RMSE": round(np.sqrt(mean_squared_error(y_test, predictions)), 2)
    })

result_df = pd.DataFrame(results)

print("\n========== MODEL COMPARISON ==========")
print(result_df.to_string(index=False))

