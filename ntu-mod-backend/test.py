from datetime import datetime
import os, requests, logging
from bs4 import BeautifulSoup
from common import read_json, get_response, pickle_this, post_response
from CONFIG import MAX_YEARS_TO_SCRAPE, URL_SCHEDULE, URL_SCHEDULE_DISPLAY, URL_SCHEDULE_DISPLAY1
import multiprocessing

def scraper_course_schedules(args):
    course, json_data = args  # Unpack the tuple

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

    filename = f"data/pickles/courses-schedule/{json_data["acadsem"]}_{course_code}.pkl"
    pickle_this(filename, soup)

def main():
    files = [
        item.name
        for item in os.scandir("data/acad-year-courses") 
        if item.is_file()
    ][::-1]  # Prioritize recent years

    logging.info(f"DETECTED {len (files)} different academic years")

    # Define the number of processes to use (adjust as needed)
    num_processes = 4

    for filename in files:
        if int(filename[:4]) <= datetime.now().year - MAX_YEARS_TO_SCRAPE:
            continue

        json_data = read_json(f"data/acad-year-courses/{filename}")
        courses = json_data["data"]

        # Create a pool of processes and map the scraping function to courses
        with multiprocessing.Pool(processes=num_processes) as pool:
            # Use a lambda function to pass both course and json_data as a tuple
            pool.map(lambda course: (course, json_data), courses)

if __name__ == "__main__":
    main()
