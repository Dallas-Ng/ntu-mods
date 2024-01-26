"""
https://googlechrome.github.io/lighthouse/viewer/
"""

import os
import json

# Directory path containing JSON files
reports_directory = './scripts/reports'

# Initialize aggregate scores
aggregate_scores = {
    "performance": 0,
    "accessibility": 0,
    "best-practices": 0,
    "seo": 0,
    "pwa": 0
}

# Print table header
print(f"| {'File':<30} | {'Performance':<15} | {'Accessibility':<15} | {'Best Practices':<15} | {'SEO':<15} | {'PWA':<15} |")

# Iterate over each JSON file in the directory
for filename in os.listdir(reports_directory):
    if filename.endswith('.json') and (".trace" not in filename and ".devtoolslog" not in filename):
        file_path = os.path.join(reports_directory, filename)

        # Load JSON data from the file with explicit encoding
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # Extract category scores
        performance_score = data['categories']['performance']['score']
        accessibility_score = data['categories']['accessibility']['score']
        best_practices_score = data['categories']['best-practices']['score']
        seo_score = data['categories']['seo']['score']
        pwa_score = data['categories']['pwa']['score']

        # Aggregate scores
        aggregate_scores['performance'] += performance_score
        aggregate_scores['accessibility'] += accessibility_score
        aggregate_scores['best-practices'] += best_practices_score
        aggregate_scores['seo'] += seo_score
        aggregate_scores['pwa'] += pwa_score

        # Print individual scores for each URL in table format
        print(f"| {filename:<30} | {performance_score:<15.2f} | {accessibility_score:<15.2f} | {best_practices_score:<15.2f} | {seo_score:<15.2f} | {pwa_score:<15.2f} |")

# Print table footer
print("|" + "-" * 100 + "|")

# Print aggregate scores in table format
print(f"| {'Aggregate Scores':<30} | {aggregate_scores['performance'] / len(os.listdir(reports_directory)):<15.2f} | {aggregate_scores['accessibility'] / len(os.listdir(reports_directory)):<15.2f} | {aggregate_scores['best-practices'] / len(os.listdir(reports_directory)):<15.2f} | {aggregate_scores['seo'] / len(os.listdir(reports_directory)):<15.2f} | {aggregate_scores['pwa'] / len(os.listdir(reports_directory)):<15.2f} |")
print("|" + "-" * 100 + "|")
