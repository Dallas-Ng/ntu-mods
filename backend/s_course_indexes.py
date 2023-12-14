from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from bs4 import BeautifulSoup
from utils import (
    day_str_to_num,
    jsonify,
    load_logger,
    pickle_this,
    post_response,
    read_json,
    unpickle_this,
)
import os, math
from settings import (
    MAX_YEARS_TO_SCRAPE,
    URL_SCHEDULE_DISPLAY1,
    FILE_BASE_URL,
    MAX_WORKERS,
    FLAG_FETCH_NEW_DATA,
)
import logging
import threading

MAIN_URL = FILE_BASE_URL + "acad-year-courses/"


def load_files() -> tuple[any, str]:
    """
    Loads JSON files, processes academic year, and returns acad-year-courses data along with the academic year.
    """
    json_files = [item.name for item in os.scandir(f"{MAIN_URL}") if item.is_file()][
        ::-1
    ]

    for json_file in json_files:
        academic_year = json_file[:6]

        if int(academic_year[:4]) < datetime.now().year - MAX_YEARS_TO_SCRAPE:
            logging.warning(f"NOT SCRAPPING {json_file}")
            continue

        # C urrently only store 2023, S2
        if academic_year[5:6] != "2":
            continue

        logging.info(f"SCRAPPING {json_file}")

        json_data = read_json(f"{MAIN_URL}{json_file}")
        return json_data, academic_year


def process_key(key, data, academic_year) -> None:
    """
    Main processer for keys and saves data
    """
    payload = {
        "acadsem": academic_year,
        "r_course_yr": data["key"],
        "r_subj_code": "Enter Keywords or Course Code",
        "r_search_type": "F",
        "boption": "CLoad",
        "staff_access": "false",
    }

    course_code = key.replace(";;", ";_;").replace(";", "-")

    soup = None
    pickle_file_path = f"backend/data/pickles/courses/{academic_year}/{course_code}"

    if FLAG_FETCH_NEW_DATA:
        response = post_response(URL_SCHEDULE_DISPLAY1, payload=payload)
        soup = BeautifulSoup(response.text, "html.parser")
        # Pickle files that are newly scrapped
        pickle_this(f"{pickle_file_path}.pkl", soup)
    else:
        soup = unpickle_this(f"{pickle_file_path}.pkl")

    if not soup:
        # This should not happen.
        raise RuntimeError(f"No BS4 Soup - {pickle_file_path}.pkl")

    processed_data = parse_course_schedule(soup)

    jsonify(f"backend/data/courses/{academic_year}/{course_code}.json", processed_data)


def process_key_solo(key, data, academic_year) -> None:
    """
    Processes a course key using a solo worker.
    """
    logging.info(f"SAVING {key} - Solo Worker")
    process_key(key, data, academic_year)


def process_key_multi(key, data, academic_year) -> None:
    """
    Processes a course key using a multi-worker approach.
    """
    logging.info(f"SAVING {key} - Thread: {threading.current_thread().name}")
    process_key(key, data, academic_year)


def solo_worker_course_indexer() -> None:
    """
    Solo worker for course indexing, processes each course key sequentially.
    """
    json_data, academic_year = load_files()

    for key in json_data.keys():
        process_key_solo(key, json_data[key], academic_year)


def multi_worker_course_indexer() -> None:
    """
    Multi-worker for course indexing, processes each course key concurrently.
    """
    json_data, academic_year = load_files()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_key_multi, key, json_data[key], academic_year): key
            for key in json_data.keys()
        }

        for future in futures:
            key = futures[future]

            try:
                future.result()
            except Exception as e:
                logging.error(f"Error processing key {key}: {e}")


def parse_course_schedule(soup):
    tables = soup.find_all("table")

    data = {}
    course = None

    for table in tables:
        rows = table.find_all("tr")

        # TODO: rewrite this hot garbage
        prereq_flag = False
        remarks_flag = False

        for row in rows:
            cells = row.find_all("td")
            row_text = [cell.get_text(strip=True) for cell in cells]

            if len(row_text) == 3:
                course = {
                    "key": row_text[0],  # used as dictionary key in front-end
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
                    half_hours_difference += 1

                # If index number is empty, happens when there multiple location, time, venue for a certain index
                index_code = row_text[0]

                index_data = {
                    "key": index_code,
                    "type": row_text[1],
                    "group": row_text[2],
                    "day": day_str_to_num(row_text[3]),
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
    load_logger()
    # multi_worker_course_indexer()
    multi_worker_course_indexer()
