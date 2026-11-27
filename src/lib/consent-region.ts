// Where browser analytics run by default, with the privacy policy as the
// notice and Cookie settings as the opt-out. Only Singapore: the PDPA has no
// cookie or tracker opt-in rule, and allows consent by notification (with an
// opt-out) or legitimate interests. Everywhere else, and wherever the country
// is unknown (no header, Tor), analytics wait for an explicit Accept.
export function defaultsToAnalytics(country?: string | null) {
  return country?.toUpperCase() === "SG"
}
