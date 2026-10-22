// Where analytics need opt-in consent before they run: the EU/EEA (GDPR and
// ePrivacy), the UK (UK GDPR and PECR), Switzerland (revFADP), Brazil (LGPD),
// South Korea (PIPA) and Quebec (Law 25). Unknown locations (no header,
// Tor) are treated as regulated. Elsewhere, including Singapore, the privacy
// policy is the notice and analytics run without a banner.
const REGULATED = new Set(
  (
    "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE " +
    "IS LI NO GB CH BR KR"
  ).split(" ")
)

export function consentRequiredFor(
  country?: string | null,
  regionCode?: string | null
) {
  const c = country?.toUpperCase()
  if (!c || c === "XX" || c === "T1") return true
  if (c === "CA") return regionCode?.toUpperCase() === "QC"
  return REGULATED.has(c)
}
