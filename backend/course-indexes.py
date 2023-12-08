from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from bs4 import BeautifulSoup
from utils import jsonify, post_response, read_json
import os, math
from config import MAX_YEARS_TO_SCRAPE, URL_SCHEDULE_DISPLAY1
import logging
import threading

MAX_WORKERS = 16  # Adjust this number based on your system and task characteristics


def solo_function():
    json_files = [item.name for item in os.scandir("backend/data") if item.is_file()][
        ::-1
    ]

    for json_file in json_files:
        if not (str(json_file[:4]).isdigit()):  # skip irrelevant files
            continue

        academic_year = json_file[:6]
        if int(academic_year[:4]) <= datetime.now().year - MAX_YEARS_TO_SCRAPE:
            logging.warning(f"NOT SCRAPPING {json_file}")
            continue

        logging.info(f"SCRAPPING {json_file}")

        json_data = read_json(f"backend/data/{json_file}")

        for key in json_data.keys():
            process_key_solo(key, json_data[key], academic_year)


def process_key_solo(key, data, academic_year):
    payload = {
        "acadsem": academic_year,
        "r_course_yr": data["courseId"],
        "r_subj_code": "Enter Keywords or Course Code",
        "r_search_type": "F",
        "boption": "CLoad",
        "staff_access": "false",
    }
    response = post_response(URL_SCHEDULE_DISPLAY1, payload=payload)
    soup = BeautifulSoup(response.text, "html.parser")

    processed_data = parser_course_schedules(soup)

    course_code = key
    course_code = course_code.replace(";;", ";_;")
    course_code = course_code.replace(";", "-")

    logging.info(f"SAVING {key} - Solo Function")
    jsonify(
        f"backend/data/courses/{academic_year}/{course_code}.json",
        processed_data,
    )


def update_course_indexes():
    json_files = [item.name for item in os.scandir("backend/data") if item.is_file()][
        ::-1
    ]

    for json_file in json_files:
        if not (str(json_file[:4]).isdigit()):  # skip irrelevant files
            continue

        academic_year = json_file[:6]
        if academic_year != "2023-2":
            continue
        # if int(academic_year[:4]) <= datetime.now().year - MAX_YEARS_TO_SCRAPE:
        #     logging.warning(f"NOT SCRAPPING {json_file}")
        #     continue

        logging.info(f"SCRAPPING {json_file}")

        json_data = read_json(f"backend/data/{json_file}")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(process_key, key, json_data[key], academic_year): key
                for key in json_data.keys()
            }
            for future in futures:
                key = futures[future]
                try:
                    future.result()
                except Exception as e:
                    logging.error(f"Error processing key {key}: {e}")


def process_key(key, data, academic_year):
    payload = {
        "acadsem": academic_year,
        "r_course_yr": data["courseId"],
        "r_subj_code": "Enter Keywords or Course Code",
        "r_search_type": "F",
        "boption": "CLoad",
        "staff_access": "false",
    }
    response = post_response(URL_SCHEDULE_DISPLAY1, payload=payload)
    soup = BeautifulSoup(response.text, "html.parser")

    processed_data = parser_course_schedules(soup)

    course_code = key
    course_code = course_code.replace(";;", ";_;")
    course_code = course_code.replace(";", "-")

    logging.info(f"SAVING {key} - Thread: {threading.current_thread().name}")
    jsonify(
        f"backend/data/courses/{academic_year}/{course_code}.json",
        processed_data,
    )


def parser_course_schedules(soup):
    tables = soup.find_all("table")

    data = {}
    course = None

    for table in tables:
        rows = table.find_all("tr")

        prereq_flag = False
        remarks_flag = False

        for row in rows:
            cells = row.find_all("td")
            row_text = [cell.get_text(strip=True) for cell in cells]

            if len(row_text) == 3:
                course = {
                    "key": row_text[0],
                    "title": row_text[1],
                    "au": row_text[2],
                    "indexes": {},
                    "prerequisites": "",
                    "remarks": "",
                }
                data[course["key"]] = course

            if len(row_text) == 2:
                # catches alternatives
                if not (row_text[0] == "" and row_text[1] == ""):
                    if "prerequisites" in row_text[0]:
                        prereq_flag = True
                        remarks_flag = False
                        course["prerequisites"] = row_text[1]
                        continue

                    if "remarks" in row_text[0]:
                        remarks_flag = True
                        prereq_flag = False
                        course["remarks"] = row_text[1]
                        continue

                if row_text[0] == "" and row_text[1] != "":
                    if prereq_flag:
                        course["prerequisites"] += f"\n{row_text[1]}"

                    if remarks_flag:
                        course["remarks"] += f"\n{row_text[1]}"

            elif len(row_text) == 7 and course is not None:
                time_split = row_text[4].split("-")
                half_hours_difference = 0

                if len(time_split) == 2:
                    l_time = datetime.strptime(time_split[0], "%H%M")
                    r_time = datetime.strptime(time_split[1], "%H%M")
                    td = r_time - l_time

                    # Convert total minutes difference to half-hours
                    half_hours_difference = td.total_seconds() / 1800

                # If index number is empty, happens when there multiple location, time, venue for a certain index
                index_code = row_text[0]

                # if index_code == "00015":
                #     print(row_text)
                #     print(course)
                #     print(data)
                #     quit()

                index_data = {
                    "key": index_code,
                    "type": row_text[1],
                    "group": row_text[2],
                    "day": row_text[3],
                    "time": row_text[4],
                    "venue": row_text[5],
                    "remarks": row_text[6],
                    "duration": math.floor(half_hours_difference),
                }

                if index_code != "":
                    course["indexes"][index_code] = [index_data]

                elif index_code == "":
                    """
                    If index code is empty, it is assume that we in a index with multiple rows.
                    So we append the to more recently added key

                    00680 LEC/STUDIO  1	  WED	  0930-1020	  ONLINE	(NO REMARK)
                          TUT	        1	  MON	  0830-1020	  TR+30	  Teaching Wk2-13
                    """
                    prev_index_code = list(course["indexes"])[-1]
                    course["indexes"][prev_index_code].append(index_data)

    return data


if __name__ == "__main__":
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    update_course_indexes()
    # solo_function()
