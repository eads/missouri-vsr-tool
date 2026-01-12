#!/usr/bin/env python3
"""
Analyze 2024 Missouri traffic stop data for homepage highlights
"""
import json
from pathlib import Path
from collections import defaultdict

# Path to agency year data
AGENCY_YEAR_DIR = Path("static/data/agency_year")

# Metrics we care about
METRICS = {
    "all_stops": "rates-by-race--totals--all-stops",
    "searches": "rates-by-race--totals--searches",
    "contraband": "rates-by-race--totals--contraband",
    "citations": "rates-by-race--totals--citations",
    "arrests": "rates-by-race--totals--arrests",
    "warnings": "rates-by-race--totals--warnings",
    "search_rate": "rates-by-race--totals--searches-rate",
    "contraband_rate": "rates-by-race--totals--contraband-rate",
}

def main():
    # Aggregated data
    year_2024_data = defaultdict(lambda: defaultdict(float))
    agency_count = 0

    # Read all agency files
    for agency_file in AGENCY_YEAR_DIR.glob("*.json"):
        try:
            with open(agency_file) as f:
                data = json.load(f)

            # Filter for 2024 data
            for row in data.get("rows", []):
                if row.get("year") != 2024:
                    continue

                row_key = row.get("row_key")

                # Check if this is a metric we care about
                for metric_name, metric_key in METRICS.items():
                    if row_key == metric_key:
                        # Sum up the values by race
                        for race in ["Total", "White", "Black", "Hispanic", "Native American", "Asian", "Other"]:
                            value = row.get(race)
                            if value is not None and value != "":
                                year_2024_data[metric_name][race] += float(value)

                        if metric_name == "all_stops" and row.get("Total"):
                            agency_count += 1
                        break
        except Exception as e:
            print(f"Error processing {agency_file}: {e}")
            continue

    # Calculate rates where needed
    print("=" * 80)
    print("2024 MISSOURI TRAFFIC STOP DATA")
    print("=" * 80)
    print()

    # 1. Total stops
    print("1. TOTAL STOPS")
    print("-" * 40)
    total_stops = year_2024_data["all_stops"]["Total"]
    print(f"Total stops: {total_stops:,.0f}")
    print(f"Agencies reporting: {agency_count}")
    print()
    print("By race:")
    for race in ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]:
        count = year_2024_data["all_stops"][race]
        pct = (count / total_stops * 100) if total_stops > 0 else 0
        print(f"  {race:20s}: {count:10,.0f} ({pct:5.1f}%)")
    print()

    # 2. Searches and contraband
    print("2. SEARCHES AND CONTRABAND")
    print("-" * 40)
    total_searches = year_2024_data["searches"]["Total"]
    total_contraband = year_2024_data["contraband"]["Total"]
    search_rate = (total_searches / total_stops * 100) if total_stops > 0 else 0
    hit_rate = (total_contraband / total_searches * 100) if total_searches > 0 else 0

    print(f"Total searches: {total_searches:,.0f}")
    print(f"Search rate: {search_rate:.1f}%")
    print(f"Contraband found: {total_contraband:,.0f}")
    print(f"Hit rate: {hit_rate:.1f}%")
    print()
    print("By race:")
    for race in ["White", "Black", "Hispanic"]:
        searches = year_2024_data["searches"][race]
        contraband = year_2024_data["contraband"][race]
        race_search_rate = (searches / year_2024_data["all_stops"][race] * 100) if year_2024_data["all_stops"][race] > 0 else 0
        race_hit_rate = (contraband / searches * 100) if searches > 0 else 0
        print(f"  {race:20s}: {searches:8,.0f} searches ({race_search_rate:4.1f}%), {contraband:8,.0f} contraband ({race_hit_rate:4.1f}%)")
    print()

    # 3. Outcomes
    print("3. OUTCOMES")
    print("-" * 40)
    total_citations = year_2024_data["citations"]["Total"]
    total_arrests = year_2024_data["arrests"]["Total"]
    total_warnings = year_2024_data["warnings"]["Total"]

    print(f"Citations: {total_citations:,.0f} ({total_citations/total_stops*100:.1f}%)")
    print(f"Arrests: {total_arrests:,.0f} ({total_arrests/total_stops*100:.1f}%)")
    print(f"Warnings: {total_warnings:,.0f} ({total_warnings/total_stops*100:.1f}%)")
    print()

    # Save to JSON for use in the app
    output_data = {
        "year": 2024,
        "total_stops": total_stops,
        "agency_count": agency_count,
        "by_race": {
            "all_stops": dict(year_2024_data["all_stops"]),
            "searches": dict(year_2024_data["searches"]),
            "contraband": dict(year_2024_data["contraband"]),
            "citations": dict(year_2024_data["citations"]),
            "arrests": dict(year_2024_data["arrests"]),
            "warnings": dict(year_2024_data["warnings"]),
        },
        "summary": {
            "search_rate": search_rate,
            "hit_rate": hit_rate,
            "citation_rate": total_citations/total_stops*100 if total_stops > 0 else 0,
            "arrest_rate": total_arrests/total_stops*100 if total_stops > 0 else 0,
            "warning_rate": total_warnings/total_stops*100 if total_stops > 0 else 0,
        }
    }

    output_file = Path("static/data/homepage_2024_stats.json")
    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    main()
