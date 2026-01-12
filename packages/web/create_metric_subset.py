#!/usr/bin/env python3
"""
Create metric_year_subset.json for scatterplot visualizations
This converts agency_year/*.json files into the compressed format
expected by AgencyRateScatter component
"""
import json
from pathlib import Path
from collections import defaultdict

# Input/output paths
AGENCY_YEAR_DIR = Path("static/data/agency_year")
OUTPUT_FILE = Path("static/data/metric_year_subset.json")

# Columns we care about
COLUMNS = ["Total", "White", "Black", "Hispanic", "Native American", "Asian", "Other"]

# Metric keys we need for the scatterplots
METRIC_KEYS = [
    # For total stops visualization
    "rates-by-race--totals--all-stops",

    # For search rate scatter
    "rates-by-race--totals--searches",
    "rates-by-race--rates--search-rate",

    # For contraband/hit rate scatter
    "rates-by-race--totals--contraband",
    "rates-by-race--rates--contraband-hit-rate",

    # For outcomes
    "rates-by-race--totals--citations",
    "rates-by-race--totals--arrests",
    "rates-by-race--totals--warnings",
]

def main():
    # Build indices
    agencies = []
    agency_to_idx = {}
    years_set = set()

    # First pass: collect agencies and years
    print(f"Scanning {AGENCY_YEAR_DIR}...")
    for agency_file in sorted(AGENCY_YEAR_DIR.glob("*.json")):
        with open(agency_file) as f:
            data = json.load(f)
            agency_name = data["agency"]
            if agency_name not in agency_to_idx:
                agency_to_idx[agency_name] = len(agencies)
                agencies.append(agency_name)

            for row in data["rows"]:
                years_set.add(row["year"])

    years = sorted(years_set)
    year_to_idx = {year: idx for idx, year in enumerate(years)}

    print(f"Found {len(agencies)} agencies and {len(years)} years")

    # Build rows structure
    rows = defaultdict(list)

    # Second pass: build compressed rows
    for agency_file in sorted(AGENCY_YEAR_DIR.glob("*.json")):
        with open(agency_file) as f:
            data = json.load(f)
            agency_name = data["agency"]
            agency_idx = agency_to_idx[agency_name]

            for row in data["rows"]:
                row_key = row.get("row_key")
                if row_key not in METRIC_KEYS:
                    continue

                year = row["year"]
                year_idx = year_to_idx[year]

                # Build value array for this row
                values = [agency_idx, year_idx]
                for col in COLUMNS:
                    val = row.get(col)
                    # Convert to number or null
                    if val is None or val == "":
                        values.append(None)
                    else:
                        try:
                            values.append(float(val))
                        except (ValueError, TypeError):
                            values.append(None)

                rows[row_key].append(values)

    # Build final output
    output = {
        "agencies": agencies,
        "years": years,
        "columns": COLUMNS,
        "rows": {key: sorted(row_list) for key, row_list in rows.items()}
    }

    print(f"Writing {OUTPUT_FILE}...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, separators=(',', ':'))

    print(f"✓ Created {OUTPUT_FILE}")
    print(f"  {len(agencies)} agencies")
    print(f"  {len(years)} years: {min(years)}-{max(years)}")
    print(f"  {len(rows)} metric keys")
    for key in sorted(rows.keys()):
        print(f"    - {key}: {len(rows[key])} rows")

if __name__ == "__main__":
    main()
