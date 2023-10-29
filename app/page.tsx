import Link from "next/link"
import data from "@/data/test.json"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function IndexPage() {
  // const d = data as IDATA;

  return (
    <div>
      <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex max-w-[980px] flex-col items-start gap-2">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            Acad Yr 2023 Semester 1
          </h1>
        </div>

        {data.map((d) => (
          <>
            <p>{d.code}</p>
            <p>{d.title}</p>
            <p>{d.au}</p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>index</TableHead>
                  <TableHead>type</TableHead>
                  <TableHead>group</TableHead>
                  <TableHead>day</TableHead>
                  <TableHead>time</TableHead>
                  <TableHead>venue</TableHead>
                  <TableHead>remark</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {d.indexes.map((x) => (
                  <TableRow>
                    <TableCell>{x.index}</TableCell>
                    <TableCell>{x.type}</TableCell>
                    <TableCell>{x.group}</TableCell>
                    <TableCell>{x.day}</TableCell>
                    <TableCell>{x.time}</TableCell>
                    <TableCell>{x.venue}</TableCell>
                    <TableCell>{x.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ))}
      </section>
    </div>
  )
}
