import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/fbf9d073-8b53-4f56-8f56-3700fe8b8ee2.png",
  avatar: "https://www.figma.com/api/mcp/asset/ef787000-98e4-406e-9491-ccb6dba3ed93.png",
  bell: "https://www.figma.com/api/mcp/asset/f3cf41d0-7c48-41a9-b93e-bdbc0ce5251b.svg",
  mapPin: "https://www.figma.com/api/mcp/asset/ebb0952a-6ef9-46ab-9cab-957a459a8d3e.svg",
  fileText: "https://www.figma.com/api/mcp/asset/9d10ba5a-64b4-4333-8c3b-83e746d256c7.svg",
  emptyMapPin: "https://www.figma.com/api/mcp/asset/fad677e1-b156-49e4-8576-ad93df4186a4.svg",
  home: "https://www.figma.com/api/mcp/asset/843571ef-b8ee-4b03-b45c-05f7280d944c.svg",
  contracts: "https://www.figma.com/api/mcp/asset/1bc0848e-b86d-43df-bb5c-c95c59bc2279.svg",
  payments: "https://www.figma.com/api/mcp/asset/1b9d54c6-974d-4a6f-b3fa-20bb4828984c.svg",
  account: "https://www.figma.com/api/mcp/asset/c72543ac-2aea-473b-9302-ea6c6b2dad7a.svg",
} as const;

type BadgeTone = "active" | "tenant" | "owner" | "progress";

function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

type PropertyCardProps = {
  nodeId: string;
  title: string;
  role: "مستأجر" | "مالک";
  status: "فعال" | "در حال تکمیل فرایند";
  address: string;
  postalCode?: string;
  contractStatus: string;
  footerText?: string;
  action: string;
  href?: string;
};

function PropertyCard({
  nodeId,
  title,
  role,
  status,
  address,
  postalCode,
  contractStatus,
  footerText,
  action,
  href,
}: PropertyCardProps) {
  const roleTone: BadgeTone = role === "مستأجر" ? "tenant" : "owner";
  const statusTone: BadgeTone = status === "فعال" ? "active" : "progress";

  return (
    <article className={styles.propertyCard} data-node-id={nodeId} data-name="Property Card">
      <div className={styles.cardTop}>
        <div className={styles.badges}>
          <Badge tone={statusTone}>{status}</Badge>
          <Badge tone={roleTone}>{role}</Badge>
        </div>
        <h2>{title}</h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.cardBody}>
        <div className={styles.iconRow}>
          <p>{address}</p>
          <span className={styles.smallIcon}><img src={assets.mapPin} alt="" width={12} height={12} /></span>
        </div>
        {postalCode ? <p className={styles.muted}>کد پستی: {postalCode}</p> : null}
        <div className={styles.iconRow}>
          <p className={styles.contractStatus}>{contractStatus}</p>
          <span className={styles.smallIcon}><img src={assets.fileText} alt="" width={12} height={12} /></span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        {href ? (
          <Link href={href} className={styles.primaryAction}>{action}</Link>
        ) : (
          <button type="button" className={styles.primaryAction}>{action}</button>
        )}
        {footerText ? <strong>{footerText}</strong> : <span aria-hidden="true" />}
      </div>
    </article>
  );
}

export default function PropertiesPage() {
  return (
    <main className={styles.page} data-node-id="173:379" data-name="Web App / Properties">
      <section className={styles.mainContent} data-node-id="173:380" data-name="Main Content Area">
        <header className={styles.headerBar} data-node-id="173:381" data-name="Header Bar">
          <button type="button" className={styles.notificationButton} aria-label="اعلان‌ها" data-node-id="173:382">
            <img src={assets.bell} alt="" width={16} height={16} />
          </button>
          <div className={styles.headerRight} data-node-id="173:385">
            <h1 data-node-id="173:386">املاک من</h1>
            <p data-node-id="173:387">خانه / املاک من</p>
          </div>
        </header>

        <p className={styles.supportingText} data-node-id="173:389">املاک مرتبط با قراردادهای شما</p>

        <section className={styles.summaryRow} data-node-id="173:390" data-name="Summary Row">
          <div className={styles.summaryPill} data-node-id="173:391"><strong className={styles.tenantCount}>۱ ملک</strong><span>به‌عنوان مستأجر</span></div>
          <div className={styles.summaryPill} data-node-id="173:394"><strong className={styles.ownerCount}>۲ ملک</strong><span>به‌عنوان مالک</span></div>
          <div className={styles.summaryPill} data-node-id="173:397"><strong className={styles.totalCount}>۳ ملک</strong><span>املاک مرتبط</span></div>
        </section>

        <section className={styles.propertyList} data-node-id="173:400" data-name="Property Cards List">
          <PropertyCard
            nodeId="173:401"
            title="سعادت‌آباد"
            role="مستأجر"
            status="فعال"
            address="تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳"
            postalCode="۱۹۹۸۷۶۵۴۳۲"
            contractStatus="قرارداد فعال تا ۱۵ مهر ۱۴۰۶"
            footerText="پرداخت بعدی: ۱۸٬۵۰۰٬۰۰۰ تومان"
            action="مشاهده قرارداد"
            href="/user/contracts/123456789012"
          />
          <PropertyCard
            nodeId="173:425"
            title="پونک"
            role="مالک"
            status="فعال"
            address="تهران، پونک، خیابان نمونه"
            postalCode="۱۴۷۶۵۴۳۲۱۰"
            contractStatus="قرارداد فعال تا ۱ آبان ۱۴۰۶"
            footerText="دریافتی بعدی: ۱۵٬۰۰۰٬۰۰۰ تومان"
            action="مشاهده قرارداد"
          />
          <PropertyCard
            nodeId="173:449"
            title="ونک"
            role="مالک"
            status="در حال تکمیل فرایند"
            address="تهران، ونک، خیابان نمونه"
            contractStatus="در انتظار تکمیل فرایند قرارداد"
            action="مشاهده وضعیت قرارداد"
          />
        </section>

        <section className={styles.emptyState} data-node-id="173:471" data-name="Inline Empty State">
          <span className={styles.emptyIcon} data-node-id="173:472"><img src={assets.emptyMapPin} alt="" width={20} height={20} /></span>
          <h2 data-node-id="173:475">هنوز ملکی به حساب شما متصل نشده است</h2>
          <p data-node-id="173:476">املاک مرتبط پس از اتصال قراردادهای ثبت‌شده در خودنویس نمایش داده می‌شوند.</p>
          <button type="button" className={styles.outlineAction} data-node-id="173:477">ثبت کد رهگیری</button>
        </section>
      </section>

      <UserPanelSidebar nodeId="142:2138" name="Right Sidebar" />
    </main>
  );
}
