import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import MetaCountdown from "@/components/MetaCountdown";
import CopyWaypoint from "@/components/CopyWaypoint";
import VendorMapView from "@/components/VendorMapView";
import {
  EVENT_LOCATIONS,
  getMainEventNames,
  getMainEventTimes,
  getMainWaypoint,
} from "@/lib/gw2/events";
import { getMetaEvent } from "@/lib/gw2/eventsData";

const SITE_URL = "https://buildop.app";

// Meta schedule comes from the weekly-cached wiki loader, so refresh daily.
export const revalidate = 86400;

export function generateStaticParams() {
  return Object.keys(EVENT_LOCATIONS).map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const loc = EVENT_LOCATIONS[slug];
  if (!loc) return { title: "Meta event not found" };

  const event = await getMetaEvent(slug);
  const names = event ? getMainEventNames(event) : [];
  const title = `${loc.map} Meta Event Timer | Next Spawn & Waypoint`;
  const description = `Live countdown to the next ${loc.map} meta event in Guild Wars 2${
    names.length ? ` (${names.join(", ")})` : ""
  }. Daily schedule, map location and a copy-ready waypoint chat code.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/gw2/meta/${slug}` },
    openGraph: { title, description: description.slice(0, 160), url: `${SITE_URL}/gw2/meta/${slug}` },
  };
}

export default async function MetaPage({ params }: Params) {
  const { slug } = await params;
  const loc = EVENT_LOCATIONS[slug];
  if (!loc) notFound();

  const event = await getMetaEvent(slug);
  const names = event ? getMainEventNames(event) : [];
  const times = event ? getMainEventTimes(event) : [];
  const waypoint = event ? getMainWaypoint(event) : undefined;
  const category = event?.category || "";
  const mapLocations = [{ area: loc.map, zone: category || null, coord: loc.coord }];
  const namesLabel = names.length ? names.join(", ") : "a map-wide meta event";

  return (
    <PageShell
      title={`${loc.map} Meta Timer`}
      seo={{
        heading: `${loc.map} Meta Event Timer`,
        intro: (
          <>
            <p>
              {loc.map} runs {namesLabel} on a fixed daily schedule in Guild Wars 2. This page counts
              down to the next start in your local time and gives you the nearest waypoint chat code
              to get there.
            </p>
            {times.length > 0 && (
              <p>
                Daily start times (UTC): {times.map((t) => t.time).join(", ")}.
              </p>
            )}
          </>
        ),
        faqs: [
          {
            q: `When does the ${loc.map} meta event start?`,
            a: times.length
              ? `The main ${loc.map} meta event starts at ${times.map((t) => t.time).join(", ")} UTC each day. The countdown on this page converts the next start to your local time.`
              : `The ${loc.map} meta event runs on a fixed daily schedule. The live countdown on this page shows the next start in your local time.`,
          },
          {
            q: `Where is the ${loc.map} meta event?`,
            a: `It takes place in ${loc.map}. Use the copy waypoint button to paste the nearest waypoint into the in-game chat and travel straight there.`,
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Event Timers", path: "/gw2-event-timer" },
          { name: loc.map, path: `/gw2/meta/${slug}` },
        ],
      }}
      headerRight={
        <Link href="/gw2-event-timer" className="text-sm text-white/55 transition hover:text-white">
          All events
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <Link href="/gw2-event-timer" className="transition hover:text-orange-400">Event Timers</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">{loc.map}</span>
        </nav>

        <p className="text-xs font-medium uppercase tracking-wide text-white/40">
          {[category, "Meta event"].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{loc.map} Meta Event Timer</h1>
        {names.length > 0 && (
          <p className="mt-2 text-sm text-white/55">Main event{names.length > 1 ? "s" : ""}: {names.join(", ")}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {event ? (
            <MetaCountdown event={event} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-7 text-sm text-white/50">
              The live schedule is temporarily unavailable. See the{" "}
              <Link href="/gw2-event-timer" className="text-orange-400 hover:underline">event timeline</Link>.
            </div>
          )}
          <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-7">
            <p className="text-sm font-medium uppercase tracking-wide text-white/40">Nearest waypoint</p>
            {waypoint ? (
              <div className="mt-2">
                <CopyWaypoint code={waypoint} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/50">Not available.</p>
            )}
            <Link
              href="/gw2-event-timer"
              className="mt-4 inline-block text-sm text-orange-400 transition hover:underline"
            >
              Open the live event timeline →
            </Link>
          </div>
        </div>

        <section className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">Location</h2>
            <span className="text-xs text-white/40">{loc.map}</span>
          </div>
          <VendorMapView locations={mapLocations} />
        </section>

        {times.length > 0 && (
          <section className="mt-9">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white">Daily schedule</h2>
              <span className="text-xs text-white/40">All times UTC</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => (
                <span
                  key={`${t.name}-${t.time}`}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm tabular-nums text-white/75"
                  title={t.name}
                >
                  {t.time}
                </span>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Meta event schedule from the Guild Wars 2 Wiki; map tiles from the official Guild Wars 2 API.
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}
