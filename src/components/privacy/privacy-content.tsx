import Container from "@/components/container"
import Header from "@/components/header"

const PrivacyContent = () => {
  return (
    <Container size="sm" className="text-muted-foreground space-y-6">
      <div className="text-foreground">
        <Header title="Privacy Policy" subtitle="Last Updated: October 2026" />
      </div>

      <p className="text-sm">
        This Privacy Policy describes how NTU Mods (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) handles information when you use{" "}
        <a
          href="https://ntumods.com"
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          rel="external nofollow noopener"
          target="_blank">
          ntumods.com
        </a>{" "}
        (the &quot;Service&quot;). NTU Mods is a free, open-source timetable
        planning tool for NTU students. We do not sell your data, and we do not
        require an account to use the Service.
      </p>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          What We Collect
        </h2>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Data Stored Locally on Your Device
        </h3>

        <p>
          Your timetable selections, academic year/semester preferences, and
          display settings are saved in your browser&apos;s{" "}
          <strong>localStorage</strong>. This data is not transmitted to our
          servers, except when submitting the feedback form (see below), where
          it is attached by default to help us debug your issue. You can clear
          it at any time by clearing your browser&apos;s site data.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Analytics
        </h3>

        <p>
          We use two third-party analytics services on the production site to
          understand how the Service is used and to improve it.
        </p>

        <p>
          <strong>Google Analytics 4</strong> collects page views, general usage
          patterns, browser and device type, and approximate location derived
          from your IP address. Data is processed by Google. See{" "}
          <a
            href="https://policies.google.com/privacy"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            rel="external nofollow noopener"
            target="_blank">
            Google&apos;s Privacy Policy
          </a>
          .
        </p>

        <p>
          <strong>PostHog</strong> collects:
        </p>

        <ul className="list-outside list-disc pl-10">
          <li>
            Page views, the referring site, browser and device type, and
            approximate location derived from your IP address
          </li>
          <li>
            Interactions with the interface, such as clicks and custom events
            (e.g. adding a module to your timetable, with its module code and
            index, or downloading a calendar)
          </li>
          <li>
            Error reports when something breaks, including the error message and
            where in our code it happened
          </li>
        </ul>

        <p>We do not record session replays or screen recordings.</p>

        <p>
          PostHog requests are routed through our own domain (ntumods.com)
          rather than sent straight from your browser. Data is processed by
          PostHog, Inc. in the United States. See{" "}
          <a
            href="https://posthog.com/privacy"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            rel="external nofollow noopener"
            target="_blank">
            PostHog&apos;s Privacy Policy
          </a>
          .
        </p>

        <p>
          Analytics are only active on the production site. They are not
          collected during local development.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Article View Counts
        </h3>

        <p>
          To show how many people have read an article, we store the
          article&apos;s name and a random visitor ID (the same ID PostHog uses)
          in our own database. It is used only to count unique readers.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Transcript Tools (CGPA Planner, FGO Optimiser)
        </h3>

        <p>
          Transcript PDFs are read entirely in your browser, and the file itself
          is never uploaded. By default, the &quot;Share anonymised module
          codes, terms and grades&quot; box is ticked. While it is ticked, we
          also record, via PostHog, the module code, term, AU and grade of each
          module on your transcript. Untick the box before uploading to opt out.
          We never read or collect your name, matriculation number, programme or
          the PDF file name. We do not link a list of modules and grades to your
          identity, but it could in principle identify you to someone who
          already knows your results. If you opt out, we only record counts and
          flags, such as how many modules were found.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Feedback Submissions
        </h3>

        <p>
          The Feedback page includes an optional feedback form. If you submit
          feedback, we collect:
        </p>

        <ul className="list-outside list-disc pl-10">
          <li>Your feedback message (required)</li>
          <li>
            Your email address (optional, only if you choose to provide it)
          </li>
          <li>
            The full contents of your browser&apos;s localStorage for this site
            (your saved timetables, settings, and favourites), included by
            default to help us debug your issue; you can turn this off with the
            &quot;Include my timetable data&quot; toggle before submitting
          </li>
        </ul>

        <p>
          We do not keep feedback in a database. It is sent as an email to the
          NTU Mods maintainer through Resend, an email delivery service, and
          stays in that inbox. It is used solely to read and act on your
          feedback. We do not use it for marketing or share it with third
          parties. We also record, via PostHog, that a submission happened,
          along with its length, the page it was sent from and whether an email
          address was included, but not the message itself.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Public API and Open Data
        </h3>

        <p>
          The{" "}
          <a
            href="/developers"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            developers page
          </a>{" "}
          documents a free, read-only API and open data files with NTU module,
          class index and exam data. They contain no personal data, and we do
          not ask callers for an account or an API key. To limit abuse, we count
          requests to the API per IP address using Cloudflare&apos;s rate
          limiting. We do not store those addresses or counts in our own
          database. The &quot;Try it&quot; box on that page only sends a request
          to our own API, with the module code you type.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          AI Assistants (WebMCP, Developer Preview)
        </h3>

        <p>
          In a browser that supports WebMCP, an AI assistant you use can call
          tools that NTUMods offers on the page, such as searching modules or
          reading and changing your saved timetables, favourites and settings.
          These tools run in your browser on the data stored there. They do not
          send your plans to our servers. The assistant itself is a separate
          service: what it reads, and what you tell it, is handled by its
          provider under that provider&apos;s own privacy policy, which we do
          not control. This is an early developer preview, and most visitors
          will not see any change.
        </p>

        <h3 className="text-foreground mt-4 text-base font-semibold">
          Usage Data
        </h3>

        <p>
          Like most web services, our hosting provider (Cloudflare) may
          automatically collect standard server logs, including IP addresses and
          request metadata, for operational and security purposes. This includes
          requests to the public API and open data files.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          How We Use Your Information
        </h2>

        <ul className="list-outside list-disc pl-10">
          <li>
            <strong>To operate and improve the Service</strong>: analytics data
            helps us understand which features are used, identify issues, and
            prioritise improvements.
          </li>
          <li>
            <strong>To respond to feedback</strong>: if you provide an email
            address with your feedback, we may reply to it.
          </li>
          <li>
            <strong>To ensure security and reliability</strong>: server logs may
            be used to detect and investigate abuse or errors.
          </li>
        </ul>

        <p>
          We do not use your data for advertising, and we do not sell or share
          your personal information with third parties for their own marketing
          purposes.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">Cookies</h2>

        <p>
          We do not set our own cookies. Google Analytics sets cookies, and
          PostHog stores a random identifier in a cookie and in your
          browser&apos;s localStorage, to distinguish visitors and sessions. You
          can block or clear these through your browser settings or with an
          extension that blocks analytics trackers.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Data Retention
        </h2>

        <ul className="list-outside list-disc pl-10">
          <li>
            <strong>LocalStorage data</strong>: retained in your browser until
            you clear site data or uninstall the browser.
          </li>
          <li>
            <strong>Feedback submissions</strong>: retained until we have
            processed and acted on them, or upon your request to delete them.
            They are kept as emails in the maintainer&apos;s inbox.
          </li>
          <li>
            <strong>Analytics data</strong>: retained according to the retention
            settings of Google Analytics and PostHog for our account.
          </li>
          <li>
            <strong>Server logs</strong>: retained according to the log settings
            of our hosting provider (Cloudflare) for our account.
          </li>
        </ul>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">Your Rights</h2>

        <p>
          You may request deletion of any feedback you have submitted by
          contacting us at the email below. Since timetable and settings data is
          stored only in your browser, you can delete it yourself at any time
          through your browser&apos;s site data settings.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Children&apos;s Privacy
        </h2>

        <p>
          The Service is intended for university students and is not directed at
          children under the age of 13. We do not knowingly collect personal
          information from anyone under 13.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Links to Other Websites
        </h2>

        <p>
          The Service may contain links to external websites (e.g. NTU course
          catalogues). We have no control over and assume no responsibility for
          the content or privacy practices of those sites.
        </p>
      </section>

      <section className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
        <h2 className="text-foreground text-xl font-semibold">
          Changes to This Policy
        </h2>

        <p>
          We may update this Privacy Policy from time to time. Changes will be
          reflected by the &quot;Last Updated&quot; date at the top of this
          page. Continued use of the Service after changes are posted
          constitutes your acceptance of the updated policy.
        </p>
      </section>
    </Container>
  )
}

export default PrivacyContent
