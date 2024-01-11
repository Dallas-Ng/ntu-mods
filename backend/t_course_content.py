import json

file1 = "backend/data/consolidated-course-content-2023-1.json"
file2 = "backend/data/consolidated-course-content-2023-2.json"

with open(file1, "r") as file:
    course_s1 = json.load(file)

with open(file2, "r") as file:
    course_s2 = json.load(file)

# Find keys present in course_s1 but not in course_s2
keys_only_in_course_s1 = [key for key in course_s1.keys() if key not in course_s2]

# Find keys present in course_s2 but not in course_s1
keys_only_in_course_s2 = [(f"http://localhost:3000/mods/{key}") for key in course_s2.keys() if key not in course_s1]

# Find keys common to both dicts and compare their values
common_keys = set(course_s1.keys()) & set(course_s2.keys())
different_values = [(key) for key in common_keys if course_s1[key] != course_s2[key]]

# Check if values associated with common keys are exactly the same
same_values = [(key) for key in common_keys if course_s1[key] == course_s2[key]]

# print("\nKeys only in course_s1:", keys_only_in_course_s1)
print("\nKeys only in course_s2:", keys_only_in_course_s2)
# print("\nCommon keys with different values:", different_values)
# print("\nCommon keys with the same values:", same_values)

print("\nNumber of keys only in course_s1:", len(keys_only_in_course_s1))
print("\nNumber of keys only in course_s2:", len(keys_only_in_course_s2))
print("\nNumber of common keys with different values:", len(different_values))
print("\nNumber of common keys with the same values:", len(same_values))
