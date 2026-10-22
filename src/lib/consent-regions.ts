// Where analytics need opt-in consent before they run: the EU/EEA (GDPR and
// ePrivacy), the UK (UK GDPR and PECR), Switzerland (revFADP), Brazil (LGPD),
// South Korea (PIPA) and Quebec (Law 25). Unknown locations (no header,
// Tor) are treated as regulated. Elsewhere, including Singapore, the privacy
// policy is the notice and analytics run without a banner.
const REGULATED = new Set([
  // EU
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czechia
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  // Rest of the EEA
  "IS", // Iceland
  "LI", // Liechtenstein
  "NO", // Norway
  // Others
  "GB", // United Kingdom
  "CH", // Switzerland
  "BR", // Brazil
  "KR" // South Korea
])

export function consentRequiredFor(
  country?: string | null,
  regionCode?: string | null
) {
  const c = country?.toUpperCase()
  if (!c || c === "XX" || c === "T1") return true
  if (c === "CA") return regionCode?.toUpperCase() === "QC"
  return REGULATED.has(c)
}
