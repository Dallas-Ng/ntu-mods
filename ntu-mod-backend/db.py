import logging
import os
import sys
from supabase import create_client, Client
from common import read_json

supabase: Client = create_client(url, key)


logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Create a file handler and set the log level
file_handler = logging.FileHandler("db_output.txt")
file_handler.setLevel(logging.INFO)

# Create a stream handler to print log messages to the console
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(logging.INFO)

# Create a formatter to specify the log message format
formatter = logging.Formatter("%(asctime)s - %(levelname)s: %(message)s")

# Set the formatter for both handlers
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(stream_handler)


# response = supabase.table("academic_years").select("*").execute()
# print(response)

"""
Injecting Academic Years
"""
# acad_year = read_json("data/ntu-acad-year.json")
# for i in acad_year:
#     print(i)

#     data, count = (
#         supabase.table("academic_years")
#         .insert(
#             {
#                 "is_active": True,
#                 "year_code": i["code"],
#                 "raw_title": i["title"],
#             }
#         )
#         .execute()
#     )


"""
Injecting Courses
"""
# files = [item.name for item in os.scandir("data/acad-year-courses") if item.is_file()][
#     ::-1
# ]  # Piroritise recent years

# for filename in files:
#     if int(filename[:4]) < 2020:  # abritary cap for now
#         continue

#     json_data = read_json(f"data/acad-year-courses/{filename}")
#     print(filename)
#     course_data = json_data["data"]

#     for data in course_data:
#         print(data["value"])
#         rows = data["value"].split(";")

#         print(
#             {
#                 "academic_year": ";".join(filename.split("-")[:2]),
#                 "is_active": True,
#                 "raw_code": data["value"],
#                 "raw_course_name": data["name"],
#             }
#         )

#         data, count = (
#             supabase.table("courses")
#             .insert(
#                 {
#                     "academic_year": ";".join(filename.split("-")[:2]),
#                     "is_active": True,
#                     "raw_code": data["value"],
#                     "raw_course_name": data["name"],
#                 }
#             )
#             .execute()
#         )

"""
Injecting Modules
"""
# files = [item.name for item in os.scandir("data/courses-schedule") if item.is_file()][
#     ::-1
# ]  # Piroritise recent years

# for filename in files:
#     json_data = read_json(f"data/courses-schedule/{filename}")

#     acad_year = filename[:6].replace("-", ";")
#     raw_course_code = filename[7:-5].replace("-", ";").replace("_", "")

#     """
#     INJESTING MODULES
#     Technically can be on the same pass
#     """
#     select_data, count = (
#         supabase.table("courses")
#         .select("id")
#         .eq("academic_year", acad_year)
#         .eq("raw_code", raw_course_code)
#         .execute()
#     )

#     # select_data = ('data', [{'id': 111}])
#     course_id = select_data[1][0]["id"]

#     for x in json_data:
#         data, count = (
#             supabase.table("modules")
#             .insert(
#                 {
#                     "course": course_id,
#                     "parsed_module_code": x["code"],
#                     "parsed_module_name": x["title"],
#                     "parsed_credits": x["au"],
                    "prerequisites": x["prerequisites"],
                    "remarks": x["remarks"],
                }
            )
            .execute()
        )

        """
        INJESTING SCHEDULES
        """
        for y in x["indexes"]:
            if y["index"] != "":
                current_index = y["index"]

            d, count = (
                supabase.table("module_schedules")
                .insert(
                    {
                        "index": current_index,
                        "type": y["type"],
                        "group": y["group"],
                        "day": y["day"],
                        "time": y["time"],
                        "venue": y["venue"],
                        "remarks": y["remarks"],
                        "module": data[1][0]["id"],
                    }
                )
                .execute()
            )
