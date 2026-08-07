export const TABLE_SETTINGS = {
  // This is centralised here as multiple parts of a components needs to be standardised
  // (thead.tsx and table.tsx)
  TIMESLOT_CLASS: `w-[32px] md:w-[40px] min-h-[15px]`,
  // Uniform per-timeslot (30 min) row height used by the "full size blocks"
  // and "standardised scale" settings — kept here so table.tsx and
  // table-loader.tsx agree on the same value. Standardised scale clamps
  // cells to exactly this (see clampCellHeightPx in cell.tsx), so it just
  // needs to be tall enough for one line of text, not the full 2-3 line
  // cell — a bigger number here only makes every row taller for no reason.
  ROW_HEIGHT_PX: 30
} as const
