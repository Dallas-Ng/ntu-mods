import StarsTable from "../stars/stars-table"

const TEMPLATE_COURSES = {
  MH1812: [
    {
      key: "10122",
      type: "LEC/STUDIO",
      group: "SCL1",
      day: 5,
      time: "1530-1620",
      venue: "LT1",
      remarks: "",
      duration: 2
    },
    {
      key: "10122",
      type: "TUT",
      group: "FCEA",
      day: 4,
      time: "1530-1620",
      venue: "TR+4",
      remarks: "Teaching Wk2-13",
      duration: 2
    }
  ],
  SC1005: [
    {
      key: "10028",
      type: "LEC/STUDIO",
      group: "SCL1",
      day: 1,
      time: "1130-1220",
      venue: "LT4",
      remarks: "",
      duration: 2
    },
    {
      key: "10028",
      type: "LEC/STUDIO",
      group: "SCL1",
      day: 5,
      time: "1230-1320",
      venue: "LT4",
      remarks: "",
      duration: 2
    },
    {
      key: "10028",
      type: "TUT",
      group: "FDDB",
      day: 4,
      time: "1130-1220",
      venue: "TR+5",
      remarks: "Teaching Wk2-13",
      duration: 2
    },
    {
      key: "10028",
      type: "LAB",
      group: "FDDB",
      day: 3,
      time: "0830-1020",
      venue: "HWLAB3",
      remarks: "Teaching Wk1,3,5,7,9,11,13",
      duration: 4
    }
  ],
  MH1810: [
    {
      key: "50001",
      type: "LEC/STUDIO",
      group: "LE",
      day: 2,
      time: "1230-1420",
      venue: "LT13",
      remarks: "",
      duration: 4
    },
    {
      key: "50001",
      type: "TUT",
      group: "C01",
      day: 4,
      time: "1630-1720",
      venue: "TR+107",
      remarks: "Teaching Wk2-13",
      duration: 2
    }
  ],
  SC1003: [
    {
      key: "10154",
      type: "LEC/STUDIO",
      group: "SCL1",
      day: 1,
      time: "1630-1720",
      venue: "LT4",
      remarks: "",
      duration: 2
    },
    {
      key: "10154",
      type: "TUT",
      group: "FR1",
      day: 1,
      time: "0830-0920",
      venue: "SWLAB1",
      remarks: "",
      duration: 2
    },
    {
      key: "10154",
      type: "LAB",
      group: "FR1",
      day: 1,
      time: "0930-1020",
      venue: "SWLAB1",
      remarks: "",
      duration: 2
    }
  ],
  CC0007: [
    {
      key: "83019",
      type: "TUT",
      group: "T20",
      day: 2,
      time: "1030-1220",
      venue: "COLLAB 1",
      remarks: "",
      duration: 4
    }
  ],
  BA2204: [
    {
      key: "00187",
      type: "SEM",
      group: "1",
      day: 3,
      time: "1100-1500",
      venue: "ABS LT10",
      remarks: "",
      duration: 8
    }
  ],
  IM2073: [
    {
      key: "32361",
      type: "PRJ",
      group: "EJ03",
      day: 5,
      time: "0930-1220",
      venue: "S2.2-B4-04",
      remarks: "Teaching Wk1-12",
      duration: 6
    }
  ],
  EE4208: [
    {
      key: "32263",
      type: "DES",
      group: "F41",
      day: 1,
      time: "1230-1520",
      venue: "S2-B5C-02",
      remarks: "Teaching Wk7-13",
      duration: 6
    }
  ]
}

export default function LandingProduct() {
  return (
    <div className="relative h-[59vh] w-full justify-center overflow-hidden rounded-lg border-b">
      <StarsTable coursesToIndex={TEMPLATE_COURSES} disableSelect fullCell />
    </div>
  )
}
