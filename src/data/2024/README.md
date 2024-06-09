# Readme

## Overview

This Python script is designed to facilitate data processing and analysis by providing helper functions to access and compare datasets stored in JSON files.

### Helper Functions

1. **get_path(filename, year=2023)**:

   - Returns the full path for a given filename and year. By default, the year is set to 2023.

2. **get_file_content(filename)**:

   - Reads and returns the content of a JSON file specified by the filename.

3. **test_equality_length(dataset1, dataset1_name, dataset2, dataset2_name)**:
   - Compares the lengths of two datasets and prints the result. Used for equality tests.

### JSON Files

The script loads and processes the following JSON files, organized by file directory:

1. **exams.json**:

   - Contains exam-related information.
   - `interface Exam`

2. **indexes.json**:

   - Stores index-related data.
   - `interface Index[]`

3. **m-au.json**:

   - Holds module AU mapping
   - `[moduleKey: string]: [moduleAU: string]`

4. **m-data-s1.json**:

   - Contains data for the 'M_DATA_S1' dataset.
   - `[moduleKey: string]: [module: module]`

5. **m-data-s2.json**:

   - Contains data for the 'M_DATA_S2' dataset.
   - `[moduleKey: string]: [module: module]`

6. **m-indexes.json**:

   - `[moduleKey: string]: Index[]`

7. **trun-m-data.json**:
   - `[moduleKey: string]: [moduleTitle: string]`

### Merged Datasets

The script combines and prints the lengths of the following merged datasets:

- **M_DATA**: Merged dictionary combining `M_DATA_S1` and `M_DATA_S2`. `M_DATA_S2` overrides `M_DATA_S1`.

Note that the reason why `M_DATA_S2` + `M_DATA_S1` is a reduced number is because there are **DUPLICATED** modules for semesters 1 and 2. The real unique number should be the length of `TRUN_M_DATA`, currently at a length of 1171.

### Dataset Lengths

The script prints the lengths of various datasets to provide a quick overview:

| Dataset         | Description                           | Current Length |
| --------------- | ------------------------------------- | -------------- |
| **EXAMS**       | Length of the 'EXAMS' dataset         | 469            |
| **INDEXES**     | Length of the 'INDEXES' dataset       | 4891           |
| **M_AU**        | Length of the 'M_AU' dataset          | 1915           |
| **M_DATA_S1**   | Length of the 'M_DATA_S1' dataset     | 1192           |
| **M_DATA_S2**   | Length of the 'M_DATA_S2' dataset     | 1206           |
| **M_DATA**      | Length of the merged 'M_DATA' dataset | 1915           |
| **M_INDEXES**   | Length of the 'M_INDEXES' dataset     | 1171           |
| **TRUN_M_DATA** | Length of the 'TRUN_M_DATA' dataset   | 1171           |

## Notes

- The script performs equality tests on datasets derived from the same set.
- This script serves as a tool for accessing and comparing educational datasets efficiently.
