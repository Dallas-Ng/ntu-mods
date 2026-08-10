export const TABLE_SETTINGS = {
  // This is centralised here as multiple parts of a components needs to be standardised
  // (thead.tsx and table.tsx)
  TIMESLOT_CLASS: `w-[32px] md:w-[40px] min-h-[15px]`,
  // Uniform per-timeslot (30 min) minimum row height — always applied so a
  // block's coloured area fills its full rowSpan (see rowHeightPx/clamp in
  // cell.tsx and table.tsx), and clamped to exactly this by the
  // "standardised scale" setting. Just needs to fit one line of text, not
  // a full 2-3 line cell — bigger only makes every row taller for no reason.
  ROW_HEIGHT_PX: 30
} as const
