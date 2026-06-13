// Official Black Lion gem icon (GW2 currency #4), used across the gem pages.
const GEM_ICON = "https://render.guildwars2.com/file/220061640ECA41C0577758030357221B4ECCE62C/502065.png";

export function GemIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={GEM_ICON} alt="gems" className={`inline-block shrink-0 ${className}`} />;
}
