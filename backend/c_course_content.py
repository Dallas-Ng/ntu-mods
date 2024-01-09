import json

from utils import jsonify


input_file_path = "backend/data/course_content.json"
output_file_path = "backend/data/consolidated-course-content-2023-2.json"

with open(input_file_path, "r") as file:
    courses = json.load(file)

# {''
# 'search_key'
# 'prerequisite'
# 'au'
# 'mutually exclusive with'
# 'not available as pe to programme'
# 'not available as core to programme'
# 'programme-dept-maintain'
# 'grade type'
# 'code'
# 'not available to all programme with'
# 'title'
# 'not available to programme'
# 'description'
# 'not available as bde/ue to programme'}


# unique_keys = set()
# # stats
# for course in courses:
#     for key in course.keys():
#         unique_keys.add(key)
# print(unique_keys)


# Consolidation
consolidated_courses = {}
for course in courses:
    code = course.get("code")

    if code in consolidated_courses.keys():
        # append search keys for repeating courses
        consolidated_courses[code]["searchKeys"].append(course["searchKeys"])
    else:
        # modify main course model

        # change search key to search keys
        course["searchKeys"] = [course["searchKeys"]]

        # chunk out prerequisite
        # e.g. prerequisite - AB1202 & AB1202 OR BC2406 & BC2406
        #                   to [[AB1202, AB1202], [BC2406, BC2406]]

        if "prerequisite" in course.keys():
            prerequisites = course["prerequisite"].split("OR")
            prerequisites = [
                [item.strip() for item in p.split("&")] for p in prerequisites
            ]
            course["prerequisite"] = prerequisites

        if "mutuallyExclusiveWith" in course.keys():
            course["mutuallyExclusiveWith"] = [
                item.strip() for item in course["mutuallyExclusiveWith"].split(",")
            ]

        consolidated_courses[code] = course


jsonify(output_file_path, consolidated_courses, minify=False)


# {
#     "maintainingDept",
#     "notAvailableToAllProgrammeWith",
#     "notAvailableAsPeToProgramme",
#     "prerequisite",
#     "description",
#     "au",
#     "notAvailableToProgramme",
#     "title",
#     "gradeType",
#     "notAvailableAsBdeueToProgramme",
#     "mutuallyExclusiveWith",
#     "notAvailableAsCoreToProgramme",
#     "searchKeys",
#     "notOffered",
#     "code",
# }
