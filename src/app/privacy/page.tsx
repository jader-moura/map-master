import type { Metadata } from "next";
import Link from "next/link";
import DocLayout from "@/components/DocLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How buildop handles data: privacy-friendly analytics, browser local storage for your preferences, and no accounts or personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <DocLayout title="Privacy Policy" updated="8 June 2026">
      <p>
        buildop is a free, fan-made Guild Wars 2 companion. We keep it simple: there are no
        user accounts, and we do not collect or sell personal information. This page explains
        what little data is involved when you use the site.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Usage &amp; performance analytics.</strong> We use Vercel Analytics and Vercel
          Speed Insights to understand aggregate traffic (page views, referrers) and page
          performance. These are privacy-friendly and do not use tracking cookies or build
          advertising profiles of you.
        </li>
        <li>
          <strong>Browser local storage.</strong> Your preferences, such as favourite bosses and
          which map layers are visible, are stored locally in your browser under keys prefixed
          with <strong>buildop:</strong>. This data stays on your device and is never sent to us.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>No names, email addresses or accounts.</li>
        <li>No Guild Wars 2 account data or API keys.</li>
        <li>No advertising or cross-site tracking cookies.</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        The site is hosted on Vercel, which may process standard request data (such as your IP
        address) to deliver and secure the site. To show the map and icons, your browser loads
        content directly from official Guild Wars 2 servers
        (tiles.guildwars2.com, render.guildwars2.com, wiki.guildwars2.com) and game data from the
        Guild Wars 2 API. As with any website, those servers receive your IP address when your
        browser requests files from them.
      </p>

      <h2>Cookies</h2>
      <p>
        buildop does not set advertising cookies. Our analytics are cookieless. If we ever add
        advertising or cookie-based features, we will update this policy first.
      </p>

      <h2>Your rights</h2>
      <p>
        Because we do not store personal data tied to your identity, there is little to access or
        delete on our side. You can clear the local preferences at any time by clearing your
        browser&apos;s site data. For any privacy question, reach us at{" "}
        <a href="mailto:contact@buildop.app">contact@buildop.app</a>.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the site evolves. The &quot;last updated&quot; date above
        reflects the latest version. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </DocLayout>
  );
}
