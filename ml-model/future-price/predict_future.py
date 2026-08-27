import json
import os
import sys
import pandas as pd
import joblib


# ==========================================
# 1. LOAD MODEL
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(
    os.path.join(BASE_DIR, "future_price_model.pkl")
)


# ==========================================
# 2. LOAD DATA
# ==========================================

df = pd.read_excel(
    os.path.join(BASE_DIR, "estate.xlsx")
)

df["date"] = pd.to_datetime(
    df["date"]
)

df = df.sort_values(
    ["locality", "date"]
)


# ==========================================
# 3. CREATE FEATURES
# ==========================================

df["previous_price"] = (
    df.groupby("locality")["price_per_sqft"]
      .shift(1)
)

df["previous_price_2"] = (
    df.groupby("locality")["price_per_sqft"]
      .shift(2)
)

df["price_growth"] = (
    (df["price_per_sqft"] - df["previous_price"])
    / df["previous_price"]
)


# ==========================================
# 4. GET LOCALITY
# ==========================================

json_mode = "--json" in sys.argv
options_mode = "--options" in sys.argv

if options_mode:
    print(json.dumps({"localities": sorted(df["locality"].dropna().unique().tolist())}))
    sys.exit()

if len(sys.argv) < 2 or sys.argv[1].startswith("--"):

    print("Usage:")
    print('python predict_future.py "Iblur Village"')
    sys.exit()


locality = sys.argv[1]


# ==========================================
# 5. CHECK LOCALITY
# ==========================================

if locality not in df["locality"].values:

    if json_mode:
        print(json.dumps({"error": "Locality not found", "localities": sorted(df["locality"].dropna().unique().tolist())}))
        sys.exit(1)

    print("Locality not found.")

    print("\nAvailable localities:")

    for name in sorted(df["locality"].unique()):
        print("-", name)

    sys.exit()


# ==========================================
# 6. GET LATEST RECORD
# ==========================================

locality_data = df[
    df["locality"] == locality
].copy()

locality_data = locality_data.sort_values(
    "date"
)

latest = locality_data.iloc[-1]


# ==========================================
# 7. CHECK HISTORY
# ==========================================

if pd.isna(latest["previous_price"]) or pd.isna(
    latest["previous_price_2"]
):

    if json_mode:
        print(json.dumps({"error": "Not enough historical data for prediction."}))
        sys.exit(1)

    print(
        "Not enough historical data for prediction."
    )

    sys.exit()


# ==========================================
# 8. CREATE MODEL INPUT
# ==========================================

input_data = pd.DataFrame([
    {
        "locality": latest["locality"],
        "zone": latest["zone"],
        "property_type": latest["property_type"],

        # IMPORTANT:
        # Use the latest historical date
        "year": latest["year"],
        "month": latest["month"],

        "price_per_sqft": latest["price_per_sqft"],
        "previous_price": latest["previous_price"],
        "previous_price_2": latest["previous_price_2"],
        "price_growth": latest["price_growth"]
    }
])


# ==========================================
# 9. PREDICT
# ==========================================

prediction = model.predict(
    input_data
)[0]


# ==========================================
# 10. CALCULATE CHANGE
# ==========================================

current_price = latest["price_per_sqft"]

change_percent = (
    (prediction - current_price)
    / current_price
) * 100

if json_mode:
    history = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "price_per_sqft": round(float(row["price_per_sqft"]), 2),
        }
        for _, row in locality_data.iterrows()
    ]
    print(json.dumps({
        "locality": locality,
        "zone": str(latest["zone"]),
        "property_type": str(latest["property_type"]),
        "latest_date": latest["date"].strftime("%Y-%m-%d"),
        "current_price": round(float(current_price), 2),
        "predicted_price": round(float(prediction), 2),
        "change_percent": round(float(change_percent), 2),
        "forecast_period": "Next 6 months",
        "history": history,
    }))
    sys.exit()


# ==========================================
# 11. DISPLAY RESULT
# ==========================================

print("\n================================")
print("BENGALURU FUTURE PRICE FORECAST")
print("================================")

print(
    f"Locality          : {locality}"
)

print(
    f"Zone              : {latest['zone']}"
)

print(
    f"Property Type     : {latest['property_type']}"
)

print(
    f"Latest data       : {latest['date'].strftime('%B %Y')}"
)

print(
    f"Current price     : ₹{current_price:,.0f}/sqft"
)

print(
    f"Predicted price   : ₹{prediction:,.0f}/sqft"
)

print(
    f"Expected change   : {change_percent:+.2f}%"
)

print(
    "Forecast period   : Next 6 months"
)

print("================================")