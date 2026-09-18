"""Smallest check that fails if convert.py breaks. Run: python3 test_convert.py"""

import convert

assert convert.parse_prerequisite("A & B OR C") == [["A", "B"], ["C"]]
assert convert.parse_prerequisite("A") == [["A"]]
assert convert.smart_title("CALCULUS III FOR ENGINEERS") == "Calculus III For Engineers"
assert convert.duration_units("0830-0950") == 3 and convert.duration_units("") == 0
assert convert.clean_description("Covers (i) foo; (ii) bar.Next") == "Covers\n(i) foo\n(ii) bar. Next"

courses = {
    "CSC;;1;F": [{"course_code": "SC1005", "course_title": "DIGITAL LOGIC", "credits": 3.0,
                  "fields": {"Prerequisite": "SC1003", "Remark": "Not for CS"},
                  "schedules": [{"index": "10001", "type": "LEC/STUDIO", "group": "1", "day": "MON",
                                 "time": "0830-0920", "venue": "LT1", "remark": ""}]}],
    "CSC;;2;F": [{"course_code": "SC1005", "course_title": "DIGITAL LOGIC", "credits": 3.0, "fields": {},
                  "schedules": [{"index": "10001", "type": "LEC/STUDIO", "group": "1", "day": "MON",
                                 "time": "0830-0920", "venue": "LT1", "remark": ""}]}],
}
content = {"CSC;;1;F": [{"course_code": "SC1005", "course_title": "DIGITAL LOGIC",
                         "fields": {"Grade Type:": "Pass/Fail", "Mutually exclusive with": "SC1006, SC1007"},
                         "description": "Gates.And more"}]}
m = convert.to_mdata(courses, content)["SC1005"]
assert m["searchKeys"] == ["CSC;;1;F", "CSC;;2;F"] and m["au"] == "3.0"
assert m["prerequisite"] == [["SC1003"]] and "notAvailableToProgramme" not in m  # content portal wins
assert m["mutuallyExclusiveWith"] == ["SC1006", "SC1007"] and m["description"] == "Gates. And more"
assert m["extras"] == {"Grade Type:": "Pass/Fail"}  # label with trailing colon is unknown -> extras

i = convert.to_indexes(courses)["SC1005"]["10001"]
assert i == [{"key": "10001", "type": "LEC", "group": "1", "day": 1, "time": "0830-0920",
              "venue": "LT1", "remarks": "", "duration": 2}]  # deduped across programmes

e = convert.to_exams('junk\n"Date","Day","Time","Course","Course Title","Duration"\n'
                     '"23 November 2026","Monday","9.00 am","AAE18C","GRAMMAR","2 hr 30 min"\n')
assert e == {"AAE18C": {"date": "23 November 2026", "day": 1, "start_time": "9.00 am", "end_time": "11.30 am",
                        "key": "AAE18C", "name": "GRAMMAR", "duration": 5}}
print("ok")
