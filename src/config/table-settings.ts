export const TABLE_SETTINGS = {
  // This is centralised here as multiple parts of a components needs to be standardised
  // (thead.tsx and table.tsx)
  TIMESLOT_CLASS: `w-[32px] md:w-[40px] min-h-[15px]`,
  // Uniform per-timeslot (30 min) row height used by the "full size blocks"
  // and "standardised scale" settings — kept here so table.tsx and
  // table-loader.tsx agree on the same value. Needs to clear the natural
  // height of a populated 2-3 line cell (~32-36px) or the "minimum" is a
  // no-op on every row that already has content.
  ROW_HEIGHT_PX: 44
} as const
