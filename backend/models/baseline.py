import pandas as pd

from backend.models.evaluation import (
    evaluate_regression,
    persistence_predictions,
)


DATASET = "data/processed/training_dataset.csv"


def run_baseline():

    df = pd.read_csv(DATASET)

    y_true = df["target_pm25_6h"]

    y_pred = persistence_predictions(df)

    metrics = evaluate_regression(
        y_true,
        y_pred,
    )

    print("\nPersistence Baseline")
    print("--------------------")

    for metric, value in metrics.items():
        print(f"{metric}: {value:.4f}")

    return metrics


if __name__ == "__main__":
    run_baseline()