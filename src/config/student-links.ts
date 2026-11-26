/**
 * The NTU portals and NTUMods pages listed on /links. The navbar's Links menu
 * shows the QUICK_LINKS subset, so a portal renamed here is renamed there too.
 */

export interface InternalLink {
  name: string
  href: string
  desc: string
}

export interface ExternalNtuLink {
  name: string
  href: string
  desc: string
}

export interface InternalCategory {
  id: string
  title: string
  type: "internal"
  links: InternalLink[]
}

export interface ExternalCategory {
  id: string
  title: string
  type: "external"
  links: ExternalNtuLink[]
}

export type LinkCategory = InternalCategory | ExternalCategory

export const LINK_CATEGORIES: LinkCategory[] = [
  {
    id: "academics",
    title: "Academics",
    type: "external",
    links: [
      {
        name: "STARS",
        href: "https://wish.wis.ntu.edu.sg/pls/webexe/ldap_login.login?w_url=https://wish.wis.ntu.edu.sg/pls/webexe/aus_stars_planner.main",
        desc: "Register for courses and plan your timetable"
      },
      {
        name: "NTULearn",
        href: "https://ntulearn.ntu.edu.sg/ultra/institution-page",
        desc: "Access course materials, lectures, and announcements"
      },
      {
        name: "Degree Audit",
        href: "https://wish.wis.ntu.edu.sg/pls/webexe/ldap_login.login?w_url=https://wish.wis.ntu.edu.sg/pls/webexe/dars_result_ro.main_display",
        desc: "View grades and track AU progress"
      },
      {
        name: "Transcript",
        href: "https://wis.ntu.edu.sg/webexe/owa/request_transcript_und.LoginN?pType=SH",
        desc: "View and request your academic transcript"
      },
      {
        name: "Class Schedule",
        href: "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main",
        desc: "Browse available classes for any module"
      },
      {
        name: "FGO Portal",
        href: "https://sso.wis.ntu.edu.sg/webexe88/owa/sso_login1.asp?t=1&p2=https://wis.ntu.edu.sg/pls/webexe/aus_su_opt.display&extra=&pg=",
        desc: "Declare eligible courses under the Flexible Grading Option. Use the FGO Optimiser first to pick which ones"
      },
      {
        name: "Academic Calendar",
        href: "https://www.ntu.edu.sg/admissions/matriculation/academic-calendars",
        desc: "Semester dates, reading week, and exam period schedule"
      },
      {
        name: "Course Content",
        href: "https://wish.wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main",
        desc: "Official module descriptions, AUs, and prerequisites by programme"
      },
      {
        name: "Student Email",
        href: "https://outlook.com/e.ntu.edu.sg",
        desc: "Office 365 EDU mailbox and calendar (username@e.ntu.edu.sg)"
      }
    ]
  },
  {
    id: "library-campus",
    title: "Library & campus",
    type: "external",
    links: [
      {
        name: "Library Booking",
        href: "https://libcalendar.ntu.edu.sg/",
        desc: "Book library facilities and study rooms"
      },
      {
        name: "Facilities Booking",
        href: "https://ntu.facilitiesbooking.com/bookings.aspx",
        desc: "Book sports halls and other campus facilities"
      },
      {
        name: "NTU Campus Map",
        href: "https://maps.ntu.edu.sg/",
        desc: "Official map of buildings, venues, and directions around campus"
      },
      {
        name: "NTU Library",
        href: "https://www.ntu.edu.sg/library",
        desc: "OneSearch, e-resources, and library opening hours"
      },
      {
        name: "Campus Shuttle",
        href: "https://ntu.edu.sg/about-us/visiting-ntu/internal-campus-shuttle",
        desc: "Campus loop and Pioneer MRT bus routes, timings, and the Omnibus app"
      },
      {
        name: "Housing",
        href: "https://www.ntu.edu.sg/life-at-ntu/accommodation",
        desc: "On-campus hall and residence information and applications"
      },
      {
        name: "Student Wellbeing",
        href: "https://www.ntu.edu.sg/life-at-ntu/student-life/campus-life-and-wellbeing/ntu-wellbeing/student-wellbeing-services",
        desc: "University Counselling Centre and mental health support"
      }
    ]
  },
  {
    id: "student-life",
    title: "Student life",
    type: "external",
    links: [
      {
        name: "Clubs & Societies",
        href: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-activities-and-engagement/clubs-groups-societies/special-interest-clubs",
        desc: "Special interest clubs for arts, culture, sports, and community work"
      },
      {
        name: "Students' Union",
        href: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-activities-and-engagement/clubs-groups-societies/ntu-students-union-council",
        desc: "The NTU Students' Union Council and its constituent clubs"
      },
      {
        name: "Health Care",
        href: "https://www.ntu.edu.sg/life-at-ntu/health-and-safety/services/health-care",
        desc: "On-campus clinic, medical scheme, and student insurance"
      }
    ]
  },
  {
    id: "career-exchange",
    title: "Career & exchange",
    type: "external",
    links: [
      {
        name: "CareerAxis",
        href: "https://careeraxis.ntu.edu.sg/students",
        desc: "NTU career portal for jobs, internships, and events"
      },
      {
        name: "InPlace",
        href: "https://inplace.ntu.edu.sg/",
        desc: "Internship and work placement portal"
      },
      {
        name: "GEM Portal",
        href: "https://gem.ntu.edu.sg/",
        desc: "Apply for student exchange at overseas partner universities"
      },
      {
        name: "Course Matching",
        href: "https://sso.wis.ntu.edu.sg/webexe88/owa/sso_login1.asp?t=1&p2=https://wis.ntu.edu.sg/pls/lms/instep_past_subj_matching.show_rec_INSTEP",
        desc: "Check which exchange courses map to NTU modules for credit"
      }
    ]
  },
  {
    id: "finance-admin",
    title: "Finance & admin",
    type: "external",
    links: [
      {
        name: "Financial Aid",
        href: "https://www.ntu.edu.sg/admissions/undergraduate/financial-matters/financial-aid",
        desc: "Bursaries, loans, and financial assistance options"
      },
      {
        name: "Fee Payment",
        href: "https://ntuadminonestop.service-now.com/ntussp",
        desc: "Pay tuition and other fees through the One Stop portal"
      },
      {
        name: "One Stop @ SAC",
        href: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-services/onestop",
        desc: "Student's Pass, concession card, insurance, and lost and found"
      },
      {
        name: "IT Helpdesk",
        href: "https://www.ntu.edu.sg/life-at-ntu/internet-account-and-policy/contact-service-desk",
        desc: "Network account, wifi, and technical support contacts"
      }
    ]
  },
  {
    id: "ntumods",
    title: "NTUMods",
    type: "internal",
    links: [
      {
        name: "Timetable Planner",
        href: "/timetable",
        desc: "Build your STARS timetable, detect clashes, and export to calendar"
      },
      {
        name: "Module Browser",
        href: "/mods",
        desc: "Search modules, view indexes, prerequisites, and exam dates"
      },
      {
        name: "Exam Schedule",
        href: "/exams",
        desc: "Browse the AY 2026/2027 Sem 1 exam timetable by date or module"
      },
      {
        name: "Academic calendar",
        href: "/calendar",
        desc: "See teaching weeks, recess, exams and public holidays, or subscribe in your calendar app"
      },
      {
        name: "CGPA Planner",
        href: "/tools/cgpa-planner",
        desc: "Find the average grade you need over your remaining AU to reach Merit, Distinction or Highest Distinction"
      },
      {
        name: "FGO Optimiser",
        href: "/tools/fgo-optimiser",
        desc: "Upload your transcript and find the modules to Flexible-Grade for the highest CGPA"
      },
      {
        name: "Campus Map",
        href: "/maps",
        desc: "Find any room by its timetable code and get walking directions between classes"
      },
      {
        name: "Wallpaper Maker",
        href: "/screenshot",
        desc: "Export your timetable as a phone wallpaper or shareable image"
      },
      {
        name: "AI Assistant Connector",
        href: "/developers/mcp",
        desc: "Add NTUMods to Claude or ChatGPT and ask about modules, indexes, and exams"
      },
      {
        name: "Guides",
        href: "/articles",
        desc: "Guides on planning modules, choosing BDEs, balancing workload, and preparing for STARS"
      },
      {
        name: "FAQ",
        href: "/faq",
        desc: "Quick answers on planning, exporting, sharing, and how your data is stored"
      },
      {
        name: "Changelog",
        href: "/changelog",
        desc: "Every new feature, fix, and data update"
      },
      {
        name: "Feedback",
        href: "/feedback",
        desc: "Report wrong data, suggest a feature, or ask a question"
      },
      {
        name: "Developer Docs",
        href: "/developers",
        desc: "Free REST API, open data files, and the MCP server"
      }
    ]
  }
]

/** The portals students open most, shown in the navbar's Links menu. */
const QUICK_LINK_NAMES = ["STARS", "NTULearn", "Degree Audit", "Transcript"]

export const QUICK_LINKS: ExternalNtuLink[] = QUICK_LINK_NAMES.map((name) => {
  const link = LINK_CATEGORIES.flatMap((c) =>
    c.type === "external" ? c.links : []
  ).find((l) => l.name === name)
  if (!link) throw new Error(`Quick link "${name}" is not in LINK_CATEGORIES`)
  return link
})
