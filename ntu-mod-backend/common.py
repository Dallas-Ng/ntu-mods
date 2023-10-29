import json, pickle, requests, logging
from typing import Any, List


"""
Response Handling
"""


def response_handler(response) -> requests.Response:
    if response.status_code == 200:
        return response

    else:
        raise RuntimeError(
            f"Failed to retrieve the web page. Status code: {response.status_code}"
        )


def get_response(url) -> requests.Response:
    logging.info(f"GET REQUEST: {url}")
    return response_handler(requests.get(url))


def post_response(url, payload=None) -> requests.Response:
    logging.info(f"POST REQUEST: {url}")
    return response_handler(requests.post(url, data=payload))


"""
Pickling
"""


def pickle_this(filename: str, data: Any) -> None:
    if ".pkl" not in filename:
        raise RuntimeError("Invalid filename")

    with open(filename, "wb") as file:
        pickle.dump(data, file)

    logging.info(f"PICKLED: {file}")


def unpickle_this(filename: str) -> Any:
    if ".pkl" not in filename:
        raise RuntimeError("Invalid filename")

    with open(filename, "rb") as file:
        juice = pickle.load(file)

    logging.info(f"JUICED: {file}")
    return juice


"""
JSON
"""


def jsonify(filename: str, json_content: object, minifiy=True) -> None:
    with open(filename, "w") as json_file:
        if minifiy:
            json.dump(json_content, json_file, separators=(",", ":"))
        else:
            json.dump(json_content, json_file, indent=4)

    logging.info(f"JSONed: {filename}")


def read_json(filename: str) -> json:
    if ".json" not in filename:
        raise TypeError("Invalid file name")

    with open(filename, "r") as json_file:
        return json.load(json_file)


"""
Other functions
"""


def clear_invalid_items(options: List[object]):
    """
    Filter and transform a list of HTML 'option' elements to remove invalid items.

    Args:
        options (List[object]): A list of HTML 'option' elements.

    Returns:
        List[dict]: A list of valid items, each represented as a dictionary with 'code' and 'title' keys.
    """
    valid_items = []

    for item in options:
        if "--" not in item.text and len(item.text.strip()) > 0:
            valid_items.append(item)

    return valid_items
