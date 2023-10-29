from bs4 import BeautifulSoup
import json

from common import get_response, clear_invalid_items, save_json
from CONFIG import URL_SCHEDULE

response = get_response(URL_SCHEDULE)


soup = BeautifulSoup(response.text, "html.parser")
select_element = soup.find("select", {"name": "acadsem"})
options = select_element.find_all("option")

option_texts = [option.text for option in options]
options = clear_invalid_items(options)


objs = []
for option in options:
    obj = {
        "code": option.attrs["value"],
        "title": option.text,
        "year": option.attrs["value"].split(";")[0],
        "term": option.attrs["value"].split(";")[1],
    }
    objs.append(obj)


save_json("data/ntu-acad-year.json", objs)
