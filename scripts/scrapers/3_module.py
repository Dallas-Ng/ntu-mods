import logging
from bs4 import BeautifulSoup
from client import SpClient
from utils import (
    FLAGS,
    THRESHOLD_ACADEMIC_YEAR,
    URLS,
    get_dirs,
    get_files,
    jsonify,
    load_logger,
    pickle_this,
    post_response,
    read_json,
    to_camel_case,
    unpickle_this,
)


def is_course_special(key: str) -> bool:
    key_lower = key.lower()
    identifiers = {"load", "gerp", "cny", "usp"}
    return any(identifier in key_lower for identifier in identifiers)


def scraper_module():
    if not FLAGS.FETCH_NEW_DATA:
        return

    year_code_files = get_files("json/academic-year-codes")

    for year_code_file in year_code_files:
        if int(year_code_file[:4]) < THRESHOLD_ACADEMIC_YEAR:
            continue

        year_code_json = read_json(f"academic-year-codes/{year_code_file}")

        for key in year_code_json.keys():
            payload = {
                "acadsem": f"{year_code_file[:6].replace("-", "_")}",
                "r_course_yr": key,
                "r_subj_code": "Enter Keywords or Course Code",
                "boption": "CLoad",
                "acad": f"{year_code_file[:4]}",
                "semester": f"{year_code_file[5:6]}", # 
                "acadsem": f"{year_code_file[:6].replace("-", "_")}", # duplicated but intentional
            }

            response = post_response(URLS.COURSE_OUTLINE_DISPLAY, payload)

            soup = BeautifulSoup(response.text, "html.parser")
            filename = f"{key.replace(';','-')}.pkl"
            pickle_this(f"course-modules/{year_code_file[:6]}/{filename}", soup)


def parser_module():
    if not FLAGS.PARSE_DATA:
        return

    modules = []  # Aggregated Modules for Each Course

    dirs = get_dirs("pickles/course-modules")
    for dir in dirs:
        files = get_files(f"pickles/course-modules/{dir}")

        for file in files:
            soup = unpickle_this(f"course-modules/{dir}/{file}")
            key = file.replace(".pkl", "").replace("-", ";")

            if is_course_special(key):
                modules.extend(parser_course_special_content(soup, key))
            else:
                modules.extend(parser_course_normal_content(soup, key))

        jsonify(f"course-modules/{dir}.json", modules)
        modules = [] # Clear for next round of directories


def parser_course_normal_content(soup: BeautifulSoup, key: str):
    """
    Take note: this scraper will only scrape the course content for non special cases
    Special cases: minor in xxx, BDEs, Scholars Stuff
    """

    course_tables = soup.find_all("table")
    courses = []

    for course_table in course_tables:
        course = {"searchKeys": key}

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
                    course["prerequisite"] = (
                        f"{course['prerequisite']} {course_tds[1].text.strip()}"
                    )
                    continue

                course_item_key = to_camel_case(
                    course_tds[0].text.strip().replace(":", "").lower()
                )
                course[course_item_key] = course_tds[1].text.strip()

            # len with 1 can be thrown away
            # [<td><b><font color="#FF00FF" size="2"></font></b></td>, <td colspan="2"><b><font color="#FF00FF" size="2"></font></b></td>]
            if len(course_tds) == 1 and len(course_tds[0].text) > 0:
                course["description"] = course_tds[0].text.strip()

        courses.append(course)
        course = {"searchKeys": key}

    return courses


def parser_course_special_content(soup: BeautifulSoup, key: str):
    """
    Special cases: minor in xxx, BDEs, Scholars Stuff
    """
    courses = []
    course = {"searchKeys": key}
    course_table = soup.find_all("table")
    course_trs = course_table[0].find_all("tr")
    PREQ_FLAG = False

    for tr in course_trs:
        course_tds = tr.find_all("td")

        # header or course info
        if len(course_tds) == 4:
            if "course" in course_tds[0].text:
                # COURSE CODE	TITLE	AU	PROGRAMME/(DEPT MAINTAIN*)
                continue

            course = {"searchKeys": key}
            course["code"] = course_tds[0].text
            course["title"] = course_tds[1].text.lower()

            course_au = course_tds[2].text.replace("AU", "").strip()
            if course_au == ".0":
                course_au = "0"
            course["au"] = course_au

            course["maintainingDept"] = course_tds[3].text

        if len(course_tds) == 2:
            # should be everything else

            if PREQ_FLAG:
                if course.get("prerequisite") is not None:
                    course["prerequisite"] = (
                        f"{course['prerequisite']} {course_tds[1].text.strip()}"
                    )
                    PREQ_FLAG = False
                    continue

            # Catches empty rows
            if course_tds[0].text == course_tds[1].text == "":
                continue

            if course_tds[0].text == "":
                course["prerequisite"] = (
                    f"{course['prerequisite']} {course_tds[1].text.strip()}"
                )
                continue

            course_item_key = to_camel_case(
                course_tds[0].text.strip().replace(":", "").lower()
            )
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


def process_module():
    if not FLAGS.PROCESS_DATA:
        return 
    
    files = get_files("json/course-modules", order=1)
    
    for file in files:
        academic_year = file.split("-")[0]
        semester = file.replace(".json", "").split("-")[1]
        
        if "processed" in file:
            # Skipped processed files
            continue

        consolidated_modules = {}
        data = read_json(f"course-modules/{file}")

        for course in data:
            code = course.get("code")
            course["year"] = academic_year
            course["semester"] = semester
            course["title"] = course["title"].lower()

            if code in consolidated_modules.keys():
                # append search keys for repeating courses
                consolidated_modules[code]["searchKeys"].append(course["searchKeys"])
            else:
                # modify main course model

                # change search key to search keys
                course["searchKeys"] = [course["searchKeys"]]

                # chunk out prerequisite
                # e.g. prerequisite - AB1202 & AB1202 OR BC2406 & BC2406
                #                   to [[AB1202, AB1202], [BC2406, BC2406]]

                if "prerequisite" in course.keys():
                    prerequisites = course["prerequisite"].split("OR")
                    prerequisites = [
                        [item.strip() for item in p.split("&")] for p in prerequisites
                    ]
                    course["prerequisite"] = prerequisites

                if "mutuallyExclusiveWith" in course.keys():
                    course["mutuallyExclusiveWith"] = [
                        item.strip() for item in course["mutuallyExclusiveWith"].split(",")
                    ]

                consolidated_modules[code] = course

        jsonify(f"course-modules/processed-{file}", consolidated_modules)


def injest_module():
    if not FLAGS.INJEST_DATA:
        return
    
    client = SpClient()
    files = get_files("json/course-modules")

    for file in files:
        if "processed" not in file:
            # Skipped UN-processed files
            continue
        
        batch_data = []
        acad_year_code = file.replace(".json", "").replace("-", ";")[-6:]
        db_acad_year = client.db("academic_year").select("id").eq("code", acad_year_code).single().execute()
        db_acad_year_id = db_acad_year.data["id"]

        modules = read_json(f"course-modules/{file}")
        for key in modules:
            module = modules[key]

            data = {
                "code": module["code"], # intentional, fast fail if this does not exist
                "au": module.get("au"),
                "title": module.get("title"),
                "description": module.get("description"),
                "search_keys": module.get("searchKeys"),
                "maintaining_dept": module.get("maintainingDept"),
                "not_available_to_all_programme_with": module.get("notAvailableToAllProgrammeWith"),
                "not_available_as_pe_to_programme": module.get("notAvailableAsPeToProgramme"),
                "prerequisite": module.get("prerequisite"),
                "grade_type": module.get("gradeType"),
                "not_available_to_programme": module.get("notAvailableToProgramme"),
                "not_available_as_bdeue_to_programme": module.get("notAvailableAsBdeueToProgramme"),
                "mutually_exclusive_with": module.get("mutuallyExclusiveWith"),
                "not_available_as_core_to_programme": module.get("notAvailableAsCoreToProgramme"),
                "not_offered": module.get("notOffered"),
                "academic_year_id": db_acad_year_id
            }
            
            existing_row = client.db("module").select("id").eq("code", module.get("code")).eq("academic_year_id", db_acad_year_id).execute()

            if len(existing_row.data) > 0:
                # used for upserting
                data["id"] = existing_row.data.pop()["id"]
            
            batch_data.append(data)

            if len(batch_data) >= 1000:
                client.db("module").upsert(batch_data).execute()
                batch_data = []

        if batch_data:
            client.db("module").upsert(batch_data).execute()
            batch_data = []
        


if __name__ == "__main__":
    load_logger()
    scraper_module()
    parser_module()
    process_module()
    injest_module()
