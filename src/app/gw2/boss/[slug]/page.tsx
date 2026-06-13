import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import BossCountdown from "@/components/BossCountdown";
import BossNextSpawns from "@/components/BossNextSpawns";
import CopyWaypoint from "@/components/CopyWaypoint";
import VendorMapView from "@/components/VendorMapView";
import { ItemCard } from "@/components/ItemCard";
import { BOSSES, BOSS_WAYPOINTS, BOSS_LEVELS, type Boss } from "@/lib/gw2/bosses";
import { BOSS_DETAILS } from "@/lib/gw2/bossDetails";
import { achievementsByIds, itemsByNames, type DbItem } from "@/lib/gw2/itemsDb";
import { itemSlug } from "@/lib/gw2/items";

const SITE_URL = "https://buildop.app";

// World boss schedule is static, so prebuild every boss page (there are ~13).
export const revalidate = 86400;

export function generateStaticParams() {
  return BOSSES.map((b) => ({ slug: b.id }));
}

function findBoss(slug: string): Boss | undefined {
  return BOSSES.find((b) => b.id === slug);
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const boss = findBoss(slug);
  if (!boss) return { title: "World boss not found" };

  const title = `${boss.name} Timer | Next Spawn, Location & Waypoint`;
  const description = `Live countdown to the next ${boss.name} spawn in Guild Wars 2. Spawns at ${boss.times.join(", ")} UTC in ${boss.zone} (${boss.area}). Waypoint chat code, map location and full daily schedule.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/gw2/boss/${boss.id}` },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: `${SITE_URL}/gw2/boss/${boss.id}`,
      images: [boss.image],
    },
  };
}

export default async function BossPage({ params }: Params) {
  const { slug } = await params;
  const boss = findBoss(slug);
  if (!boss) notFound();

  const waypoint = BOSS_WAYPOINTS[boss.id];
  const level = BOSS_LEVELS[boss.id];
  const kind = boss.hardcore ? "Hardcore meta boss" : "World boss";
  const mapLocations = [{ area: boss.area, zone: boss.zone, coord: boss.coord }];

  const detail = BOSS_DETAILS[boss.id];
  const [dropRows, achievements] = await Promise.all([
    detail?.drops.length ? itemsByNames(detail.drops).catch(() => [] as DbItem[]) : Promise.resolve([] as DbItem[]),
    detail?.achievements.length ? achievementsByIds(detail.achievements).catch(() => []) : Promise.resolve([]),
  ]);
  // Preserve the curated order and drop any names not found in the DB.
  const dropByName = new Map(dropRows.map((i) => [i.name, i]));
  const drops = (detail?.drops ?? [])
    .map((n) => dropByName.get(n))
    .filter((i): i is DbItem => Boolean(i));

  const otherBosses = BOSSES.filter((b) => b.id !== boss.id);

  return (
    <PageShell
      title={`${boss.name} Timer`}
      seo={{
        heading: `${boss.name} Timer`,
        intro: (
          <>
            <p>
              {boss.name} is a {kind.toLowerCase()} in Guild Wars 2 that spawns in {boss.zone} (
              {boss.area}). It runs on a fixed daily schedule, so this page counts down to the next
              spawn in your local time and gives you the nearest waypoint chat code to get there.
            </p>
            <p>
              Daily spawn times (UTC): {boss.times.join(", ")}. The encounter stays active for about{" "}
              {boss.durationMin} minutes after it begins.
            </p>
          </>
        ),
        faqs: [
          {
            q: `When does ${boss.name} spawn in GW2?`,
            a: `${boss.name} spawns at ${boss.times.join(", ")} UTC every day in ${boss.zone}. The countdown on this page converts the next spawn to your local time.`,
          },
          {
            q: `Where is ${boss.name} located?`,
            a: `${boss.name} is found at ${boss.area} in ${boss.zone}. Use the copy waypoint button to paste the nearest waypoint into the in-game chat and travel straight there.`,
          },
          {
            q: `Is ${boss.name} a hardcore meta boss?`,
            a: boss.hardcore
              ? `Yes. ${boss.name} is a hardcore meta boss that needs an organised squad and rewards bonus chests, so join a populated map a few minutes early.`
              : `No. ${boss.name} is a standard world boss, a quick open-tag event you can join solo on any active map.`,
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "World Boss Timer", path: "/gw2-world-boss-timer" },
          { name: boss.name, path: `/gw2/boss/${boss.id}` },
        ],
      }}
      headerRight={
        <Link href="/gw2-world-boss-timer" className="text-sm text-white/55 transition hover:text-white">
          All bosses
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <Link href="/gw2-world-boss-timer" className="transition hover:text-orange-400">World Boss Timer</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">{boss.name}</span>
        </nav>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={boss.image}
            alt={boss.name}
            width={200}
            height={120}
            className="h-[120px] w-[200px] shrink-0 rounded-xl border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              {[kind, level ? `Level ${level}` : null].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-1 text-3xl font-bold">{boss.name} Timer</h1>
            <p className="mt-2 text-sm text-white/55">
              {boss.zone} · {boss.area}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <BossCountdown boss={boss} />
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
              href={`/gw2-world-boss-timer?boss=${boss.id}`}
              className="mt-4 inline-block text-sm text-orange-400 transition hover:underline"
            >
              Open the live map & full timer →
            </Link>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">Next spawns</h2>
            <span className="text-xs text-white/40">Your local time</span>
          </div>
          <BossNextSpawns times={boss.times} />
        </section>

        {drops.length > 0 && (
          <section className="mt-9">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white">Notable drops</h2>
              <span className="text-xs text-white/40">Open any item for its live price</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {drops.map((it) => (
                <ItemCard key={it.id} id={it.id} name={it.name} icon={it.icon ?? undefined} rarity={it.rarity ?? undefined} />
              ))}
            </div>
            <p className="mt-2 text-xs text-white/40">
              Plus the daily bonus chest (a guaranteed rare or exotic) and a ground chest with Dragonite Ore.
            </p>
          </section>
        )}

        {achievements.length > 0 && (
          <section className="mt-9">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white">Achievements</h2>
              <span className="text-xs text-white/40">{achievements.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <Link
                  key={a.id}
                  href={`/gw2/achievement/${itemSlug(a.id, a.name)}`}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 transition hover:border-orange-400/40 hover:text-white"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {(detail?.howToStart || detail?.tips) && (
          <section className="mt-9">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white">How to start &amp; tips</h2>
            </div>
            {detail.howToStart && (
              <p className="text-[15px] leading-relaxed text-white/70">{detail.howToStart}</p>
            )}
            {detail.tips && (
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                <span className="font-medium text-white/80">Tip: </span>
                {detail.tips}
              </p>
            )}
          </section>
        )}

        <section className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">Location</h2>
            <span className="text-xs text-white/40">{boss.zone}</span>
          </div>
          <VendorMapView locations={mapLocations} />
        </section>

        <section className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">Daily spawn schedule</h2>
            <span className="text-xs text-white/40">All times UTC</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {boss.times.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm tabular-nums text-white/75"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-white/45">
            {boss.name} is active for about {boss.durationMin} minutes after each spawn. See the{" "}
            <Link href="/gw2-world-boss-timer" className="text-orange-400 hover:underline">
              full world boss timer
            </Link>{" "}
            for every boss at once, with live countdowns and map.
          </p>
        </section>

        <section className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">More world boss timers</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherBosses.map((b) => (
              <Link
                key={b.id}
                href={`/gw2/boss/${b.id}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 transition hover:border-orange-400/40 hover:text-white"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          World boss schedule from the Guild Wars 2 Wiki; map tiles from the official Guild Wars 2 API.
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}
