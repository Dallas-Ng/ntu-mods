import json

BASE_PATH = "./src/data"

"""
Helper Functions
"""
def get_path(filename, year=2023):
    return f"{BASE_PATH}/{str(year)}/{filename}"


def get_file_content(filename):
     with open(get_path(filename), "r") as json_file:
        return json.load(json_file)
     

def test_equality_length(dataset1, dataset1_name, dataset2, dataset2_name):
    print(f"Testing Equality of {dataset1_name} and {dataset2_name}")

    try:
        assert len(dataset1) == len(dataset2)
        print(f"Lengths are equal: {len(dataset1)} == {len(dataset2)}")
    except AssertionError:
        print(f"Lengths are not equal: {len(dataset1)} != {len(dataset2)}")
        

"""
JSON Files - in order of file directory
"""
EXAMS = get_file_content("exams.json")
INDEXES = get_file_content("indexes.json")
M_AU = get_file_content("m-au.json")
M_DATA_S1 = get_file_content("m-data-s1.json")
M_DATA_S2 = get_file_content("m-data-s2.json")
M_DATA = { **M_DATA_S1, **M_DATA_S2 } # Merge Dictionary, S2 overrides S1
M_INDEXES = get_file_content("m-indexes.json")
TRUN_M_DATA = get_file_content("trun-m-data.json")

print(f"LENGTH: EXAMS       | {len(EXAMS)}")
print(f"LENGTH: INDEXES     | {len(INDEXES)}")
print(f"LENGTH: M_AU        | {len(M_AU)}")
print(f"LENGTH: M_DATA_S1   | {len(M_DATA_S1)}")
print(f"LENGTH: M_DATA_S2   | {len(M_DATA_S2)}")
print(f"LENGTH: M_DATA      | {len(M_DATA)}")
print(f"LENGTH: M_INDEXES   | {len(M_INDEXES)}")
print(f"LENGTH: TRUN_M_DATA | {len(TRUN_M_DATA)}")

print("\n===========\n")

# Equality Tests
test_equality_length(M_AU, "M_AU", M_DATA, "M_DATA") # Both dervived from same set
test_equality_length(M_INDEXES, "M_INDEXES", TRUN_M_DATA, "") # Both dervived from same set
