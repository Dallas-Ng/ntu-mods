# FLAGS
FLAG_DEBUG_MODE = True
FLAG_FETCH_NEW_DATA = False

# CONFIG
MAX_YEARS_TO_SCRAPE = 0  # 0 means this year, 1 means this year and the year before
MAX_WORKERS = 50  # For parallel processes

# FILE NAMES
FILE_BASE_URL = "backend/data/"
FILENAME_OUTPUT_LOG = "output.txt"

# URLS
URL_SCHEDULE = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
URL_SCHEDULE_DISPLAY = (
    "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display"
)
URL_SCHEDULE_DISPLAY1 = (
    "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1"
)
