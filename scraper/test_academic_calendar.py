"""Pure-function checks for academic_calendar.py (no PDF, no LiteParse).
Run: python3 test_academic_calendar.py"""

import datetime as dt

import academic_calendar as ac

D = dt.date

assert ac.parse_date_range("9 Aug 2026 (Sun)*") == (D(2026, 8, 9), D(2026, 8, 9))
assert ac.parse_date_range("3 - 4 Aug 2026") == (D(2026, 8, 3), D(2026, 8, 4))
assert ac.parse_date_range("21 Jul - 1 Aug 2026") == (D(2026, 7, 21), D(2026, 8, 1))
assert ac.parse_date_range("6 - 7 Feb 2027 (Sat - Sun)*^") == (D(2027, 2, 6), D(2027, 2, 7))
assert ac.parse_date_range("28 Dec - 2 Jan 2027") == (D(2026, 12, 28), D(2027, 1, 2))
for bad in ("TBA", "Aug 2026", "9 Foo 2026", "1 - 2 - 3 Aug 2026"):
    try:
        ac.parse_date_range(bad)
    except ac.CalendarError:
        pass
    else:
        raise AssertionError(f"accepted {bad!r}")

# Grids run Sunday to Saturday: Sunday 9 Aug 2026 is in the row of Monday 10 Aug.
assert ac._row_monday(D(2026, 8, 9)) == D(2026, 8, 10)
assert ac._row_monday(D(2026, 8, 10)) == D(2026, 8, 10)
assert ac._row_monday(D(2026, 8, 15)) == D(2026, 8, 10)

assert ac.colour_distance("ff8fb4ff", "ffabbfff") < ac.MAX_COLOUR_DISTANCE  # recess legend vs grid
assert ac.colour_distance("ffffaa71", "ffabbfff") > ac.MAX_COLOUR_DISTANCE

# Weekday runs, skipping weekends.
assert ac._ranges([D(2026, 11, 20), D(2026, 11, 23), D(2026, 11, 16)]) == [(D(2026, 11, 16), D(2026, 11, 16)), (D(2026, 11, 20), D(2026, 11, 23))]

print("ok")
