import { Suspense } from "react"
import Link from "next/link"

import { getBdeModules } from "@/lib/server/get-bde-modules"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import { siteConfig } from "@/config/site"
import Header from "@/components/header"
import { BdeModuleList } from "@/components/mods/bde-module-list"

export const dynamic = "force-static"

const BDE_ARTICLES = [
  {
    href: "/articles/what-is-a-bde-at-ntu",
    title: "What Is a BDE at NTU?"
  },
  {
    href: "/articles/most-popular-bdes-at-ntu",
    title: "Most Popular BDEs at NTU"
  },
  {
    href: "/articles/easy-bde-at-ntu",
    title: "Easy BDEs at NTU"
  },
  {
    href: "/articles/how-to-bid-for-bde-at-ntu",
    title: "How to Bid for a BDE at NTU"
  },
  {
    href: "/articles/language-bde-at-ntu",
    title: "Language BDEs at NTU"
  },
  {
    href: "/articles/complete-ntu-bde-list",
    title: "Complete NTU BDE List"
  },
  {
    href: "/articles/bde-vs-minor-at-ntu",
    title: "BDE vs Minor at NTU"
  },
  {
    href: "/articles/does-bde-count-towards-degree-ntu",
    title: "Does BDE Count Towards Your Degree?"
  },
  {
    href: "/articles/bde-for-engineering-students-ntu",
    title: "BDE Guide for Engineering Students"
  }
]

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
    description: "Complete list of NTU BDE modules available this semester",
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
        <Header title="NTU BDE Modules" subtitle={LATEST_SEMESTER_LABEL} />

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Broadening and Deepening Electives (BDEs) are open to all NTU
          students regardless of programme. They let you explore subjects
          outside your major and count toward your graduation AU requirements.
          Browse all {bdeModules.length} BDE modules available this semester
          below, or{" "}
          <Link href="/timetable" className="underline">
            add them directly to your timetable
          </Link>
          .
        </p>

        <Suspense>
          <BdeModuleList initialModules={bdeModules} />
        </Suspense>

        <hr />

        <section className="space-y-3">
          <h2 className="font-semibold">BDE Guides</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BDE_ARTICLES.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="bg-card hover:bg-accent rounded-md border px-4 py-3 text-sm font-medium transition-colors">
                {a.title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
