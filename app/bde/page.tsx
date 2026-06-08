import { getBdeModules } from "@/lib/server/get-bde-modules"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import { siteConfig } from "@/config/site"
import Header from "@/components/header"
import { BdeModuleList } from "@/components/mods/bde-module-list"

export const dynamic = "force-static"

const FAQ = [
  {
    question: "What are NTU BDE modules?",
    answer:
      "BDE stands for Broadening and Deepening Electives. These are modules open to all NTU students regardless of programme. They allow students to explore subjects outside their major and count toward graduation requirements."
  },
  {
    question: "How many BDE modules are there at NTU?",
    answer:
      "There are hundreds of BDE modules offered each semester across faculties including engineering, business, science, and humanities. The exact number varies each semester."
  },
  {
    question: "What is the difference between BDE and UE at NTU?",
    answer:
      "BDE (Broadening and Deepening Electives) are open to all students and span a wide range of disciplines. UE (Unrestricted Electives) are free-choice modules that may include BDEs as well as modules from your own faculty. Both count toward graduation but have different registration rules."
  },
  {
    question: "How do I register for BDE modules at NTU?",
    answer:
      "BDE modules are registered through the STARS system during the bidding rounds. You can browse available BDE modules here, compare indexes and class times, then add them to your timetable before bidding."
  }
]

export default async function BdePage() {
  const bdeModules = await getBdeModules()

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NTU Broadening and Deepening Elective (BDE) Modules",
    description:
      "Complete list of NTU BDE modules available this semester",
    url: `${siteConfig.url}/bde`,
    numberOfItems: bdeModules.length,
    itemListElement: bdeModules.slice(0, 200).map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteConfig.url}/mods/${m.code}`,
      name: `${m.code} ${m.title}`
    }))
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="space-y-6">
        <Header
          title="NTU BDE Modules"
          subtitle={LATEST_SEMESTER_LABEL}
        />

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Broadening and Deepening Electives (BDEs) are open to all NTU
          students regardless of programme. They let you explore subjects
          outside your major and count toward your graduation AU requirements.
          Browse all {bdeModules.length} BDE modules available this semester
          below.
        </p>

        <BdeModuleList initialModules={bdeModules} />
      </div>
    </>
  )
}
