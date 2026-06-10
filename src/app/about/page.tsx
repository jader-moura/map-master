import type { Metadata } from "next";
import Link from "next/link";
import DocLayout from "@/components/DocLayout";

export const metadata: Metadata = {
  title: "About buildop",
  description:
    "buildop is a free Guild Wars 2 companion: interactive Tyria map, world boss and event timers, gathering map and live Trading Post prices. Built by a fan, powered by the official GW2 API.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <DocLayout title="About buildop" updated="8 June 2026">
      <p>
        buildop is a free companion toolkit for Guild Wars 2, built to make everyday play a little
        smoother. It brings together the tools players reach for most, all in one fast, dark-themed
        interface.
      </p>

      <h2>What you can do here</h2>
      <ul>
        <li>
          <Link href="/">Interactive Tyria map</Link> with waypoints, vistas, points of interest,
          renown hearts, hero challenges and portals.
        </li>
        <li>
          <Link href="/gw2-world-boss-timer">World boss timer</Link> with live countdowns and
          spawn alerts.
        </li>
        <li>
          <Link href="/gw2-event-timer">Event timer</Link>, a live meta-event timeline across every
          expansion.
        </li>
        <li>
          <Link href="/gw2-gathering-map">Gathering map</Link> that shows where to farm each
          material by zone level.
        </li>
        <li>
          <Link href="/gw2-trading-post">Trading Post prices</Link>, including the live gem
          exchange rate and key items.
        </li>
      </ul>

      <h2>Where the data comes from</h2>
      <p>
        Game data, item icons and map tiles are sourced from the official{" "}
        <a href="https://api.guildwars2.com" target="_blank" rel="noopener noreferrer">
          Guild Wars 2 API
        </a>{" "}
        (api.guildwars2.com) and ArenaNet&apos;s official servers, refreshed regularly. See our{" "}
        <Link href="/terms">Terms</Link> for the full attribution notice.
      </p>

      <h2>Who makes it</h2>
      <p>
        buildop is an independent project built and maintained by a Guild Wars 2 fan. Got feedback,
        a bug, or a data correction? Head to the <Link href="/contact">contact page</Link>,
        we&apos;d love to hear from you.
      </p>

      <h2>Not affiliated with ArenaNet</h2>
      <p>
        buildop is a fan-made project and is not affiliated with or endorsed by ArenaNet. Guild
        Wars 2 and all related logos and names are trademarks of ArenaNet, LLC.
      </p>
    </DocLayout>
  );
}
