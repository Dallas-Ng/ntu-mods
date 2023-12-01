from bs4 import BeautifulSoup
from config import URL_SCHEDULE
from utils import jsonify, unpickle_this, get_response, pickle_this, clear_invalid_items


def update_acad_year():
    scraper_acad_year()
    parser_acad_year()


def scraper_acad_year():
    response = get_response(URL_SCHEDULE)
    soup = BeautifulSoup(response.text, "html.parser")
    pickle_this("backend/data/pickles/acad-year.pkl", soup)


def parser_acad_year():
    soup = unpickle_this("backend/data/pickles/acad-year.pkl")
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

    jsonify("backend/data/acad-year.json", acad_year_objects)


if __name__ == "__main__":
    update_acad_year()
