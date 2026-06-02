"use client"

import {
  AlertTriangleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  XCircleIcon,
  ZapIcon
} from "lucide-react"

import type { FgoStrategy, OptimisationResult } from "@/types/fgo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  result: OptimisationResult
  onReset: () => void
}

const STRATEGY_ICONS: Record<FgoStrategy["type"], React.ReactNode> = {
  recommended: <TrendingUpIcon className="size-4" />,
  conservative: <ShieldCheckIcon className="size-4" />,
  maxCgpa: <ZapIcon className="size-4" />,
  graduationSafe: <ShieldCheckIcon className="size-4" />
}

function CgpaBadge({ value }: { value: number }) {
  return (
    <span className="bg-foreground text-background rounded px-2 py-0.5 font-mono text-sm font-bold">
      {value.toFixed(2)}
    </span>
  )
}

function StrategyCard({ strategy }: { strategy: FgoStrategy }) {
  const { selection: s } = strategy

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {STRATEGY_ICONS[strategy.type]}
        </span>
        <span className="font-medium">{strategy.label}</span>
        {s.cgpaImprovement > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <ArrowUpIcon className="size-3" />+{s.cgpaImprovement.toFixed(3)}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{strategy.description}</p>

      {s.courses.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">
          No modules to FGO under this strategy.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {s.courses.map((c) => (
              <span
                key={c.courseCode}
                className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                {c.courseCode} ({c.grade}, {c.au} AU)
              </span>
            ))}
          </div>
          <div className="bg-muted/50 grid grid-cols-3 gap-2 rounded-lg p-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">New CGPA</span>
              <CgpaBadge value={s.newCgpa} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">AU consumed</span>
              <span className="font-medium">{s.auConsumed} AU</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">GP removed</span>
              <span className="font-medium">
                {s.gradePointsRemoved.toFixed(1)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function FgoResults({ result, onReset }: Props) {
  const recommended = result.strategies.find((s) => s.type === "recommended")
  const alternatives = result.strategies.filter((s) => s.type !== "recommended")

  return (
    <div className="flex flex-col gap-8">
      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangleIcon className="size-4" />
            <span className="text-sm font-medium">Assumptions & warnings</span>
          </div>
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Section 1 — Academic Summary */}
      <section>
        <h3 className="mb-4 font-semibold">Academic Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Current CGPA", result.currentCgpa.toFixed(2)],
            ["Grade Points", result.currentGradePoints.toFixed(1)],
            ["Total AU", result.currentCgpaAu],
            ["FGO Remaining", `${result.fgoQuotaRemaining} AU`],
            ["Core/ICC/MPE Cap Left", `${result.coreMpeIccCapRemaining} AU`]
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">{label}</span>
              <span className="font-mono text-lg font-bold">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 — Eligibility */}
      <section>
        <h3 className="mb-4 font-semibold">Eligibility Review</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              label: `Eligible (${result.eligibleCourses.length})`,
              courses: result.eligibleCourses,
              icon: <CheckCircleIcon className="size-4 text-green-500" />
            },
            {
              label: `Ineligible (${result.ineligibleCourses.length})`,
              courses: result.ineligibleCourses,
              icon: <XCircleIcon className="text-muted-foreground size-4" />
            },
            {
              label: `Failed — High Risk (${result.failedCourses.length})`,
              courses: result.failedCourses,
              icon: <AlertTriangleIcon className="size-4 text-red-500" />
            },
            {
              label: `Already FGO-ed (${result.fgoAppliedCourses.length})`,
              courses: result.fgoAppliedCourses,
              icon: <CheckCircleIcon className="text-muted-foreground size-4" />
            }
          ].map(({ label, courses, icon }) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </div>
              {courses.length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {courses.map((c) => (
                    <span
                      key={c.courseCode}
                      title={c.eligibilityReason}
                      className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {c.courseCode}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — GPA Drag */}
      <section>
        <h3 className="mb-4 font-semibold">GPA Drag Ranking</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Module</th>
                <th className="px-3 py-2 text-left font-medium">Grade</th>
                <th className="px-3 py-2 text-left font-medium">AU</th>
                <th className="px-3 py-2 text-left font-medium">GPA Drag</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.gpaDragRanking.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-3 py-4 text-center text-xs">
                    No eligible courses with GPA drag.
                  </td>
                </tr>
              ) : (
                result.gpaDragRanking.map((entry) => (
                  <tr key={entry.course.courseCode}>
                    <td className="text-muted-foreground px-3 py-2 text-xs">
                      {entry.rank}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">
                        {entry.course.courseCode}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {entry.course.courseTitle}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {entry.course.grade}
                    </td>
                    <td className="px-3 py-2 text-xs">{entry.course.au}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-1.5 w-20 rounded-full">
                          <div
                            className="h-full rounded-full bg-red-400 dark:bg-red-600"
                            style={{
                              width: `${Math.min(100, (entry.drag / (result.gpaDragRanking[0]?.drag || 1)) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs">
                          {entry.drag.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — Recommended */}
      {recommended && (
        <section>
          <h3 className="mb-4 font-semibold">Recommended FGO Optimisation</h3>
          <StrategyCard strategy={recommended} />
        </section>
      )}

      {/* Section 5 — Alternative Strategies */}
      <section>
        <h3 className="mb-4 font-semibold">Alternative Strategies</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {alternatives.map((s) => (
            <StrategyCard key={s.type} strategy={s} />
          ))}
        </div>
      </section>

      {/* Section 6 — Risk & Compliance */}
      <section>
        <h3 className="mb-4 font-semibold">Risk & Compliance Checks</h3>
        <div className="flex flex-col gap-2">
          {result.riskChecks.map((check) => (
            <div
              key={check.label}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                check.pass
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
              )}>
              {check.pass ? (
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{check.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    check.pass
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  )}>
                  {check.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Failed module warning */}
      {result.failedCourses.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Failed Module Warning
            </span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-400">
            Warning: The following modules appear to be failed:{" "}
            {result.failedCourses.map((c) => c.courseCode).join(", ")}. Applying
            FGO may remove them from CGPA calculation, but you may still need to
            retake them to satisfy graduation requirements. The FGO quota used
            on this attempt may be wasted. Please verify the implications with
            your school before proceeding.
          </p>
        </div>
      )}

      <Button variant="outline" onClick={onReset} className="w-full">
        Analyse Another Audit
      </Button>
    </div>
  )
}
