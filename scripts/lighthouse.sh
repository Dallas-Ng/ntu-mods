#!/bin/bash

# Specify the command
LH_COMMAND="yarn lighthouse --output=json --save-assets"

# Convert sitemap.txt to Unix-style line endings
tr -d '\r' < ./scripts/sitemap.txt > ./scripts/sitemap_unix.txt

# Counter for processed URLs
processed_urls=0

# Read through the sitemap_unix.txt file line by line
while IFS= read -r url; do
  # Skip URLs starting with the specified tail
  if [[ "$url" == "https://ntumods.com/mods/"* ]]; then
    if ((processed_urls >= 5)); then
      echo "Skipping additional URLs. Processed 5 URLs."
      break
    fi

    echo "Running Lighthouse for URL: $url"
    $LH_COMMAND "$url" --output-path="./scripts/reports/$(basename $url).json"

    echo "Lighthouse completed for URL: $url"
    
    ((processed_urls++))
  fi
done < ./scripts/sitemap_unix.txt
