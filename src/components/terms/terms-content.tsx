import { siteConfig } from "@/config/site"
import Container from "@/components/container"
import Header from "@/components/header"

const TermsContent = () => {
  return (
    <Container size="sm" className="text-muted-foreground space-y-6">
      <div className="text-foreground">
        <Header title="Terms of Use" subtitle="Last Updated: 22 October 2026" />
      </div>

      <p className="text-sm">
        By using NTUMods (&quot;we&quot;, &quot;us&quot;) at ntumods.com (the
        &quot;Service&quot;), you agree to these terms. If you do not agree,
        please do not use the Service.
      </p>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Using the Service
        </h2>

        <p>
          NTUMods is a free, open-source tool for planning NTU timetables and
          browsing module, index and exam data. You may use it for personal,
          non-commercial planning. Do not misuse it: do not attempt to disrupt
          it, overload it, scrape it beyond the documented public API and open
          data files, or bypass its rate limits.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Not Affiliated with NTU
        </h2>

        <p>
          NTUMods is an independent project. It is not affiliated with, endorsed
          by or operated by Nanyang Technological University. Course data comes
          from public NTU sources and may be late, incomplete or wrong. Always
          confirm class indexes, timings, venues, exam details and graduation
          requirements with official NTU systems before you register or rely on
          them.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">No Warranty</h2>

        <p>
          The Service is provided &quot;as is&quot; and &quot;as
          available&quot;, without warranties of any kind. We do not guarantee
          it will be accurate, uninterrupted or error free, and results from
          tools such as the CGPA planner or FGO optimiser are estimates only.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Limitation of Liability
        </h2>

        <p>
          To the extent permitted by law, we are not liable for any loss arising
          from your use of, or inability to use, the Service, including missed
          registrations, clashes, or decisions made on the basis of its data.
          Nothing in these terms limits liability that cannot be limited by law,
          or your statutory rights as a consumer.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Your Data and Privacy
        </h2>

        <p>
          Your timetable and settings are stored in your browser. How we handle
          analytics, cookies and consent, including the opt-in banner shown in
          regions that require it, is described in the{" "}
          <a
            href="/privacy"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            Privacy Policy
          </a>
          , which forms part of these terms.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Open Source and Content
        </h2>

        <p>
          The source code is published on{" "}
          <a
            href={siteConfig.links.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2">
            GitHub
          </a>{" "}
          under the licence in its repository. Module and exam data is
          NTU&apos;s; we present it for convenience. Articles and site design
          remain with their authors unless stated otherwise.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Changes and Governing Law
        </h2>

        <p>
          We may change these terms or the Service at any time, and will update
          the date above. Continued use after a change means you accept it.
          These terms are governed by the laws of Singapore, without affecting
          any mandatory consumer rights you have in your country of residence.
        </p>
      </section>
    </Container>
  )
}

export default TermsContent
