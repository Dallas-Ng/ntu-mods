"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Rich } from "@/components/developers/code"
import TryModuleApi from "@/components/developers/try-module-api"

export interface ApiOp {
  id: string
  path: string
  summary: string
  description?: string
  /** Display date, e.g. "19 Oct 2026". */
  updated: string
  params: { name: string; description: string }[]
  responses: { status: string; description: string }[]
  fields?: [string, string, string][]
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
  "2": "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  "3": "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  "4": "bg-amber-500/20 text-amber-900 dark:text-amber-300",
  "5": "bg-rose-500/15 text-rose-800 dark:text-rose-300"
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
        <p className="text-foreground/80 text-sm">
          <Rich text={op.description} />
        </p>
      )}
      {op.params.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">Parameters</h3>
          <ul className="space-y-2 text-sm">
            {op.params.map((p) => (
              <li key={p.name} className="space-y-0.5">
                <code className="bg-muted rounded px-1 py-0.5 text-xs font-semibold">
                  {p.name}
                </code>
                <p className="text-foreground/80">
                  <Rich text={p.description} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Tabs defaultValue="responses">
        <TabsList className="w-full sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="text-foreground/80 data-[state=active]:text-foreground dark:text-foreground/80 dark:data-[state=active]:text-foreground sm:flex-none sm:px-4">
              {TAB_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="responses">
          <ul>
            {op.responses.map((r) => (
              <li
                key={r.status}
                className="flex items-baseline gap-3 border-t py-2 text-sm first:border-t-0">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${STATUS_STYLE[r.status[0]]}`}>
                  {r.status}
                </span>
                <span className="text-foreground/80">
                  <Rich text={r.description} />
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
        {op.fields && (
          <TabsContent value="fields">
            <ul>
              {op.fields.map(([name, type, description]) => (
                <li
                  key={name}
                  className="space-y-0.5 border-t py-2 text-sm first:border-t-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <code className="text-xs font-semibold break-all">
                      {name}
                    </code>
                    <code className="text-foreground/70 text-xs">{type}</code>
                  </div>
                  {description && (
                    <p className="text-foreground/80">
                      <Rich text={description} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
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

const ApiExplorer = ({ groups }: { groups: ApiGroup[] }) => (
  <div className="space-y-8">
    {groups.map((g) => (
      <section key={g.name} className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{g.name}</h2>
          {g.description && (
            <p className="text-foreground/80 text-sm">{g.description}</p>
          )}
        </div>
        <Accordion type="multiple" className="space-y-2">
          {g.ops.map((op) => (
            <AccordionItem
              key={op.id}
              value={op.id}
              className="rounded-xl border px-4 last:border-b">
              <AccordionTrigger className="items-center py-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="bg-primary text-primary-foreground shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold">
                      GET
                    </span>
                    <code className="text-sm font-semibold break-all">
                      {op.path}
                    </code>
                  </span>
                  <span className="text-foreground/80 text-xs font-normal">
                    {op.summary}
                    <span className="text-foreground/60">
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

export default ApiExplorer
