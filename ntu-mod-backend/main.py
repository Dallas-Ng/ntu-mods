import logging
import sys
from scrapers import *
from parsers import *
from CONFIG import *

# Flags
FETCH_NEW_PICKED_DATA = False
output_file = "output.txt"

if __name__ == "__main__":
    # Configure the logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Create a file handler and set the log level
    file_handler = logging.FileHandler(output_file)
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

    logger.info("CONFIG:")
    logger.info(f"MAX_YEARS_TO_SCRAPE: {MAX_YEARS_TO_SCRAPE}")

    if FETCH_NEW_PICKED_DATA:
        logger.info("FETCHING NEW DATA ========")

    # Order matters
    if FETCH_NEW_PICKED_DATA:
        logger.info("FETCHING ACAD YEAR")
        scraper_acad_year()

    logger.info("PARSING ACAD YEAR")
    acad_year_parser()

    if FETCH_NEW_PICKED_DATA:
        logger.info("FETCHING ACAD YEAR COURSES")
        scraper_acad_year_courses()

    logger.info("PARSING ACAD YEAR COURSES")
    acad_year_courses_parser()

    if FETCH_NEW_PICKED_DATA:
        logger.info("FETCHING COURSE SCHEDULES")
        scraper_course_schedules()

    logger.info("PARSING COURSE SCHEDULES")
    course_schedules_parser()
