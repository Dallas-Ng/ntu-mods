import pytest
from utils import read_json


def find_entry_difference(dict1, dict2):
    # Find common keys between the two dictionaries
    common_keys = set(dict1) & set(dict2)

    # Create a dictionary containing entries unique to each dictionary
    difference_entries = {key: dict1[key] for key in (set(dict1) - common_keys)} | {
        key: dict2[key] for key in (set(dict2) - common_keys)
    }

    return difference_entries


def test_find_entry_difference():
    dict1 = {"a": 1, "b": 2, "c": 3}
    dict2 = {"b": 2, "c": 3, "d": 4}

    assert find_entry_difference(dict1, dict2) == {"a": 1, "d": 4}


@pytest.fixture
def processed_data():
    return read_json("data/combined-2023-2.json")


@pytest.fixture
def processed_indexes():
    return read_json("data/combined-2023-2-indexes.json")


def test_non_unique_indexes_count(processed_data):
    non_unique_indexes_count = sum(len(module_data["indexes"]) for module_data in processed_data.values())
    assert non_unique_indexes_count > 0


def test_unique_indexes_count(processed_data):
    unique_indexes_from_processed_data = {
        index_key: index_value
        for module_data in processed_data.values()
        for index_key, index_value in module_data["indexes"].items()
    }
    assert len(unique_indexes_from_processed_data) > 0


def test_processed_indexes_count(processed_indexes):
    assert len(processed_indexes) > 0


def test_find_and_print_differences(processed_data, processed_indexes):
    unique_indexes_from_processed_data = {
        index_key: index_value
        for module_data in processed_data.values()
        for index_key, index_value in module_data["indexes"].items()
    }
    differences = find_entry_difference(unique_indexes_from_processed_data, processed_indexes)
    assert len(differences) == 0


def test_modules_count(processed_data):
    assert len(processed_data) > 0
