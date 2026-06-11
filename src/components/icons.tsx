// Shared inline icon set used across the app shell.

export function Icon({
  path,
  className = "h-5 w-5",
  fill = "none",
}: {
  path: string;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

export const P = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  map: "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  info: "M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4M6.1 6.1A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.1-.5",
  chevron: "M6 9l6 6 6-6",
  pin: "M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  star: "M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.8L12 17.3 5.8 20.8l1.6-6.8L2.2 8.9l6.9-.6z",
  close: "M18 6 6 18M6 6l12 12",
  layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  copy: "M9 9h10v10H9zM5 15H4V5h10v1",
  check: "M5 12l5 5L20 6",
  coins: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12",
  clock: "M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  pickaxe: "M4 20l8-8M12 12V6M7 9q5-6 10 0",
  swords:
    "M14.5 17.5 3 6 3 3 6 3 17.5 14.5M13 19 19 13M16 16 20 20M19 21 21 19M14.5 6.5 18 3 21 3 21 6 17.5 9.5M5 14 9 18M7 17 4 20M3 19 5 21",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0",
  shield: "M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z",
  doc: "M6 2h9l4 4v16H6zM15 2v4h4M9 12h6M9 16h6",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  store: "M4 8l1.5-4h13L20 8M4 8h16M5 8v12h14V8M10 20v-6h4v6",
};
