import type { Metadata } from "next";
import Link from "next/link";
import DocLayout from "@/components/DocLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using buildop, a free Guild Wars 2 companion provided as is, with no warranty and no affiliation with ArenaNet.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <DocLayout title="Terms of Service" updated="8 June 2026">
      <p>
        By using buildop you agree to these terms. They are intentionally short and plain, this is
        a free fan tool, not a commercial service.
      </p>

      <h2>Use of the service</h2>
      <p>
        buildop is free to use for personal, non-commercial purposes. You may not attempt to
        disrupt the service, scrape it at a scale that degrades it for others, or pass it off as
        your own.
      </p>

      <h2>Provided &quot;as is&quot;</h2>
      <p>
        The site is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of
        any kind. Game data such as boss timers, gathering tiers and Trading Post prices can be
        delayed, incomplete or inaccurate, and the game itself changes over time. Always confirm
        in-game before making decisions, and do not rely on buildop as your only source.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, buildop and its maintainer are not liable for any
        loss or damage arising from your use of, or inability to use, the site, including any
        in-game decisions made based on its information.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We may change, pause or discontinue any part of the service at any time without notice. We
        may also update these terms; continued use after a change means you accept the updated
        terms.
      </p>

      <h2>Not affiliated with ArenaNet</h2>
      <p>
        buildop is a fan-made project and is not affiliated with or endorsed by ArenaNet. Guild
        Wars 2 and all related logos and names are trademarks of ArenaNet, LLC. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> for how data is handled.
      </p>
    </DocLayout>
  );
}
