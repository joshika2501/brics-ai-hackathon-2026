from pathlib import Path

import pandas as pd

from backend.services.feature_engineering import create_features


RAW_DIR = Path("data/raw_90d")
PROCESSED_DIR = Path("data/processed")

OUTPUT_FILE = PROCESSED_DIR / "training_dataset_90d.csv"


def build_training_dataset():

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    files = sorted(
        RAW_DIR.glob("*.csv")
    )

    if not files:
        raise FileNotFoundError(
            "No raw CSV files found in data/raw_90d"
        )

    frames = []

    for file in files:

        print(f"Loading {file}")

        df = pd.read_csv(file)

        features = create_features(df)

        frames.append(features)

        print(
            f"Feature rows: {len(features)}"
        )

    combined = pd.concat(
        frames,
        ignore_index=True
    )

    combined = combined.sort_values(
        ["country", "city", "time"]
    ).reset_index(drop=True)

    combined.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nTraining dataset created.")
    print(f"Rows: {len(combined)}")
    print(f"Columns: {len(combined.columns)}")
    print(f"Saved: {OUTPUT_FILE}")

    print("\nRows per city:")

    print(
        combined.groupby(
            ["country", "city"]
        ).size()
    )

    return combined


if __name__ == "__main__":
    build_training_dataset()