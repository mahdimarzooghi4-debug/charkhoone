type BrandLogoProps = {
  className?: string;
  source?: "landing" | "hub" | "footer" | "download" | "download-phone";
};

// Original exported Figma logo variants, bundled locally so temporary MCP
// asset URLs cannot break public web pages after they expire.
const sources = {
  landing: "/brand/landing-header.png",
  hub: "/brand/landing-hub.png",
  footer: "/brand/landing-footer.png",
  download: "/brand/download-header.png",
  "download-phone": "/brand/download-phone.png",
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
