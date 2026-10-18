"use client"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import AppearanceSettings from "@/components/settings/appearance-settings"
import TableSettings from "@/components/settings/table-settings"

interface SectionProps {
  id: string
  title: string
  desc: string
  children: React.ReactNode
}

const Section = ({ id, title, desc, children }: SectionProps) => (
  <section id={id} className="scroll-mt-20 space-y-4">
    <div className="space-y-1">
      <h2 className="text-2xl font-bold tracking-tighter">{title}</h2>
      <p className="text-muted-foreground text-sm text-pretty">{desc}</p>
    </div>

    {children}
  </section>
)

interface Props {
  commit: string
  buildTime: string
}

const SettingsPageContent = ({ commit, buildTime }: Props) => {
  return (
    <div className="space-y-10">
      <Header
        title="Settings"
        subtitle="Customise the look, feel, and timetable detail level."
      />

      <Section
        id="dark-mode"
        title="Appearance"
        desc="Tune theme, radius, density, contrast, and timetable colour personality.">
        <div className="bg-muted rounded-2xl p-5">
          <AppearanceSettings />
        </div>
      </Section>

      <Section
        id="table-settings"
        title="Timetable cells"
        desc="Choose which details show in each timetable cell.">
        <div className="bg-muted rounded-2xl p-5">
          <TableSettings />
        </div>
      </Section>

      <section
        id="feedback"
        className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold">Feedback</h2>
          <p className="text-muted-foreground text-sm text-pretty">
            Have a problem or suggestion? Let us know.
          </p>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <a href="/feedback">Share Feedback</a>
        </Button>
      </section>

      <p className="text-muted-foreground text-xs">
        Build <span className="font-mono">{commit.slice(0, 7)}</span>
        {" · "}
        {buildTime}
      </p>
    </div>
  )
}

export default SettingsPageContent
