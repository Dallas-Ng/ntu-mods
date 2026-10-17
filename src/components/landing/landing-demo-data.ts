import { timeslotsOverlap } from "@/lib/generate-timetable-combinations"
import { getModuleIndexesData } from "@/lib/server/db/repo"

type Persona = { id: string; label: string; note: string; modules: string[] }

// Module codes come from the NTUMods course guides (business, civil, EEE,
// humanities, MAE) and the course catalogue. Anything not offered this
// semester, or that clashes, is left out when the timetable is built.
const PERSONAS: Persona[] = [
  {
    id: "cs",
    label: "Computer Science Student",
    note: "Labs, lectures and tutorials",
    modules: ["SC1007", "SC2001", "SC2002", "SC2005", "SC2008", "MH1812"]
  },
  {
    id: "business",
    label: "Business Student",
    note: "Seminar-heavy weeks",
    modules: ["AB1201", "AB1202", "AB1301", "AB1501", "AB1601", "AB0403"]
  },
  {
    id: "eee",
    label: "Electrical and Electronic Engineering Student",
    note: "Design projects and labs",
    modules: ["EE2101", "EE2102", "EE2103", "EE2073", "EE3011", "MH1811"]
  },
  {
    id: "civil",
    label: "Civil Engineering Student",
    note: "Structures, soils and fluids",
    modules: ["CV1011", "CV1012", "CV1013", "CV2011", "CV2012", "CV2014"]
  },
  {
    id: "mae",
    label: "Mechanical Engineering Student",
    note: "Dynamics, materials and maths",
    modules: ["MA1001", "MA1008", "MA2001", "MA2002", "MA2005", "MH1811"]
  },
  {
    id: "english",
    label: "English Literature Student",
    note: "Readings, seminars and tutorials",
    modules: ["HL1003", "HL1005", "HL2004", "HL2003", "HL2007", "HL2021"]
  },
  {
    id: "econ",
    label: "Economics Student",
    note: "Lectures with tutorials",
    modules: ["HE2001", "HE2002", "HE3003", "HE3012", "HE3010", "MH1810"]
  },
  {
    id: "bio",
    label: "Biological Sciences Student",
    note: "Lab-heavy weeks",
    modules: ["BS1005", "BS1006", "BS1007", "BS1100", "BS1009", "CM1002"]
  },
  {
    id: "psych",
    label: "Psychology Student",
    note: "Lectures with tutorials",
    modules: ["HP1000", "HP1100", "HP2300", "HP2400", "HP2600", "HP2700"]
  },
  {
    id: "maths",
    label: "Mathematical Sciences Student",
    note: "Proofs, calculus and code",
    modules: ["MH1101", "MH1201", "MH1301", "MH1403", "MH2510", "MH1812"]
  },
  {
    id: "adm",
    label: "Art, Design and Media Student",
    note: "Studios and critiques",
    modules: ["DC1100", "DC1101", "DC1102", "DF1100", "DF1101"]
  },
  {
    id: "bde",
    label: "BDE Warrior",
    note: "Nothing but BDEs",
    modules: ["DC1101", "DF1100", "HP1000", "BS2025", "MA0218", "HP2300"]
  }
]

export type DemoPersona = {
  id: string
  label: string
  note: string
  timetable: TimetableWithIndex
  types: string[]
}

// For each module take the index that clashes with nothing already chosen and
// sits on the emptiest days, so the week comes out spread out.
const pickTimetable = async (
  modules: string[],
  year: string,
  semester: string
): Promise<TimetableWithIndex> => {
  const timetable: TimetableWithIndex = {}
  const chosen: Index[] = []
  // Modules with the fewest indexes go first, they have the least room to move
  const options = (
    await Promise.all(
      modules.map(async (code) => ({
        code,
        indexes: Object.values(await getModuleIndexesData(code, year, semester))
      }))
    )
  ).sort((a, b) => a.indexes.length - b.indexes.length)

  for (const { code, indexes } of options) {
    let best: { slots: Index[]; load: number } | null = null
    for (const slots of indexes) {
      if (slots.some((s) => chosen.some((c) => timeslotsOverlap(s, c))))
        continue
      const load = slots.reduce(
        (sum, s) => sum + chosen.filter((c) => c.day === s.day).length,
        0
      )
      if (!best || load < best.load) best = { slots, load }
    }
    if (best) {
      timetable[code] = best.slots
      chosen.push(...best.slots)
    }
  }
  return timetable
}

export const getLandingDemoData = async (
  year: string,
  semester: string
): Promise<DemoPersona[]> =>
  (
    await Promise.all(
      PERSONAS.map(async ({ modules, ...p }) => {
        const timetable = await pickTimetable(modules, year, semester)
        const types = [
          ...new Set(
            Object.values(timetable).flatMap((s) => s.map((i) => i.type))
          )
        ]
        return { ...p, timetable, types }
      })
    )
  )
    // A persona needs a full-looking week to be worth showing
    .filter((p) => Object.keys(p.timetable).length >= 4)
