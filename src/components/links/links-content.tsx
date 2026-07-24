import type { ArticleHeading } from "@/lib/server/articles"
import ArticleToc from "@/components/articles/article-toc"
import Container from "@/components/container"
import Header from "@/components/header"
import LinkCard from "@/components/links/link-card"

interface InternalLink {
  name: string
  href: string
  desc: string
}

interface ExternalNtuLink {
  name: string
  href: string
  desc: string
}

interface InternalCategory {
  id: string
  title: string
  type: "internal"
  links: InternalLink[]
}

interface ExternalCategory {
  id: string
  title: string
  type: "external"
  links: ExternalNtuLink[]
}

type LinkCategory = InternalCategory | ExternalCategory

const LINK_CATEGORIES: LinkCategory[] = [
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
      }
    ]
  },
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
        desc: "Declare eligible courses under the Free General Option"
      },
      {
        name: "Academic Calendar",
        href: "https://www.ntu.edu.sg/admissions/matriculation/academic-calendars",
        desc: "Semester dates, reading week, and exam period schedule"
      }
    ]
  },
  {
    id: "library-campus",
    title: "Library & Campus",
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
      }
    ]
  },
  {
    id: "career-exchange",
    title: "Career & Exchange",
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
    title: "Finance & Admin",
    type: "external",
    links: [
      {
        name: "Financial Aid",
        href: "https://www.ntu.edu.sg/admissions/undergraduate/financial-matters/financial-aid",
        desc: "Bursaries, loans, and financial assistance options"
      }
    ]
  }
]

const linkHeadings: ArticleHeading[] = LINK_CATEGORIES.map(({ id, title }) => ({
  id,
  depth: 2,
  text: title
}))

const LinksContent = () => {
  return (
    <Container size="md">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <div className="space-y-8">
          <Header
            title="Student Links"
            subtitle="Quick links to the most-used NTU student portals — from course registration and grades to career, exchange, and campus facilities."
          />

          <p className="text-muted-foreground text-sm">
            Not sure what each portal does?{" "}
            <a
              href="/articles/ntu-student-portal-links"
              className="text-blue-500 transition-colors hover:text-blue-600">
              Read the full guide
            </a>{" "}
            for a breakdown of every portal and when to use it.
          </p>

          <div className="space-y-10">
            {LINK_CATEGORIES.map(({ id, title, type, links }) => (
              <section id={id} key={id} className="scroll-mt-20 space-y-4">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-muted-foreground text-xs">
                    {type === "internal"
                      ? "NTUMods — unofficial"
                      : "Official NTU portal"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {links.map(({ name, href, desc }) => (
                    <LinkCard
                      key={name}
                      name={name}
                      href={href}
                      desc={desc}
                      external={type === "external"}
                      category={title}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <ArticleToc headings={linkHeadings} />
      </div>
    </Container>
  )
}

export default LinksContent
