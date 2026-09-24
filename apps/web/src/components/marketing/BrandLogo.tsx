type BrandLogoProps = {
  className?: string;
  source?: "landing" | "hub" | "footer" | "login" | "download" | "download-phone";
};

const sources = {
  landing: { src: "/brand/dashboard-logo.png", width: 220, height: 95 },
  hub: { src: "/brand/landing-hub.png", width: 152, height: 66 },
  footer: { src: "/brand/landing-footer.png", width: 175, height: 76 },
  login: { src: "/brand/dashboard-logo.png", width: 220, height: 95 },
  download: { src: "/brand/dashboard-logo.png", width: 220, height: 95 },
  "download-phone": { src: "/brand/landing-header.png", width: 88, height: 38 },
} as const;

export function BrandLogo({ className = "", source = "landing" }: BrandLogoProps) {
  const logo = sources[source];

  return (
    <img
      className={["ch-brand-logo", className].filter(Boolean).join(" ")}
      src={logo.src}
      alt="چارخونه"
      width={logo.width}
      height={logo.height}
      loading="eager"
    />
  );
}
