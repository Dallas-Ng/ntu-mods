import json

BASE_PATH = "./data"

def get_path(filename, year=2023):
    return f"{BASE_PATH}/{str(year)}/{filename}"

def get_file_content(filename):
     with open(get_path(filename), "r") as json_file:
        return json.load(json_file)


TRUN_M_DATA = get_file_content("trun-m-data.json")
M_DATA_S1 = get_file_content("m-data-s1.json")
M_DATA_S2 = get_file_content("m-data-s2.json")
M_DATA = { **M_DATA_S1, **M_DATA_S2 }

print(len(TRUN_M_DATA))
print(len(M_DATA_S1))
print(len(M_DATA_S2))
print(len(M_DATA))

# TODO: Fix
