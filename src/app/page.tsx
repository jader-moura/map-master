import MapMasterApp from "@/components/MapMasterApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
          GW2 MapMaster
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
          World Boss Timer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Live countdowns to every Guild Wars 2 world boss, with the exact zone
          and in-game location shown on the official map. Times update every
          second based on your current moment.
        </p>
      </header>

      <MapMasterApp />

      <footer className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
        Fan project. Guild Wars 2 and all related assets are © ArenaNet, LLC.
        Data from the official{" "}
        <a
          className="underline hover:text-white/70"
          href="https://wiki.guildwars2.com/wiki/API:Main"
          target="_blank"
          rel="noreferrer"
        >
          GW2 API
        </a>{" "}
        and Wiki.
      </footer>
    </main>
  );
}
