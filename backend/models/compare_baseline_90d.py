import pandas as pd

from backend.models.evaluation import evaluate_regression


DATASET = "data/processed/training_dataset_90d.csv"


def evaluate_city(df, city):

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    n = len(city_df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    test_df = city_df.iloc[validation_end:]

    y_true = test_df["target_pm25_6h"]

    # Persistence:
    # predict future PM2.5 using current PM2.5.
    y_pred = test_df["pm2_5"]

    metrics = evaluate_regression(
        y_true,
        y_pred,
    )

    return metrics


def main():

    df = pd.read_csv(DATASET)

    print("\n90-Day Persistence Baseline — TEST")
    print("=" * 70)

    for city in sorted(df["city"].unique()):

        metrics = evaluate_city(
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