"""
Academic Year Codes Scraper

Data:
    - Scrapes the academic year's course codes 
    @see {"key":"BUS;AWM;3;F","courseName":"Business (AWM) Year 3","code":"BUS","specialisation":"AWM","year":"3","enrollmentType":"F"}

Notes:
    - IT IS NOT USING UPSERT PROPERLY (without id given)
        - Currently, there is a validation check to database if the course exists already
        - We do not _upsert_ as it is historical data (needs to be preserved and should not be overwritten)
    - While this is not a very expensive operation, it is limited to 2022 and after.
"""

import logging
from bs4 import BeautifulSoup
from client import SpClient
from utils import FLAGS, THRESHOLD_ACADEMIC_YEAR, URLS, get_files, jsonify, load_logger, post_response, unpickle_this, read_json, pickle_this, clear_invalid_items


def scraper_acad_year_courses():
    if not FLAGS.FETCH_NEW_DATA:
        return

    acad_year = read_json("json/acad-year.json")

    for item in acad_year:
        payload = {
            "acadsem": item["code"],
            "r_course_yr": None,
            "r_subj_code": "Enter Keywords or Course Code",
            "r_search_type": "F",
            "boption": "x",
            "staff_access": "false",
        }

        response = post_response(URLS.SCHEDULE_DISPLAY, data=payload)
        soup = BeautifulSoup(response.text, "html.parser")
        item_name_name = f"{item["code"].replace(';', '-')}"

        pickle_this(f"academic-year-codes/{item_name_name}.pkl", soup)


def parser_acad_year_courses():
    if not FLAGS.PARSE_DATA:
        return 
    
    files = get_files("pickles/academic-year-codes")

    for filename in files:
        filename_wo_ext = filename.replace(".pkl", "") # 2019-1.pkl
        soup = unpickle_this(f"academic-year-codes/{filename}")

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


        filename = f"json/academic-year-codes/{filename_wo_ext}-courses.json"
        jsonify(filename, json_data)


def injest_acad_year_courses():
    if not FLAGS.INJEST_DATA:
        return
    
    client = SpClient()
    new_data_batch = []

    json_files = get_files("json/academic-year-codes")

    for json_file in json_files:
        academic_year = json_file[:6]
        
        if int(academic_year[:4]) < THRESHOLD_ACADEMIC_YEAR:
            continue
        
        
        academic_year_parsed = academic_year.replace("-", ";")

        db_acad_year = client.db("academic_year").select("id").eq("code", academic_year_parsed).single().execute()
        db_acad_year_id = db_acad_year.data["id"]

        json_data = read_json(f"json/academic-year-codes/{json_file}")

        for key in json_data.keys():
            logging.info(f"{academic_year_parsed} || {key}")
            data = json_data[key]

            new_data = {
                "academic_year_code": db_acad_year_id,
                "key": key,
                "course_name": data["courseName"],
                "code": data["code"],
                "specialisation": data["specialisation"],
                "year": data["year"],
                "enrollment_type": data["enrollmentType"]
            }

            existing_row = client.db("course").select("id").eq("academic_year_code", db_acad_year_id).eq("key", data["key"]).execute()

            if len(existing_row.data) > 0:
                # Don't duplicate rows
                logging.info(f"Duplicated Key Found - Skipping")
                continue
            
            new_data_batch.append(new_data)

            if len(new_data_batch) >= 1000:
                client.db("course").upsert(new_data_batch).execute()
                new_data_batch = []

        # Catch remaining data batch
        if new_data_batch:
            client.db("course").upsert(new_data_batch).execute()
            new_data_batch = []


if __name__ == "__main__":
    load_logger()
    scraper_acad_year_courses()
    parser_acad_year_courses()
    injest_acad_year_courses()
