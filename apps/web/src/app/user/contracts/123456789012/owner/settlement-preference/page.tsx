import Link from "next/link";
import styles from "../flow.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/5f083197-a8d1-45df-a31c-8e0bf47ea582.png",
  avatar: "https://www.figma.com/api/mcp/asset/34d70df5-527e-4a53-8f17-fcb4cc3b4f31.png",
  selection: "https://www.figma.com/api/mcp/asset/46e4e6c6-16a7-4696-ba6f-8e816219cea7.svg",
  home: "https://www.figma.com/api/mcp/asset/35fc84b9-3408-4d82-8cba-e2818d2c6488.svg",
  contracts: "https://www.figma.com/api/mcp/asset/c02143de-66cc-48cb-b6ff-58f2b85ccfa5.svg",
  payments: "https://www.figma.com/api/mcp/asset/a6a45c59-d3ad-4b64-bbe1-4b6fde87b47a.svg",
  account: "https://www.figma.com/api/mcp/asset/102a2c4a-c72d-4c59-90a3-5162459a9ffc.svg",
} as const;

export default function OwnerSettlementPreferencePage() {
  return (
    <main className={styles.page} data-node-id="150:1685" data-name="Web App / Owner Settlement Preference">
      <section className={styles.mainContent} data-node-id="150:1686">
        <header className={styles.pageHeader} data-node-id="150:1687">
          <div className={styles.breadcrumb} data-node-id="150:1688"><span>قراردادها</span><span>/</span><span>روش دریافت</span></div>
          <div className={styles.titleBlock} data-node-id="150:1692"><span className={styles.badgeOwner}>مالک</span><div className={styles.titleCopy}><h1 data-node-id="150:1697">روش دریافت خود را انتخاب کنید</h1><p data-node-id="150:1698">مشخص کنید دریافتی‌های این قرارداد چگونه برای شما مدیریت و تسویه شوند.</p></div></div>
        </header>

        <div className={styles.columns} data-node-id="150:1699">
          <aside className={styles.sideColumn} data-node-id="150:1700">
            <section className={styles.card} data-node-id="150:1701">
              <h2 data-node-id="150:1702">خلاصه انتخاب</h2><div className={styles.divider} />
              <div className={styles.summaryRows} data-node-id="150:1704"><div className={styles.summaryRow}><strong>سعادت‌آباد</strong><span>قرارداد</span></div><div className={styles.summaryRow}><strong>مالک</strong><span>نقش شما</span></div><div className={styles.summaryRow}><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی</span></div><div className={styles.summaryRow}><strong className={styles.accent}>دریافت ماهانه</strong><span>روش دریافت انتخاب‌شده</span></div></div>
              <div className={styles.divider} />
              <div className={styles.actionBlock} data-node-id="150:1718"><Link href="/user/contracts/123456789012/owner/final-confirmation" className={styles.primaryButton} data-node-id="150:1719">انتخاب و ادامه</Link><Link href="/user/contracts/123456789012/owner" className={styles.linkButton} data-node-id="150:1722">مشاهده قرارداد</Link></div>
            </section>
          </aside>

          <div className={styles.mainColumn} data-node-id="150:1724">
            <section className={styles.card} data-node-id="150:1725"><div className={styles.cardHeader}><span className={styles.badgeWarning}>در انتظار تأیید مالک</span><h2 data-node-id="150:1730">قرارداد مرتبط</h2></div><div className={styles.divider} /><div className={styles.summaryGrid}><div><strong>۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶</strong><span>مدت قرارداد</span></div><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>اجاره ماهانه قرارداد</span></div><div><strong>علی رضایی</strong><span>مستأجر</span></div><div><strong>سعادت‌آباد</strong><span>ملک</span></div></div></section>

            <section className={`${styles.optionCard} ${styles.optionSelected}`} data-node-id="150:1745">
              <div className={styles.optionHeader}><span className={styles.selectionCheck}>✓</span><div className={styles.optionTitle}><strong data-node-id="150:1750">دریافت ماهانه</strong><span className={styles.optionGlyph} /></div></div>
              <p data-node-id="150:1753">مبلغ قابل تسویه هر دوره طبق برنامه قرارداد برای شما پرداخت می‌شود.</p>
              <div className={styles.breakdown}><div className={styles.row}><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی:</span></div><div className={`${styles.row} ${styles.fee}`}><strong>−۱۰۰٬۰۰۰ تومان</strong><span>کارمزد خدمات چارخونه - ۰٫۵٪:</span></div><div className={`${styles.row} ${styles.net}`}><strong>۱۹٬۹۰۰٬۰۰۰ تومان</strong><span>مبلغ خالص قابل تسویه:</span></div></div>
            </section>

            <section className={styles.optionCard} data-node-id="150:1759">
              <div className={styles.optionHeader}><img className={styles.selectionAsset} src={assets.selection} alt="" width={20} height={20} /><div className={styles.optionTitle}><strong data-node-id="150:1763">تجمیع دریافتی در صندوق</strong><span className={styles.optionGlyph} /></div></div>
              <p data-node-id="150:1766">به‌جای دریافت ماهانه، مبالغ واجد شرایط در صندوق باقی می‌مانند و طبق شرایط صندوق امکان بهره‌مندی از بازده ایجاد می‌شود.</p>
              <div className={styles.breakdown}><div className={styles.row}><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی:</span></div><div className={`${styles.row} ${styles.fee}`}><strong>−۱۰۰٬۰۰۰ تومان</strong><span>کارمزد خدمات چارخونه - ۰٫۵٪:</span></div><div className={styles.row}><strong>۱۹٬۹۰۰٬۰۰۰ تومان</strong><span>مبلغ خالص قابل تجمیع:</span></div></div>
            </section>

            <section className={styles.card} data-node-id="150:1772"><h2 data-node-id="150:1773">مقایسه روش‌ها</h2><div className={styles.compareTable} data-node-id="150:1774"><div className={`${styles.tableRow} ${styles.tableHeader}`}><span>تجمیع در صندوق</span><span>دریافت ماهانه</span><span>ویژگی</span></div><div className={styles.tableRow}><span className={styles.muted}>خیر</span><span className={styles.good}>بله</span><span>دسترسی ماهانه به مبلغ</span></div><div className={styles.tableRow}><span className={styles.good}>بله</span><span className={styles.muted}>خیر</span><span>تجمیع مبالغ</span></div><div className={styles.tableRow}><span className={styles.accent}>بله، طبق شرایط صندوق</span><span className={styles.muted}>خیر</span><span>امکان بهره‌مندی از بازده صندوق</span></div></div></section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="150:1794" />
    </main>
  );
}
