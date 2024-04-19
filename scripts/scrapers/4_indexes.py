from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from bs4 import BeautifulSoup
from client import SpClient
from utils import (
    FLAGS,
    THRESHOLD_ACADEMIC_YEAR,
    URLS,
    day_str_to_num,
    get_dirs,
    get_files,
    jsonify,
    load_logger,
    pickle_this,
    post_response,
    read_json,
    unpickle_this,
)
import math, logging, threading


def load_files() -> tuple[list[dict], list[str]]:
    """
    Loads JSON files, processes academic year, and returns acad-year-courses data along with the academic years.
    """
    json_files = get_files("json/academic-year-codes")
    json_data_list = []
    academic_year_list = []

    for json_file in json_files:
        academic_year = json_file[:6]

        if int(academic_year[:4]) < THRESHOLD_ACADEMIC_YEAR:
            logging.warning(f"NOT SCRAPPING {json_file}")
            continue

        logging.info(f"SCRAPPING {json_file}")

        json_data = read_json(f"academic-year-codes/{json_file}")
        json_data_list.append(json_data)
        academic_year_list.append(academic_year)

    return json_data_list, academic_year_list


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
    pickle_file_path = f"indexes/{academic_year}/{course_code}"

    if FLAGS.FETCH_NEW_DATA:
        response = post_response(URLS.SCHEDULE_DISPLAY1, payload=payload)
        soup = BeautifulSoup(response.text, "html.parser")
        # Pickle files that are newly scrapped
        pickle_this(f"{pickle_file_path}.pkl", soup)
    else:
        soup = unpickle_this(f"{pickle_file_path}.pkl")

    if not soup:
        # This should not happen.
        raise RuntimeError(f"No BS4 Soup - {pickle_file_path}.pkl")

    processed_data = parse_course_schedule(soup)

    jsonify(f"indexes/{academic_year}/{course_code}.json", processed_data)


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
    json_data_list, academic_year_list = load_files()

    for i in range(len(json_data_list)):
        json_data = json_data_list[i]
        academic_year = academic_year_list[i]

        for key in json_data.keys():
            process_key_solo(key, json_data[key], academic_year)


def multi_worker_course_indexer() -> None:
    """
    Multi-worker for course indexing, processes each course key concurrently.
    """
    json_data_list, academic_year_list = load_files()

    with ThreadPoolExecutor(max_workers=70) as executor:
        futures = {
            executor.submit(
                process_key_multi, key, json_data_list[i][key], academic_year_list[i]
            ): key
            for i in range(len(json_data_list))
            for key in json_data_list[i].keys()
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
    prev_index_code = None

    for table in tables:
        rows = table.find_all("tr")

        for row in rows:
            cells = row.find_all("td")
            row_text = [cell.get_text(strip=True) for cell in cells]

            if len(row_text) == 3:
                course = {
                    "key": row_text[0],  # used as dictionary key in front-end
                    "indexes": {},
                }
                data[course["key"]] = course

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
                    index_data["key"] = prev_index_code
                    course["indexes"][prev_index_code].append(index_data)

    return data


def aggregate_indexes():
    for dir_name in get_dirs("json/indexes"):
        """
        indexes = {
            CC0002: [
                14526: {},
                14527: {}
            ]
        }
        """
        indexes = {}

        for file_name in get_files(f"json/indexes/{dir_name}"):
            json_data = read_json(f"indexes/{dir_name}/{file_name}")

            for key in json_data.keys():
                if key not in indexes:
                    indexes[key] = {}

                for index_key in json_data[key]["indexes"].keys():
                    module_indexes = json_data[key]["indexes"][index_key]

                    for index in module_indexes:
                        index_item_key = index["key"]

                        if index_item_key not in indexes[key]:
                            indexes[key][index_item_key] = []

                        if index not in indexes[key][index_item_key]:
                            indexes[key][index_item_key].append(index)

        jsonify(f"indexes/aggregated-{dir_name}.json", indexes)


def injest_indexes():
    client = SpClient()
    modules_to_injest = []
    cache = {}

    for file in get_files("json/indexes"):
        acad_year_code = file.replace(".json", "").replace("-", ";")[-6:]

        if acad_year_code == "2023;S":
            continue

        logging.info(f"QUEUE Module - {acad_year_code}")

        db_acad_year = (
            client.db("academic_year")
            .select("id")
            .eq("code", acad_year_code)
            .single()
            .execute()
        )

        db_acad_year_id = db_acad_year.data["id"]

        data = read_json(f"indexes/{file}")

        for module_key, module_data in data.items():
            db_module_id = None

            # Cache module keys from DB
            if module_key not in cache:
                db_module = None

                try:
                    db_module = (
                        client.db("module")
                        .select("id")
                        .eq("academic_year_id", db_acad_year_id)
                        .eq("code", module_key)
                        .single()
                        .execute()
                    )
                except:
                    # These modules dont exist from the course content
                    # They previously did but was deleted by an admin
                    # The indexes are still exposed via module-scheduling
                    logging.warning(
                        f"MODULE NOT FOUND: {module_key} - {acad_year_code}"
                    )
                    continue

                db_module_id = db_module.data["id"]
                cache[module_key] = db_module_id
            else:
                db_module_id = cache[module_key]

            for module_index in module_data:
                module_index["module_id"] = db_module_id
                # Check if index already existed
                # existing_row = (
                #     client.db("index")
                #     .select("id")
                #     .eq("key", module_index.get("key"))
                #     .eq("type", module_index.get("type"))
                #     .eq("group", module_index.get("group"))
                #     .eq("day", module_index.get("day"))
                #     .eq("time", module_index.get("time"))
                #     .eq("venue", module_index.get("venue"))
                #     .eq("remarks", module_index.get("remarks"))
                #     .eq("duration", module_index.get("duration"))
                #     .eq("module_id", module_index.get("module_id"))
                #     .execute()
                # )
                # if len(existing_row.data) > 0:
                #     continue
                modules_to_injest.append(module_index)

        #
        batch_size = 5000
        for i in range(0, len(modules_to_injest), batch_size):
            logging.info(f"INESTING Modules - {acad_year_code}")
            batch = modules_to_injest[i : i + batch_size]
            client.db("index").upsert(batch).execute()


def count():
    count = {}
    for file in get_files("json/indexes"):
        data = read_json(f"indexes/{file}")

        count[file] = len(data.items())

    print(count)


if __name__ == "__main__":
    load_logger()

    SINGLE = False
    if FLAGS.PARSE_DATA:
        if SINGLE:
            solo_worker_course_indexer()
        else:
            multi_worker_course_indexer()

    aggregate_indexes()

    if FLAGS.INJEST_DATA:
        injest_indexes()
