/** Today in Singapore, whatever the visitor's timezone: "2027-01-20". */
export const singaporeToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date())
