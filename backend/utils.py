import json, pickle, requests, logging, os
from typing import Any, List


def load_logger():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


"""
Response Handling
"""


def response_handler(response: requests.Response) -> requests.Response:
    """
    Handles HTTP responses.

    Args:
        response (requests.Response): HTTP response object.

    Returns:
        requests.Response: The input response if status code is 200.

    Raises:
        RuntimeError: If status code is not 200.
    """
    if response.status_code == 200:
        return response
    else:
        raise RuntimeError(
            f"Failed to retrieve the web page. Status code: {response.status_code}"
        )


def get_response(url: str) -> requests.Response:
    """
    Sends a GET request to the specified URL and handles the response.

    Args:
        url (str): URL for the GET request.

    Returns:
        requests.Response: HTTP response object.
    """
    logging.info(f"GET REQUEST: {url}")
    return response_handler(requests.get(url))


def post_response(url: str, payload: dict = None) -> requests.Response:
    """
    Sends a POST request to the specified URL with optional payload and handles the response.

    Args:
        url (str): URL for the POST request.
        payload (dict): Data to include in the POST request.

    Returns:
        requests.Response: HTTP response object.
    """
    logging.info(f"POST REQUEST: {url}")
    return response_handler(requests.post(url, data=payload))


"""
Pickling
"""


def pickle_this(filename: str, data: Any) -> None:
    """
    Pickles data and saves it to the specified file.

    Args:
        filename (str): Name of the file to save the pickled data.
        data (Any): Data to be pickled.

    Returns:
        None
    """
    if not filename.endswith(".pkl") or ".pkl" not in filename:
        raise RuntimeError("Invalid filename")

    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with open(filename, "wb") as file:
        pickle.dump(data, file)

    logging.info(f"PICKLED: {filename}")


def unpickle_this(filename: str) -> Any:
    """
    Unpickles data from the specified file.

    Args:
        filename (str): Name of the file containing pickled data.

    Returns:
        Any: Unpickled data.
    """
    if not filename.endswith(".pkl") or ".pkl" not in filename:
        raise RuntimeError("Invalid filename")

    with open(filename, "rb") as file:
        juice = pickle.load(file)

    logging.info(f"JUICED: {filename}")
    return juice


"""
JSON
"""


def jsonify(filename: str, json_content: object, minify: bool = True) -> None:
    """
    Writes JSON content to the specified file.

    Args:
        filename (str): Name of the file to save the JSON content.
        json_content (object): JSON content to be written.
        minify (bool): If True, the JSON content is minified; otherwise, it is indented.

    Returns:
        None
    """
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with open(filename, "w") as json_file:
        if minify:
            json.dump(json_content, json_file, separators=(",", ":"))
        else:
            json.dump(json_content, json_file, indent=2)

    logging.info(f"JSONed: {filename}")


def read_json(filename: str) -> json:
    """
    Reads JSON content from the specified file.

    Args:
        filename (str): Name of the file containing JSON content.

    Returns:
        json: Parsed JSON content.
    """
    if not filename.endswith(".json"):
        raise TypeError("Invalid file name")

    with open(filename, "r") as json_file:
        return json.load(json_file)


"""
Other functions
"""


def clear_invalid_items(options: List[object]) -> List[dict]:
    """
    Filters and transforms a list of HTML 'option' elements to remove invalid items.

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


def day_str_to_num(day_str: str) -> int:
    """
    Converts a day string (e.g., "MON", "TUE") to the corresponding integer representation.

    Args:
        day_str (str): The input day string.

    Returns:
        int: The mapped day as an integer (1 for "MON", 2 for "TUE", etc.).
    """
    # Define a mapping of days to their integer representations
    days_mapping = {
        "mon": 1,
        "tue": 2,
        "wed": 3,
        "thu": 4,
        "fri": 5,
        "sat": 6,
        "sun": 7,
    }

    # Convert the input day string to lowercase for case-insensitive comparison
    lower_day_str = day_str.lower()

    # Return the corresponding integer if the day string is found in the mapping
    if lower_day_str in days_mapping:
        return days_mapping[lower_day_str]
    else:
        raise RuntimeError(f"No mapping found for this day_str: {day_str}")
