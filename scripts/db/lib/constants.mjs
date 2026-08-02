/**
 * Static reference data for the scripts/db pipeline, kept apart from
 * derive.mjs's derivation logic so a data change (a new semester label) can't
 * be confused with a logic change.
 */

/**
 * Shape of an NTU module code: 2-6 letter school/subject prefix, a 4-digit
 * level+serial, optional trailing letter (e.g. CZ2002, SC1005, AB1201A).
 * Mirrors src/lib/module-constants.ts's MODULE_CODE_RE — plain .mjs scripts can't
 * import a .ts file directly, so this can't just re-export it. Keep the two
 * in sync.
 */
export const MODULE_CODE_RE = /^[A-Z]{2,6}\d{4}[A-Z]?$/

/** Fallback semester-name labels, used by derive.mjs's semesterName() when the portal's own name isn't available. */
export const SEM_LABEL = {
  1: "Semester 1",
  2: "Semester 2",
  S: "Special Term",
  T: "Teaching Term"
}
