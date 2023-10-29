import os
from supabase import create_client, Client

from common import read_json

url: str = "https://ypxcoszxhnkrhgfgmamg.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweGNvc3p4aG5rcmhnZmdtYW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODU3MjE2NCwiZXhwIjoyMDE0MTQ4MTY0fQ.pe0_4asOcm1UR06NrXd9t74kQOFIcxGEPAPT9hGwx1E"
supabase: Client = create_client(url, key)


# Create a random user login email and password.
# random_email: str = "3hf82fijf92@supamail.com"
# random_password: str = "fqj13bnf2hiu23h"
# user = supabase.auth.sign_up({"email": random_email, "password": random_password})


# data, count = supabase.table('academic_years')
#   .insert({"id": 1, "name": "Denmark"})
#   .execute()


response = supabase.table("academic_years").select("*").execute()
print(response)

# acad_year = read_json("data/ntu-acad-year.json")
# for i in acad_year:
#     print(i)

#     data, count = (
#         supabase.table("academic_years")
#         .insert(
#             {
#                 "is_active": True,
#                 "code": i["code"],
#                 "title": i["title"],
#                 "year": i["year"],
#                 "term": i["term"],
#             }
#         )
#         .execute()
#     )

files = [item.name for item in os.scandir("data/acad-year-courses") if item.is_file()][
    ::-1
]  # Piroritise recent years

for filename in files:
    json_data = read_json(f"data/acad-year-courses/{filename}")

    course_data = json_data["data"]

    for i in course_data:
        print(i["value"])
        rows = i["value"].split(";")
        print(
            {
                "is_active": True,
                "code": i["value"],
                "course_code": rows[0],
                "course_name": i["name"],
                "year": rows[2],
                "specialisation": rows[1],
            }
        )

        data, count = (
            supabase.table("academic_years")
            .insert(
                {
                    "is_active": True,
                    "code": i["value"],
                    "course_code": rows[0],
                    "course_name": i["name"],
                    "year": rows[2],
                    "specialisation": rows[1],
                }
            )
            .execute()
        )
