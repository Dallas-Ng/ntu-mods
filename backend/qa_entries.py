from utils import read_json

"""
Currently there are cases where there are indexes that are not shown publically in the browser but
scrapped from our program

examples

{'00015': [{'type': 'SEM', 'group': '5', 'day': 'TUE', 'time': '1330-1720', 'venue': 'S3-SR3', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING I'}],
'00016': [{'type': 'SEM', 'group': '6', 'day': 'WED', 'time': '1430-1820', 'venue': 'S4-SR21', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING I'}],
'00017': [{'type': 'SEM', 'group': '7', 'day': 'THU', 'time': '0830-1220', 'venue': 'S3-SR3', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING I'}],
'00018': [{'type': 'SEM', 'group': '8', 'day': 'THU', 'time': '1330-1720', 'venue': 'S4-SR9', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING I'}],
'00019': [{'type': 'SEM', 'group': '9', 'day': 'FRI', 'time': '0830-1220', 'venue': 'S3-SR2', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING I'}],
'00027': [{'type': 'SEM', 'group': '2', 'day': 'TUE', 'time': '1330-1720', 'venue': 'S4-SR16', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING II'}],
'00028': [{'type': 'SEM', 'group': '3', 'day': 'WED', 'time': '0830-1220', 'venue': 'S3-SR5', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING II'}],
'00029': [{'type': 'SEM', 'group': '4', 'day': 'WED', 'time': '1430-1820', 'venue': 'S4-SR19', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING II'}],
'00037': [{'type': 'SEM', 'group': '2', 'day': 'WED', 'time': '1430-1820', 'venue': 'S4-SR7', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING RECOGNITION & MEASUREMENT'}],
'00038': [{'type': 'SEM', 'group': '3', 'day': 'THU', 'time': '0830-1220', 'venue': 'S4-SR2', 'remarks': '', 'duration': 7, 'title': 'ACCOUNTING RECOGNITION & MEASUREMENT'}]}
"""


def find_entry_difference(dict1, dict2):
    keys_set1 = set(dict1.keys())
    keys_set2 = set(dict2.keys())

    common_keys = keys_set1.intersection(keys_set2)

    difference_entries = {key: dict1[key] for key in (keys_set1 - common_keys)} | {
        key: dict2[key] for key in (keys_set2 - common_keys)
    }

    sorted_entries = sorted(difference_entries.items(), key=lambda x: x[0])
    top_10_differences = dict(sorted_entries[:10])

    return top_10_differences


processed_data = read_json("backend/data/combined-2023-2.json")
processed_indexes = read_json("backend/data/combined-2023-2-indexes.json")


# NOT unique indexes from process_data
NOT_unique_indexes_from_process_data = 0
for k in processed_data.keys():
    indexes = processed_data[k]["indexes"]
    NOT_unique_indexes_from_process_data += len(indexes)

print(
    "NOT unique indexes from process_data " + str(NOT_unique_indexes_from_process_data)
)

# unique indexes from process_data
unique_indexes_from_process_data = {}
for k in processed_data.keys():
    indexes = processed_data[k]["indexes"]

    for k, v in indexes.items():
        unique_indexes_from_process_data[k] = v

print("unique indexes from process_data " + str(len(unique_indexes_from_process_data)))

# unique indexes from process_indexes
print("unique indexes from process_indexes " + str(len(processed_indexes)))

# diff
difference = find_entry_difference(unique_indexes_from_process_data, processed_indexes)
print(f"diff {len(difference)}")
print(difference)


# number of modules
print("number of modules " + str(len(processed_data)))
