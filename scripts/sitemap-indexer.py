"""
DefaultPublishRequestsPerDayPerProject: 
The default daily per project quota for publish requests (URL_UPDATED and URL_DELETED combined). 
Default value: 200.

DefaultMetadataRequestsPerMinutePerProject:
The default per minute per project quota for Read Only requests to getMetadata. 
Default value: 180.

DefaultRequestsPerMinutePerProject:
The default per minute per project quota for all endpoints.
Default value: 600.
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build


def get_indexing_service(service_account_key_path):
    credentials = service_account.Credentials.from_service_account_file(
        service_account_key_path, scopes=["https://www.googleapis.com/auth/indexing"]
    )

    indexing_service = build("indexing", "v3", credentials=credentials)
    return indexing_service


def submit_url_for_indexing(indexing_service, url_to_index):
    content = {"url": url_to_index, "type": "URL_UPDATED"}

    try:
        request = indexing_service.urlNotifications().publish(body=content).execute()

        print("Indexing request sent successfully.")
        print("Request details:", request)

    except Exception as e:
        print("Error sending indexing request:", str(e))


def submit_urls_from_sitemap_file(service_account_key_path, sitemap_file_path):
    indexing_service = get_indexing_service(service_account_key_path)

    try:
        with open(sitemap_file_path, "r") as file:
            urls = [line.strip() for line in file.readlines()]

        for url in urls[801:1000]:
            submit_url_for_indexing(indexing_service, url)

    except Exception as e:
        print("Error reading sitemap file:", str(e))


if __name__ == "__main__":
    service_account_key_path = "./scripts/secrets/GOOGLE_API_KEY.json"
    sitemap_file_path = "./scripts/sitemap.txt"

    submit_urls_from_sitemap_file(service_account_key_path, sitemap_file_path)
