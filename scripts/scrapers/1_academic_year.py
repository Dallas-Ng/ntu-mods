"""
Academic Year Scraper

Data:
    Scrapes the available academic year (e.g. 2014-S2, 2020-T, 2023-S1)

Notes:
    - This scraper does not need a threshold as the number of items are relatively low (furthest year is 2014)
"""

from bs4 import BeautifulSoup
from client import SpClient
from utils import (
    FLAGS,
    URLS,
    jsonify,
    load_logger,
    read_json,
    unpickle_this,
    get_response,
    pickle_this,
    clear_invalid_items,
)

JSON_FILE_NAME = "acad-year.json"
PICKLE_FILE_NAME = "acad-year.pkl"


def scraper_academic_year():
    if not FLAGS.FETCH_NEW_DATA:
        return

    response = get_response(URLS.SCHEDULE)
    soup = BeautifulSoup(response.text, "html.parser")
    pickle_this(PICKLE_FILE_NAME, soup)


def parser_academic_year():
    if not FLAGS.PARSE_DATA:
        return

    soup = unpickle_this(PICKLE_FILE_NAME)

    if not soup:
        # This should not happen.
        raise RuntimeError(f"No BS4 Soup - {PICKLE_FILE_NAME}")

    select_element = soup.find("select", {"name": "acadsem"})
    options = select_element.find_all("option")
    options = clear_invalid_items(options)

    acad_year_objects = []

    for option in options:
        year_code = option["value"].split(";")  # 2014;S, 2015;2, 2016;1

        new_obj = {
            "code": option["value"],  # Original value: "2014;S"
            "title": option.text,  # Acad year str: "Acad Yr 2015 Semester 1"
            "year": year_code[0],  # Acad year: 2015
            "term": year_code[1],  # Acad term: S - Special Term I, etc.
        }

        acad_year_objects.append(new_obj)

    jsonify(JSON_FILE_NAME, acad_year_objects)


def injest_academic_year():
    if not FLAGS.INJEST_DATA:
        return

    acad_years = read_json(JSON_FILE_NAME)
    client = SpClient()

    for item in acad_years:
        data = {
            "code": item["code"],
            "title": item["title"],
            "year": item["year"],
            "term": item["term"],
        }

        existing_academic_year = (
            client.db("academic_year")
            .select("id")
            .eq("code", item["code"])
            .eq("title", item["title"])
            .eq("year", item["year"])
            .eq("term", item["term"])
        ).execute()

        if len(existing_academic_year.data) > 0:
            data["id"] = existing_academic_year.data.pop()["id"]

        client.db("academic_year").upsert(data).execute()


if __name__ == "__main__":
    load_logger()
    scraper_academic_year()
    parser_academic_year()
    injest_academic_year()
