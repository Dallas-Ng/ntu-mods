from common import clear_invalid_items, jsonify, unpickle_this
import os


def acad_year_parser():
    soup = unpickle_this("data/pickles/acad-year.pkl")
    select_element = soup.find("select", {"name": "acadsem"})
    options = select_element.find_all("option")
    options = clear_invalid_items(options)

    acad_year_objects = []

    for option in options:
        year = option["value"].split(";")[0]
        acad_year_objects.append(
            {
                "code": option["value"],
                "title": option.text,
                "year": year,
                "term": option["value"].split(";")[1],
            }
        )

    jsonify("data/ntu-acad-year.json", acad_year_objects)


def acad_year_courses_parser():
    files = [
        item.name
        for item in os.scandir("data/pickles/acad-year-courses")
        if item.is_file()
    ][::-1]

    for filename in files:
        filename_wo_ext = filename.replace(".pkl", "")
        soup = unpickle_this(f"data/pickles/acad-year-courses/{filename}")

        select_element = soup.find("select", {"name": "r_course_yr"})
        options = select_element.find_all("option")
        options = clear_invalid_items(options)
        options = [{"value": x.attrs["value"], "name": x.text} for x in options]

        filename = f"data/acad-year-courses/{filename_wo_ext}-courses.json"
        to_save = {"acadsem": filename_wo_ext, "data": options}
        jsonify(filename, to_save)


def course_schedules_parser():
    files = [
        item.name
        for item in os.scandir("data/pickles/courses-schedule")
        if item.is_file()
    ][::-1]

    for filename in files:
        filename_wo_ext = filename.replace(".pkl", "")
        soup = unpickle_this(f"data/pickles/courses-schedule/{filename}")

        tables = soup.find_all("table")

        data = []
        course = None

        for table in tables:
            rows = table.find_all("tr")

            for row in rows:
                cells = row.find_all("td")
                row_text = [cell.get_text(strip=True) for cell in cells]

                if len(row_text) == 3:
                    course = {
                        "code": row_text[0],
                        "title": row_text[1],
                        "au": row_text[2],
                        "indexes": [],
                    }
                    data.append(course)

                if len(row_text) == 2:
                    if not (row_text[0] == "" and row_text[1] == ""):
                        course[f"{row_text[0]}"] = row_text[1]

                elif len(row_text) == 7 and course is not None:
                    course["indexes"].append(
                        {
                            "index": row_text[0],
                            "type": row_text[1],
                            "group": row_text[2],
                            "day": row_text[3],
                            "time": row_text[4],
                            "venue": row_text[5],
                            "remark": row_text[6],
                        }
                    )

        filename = f"data/courses-schedule/{filename_wo_ext}.json"
        jsonify(filename, data)


if __name__ == "__main__":
    # acad_year_parser()
    pass
