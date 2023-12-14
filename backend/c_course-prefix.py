import json
import os


def consolidate_course_prefix(filepaths):
    """
    Consolidates course data from multiple JSON files into two combined JSON files:
    'combined-<academic_year>.json' for course information and
    'combined-<academic_year>-indexes.json' for index information.

    Args:
        filepaths (list): List of JSON file paths to be consolidated.

    Returns:
        None
    """
    unique_prefixes = {}

    for filepath in filepaths:
        with open(filepath, "r") as file:
            # print(filepath)
            data = json.load(file)

            for key, course_data in data.items():
                unique_prefixes[
                    "".join(c for c in key if not c.isdigit())
                ] = course_data["title"]

    # print(unique_prefixes)
    with open(f"backend/data/unique-prefixes.json", "w") as output:
        json.dump(unique_prefixes, output)
        # print(json.dump(unique_prefixes))


directories = [dir.path for dir in os.scandir("backend/data/courses")]

files = []
for directory in directories:
    for item in os.scandir(directory):
        if item.is_file():
            files.append(os.path.join(directory, item.name))


consolidate_course_prefix(files)
