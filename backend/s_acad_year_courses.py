import requests, os
from bs4 import BeautifulSoup
from utils import jsonify, load_logger, unpickle_this, read_json, pickle_this, clear_invalid_items
from settings import URL_SCHEDULE_DISPLAY, FLAG_FETCH_NEW_DATA

def fetch_acad_year_courses():
    scraper_acad_year_courses()
    parser_acad_year_courses()


def scraper_acad_year_courses():
    if not FLAG_FETCH_NEW_DATA:
        return

    acad_year = read_json("backend/data/acad-year.json")

    for item in acad_year:
        payload = {
            "acadsem": item["code"],
            "r_course_yr": None,
            "r_subj_code": "Enter Keywords or Course Code",
            "r_search_type": "F",
            "boption": "x",
            "staff_access": "false",
        }

        response = requests.post(URL_SCHEDULE_DISPLAY, data=payload)
        soup = BeautifulSoup(response.text, "html.parser")
        item_name_name = f"{item["code"].replace(';', '-')}"

        pickle_this(f"backend/data/pickles/acad-year-courses/{item_name_name}.pkl", soup)


def parser_acad_year_courses():
    files = [
        item.name
        for item in os.scandir("backend/data/pickles/acad-year-courses")
        if item.is_file()
    ][::-1]

    for filename in files:
        filename_wo_ext = filename.replace(".pkl", "") # 2019-1.pkl
        soup = unpickle_this(f"backend/data/pickles/acad-year-courses/{filename}")

        select_element = soup.find("select", {"name": "r_course_yr"})
        options = select_element.find_all("option")
        options = clear_invalid_items(options)

        json_data = {}

        for option in options:
            course_id = option.attrs["value"]
            course_id_split = course_id.split(";")
            course_name = option.text

            """
            course id is broken down by course code, specialisation, year, {full time | part time}
            {
              "ACC;;1;F": {
                "key":"ACC;;1;F",
                "courseName":"Accountancy Year 1",
                "code":"ACC",
                "specialisation":"ACC",
                "year":"ACC",
                "enrollmentType":"ACC"
              }
            }
            """
            json_data[f"{course_id}"] = {
                "key": course_id, # used as dictionary key in front-end
                "courseName": course_name,
                "code": course_id_split[0],
                "specialisation": course_id_split[1],
                "year": course_id_split[2],
                "enrollmentType": course_id_split[3]
            }


        filename = f"backend/data/acad-year-courses/{filename_wo_ext}-courses.json"
        jsonify(filename, json_data)


if __name__ == "__main__":
    load_logger()
    fetch_acad_year_courses()
