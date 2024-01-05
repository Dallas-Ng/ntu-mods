import json
import os
import collections


def consolidate_course_data(filepaths):
    """
    Consolidates course data from multiple JSON files into two combined JSON files:
    'combined-<academic_year>.json' for course information and
    'combined-<academic_year>-indexes.json' for index information.

    Args:
        filepaths (list): List of JSON file paths to be consolidated.

    Returns:
        None
    """
    combined_data = {}
    combined_indexes = {}

    for filepath in filepaths:
        filepath_split = filepath.split("\\")
        academic_year = filepath_split[1]

        if academic_year != "2023-2":
            continue

        with open(filepath, "r") as file:
            print(filepath)
            data = json.load(file)

            for key, course_data in data.items():
                if key in combined_data:
                    for k, v in course_data["indexes"].items():
                        """
                        Previously, if this wasnt here it would not map certain indexes to their modules
                        I assume it is because it was being overridden by course data directly as
                        certain course data does not have ALL the indexes of the module

                        Example:    key of mod      indexes of the mod
                          ACC 1     - AB101   - Index 100, Index 101
                          ACC (FA)  - AB101   - Index 100, Index 103

                          101 might be deleted as we are replacing the course data by key of the module
                              combined_data [key_of_mod] = indexes

                          Note that 101 will be deleted as we take the latest version of the mod instead of combininng
                            all the indexes
                        """
                        # for sub index, we assign a index key to it.
                        # example: SC1005, has lectures, tutorial and lab, but index key is only shown on the FIRST index of the course index
                        for x in v:
                            if x["key"] == "":
                                x["key"] = v[0]["key"]

                        combined_data[key]["indexes"][k] = v
                else:
                    combined_data[key] = course_data

                for k, v in course_data["indexes"].items():
                    # for j in v:
                    # j["title"] = course_data["title"]
                    combined_indexes[k] = v

    combined_data = collections.OrderedDict(sorted(combined_data.items()))
    combined_indexes = collections.OrderedDict(sorted(combined_data.items()))

    with open(f"backend/data/consolidated-{academic_year}.json", "w") as output:
        json.dump(combined_data, output)

    with open(f"backend/data/consolidated-{academic_year}-indexes.json", "w") as output:
        json.dump(combined_indexes, output)


directories = [dir.path for dir in os.scandir("backend/data/courses")]

files = []
for directory in directories:
    for item in os.scandir(directory):
        if item.is_file():
            files.append(os.path.join(directory, item.name))


consolidate_course_data(files)
