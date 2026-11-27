import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import { TextLink } from "@/components/ui/text-link"
import Container from "@/components/container"
import Header, { SectionHeading } from "@/components/header"

const PrivacyContent = () => {
  return (
    <Container size="sm" className="space-y-8">
      <div>
        <Header
          title="Privacy Policy"
          subtitle="Last updated: 27 November 2026"
        />
      </div>

      <p className="text-sm">
        This Privacy Policy describes how NTUMods (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) handles information when you use{" "}
        <TextLink
          href="https://ntumods.com"
          rel="external nofollow noopener"
          target="_blank">
          ntumods.com
        </TextLink>{" "}
        (the &quot;Service&quot;). NTUMods is a free, open-source timetable
        planning tool for NTU students. We do not sell your data, and we do not
        require an account to use the Service.
      </p>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>What we collect</SectionHeading>

        <SectionHeading as="h3" className="mt-4">
          Data stored locally on your device
        </SectionHeading>

        <p>
          Your timetable selections, academic year/semester preferences, and
          display settings are saved in your browser&apos;s{" "}
          <strong>localStorage</strong>. This data is not transmitted to our
          servers unless you choose to attach it when submitting feedback. You
          can clear it at any time by clearing your browser&apos;s site data.
        </p>

        <SectionHeading as="h3" id="analytics" className="mt-4">
          Analytics
        </SectionHeading>

        <p>
          We use two third-party analytics services on the production site to
          understand how the Service is used and to improve it. They stay
          switched off until you accept analytics, wherever you visit from.
        </p>

        <p>
          <strong>Google Analytics 4</strong> collects page views, general usage
          patterns, browser and device type, and approximate location derived
          from your IP address. Data is processed by Google. See{" "}
          <TextLink
            href="https://policies.google.com/privacy"
            rel="external nofollow noopener"
            target="_blank">
            Google&apos;s Privacy Policy
          </TextLink>
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
          <TextLink
            href="https://posthog.com/privacy"
            rel="external nofollow noopener"
            target="_blank">
            PostHog&apos;s Privacy Policy
          </TextLink>
          .
        </p>

        <p>
          Analytics are only active on the production site. They are not
          collected during local development.
        </p>

        <SectionHeading as="h3" className="mt-4">
          Article view counts
        </SectionHeading>

        <p>
          To show how many people have read an article, we store the
          article&apos;s name and a random visitor ID (the same ID PostHog uses,
          when it has one) in our own database. It is used only to count unique
          readers. We only read or create that ID and record a view after you
          accept analytics.
        </p>

        <SectionHeading as="h3" className="mt-4">
          Transcript Tools (CGPA Planner, FGO Optimiser)
        </SectionHeading>

        <p>
          Transcript PDFs are read entirely in your browser, and the file itself
          is never uploaded. If you accept analytics and tick the box to share
          transcript details, PostHog receives the module code, term, academic
          units and grade for each module on your transcript. The shared data
          excludes your name, matriculation number, programme and PDF file name.
          We do not link a list of modules and grades to your identity, but it
          could in principle identify you to someone who already knows your
          results. If you accept analytics and leave the box unticked, we only
          record counts and flags, such as how many modules were found.
        </p>

        <SectionHeading as="h3" className="mt-4">
          Timetable walking routes
        </SectionHeading>

        <p>
          The Walking between classes feature on the timetable page works out
          the venues of your classes for one day on your device. Only when you
          open it, and only for the pairs of venues that follow each other, it
          asks our server for the walking route between the two venues (see
          Walking directions under Campus Map below). Module codes, indexes,
          plan names and custom block names are not sent. Your plan names and
          layout choices are saved in localStorage like the rest of your
          timetable.
        </p>

        <SectionHeading as="h3" className="mt-4">
          Campus Map
        </SectionHeading>

        <p>
          The campus map does not use your device&apos;s location. Buildings,
          rooms, floor plans and roads are served from our own site, and your
          map settings (map type, labels and categories shown) are saved in
          localStorage.
        </p>

        <ul className="list-outside list-disc pl-10">
          <li>
            <strong>Satellite and Hybrid views</strong> load imagery directly
            from Esri&apos;s servers, so Esri receives your IP address and the
            part of the campus you are viewing. See{" "}
            <TextLink
              href="https://www.esri.com/en-us/privacy/overview"
              rel="external nofollow noopener"
              target="_blank">
              Esri&apos;s Privacy Statement
            </TextLink>
            .
          </li>
          <li>
            <strong>Walking directions</strong> send the start and end points to
            our server, which asks MazeMap&apos;s routing service for the route.
            Your IP address is not passed on to MazeMap. Routes are cached by
            Cloudflare without any visitor information, and requests are counted
            per IP address to limit abuse, as with the public API.
          </li>
          <li>
            <strong>Analytics</strong>: PostHog records what you type into the
            map search, the type of place you open, the length of routes shown,
            map settings you change and when you share a link. Page views
            include the page address, which names the place or route on screen
            when you open a shared link.
          </li>
        </ul>

        <SectionHeading as="h3" className="mt-4">
          Feedback submissions
        </SectionHeading>

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
            Your timetables, settings and favourites, if you turn on the
            &quot;Include my timetable data&quot; toggle before submitting
          </li>
        </ul>

        <p>
          We do not keep feedback in a database. It is sent as an email to the
          NTUMods maintainer through Resend, an email delivery service, and
          stays in that inbox. It is used solely to read and act on your
          feedback. We do not use it for marketing or share it with third
          parties. We also record, via PostHog, that a submission happened,
          along with its length, the page it was sent from and whether an email
          address was included, but not the message itself, if you accept
          analytics. The email to the maintainer can include your PostHog ID.
        </p>

        <SectionHeading as="h3" className="mt-4">
          Public API and open data
        </SectionHeading>

        <p>
          The <TextLink href="/developers">developers page</TextLink> documents
          a free, read-only API and open data files with NTU module, class index
          and exam data. They contain no personal data, and we do not ask
          callers for an account or an API key. To limit abuse, we count
          requests to the API per IP address using Cloudflare&apos;s rate
          limiting. We do not store those addresses or counts in our own
          database. The &quot;Try it&quot; box on that page only sends a request
          to our own API, with the module code you type.
        </p>

        <SectionHeading as="h3" className="mt-4">
          MCP Server
        </SectionHeading>

        <p>
          Our public MCP server at ntumods.com/mcp gives AI assistants read-only
          access to the same public module, class index and exam data. It needs
          no account or key and does not read or change anything stored in your
          browser. For each call we log the tool name, the result status, how
          long it took, and the name of the client (the MCP client name, or the
          start of its User-Agent). We do not log what you or the assistant
          searched for or asked about, and we do not store calls in our own
          database. We do not share these logs, and we do not use them for
          advertising. As with the API, we count requests per IP address using
          Cloudflare&apos;s rate limiting, and Cloudflare may keep standard
          server logs, including IP addresses. The assistant you connect is a
          separate service, and what you tell it is handled by its provider
          under that provider&apos;s own privacy policy. We keep no account or
          profile for MCP users, so we have nothing of ours to look up or
          delete. Server logs held by Cloudflare follow its retention settings.
          For questions or requests, use our{" "}
          <TextLink href="/feedback">feedback page</TextLink>.
        </p>

        <SectionHeading as="h3" className="mt-4">
          AI Assistants (WebMCP, Developer Preview)
        </SectionHeading>

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

        <SectionHeading as="h3" className="mt-4">
          Usage data
        </SectionHeading>

        <p>
          Like most web services, our hosting provider (Cloudflare) may
          automatically collect standard server logs, including IP addresses and
          request metadata, for operational and security purposes. This includes
          requests to the public API and open data files. We also send technical
          error reports from our servers to PostHog for troubleshooting. Server
          logs and server error reports operate independently of your browser
          analytics choice.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>How we use your information</SectionHeading>

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

      <section
        id="consent"
        className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Consent</SectionHeading>

        <p>
          We show the analytics cookie banner worldwide. Google Analytics,
          PostHog browser analytics and unique article view counting stay
          switched off until you select Accept analytics. You can use the site
          after selecting Reject analytics.
        </p>

        <p>
          Your choice is saved in your browser&apos;s localStorage. You can
          change or withdraw it at any time through{" "}
          <strong>Cookie settings</strong> in the footer. Withdrawing stops new
          browser analytics events and article view counting. Requests already
          started may still complete. You can clear any remaining cookies and
          identifiers in your browser settings.
        </p>

        <p>
          We rely on your consent for optional browser analytics. We use browser
          storage to provide features you request, such as saving your
          timetable, applying your display settings and remembering your
          analytics choice.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Cookies</SectionHeading>

        <p>
          We do not set our own cookies. Google Analytics sets cookies, and
          PostHog stores a random identifier in a cookie and in your
          browser&apos;s localStorage, to distinguish visitors and sessions.
          Both are only set after you accept analytics. You can also block or
          clear them through your browser settings or with an extension that
          blocks analytics trackers.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>International transfers</SectionHeading>

        <p>
          Google, PostHog (United States), Cloudflare and Resend process data in
          countries that may differ from yours, including outside the EEA, the
          UK and Switzerland. You can ask the maintainer about international
          transfers through the{" "}
          <TextLink href="/feedback">feedback page</TextLink>.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Data retention</SectionHeading>

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

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Your rights</SectionHeading>

        <p>
          You may request deletion of any feedback you have submitted through
          the <TextLink href="/feedback">feedback page</TextLink>. Since
          timetable and settings data is stored only in your browser, you can
          delete it yourself at any time through your browser&apos;s site data
          settings.
        </p>

        <p>
          Depending on where you live (for example under the GDPR, UK GDPR, LGPD
          or Singapore&apos;s PDPA), you may also have the right to access,
          correct, delete or restrict the use of personal data we hold about
          you, to object to its processing, to withdraw consent, and to lodge a
          complaint with your data protection authority. Because we do not
          require accounts and analytics data is tied to a random identifier, we
          may ask you for that identifier to find your data. To make a request,
          contact us through the feedback page.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Children&apos;s Privacy</SectionHeading>

        <p>
          The Service is intended for university students and is not directed at
          children under the age of 13. We do not knowingly collect personal
          information from anyone under 13.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Links to other websites</SectionHeading>

        <p>
          The Service may contain links to external websites (e.g. NTU course
          catalogues). We have no control over and assume no responsibility for
          the content or privacy practices of those sites.
        </p>
      </section>

      <section className={cn(cardVariants(), "space-y-3 p-5 text-sm")}>
        <SectionHeading>Changes to this policy</SectionHeading>

        <p>
          We may update this Privacy Policy from time to time. Changes will be
          reflected by the &quot;Last updated&quot; date at the top of this
          page.
        </p>
      </section>
    </Container>
  )
}

export default PrivacyContent
