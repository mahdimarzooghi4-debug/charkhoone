type BrandLogoProps = {
  className?: string;
  source?: "landing" | "download";
};

const sources = {
  landing: "https://www.figma.com/api/mcp/asset/2158ad7d-bdb2-4d7d-b608-b0cab1dc187a.png",
  download: "https://www.figma.com/api/mcp/asset/f3c9c445-3383-492c-8684-11614924436c.png",
} as const;

export function BrandLogo({ className = "", source = "landing" }: BrandLogoProps) {
  return (
    <img
      className={["ch-brand-logo", className].filter(Boolean).join(" ")}
      src={sources[source]}
      alt="چارخونه"
      width={175}
      height={76}
    />
  );
}
