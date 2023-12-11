from acad_year import fetch_acad_year
from acad_year_courses import fetch_acad_year_courses
from utils import load_logger
from course_indexes import (
    multi_worker_course_indexer,
    solo_worker_course_indexer,
)


if __name__ == "__main__":
    load_logger()

    fetch_acad_year()
    fetch_acad_year_courses()

    # solo_worker_course_indexer()
    multi_worker_course_indexer()
