from datetime import datetime
import os, requests, logging
from bs4 import BeautifulSoup
from common import read_json, get_response, pickle_this, post_response
from CONFIG import MAX_YEARS_TO_SCRAPE, URL_SCHEDULE, URL_SCHEDULE_DISPLAY, URL_SCHEDULE_DISPLAY1


def scraper_acad_year():
    response = get_response(URL_SCHEDULE)
    soup = BeautifulSoup(response.text, "html.parser")
    pickle_this("data/pickles/acad-year.pkl", soup)


def scraper_acad_year_courses():
    acad_year = read_json("data/ntu-acad-year.json")
    logging.info(f"DETECTED {len(acad_year)} items")

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

        pickle_this(f"data/pickles/acad-year-courses/{item_name_name}.pkl", soup)


def scraper_course_schedules():
    files = [
        item.name
        for item in os.scandir("data/acad-year-courses")
        if item.is_file()
    ][::-1] # Prioritise recent years

    logging.info(f"DETECTED {len(files)} different academic years")
    for filename in files:
        # Only want to scrape recent 5 years
        if int(filename[:4]) <= datetime.now().year - MAX_YEARS_TO_SCRAPE:
            continue

        json_data = read_json(f"data/acad-year-courses/{filename}")


        for course in json_data["data"]:
            payload = {
                "acadsem": json_data["acadsem"],
                "r_course_yr": course["value"],
                "r_subj_code": "Enter Keywords or Course Code",
                "r_search_type": "F",
                "boption": "CLoad",
                "staff_access": "false",
            }

            response = post_response(URL_SCHEDULE_DISPLAY1, payload=payload)
            soup = BeautifulSoup(response.text, "html.parser")

            course_code = course["value"]
            course_code = course_code.replace(";;", ";_;")
            course_code = course_code.replace(";", "-")

            filename=f"data/pickles/courses-schedule/{json_data["acadsem"]}_{course_code}.pkl"
            pickle_this(filename, soup)


if __name__ == "__main__":
    # scraper_acad_year()
    # scraper_acad_year_courses()
    # scraper_course_schedules()
    pass
