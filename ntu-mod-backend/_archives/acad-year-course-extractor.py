import requests
from bs4 import BeautifulSoup
from common import get_response, clear_invalid_items, save_json, get_json_contents
from CONFIG import URL_SCHEDULE_DISPLAY


ntu_acad_years = get_json_contents("data/ntu-acad-year.json")

print(f"DETECTED {len(ntu_acad_years)} years")

for year in ntu_acad_years:
    payload = {
        "acadsem": year["code"],
        "r_course_yr": None,
        "r_subj_code": "Enter Keywords or Course Code",
        "r_search_type": "F",
        "boption": "x",
        "staff_access": "false",
    }

    # Send a POST request with the payload
    response = requests.post(URL_SCHEDULE_DISPLAY, data=payload)

    soup = BeautifulSoup(response.text, "html.parser")
    select_element = soup.find("select", {"name": "r_course_yr"})
    options = select_element.find_all("option")

    option_texts = [option.text for option in options]
    options = clear_invalid_items(options)

    options = [{"value": x.attrs["value"], "name": x.text} for x in options]

    filename = (
        f'data/acad-year-courses/{year["title"].replace(" ", "-").lower()}-courses.json'
    )

    to_save = {"acadsem": year["code"], "data": options}

    save_json(filename, to_save)
    print(f"SAVED {filename}")
