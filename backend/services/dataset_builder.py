from pathlib import Path

from backend.services.historical import get_historical_data


CITIES = {
    "delhi": {
        "country": "India",
        "city": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
    },
    "sao_paulo": {
        "country": "Brazil",
        "city": "Sao Paulo",
        "latitude": -23.5505,
        "longitude": -46.6333,
    },
    "johannesburg": {
        "country": "South Africa",
        "city": "Johannesburg",
        "latitude": -26.2041,
        "longitude": 28.0473,
    },
}


# Keep the original 7-day dataset untouched.
OUTPUT_DIR = Path("data/raw_90d")


def build_datasets(start_date: str, end_date: str):

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    for filename, city_info in CITIES.items():

        print(
            f"\nDownloading data for "
            f"{city_info['city']}, {city_info['country']}..."
        )

        df = get_historical_data(
            latitude=city_info["latitude"],
            longitude=city_info["longitude"],
            start_date=start_date,
            end_date=end_date,
        )

        df["country"] = city_info["country"]
        df["city"] = city_info["city"]
        df["latitude"] = city_info["latitude"]
        df["longitude"] = city_info["longitude"]

        output_file = OUTPUT_DIR / f"{filename}.csv"

        df.to_csv(
            output_file,
            index=False
        )

        print(f"Saved: {output_file}")
        print(f"Rows: {len(df)}")
        print(f"Columns: {len(df.columns)}")


if __name__ == "__main__":

    build_datasets(
        start_date="2026-05-01",
        end_date="2026-08-01",
    )