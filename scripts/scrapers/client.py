import os
from typing import Literal
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")


class SpClient:
    def __init__(self):
        self.supabase: Client = create_client(url, key)

    def db(
        self,
        table_name: Literal[
            "academic_year", "course", "module", "index", "courses_to_modules"
        ],
    ):
        if self.supabase is None:
            raise ConnectionError("Supabase Client is Not Loaded!")

        return self.supabase.table(table_name)
