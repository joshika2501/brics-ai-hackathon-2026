import pandas as pd

from backend.models.evaluation import evaluate_regression
from backend.models.evaluation import persistence_predictions


DATASET = "data/processed/training_dataset.csv"


def compare_city(df, city):

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    split_index = int(len(city_df) * 0.70)

    validation_df = city_df.iloc[split_index:]

    y_true = validation_df["target_pm25_6h"]

    y_pred = persistence_predictions(validation_df)

    metrics = evaluate_regression(
        y_true,
        y_pred,
    )

    return metrics


def main():

    df = pd.read_csv(DATASET)

    print("\nPersistence Baseline — Validation Period")
    print("=" * 60)

    for city in sorted(df["city"].unique()):

        metrics = compare_city(
            df,
            city,
        )

        print(
            f"{city:15s} "
            f"MAE={metrics['MAE']:.4f}  "
            f"RMSE={metrics['RMSE']:.4f}  "
            f"R2={metrics['R2']:.4f}"
        )


if __name__ == "__main__":
    main()