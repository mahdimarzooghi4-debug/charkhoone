type BrandLogoProps = {
  className?: string;
  source?: "landing" | "hub" | "footer" | "download" | "download-phone";
};

const sources = {
  landing: "/brand/landing-header.svg",
  hub: "/brand/landing-hub.svg",
  footer: "/brand/landing-footer.svg",
  download: "/brand/landing-header.svg",
  "download-phone": "/brand/landing-header.svg",
} as const;

export function BrandLogo({ className = "", source = "landing" }: BrandLogoProps) {
  return (
    <img
      className={["ch-brand-logo", className].filter(Boolean).join(" ")}
      src={sources[source]}
      alt="چارخونه"
      width={175}
      height={76}
      loading="eager"
    />
  );
}
