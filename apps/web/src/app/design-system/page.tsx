import { LeaseRegistrationPanel } from "../../components/ui/LeaseRegistrationPanel";

const brandColors = [
  { name: "Brand Primary", value: "#0D3B36" },
  { name: "Brand Accent", value: "#FF8A00" },
  { name: "Page Background", value: "#F3F5F4" },
  { name: "White Surface", value: "#FFFFFF" },
  { name: "Border", value: "#E5E7E6" },
  { name: "Muted", value: "#9CA3AF" },
  { name: "Primary Text", value: "#1F2937" },
];

const semanticColors = [
  { name: "Action / Primary", value: "#0D3B36" },
  { name: "Action / Accent", value: "#FF8A00" },
  { name: "Background / Page", value: "#F3F5F4" },
  { name: "Background / Surface", value: "#FFFFFF" },
  { name: "Text / Primary", value: "#1F2937" },
  { name: "Text / Muted", value: "#9CA3AF" },
  { name: "Border / Default", value: "#E5E7E6" },
];

const typography = [
  { sample: "عنوان نمایشی", className: "ch-type-display", meta: "Display — ۳۲px / Bold" },
  { sample: "عنوان اصلی", className: "ch-type-h1", meta: "H1 — ۲۸px / Bold" },
  { sample: "عنوان فرعی", className: "ch-type-h2", meta: "H2 — ۲۴px / Semi Bold" },
  { sample: "عنوان سوم", className: "ch-type-h3", meta: "H3 — ۲۰px / Semi Bold" },
  { sample: "متن بزرگ‌تر", className: "ch-type-body-lg", meta: "Body Large — ۱۶px / Regular" },
  { sample: "متن عادی", className: "ch-type-body", meta: "Body — ۱۴px / Regular" },
  { sample: "برچسب", className: "ch-type-label", meta: "Label — ۱۴px / Medium" },
  { sample: "زیرنویس", className: "ch-type-caption", meta: "Caption — ۱۲px / Regular" },
];

const spacing = [4, 8, 12, 16, 24, 32, 48];
const radii = [8, 12, 16, 24];

function SwatchGrid({ colors }: { colors: Array<{ name: string; value: string }> }) {
  return (
    <div className="ch-swatch-grid">
      {colors.map((color) => (
        <div className="ch-swatch" key={color.name}>
          <div className="ch-swatch__color" style={{ backgroundColor: color.value }} aria-hidden="true" />
          <div className="ch-swatch__meta">
            <span className="ch-swatch__name">{color.name}</span>
            <span className="ch-swatch__value">{color.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="ch-ds-page" data-figma-source="35:35">
      <header className="ch-ds-header" data-node-id="35:36">
        <h1>چارخونه — سیستم طراحی</h1>
        <p>بنیادها و توکن‌های طراحی</p>
      </header>

      <section className="ch-ds-section" data-node-id="35:39">
        <h2>رنگ‌های برند</h2>
        <SwatchGrid colors={brandColors} />
      </section>

      <section className="ch-ds-section" data-node-id="35:77">
        <h2>رنگ‌های معنایی</h2>
        <SwatchGrid colors={semanticColors} />
      </section>

      <section className="ch-ds-section" data-node-id="35:115">
        <h2>تایپوگرافی — Vazirmatn</h2>
        <div className="ch-type-list">
          {typography.map((item) => (
            <div className="ch-type-row" key={item.meta}>
              <p className={`ch-type-row__sample ${item.className}`}>{item.sample}</p>
              <span className="ch-type-row__meta">{item.meta}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ch-ds-section" data-node-id="35:149">
        <h2>فاصله‌گذاری</h2>
        <div className="ch-spacing-row">
          {spacing.map((size) => (
            <div className="ch-spacing-item" key={size}>
              <div className="ch-spacing-box" style={{ width: size, height: size }} aria-hidden="true" />
              <span>{size.toLocaleString("fa-IR")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ch-ds-section" data-node-id="35:173">
        <h2>گوشه‌ها</h2>
        <div className="ch-radius-row">
          {radii.map((radius) => (
            <div className="ch-radius-item" key={radius}>
              <div className="ch-radius-box" style={{ borderRadius: radius }} aria-hidden="true" />
              <span>{radius.toLocaleString("fa-IR")}px</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ch-ds-section" data-node-id="35:188">
        <h2>اندازه کنترل‌ها</h2>
        <ul className="ch-control-notes">
          <li>ارتفاع دکمه پیش‌فرض: ۴۸px</li>
          <li>ارتفاع ورودی پیش‌فرض: ۴۸px</li>
          <li>حاشیه افقی صفحه موبایل: ۱۶–۲۰px</li>
          <li>حاشیه افقی صفحه دسکتاپ: ۲۴–۳۲px</li>
        </ul>
      </section>

      <section className="ch-ds-section" data-node-id="35:195">
        <h2>نمونه طرح‌بندی RTL</h2>
        <div className="ch-ds-rtl-preview">
          <LeaseRegistrationPanel />
        </div>
      </section>
    </main>
  );
}
