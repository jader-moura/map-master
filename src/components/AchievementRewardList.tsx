"use client";

import { useEffect, useMemo, useState } from "react";
import AchievementRewardCard from "@/components/AchievementRewardCard";
import { matchBoss, getBossStatuses } from "@/lib/gw2/bosses";
import type { RewardAchievement } from "@/lib/gw2/itemsDb";

// Renders the achievement reward cards, ordering world-boss kills by when they
// next become available (active now first, then soonest spawn). Non-boss
// achievements follow, alphabetically. Re-sorts periodically so the order stays
// live. Falls back to the server (name) order until the clock is set, to avoid a
// hydration mismatch.
export default function AchievementRewardList({ achievements }: { achievements: RewardAchievement[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const ordered = useMemo(() => {
    if (!now) return achievements;
    const statuses = getBossStatuses(now);
    const rank = (a: RewardAchievement) => {
      const boss = matchBoss(`${a.name} ${a.requirement ?? ""}`);
      const s = boss ? statuses.find((x) => x.boss.id === boss.id) : undefined;
      if (!s) return { hasBoss: 0, t: Infinity };
      return { hasBoss: 1, t: s.active ? -1 : s.msUntilSpawn };
    };
    return [...achievements].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra.hasBoss !== rb.hasBoss) return rb.hasBoss - ra.hasBoss; // bosses first
      if (ra.hasBoss) return ra.t - rb.t; // active, then soonest spawn
      return a.name.localeCompare(b.name); // non-boss: alphabetical
    });
  }, [achievements, now]);

  return (
    <div className="flex flex-col gap-2">
      {ordered.map((a) => (
        <AchievementRewardCard key={a.id} achievement={a} />
      ))}
    </div>
  );
}
