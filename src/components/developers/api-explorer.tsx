"use client"

import { useEffect, useState } from "react"

import { track } from "@/lib/analytics"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Rich } from "@/components/developers/code"
import TryModuleApi from "@/components/developers/try-module-api"
import { SectionHeading } from "@/components/header"
import HeadingAnchor from "@/components/heading-anchor"

export interface ApiOp {
  id: string
  path: string
  summary: string
  description?: string
  /** Display date, e.g. "19 Oct 2026". */
  updated: string
  params: {
    name: string
    where: string
    description: string
    pattern?: string
    example?: string
  }[]
  responses: { status: string; description: string }[]
  fields?: [string, string, string][]
  /** Where the fields sit in the response. */
  fieldsNote?: string
  /** A curl command for the example request. */
  request: string
  /** Example response body, truncated with "..." where long. */
  response?: string
  responseLang: string
  tryIt?: boolean
}

export interface ApiGroup {
  name: string
  description?: string
  ops: ApiOp[]
}

const STATUS_STYLE: Record<string, string> = {
  "2": "bg-success-subtle text-success",
  "3": "bg-primary-subtle text-primary",
  "4": "bg-warning-subtle text-warning",
  "5": "bg-destructive-subtle text-destructive"
}

const TAB_LABEL: Record<string, string> = {
  responses: "Responses",
  fields: "Fields",
  example: "Example",
  try: "Try it"
}

const Operation = ({ op }: { op: ApiOp }) => {
  const tabs = [
    "responses",
    ...(op.fields ? ["fields"] : []),
    "example",
    ...(op.tryIt ? ["try"] : [])
  ]

  return (
    <div className="space-y-4">
      {op.description && (
        <p className="text-foreground text-sm">
          <Rich text={op.description} />
        </p>
      )}
      {op.params.length > 0 && (
        <div className="space-y-1.5">
          <SectionHeading as="h3">Parameters</SectionHeading>
          <table className="data-table text-sm!">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {op.params.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code className="text-sm">{p.name}</code>
                    <div className="text-muted-foreground text-sm font-normal">
                      {p.where}, required
                    </div>
                  </td>
                  <td className="space-y-1">
                    <p>
                      <Rich text={p.description} />
                    </p>
                    {p.pattern && (
                      <p className="text-foreground text-sm">
                        <Rich text={`Format: \`${p.pattern}\``} />
                      </p>
                    )}
                    {p.example && (
                      <p className="text-foreground text-sm">
                        <Rich text={`Example: \`${p.example}\``} />
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Tabs defaultValue="responses">
        <TabsList className="w-full sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="text-foreground data-[state=active]:text-foreground dark:text-foreground/80 dark:data-[state=active]:text-foreground sm:flex-none sm:px-4">
              {TAB_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="responses">
          <ul className="list-none space-y-0 pl-0">
            {op.responses.map((r) => (
              <li
                key={r.status}
                className="flex items-baseline gap-3 border-t py-2 text-sm first:border-t-0">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-semibold ${STATUS_STYLE[r.status[0]]}`}>
                  {r.status}
                </span>
                <span className="text-foreground">
                  <Rich text={r.description} />
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
        {op.fields && (
          <TabsContent value="fields">
            {op.fieldsNote && (
              <p className="text-foreground pb-2 text-sm">
                <Rich text={op.fieldsNote} />
              </p>
            )}
            <table className="data-table text-sm!">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {op.fields.map(([name, type, description]) => (
                  <tr key={name}>
                    <td>
                      <code className="text-sm break-all">{name}</code>
                      <div className="text-muted-foreground font-mono text-sm font-normal break-all">
                        {type}
                      </div>
                    </td>
                    <td>
                      <Rich text={description} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        )}
        <TabsContent value="example" className="space-y-3">
          <Code code={op.request} lang="bash" title="Request" />
          {op.response && (
            <Code
              code={op.response}
              lang={op.responseLang}
              title="Response (shortened)"
            />
          )}
        </TabsContent>
        {op.tryIt && (
          <TabsContent value="try">
            <TryModuleApi />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-")

const ApiExplorer = ({ groups }: { groups: ApiGroup[] }) => {
  const [open, setOpen] = useState<string[]>([])

  // A link like /developers/api#getModule opens that endpoint and scrolls to it.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1)
      if (!groups.some((g) => g.ops.some((op) => op.id === id))) return
      setOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "start" })
      )
    }
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [groups])

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.name} className="space-y-3">
          <div className="space-y-1">
            <SectionHeading id={slug(g.name)}>
              {g.name}
              <HeadingAnchor id={slug(g.name)} label={g.name} />
            </SectionHeading>
            {g.description && (
              <p className="text-foreground text-sm">{g.description}</p>
            )}
          </div>
          <Accordion
            type="multiple"
            value={open}
            onValueChange={(v) => {
              if (v.length > open.length) track("api_operation_opened")
              setOpen(v)
            }}
            className="space-y-2">
            {g.ops.map((op) => (
              <AccordionItem
                key={op.id}
                value={op.id}
                id={op.id}
                className="bg-muted scroll-mt-28 rounded-xl px-4">
                <AccordionTrigger className="items-center py-3 hover:no-underline">
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="bg-primary text-primary-foreground shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold">
                        GET
                      </span>
                      <code className="text-sm font-semibold break-all">
                        {op.path}
                      </code>
                    </span>
                    <span className="text-foreground text-sm font-normal">
                      {op.summary}
                      <span className="text-muted-foreground">
                        {" "}
                        · Last updated {op.updated}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Operation op={op} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  )
}

export default ApiExplorer
