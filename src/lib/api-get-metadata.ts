// @see - https://www.ntu.edu.sg/docs/default-source/office-of-academic-services/ntu-academic-calendar-ay2024-25-(semester)ed24694b-0785-4457-9df6-791ecfa40935.pdf?sfvrsn=86d0f8be_3

export const apiGetMetadata = (searchParams: URLSearchParams) => {
  const acadYear =
    searchParams.get("acadYear") || (new Date().getFullYear() - 1).toString()

  let semester = searchParams.get("semester")
  if (!semester) {
    const today = new Date()
    const currMonth = today.getMonth()
    const currDate = today.getDate()

    // AY23/24
    // TODO: update to AY24/25
    if (
      // 7 Aug
      (currMonth === 8 && currDate >= 7) ||
      // or after 7 Aug
      currMonth > 8 ||
      // or before 8 Dec
      (currMonth === 12 && currDate <= 8)
    ) {
      semester = "1"
    } else if (
      // 15 Jan
      (currMonth === 1 && currDate >= 15) ||
      // or after 15 Jan
      currMonth > 1 ||
      // or before 10 May
      (currMonth === 5 && currDate <= 10)
    ) {
      semester = "2"
    } else {
      // We include all other days on top of special term so that we always return a semester

      // 13 May - 2 Aug
      semester = "S"
    }
  }

  return { acadYear, semester }
}
