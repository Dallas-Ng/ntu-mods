import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import Container from "@/components/container"
import Header from "@/components/header"

export const metadata: Metadata = {
  title: siteConfig.metatags.privacy.title,
  description: siteConfig.metatags.privacy.desc,
  alternates: { canonical: "/privacy" }
}

export default function HelpPage() {
  return (
    <Container size="sm" className="text-muted-foreground space-y-4">
      <div className="text-foreground">
        <Header title="Privacy Policy" subtitle="Last Updated: May 2026" />
      </div>

      <br />

      <p>
        This Privacy Policy describes how NTU Mods (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) handles information when you use{" "}
        <Link
          href="https://ntumods.com"
          rel="external nofollow noopener"
          target="_blank">
          ntumods.com
        </Link>{" "}
        (the &quot;Service&quot;). NTU Mods is a free, open-source timetable
        planning tool for NTU students. We do not sell your data, and we do not
        require an account to use the Service.
      </p>

      <h2 className="my-2 text-xl">What We Collect</h2>

      <h3 className="mt-4 text-lg">Data Stored Locally on Your Device</h3>

      <p>
        Your timetable selections, academic year/semester preferences, and
        display settings are saved in your browser&apos;s{" "}
        <strong>localStorage</strong>. This data never leaves your device and is
        not transmitted to our servers. You can clear it at any time by clearing
        your browser&apos;s site data.
      </p>

      <h3 className="mt-4 text-lg">Analytics</h3>

      <p>
        We use third-party analytics services in production to understand how
        the Service is used and to improve it. These services may collect:
      </p>

      <ul className="list-outside list-disc pl-10">
        <li>
          <strong>Google Analytics 4</strong> — collects page views, general
          usage patterns, browser type, device type, and approximate location
          derived from your IP address. Data is processed by Google. See{" "}
          <Link
            href="https://policies.google.com/privacy"
            rel="external nofollow noopener"
            target="_blank">
            Google&apos;s Privacy Policy
          </Link>
          .
        </li>
        <li>
          <strong>Microsoft Clarity</strong> — records session replays,
          heatmaps, and click patterns to help us understand how users interact
          with the interface. Data is processed by Microsoft. See{" "}
          <Link
            href="https://privacy.microsoft.com/en-us/privacystatement"
            rel="external nofollow noopener"
            target="_blank">
            Microsoft&apos;s Privacy Statement
          </Link>
          .
        </li>
        <li>
          <strong>PostHog</strong> — collects page views, custom events (e.g.
          timetable interactions), and error reports to help us identify issues
          and improve the Service. Data is processed by PostHog, Inc. See{" "}
          <Link
            href="https://posthog.com/privacy"
            rel="external nofollow noopener"
            target="_blank">
            PostHog&apos;s Privacy Policy
          </Link>
          .
        </li>
      </ul>

      <p>
        Analytics are only active on the production site. They are not collected
        during local development.
      </p>

      <h3 className="mt-4 text-lg">Feedback Submissions</h3>

      <p>
        The Settings page includes an optional feedback form. If you submit
        feedback, we collect:
      </p>

      <ul className="list-outside list-disc pl-10">
        <li>Your feedback message (required)</li>
        <li>
          Your email address (optional — only if you choose to provide it)
        </li>
      </ul>

      <p>
        This data is stored in a Vercel Postgres database hosted in the United
        States. It is used solely to read and act on your feedback. We do not
        use it for marketing or share it with third parties.
      </p>

      <h3 className="mt-4 text-lg">Usage Data</h3>

      <p>
        Like most web services, our hosting provider (Vercel) may automatically
        collect standard server logs, including IP addresses and request
        metadata, for operational and security purposes.
      </p>

      <h2 className="my-2 text-xl">How We Use Your Information</h2>

      <ul className="list-outside list-disc pl-10">
        <li>
          <strong>To operate and improve the Service</strong> — analytics data
          helps us understand which features are used, identify issues, and
          prioritise improvements.
        </li>
        <li>
          <strong>To respond to feedback</strong> — if you provide an email
          address with your feedback, we may reply to it.
        </li>
        <li>
          <strong>To ensure security and reliability</strong> — server logs may
          be used to detect and investigate abuse or errors.
        </li>
      </ul>

      <p>
        We do not use your data for advertising, and we do not sell or share
        your personal information with third parties for their own marketing
        purposes.
      </p>

      <h2 className="my-2 text-xl">Cookies</h2>

      <p>
        We do not set our own cookies. However, Google Analytics, Microsoft
        Clarity, and PostHog may set cookies on your device to distinguish users
        and sessions. You can disable these through your browser settings or by
        using a browser extension that blocks analytics trackers.
      </p>

      <h2 className="my-2 text-xl">Data Retention</h2>

      <ul className="list-outside list-disc pl-10">
        <li>
          <strong>LocalStorage data</strong> — retained in your browser until
          you clear site data or uninstall the browser.
        </li>
        <li>
          <strong>Feedback submissions</strong> — retained until we have
          processed and acted on them, or upon your request to delete them.
        </li>
        <li>
          <strong>Analytics data</strong> — retained according to the respective
          retention policies of Google Analytics, Microsoft Clarity, and
          PostHog.
        </li>
      </ul>

      <h2 className="my-2 text-xl">Your Rights</h2>

      <p>
        You may request deletion of any feedback you have submitted by
        contacting us at the email below. Since timetable and settings data is
        stored only in your browser, you can delete it yourself at any time
        through your browser&apos;s site data settings.
      </p>

      <h2 className="my-2 text-xl">Children&apos;s Privacy</h2>

      <p>
        The Service is intended for university students and is not directed at
        children under the age of 13. We do not knowingly collect personal
        information from anyone under 13.
      </p>

      <h2 className="my-2 text-xl">Links to Other Websites</h2>

      <p>
        The Service may contain links to external websites (e.g. NTU course
        catalogues). We have no control over and assume no responsibility for
        the content or privacy practices of those sites.
      </p>

      <h2 className="my-2 text-xl">Changes to This Policy</h2>

      <p>
        We may update this Privacy Policy from time to time. Changes will be
        reflected by the &quot;Last Updated&quot; date at the top of this page.
        Continued use of the Service after changes are posted constitutes your
        acceptance of the updated policy.
      </p>
    </Container>
  )
}
