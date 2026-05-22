import sys
import json
import argparse
import pandas as pd
import joblib
from pathlib import Path


def load_model(base_path: Path):
    model_path = base_path / "house_price_model.pkl"
    model = joblib.load(model_path)
    return model


def load_columns(base_path: Path):
    df = pd.read_csv(base_path / "cleaned_housing.csv")
    X = df.drop("price", axis=1)
    return X


def options(base_path: Path):
    X = load_columns(base_path)
    area_types = [c.replace("area_type_", "") for c in X.columns if c.startswith("area_type_")]
    locations = [c.replace("location_", "") for c in X.columns if c.startswith("location_")]
    return {"area_types": area_types, "locations": locations}


def predict(base_path: Path, payload: dict):
    model = load_model(base_path)
    X = load_columns(base_path)

    # single row with same columns
    row = pd.Series(0, index=X.columns, dtype=float)

    # numeric fields
    for k in ["total_sqft", "bath", "balcony", "bhk"]:
        if k in payload and payload[k] is not None:
            try:
                row[k] = float(payload[k])
            except Exception:
                row[k] = 0.0

    # categorical one-hot: area_type and location
    area = payload.get("area_type")
    if area:
        col = "area_type_" + area
        if col in row.index:
            row[col] = 1

    loc = payload.get("location")
    if loc:
        col = "location_" + loc
        if col in row.index:
            row[col] = 1

    # ensure shape (1, n)
    X_row = row.to_frame().T
    pred = model.predict(X_row)
    return {"price_lakhs": float(pred[0])}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--options", action="store_true", help="Print available area types and locations as JSON")
    args = parser.parse_args()

    base_path = Path(__file__).parent

    if args.options:
        out = options(base_path)
        print(json.dumps(out))
        return

    # read JSON payload from stdin
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw or "{}")
    except Exception as e:
        print(json.dumps({"error": "invalid input", "detail": str(e)}))
        sys.exit(1)

    try:
        out = predict(base_path, payload)
        print(json.dumps(out))
    except Exception as e:
        print(json.dumps({"error": "prediction_failed", "detail": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
