import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { PreviewAction } from "@/components/user/PreviewAction";

const assets = { mapPin: "/brand/footer-map.svg", fileText: "/brand/dashboard-quick-file.svg" } as const;

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
  href: string;
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
        <Link href={href} className={styles.primaryAction}>{action}</Link>
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
          <PreviewAction className={styles.notificationButton} label="اعلان‌ها" title="اعلان‌های حساب" message="اعلان‌های نمونه در بخش اقدام‌های موردنیاز خانه نمایش داده می‌شوند. اعلان واقعی تا زمان اتصال حساب و سرویس پیام‌رسانی دریافت نمی‌شود."><span aria-hidden="true">🔔</span></PreviewAction>
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
            footerText="دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان"
            action="مشاهده قرارداد (نمونه)"
            href="/user/contracts/demo/pounak"
          />
          <PropertyCard
            nodeId="173:449"
            title="ونک"
            role="مالک"
            status="در حال تکمیل فرایند"
            address="تهران، ونک، خیابان نمونه"
            contractStatus="در انتظار تکمیل فرایند قرارداد"
            action="مشاهده وضعیت قرارداد (نمونه)"
            href="/user/contracts/demo/vanak"
          />
        </section>

      </section>

      <UserPanelSidebar nodeId="142:2138" name="Right Sidebar" />
    </main>
  );
}
