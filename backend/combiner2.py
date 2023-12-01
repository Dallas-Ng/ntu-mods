import json
import os


def combine_json_files(filepaths):
    """
    Combines multiple JSON files containing course data into two consolidated JSON files:
    'combined-2023-2.json' for course information and 'combined-2023-2-indexes.json' for index information.

    Args:
        file_names (list): List of JSON file names to be combined.

    Returns:
        None
    """
    combined_data = {}
    combined_indexes = {}

    for filepath in filepaths:
        filepath_split = filepath.split("\\")
        academic_year = filepath_split[1]

        with open(filepath, "r") as file:
            print(filepath)
            data = json.load(file)

            for key, course_data in data.items():
                combined_data[key] = course_data

                for k, v in course_data["indexes"].items():
                    for j in v:
                        j["title"] = course_data["title"]
                    combined_indexes[k] = v

    with open(f"backend/data/combined-{academic_year}.json", "w") as output:
        json.dump(combined_data, output, indent=2)

    with open(f"backend/data/combined-{academic_year}-indexes.json", "w") as output:
        json.dump(combined_indexes, output, indent=2)


directories = [dir.path for dir in os.scandir("backend/data/courses")]

files = []
for directory in directories:
    for item in os.scandir(directory):
        if item.is_file():
            files.append(os.path.join(directory, item.name))


combine_json_files(files)
