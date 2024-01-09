import os
from bs4 import BeautifulSoup
from settings import FILE_BASE_URL, URL_COURSE_OUTLINE_DISPLAY, FLAG_FETCH_NEW_DATA
from utils import (
    jsonify,
    load_logger,
    post_response,
    unpickle_this,
    pickle_this,
)

KEYS = []
with open("backend/data/courses-keys.txt", "r") as file:
    keys = file.readlines()
    KEYS = [key.replace("\n","").strip() for key in keys]


def to_camel_case(input_string):
    input_string = input_string.replace("/","")
    words = input_string.split()
    camel_case_string = words[0].lower() + ''.join(word.capitalize() for word in words[1:])
    return camel_case_string

def is_course_special(key: str) -> bool:
    return not(key in KEYS)


def fetch_course_content():
    scrape_course_content()
    parser_course_content()


def scrape_course_content():
    if not FLAG_FETCH_NEW_DATA:
        return

    # use option in soup to find all the options
    # rn using text file for s2 only
    # missing CN YANG scholar

    json_file_path = "backend/data/test.txt"

    with open(json_file_path, "r") as file:
        acad_year_courses = file.readlines()


    for key in acad_year_courses:
        key = key.strip().replace("\n", "")
        payload = {
            "acadsem": "2023_2",
            # "r_course_yr": key,
            "r_course_yr": "CNY;CNY;X",
            "r_subj_code": "Enter Keywords or Course Code",
            "boption": "CLoad",
            "acad": "2023",
            "semester": "2",
            "acadsem": "2023_2",
        }

        response = post_response(URL_COURSE_OUTLINE_DISPLAY, payload)

        soup = BeautifulSoup(response.text, "html.parser")
        pickle_this(f"backend/data/pickles/course_content/2023-2/{key.replace(";","-")}.pkl", soup)



def parser_course_content():
    files = [
        item.name
        for item in os.scandir("backend/data/pickles/course_content/2023-2")
        if item.is_file()
    ]

    courses = []
    for filename in files:
      soup = unpickle_this(f"backend/data/pickles/course_content/2023-2/{filename}")
      key = filename.replace(".pkl", "").replace("-", ";")

      if is_course_special(key):
        courses.extend(parser_course_special_content(soup, key))
      else:
        courses.extend(parser_course_normal_content(soup, key))

    jsonify("backend/data/course_content.json", courses, minify=False)


def parser_course_normal_content(soup: BeautifulSoup, key: str):
    """
    Take note: this scraper will only scrape the course content for non special cases
    Special cases: minor in xxx, BDEs, Scholars Stuff
    """

    course_tables = soup.find_all("table")
    courses = []

    for course_table in course_tables:
        course = { "searchKeys": key }
        PREQ_FLAG = False

        course_trs = course_table.find_all("tr")
        for course_tr in course_trs:
            course_tds = course_tr.find_all("td")

            if len(course_tds) == 4:
                # should be the header
                # GC0001	SUSTAINABILITY: SEEING THROUGH THE HAZE	1.0 AU
                course["code"] = course_tds[0].text
                course["title"] = course_tds[1].text

                # AU has white spacing infront
                course_au = course_tds[2].text.replace("AU", "").strip()
                if course_au == ".0":
                    course_au = "0"
                course["au"] = course_au

                continue

            if len(course_tds) == 3:
                # should be the header
                # GC0001	SUSTAINABILITY: SEEING THROUGH THE HAZE	1.0 AU
                course["code"] = course_tds[0].text
                course["title"] = course_tds[1].text

                # AU has white spacing infront
                course_au = course_tds[2].text.replace("AU", "").strip()
                if course_au == ".0":
                    course_au = "0"
                course["au"] = course_au

                continue

            if len(course_tds) == 2:
                # should be everything else

                # Catches empty rows
                if course_tds[0].text == course_tds[1].text == "":
                    continue

                # only prereq has empty first cell and data on second cell
                if course_tds[0].text == "":
                    course["prerequisite"] = f"{course["prerequisite"]} {course_tds[1].text.strip()}"
                    continue


                course_item_key = to_camel_case(course_tds[0].text.strip().replace(":", "").lower())
                course[course_item_key] = course_tds[1].text.strip()


            # len with 1 can be thrown away
            # [<td><b><font color="#FF00FF" size="2"></font></b></td>, <td colspan="2"><b><font color="#FF00FF" size="2"></font></b></td>]
            if len(course_tds) == 1 and len(course_tds[0].text) > 0:
                course["description"] = course_tds[0].text.strip()

        courses.append(course)
        course = { "searchKeys": key }

    return courses


def parser_course_special_content(soup: BeautifulSoup, key: str):
    """
    Special cases: minor in xxx, BDEs, Scholars Stuff
    """
    courses = []
    course = { "searchKeys": key }
    course_table = soup.find_all("table")
    course_trs = course_table[0].find_all("tr")
    PREQ_FLAG = False

    for tr in course_trs:
        course_tds = tr.find_all("td")

        # header or course info
        if len(course_tds) == 4:
            if "course" in course_tds[0].text.lower():
                # COURSE CODE	TITLE	AU	PROGRAMME/(DEPT MAINTAIN*)
                continue

            course = { "searchKeys": key }
            course["code"] = course_tds[0].text
            course["title"] = course_tds[1].text

            course_au = course_tds[2].text.replace("AU", "").strip()
            if course_au == ".0":
                course_au = "0"
                course["au"] = course_au

            course["maintainingDept"] = course["title"] = course_tds[3].text

        if len(course_tds) == 2:
                # should be everything else

                if PREQ_FLAG:
                    if course.get("prerequisite") is not None:
                      course["prerequisite"] = f"{course["prerequisite"]} {course_tds[1].text.strip()}"
                      PREQ_FLAG = False
                      continue


                # Catches empty rows
                if course_tds[0].text == course_tds[1].text == "":
                    continue

                if course_tds[0].text == "":
                    course["prerequisite"] = f"{course["prerequisite"]} {course_tds[1].text.strip()}"
                    continue

                course_item_key = to_camel_case(course_tds[0].text.strip().replace(":", "").lower())
                course[course_item_key] = course_tds[1].text.strip()

                if "OR" in course_tds[1].text:
                    PREQ_FLAG = True
                    continue

        # len with 1 can be thrown away
        # [<td><b><font color="#FF00FF" size="2"></font></b></td>, <td colspan="2"><b><font color="#FF00FF" size="2"></font></b></td>]
        if len(course_tds) == 1 and len(course_tds[0].text) > 0:
            text = course_tds[0].text.strip()
            if text == "":
                continue

            if "Not offered" in text:
                course["notOffered"] = text
                continue
            else:
              course["description"] = text
              courses.append(course)


    return courses


if __name__ == "__main__":
    load_logger()
    fetch_course_content()
