import requests
import xml.etree.ElementTree as ET

OUTPUT_FILE = "./scripts/sitemap.txt"


def extract_urls_from_sitemap(sitemap_url):
    try:
        # Fetch the sitemap content
        response = requests.get(sitemap_url)
        response.raise_for_status()

        # Parse the XML content
        root = ET.fromstring(response.content)

        # Extract URLs from the sitemap
        urls = [
            element.text.strip()
            for element in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
        ]

        # Save URLs to a text file
        with open(OUTPUT_FILE, "w") as file:
            for url in urls:
                file.write(url + "\n")

        print(f"Extracted URLs saved to {OUTPUT_FILE}")
        return urls

    except requests.exceptions.RequestException as e:
        print(f"Error fetching sitemap: {str(e)}")
        return []

    except ET.ParseError as e:
        print(f"Error parsing sitemap XML: {str(e)}")
        return []


if __name__ == "__main__":
    # Get production sitemap instead of local files
    sitemap_url = "https://ntumods.com/sitemap-0.xml"
    extracted_urls = extract_urls_from_sitemap(sitemap_url)
