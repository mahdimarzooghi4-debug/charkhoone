"use client";

import { useState } from "react";
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

type ReceiptMethod = "monthly" | "fund";

export default function OwnerSettlementPreferencePage() {
  const [method, setMethod] = useState<ReceiptMethod>("monthly");
  const isMonthly = method === "monthly";

  return (
    <main className={`${styles.page} ${styles.ownerSettlementChoice}`} data-node-id="150:1685" data-name="Web App / Owner Settlement Preference">
      <section className={styles.mainContent} data-node-id="150:1686">
        <header className={styles.pageHeader} data-node-id="150:1687">
          <div className={styles.breadcrumb} data-node-id="150:1688"><span>قراردادها</span><span>/</span><span>روش دریافت</span></div>
          <div className={styles.titleBlock} data-node-id="150:1692"><span className={styles.badgeOwner}>مالک</span><div className={styles.titleCopy}><h1 data-node-id="150:1697">روش دریافت خود را انتخاب کنید</h1><p data-node-id="150:1698">در این پیش‌نمایش، روش دریافت فرضی مالک را انتخاب کنید؛ مبلغ دریافتی مالک بر پایه رهن کامل معادل قرارداد و نسبت ۳٪ محاسبه می‌شود، نه بر پایه سود وام مستأجر. هیچ تسویه یا صندوق واقعی فعال نیست.</p></div></div>
        </header>

        <div className={styles.columns} data-node-id="150:1699">
          <aside className={styles.sideColumn} data-node-id="150:1700">
            <section className={styles.card} data-node-id="150:1701">
              <h2 data-node-id="150:1702">خلاصه انتخاب</h2><div className={styles.divider} />
              <div className={styles.summaryRows} data-node-id="150:1704"><div className={styles.summaryRow}><strong>سعادت‌آباد</strong><span>قرارداد</span></div><div className={styles.summaryRow}><strong>مالک</strong><span>نقش شما</span></div><div className={styles.summaryRow}><strong>۳۵٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی</span></div><div className={styles.summaryRow}><strong className={styles.accent}>{isMonthly ? "دریافت ماهانه" : "تجمیع دریافتی در صندوق"}</strong><span>روش دریافت انتخاب‌شده</span></div></div>
              <div className={styles.divider} />
              <div className={styles.actionBlock} data-node-id="150:1718"><Link href={`/user/contracts/123456789012/owner/final-confirmation?method=${method}`} className={styles.primaryButton} data-node-id="150:1719">انتخاب و ادامه</Link><Link href={`/user/contracts/123456789012/owner?method=${method}`} className={styles.linkButton} data-node-id="150:1722">مشاهده قرارداد</Link></div>
            </section>
          </aside>

          <div className={styles.mainColumn} data-node-id="150:1724">
            <section className={styles.card} data-node-id="150:1725"><div className={styles.cardHeader}><span className={styles.badgeWarning}>در انتظار تأیید مالک</span><h2 data-node-id="150:1730">قرارداد مرتبط</h2></div><div className={styles.divider} /><div className={styles.summaryGrid}><div><strong>۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶</strong><span>مدت قرارداد</span></div><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>اجاره ماهانه قرارداد</span></div><div><strong>علی رضایی</strong><span>مستأجر</span></div><div><strong>سعادت‌آباد</strong><span>ملک</span></div></div></section>

            <button type="button" aria-pressed={isMonthly} onClick={() => setMethod("monthly")} className={`${styles.optionCard} ${isMonthly ? styles.optionSelected : ""}`} data-node-id="150:1745">
              <div className={styles.optionHeader}><span className={isMonthly ? styles.selectionCheck : styles.selectionUnselected} aria-hidden="true">{isMonthly ? "✓" : ""}</span><div className={styles.optionTitle}><strong data-node-id="150:1750">دریافت ماهانه</strong><span className={styles.optionGlyph} /></div></div>
              <p data-node-id="150:1753">در نمونه، رهن کامل معادل ۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان با نسبت ۳٪ به دریافتی ناخالص ماهانه ۳۵٬۰۰۰٬۰۰۰ تومان تبدیل می‌شود؛ پرداخت واقعی یا تضمینی نیست.</p>
              <div className={styles.breakdown}><div className={styles.row}><strong>۳۵٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی:</span></div><div className={`${styles.row} ${styles.fee}`}><strong>−۱۷۵٬۰۰۰ تومان</strong><span>کارمزد خدمات چارخونه - ۰٫۵٪:</span></div><div className={`${styles.row} ${styles.net}`}><strong>۳۴٬۸۲۵٬۰۰۰ تومان</strong><span>مبلغ خالص قابل تسویه:</span></div></div>
            </button>

            <button type="button" aria-pressed={!isMonthly} onClick={() => setMethod("fund")} className={`${styles.optionCard} ${!isMonthly ? styles.optionSelected : ""}`} data-node-id="150:1759">
              <div className={styles.optionHeader}><span className={!isMonthly ? styles.selectionCheck : styles.selectionUnselected} aria-hidden="true">{!isMonthly ? "✓" : ""}</span><div className={styles.optionTitle}><strong data-node-id="150:1763">تجمیع دریافتی در صندوق</strong><span className={styles.optionGlyph} /></div></div>
              <p data-node-id="150:1766">در این نمونه، به‌جای دریافت ماهانه، مبلغ خالص محاسبه‌شده از رهن کامل معادل در صندوق تجمیع می‌شود؛ نرخ بازده و شرایط صندوق نهایی یا عملیاتی نیست.</p>
              <div className={styles.breakdown}><div className={styles.row}><strong>۳۵٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ ناخالص دریافتی:</span></div><div className={`${styles.row} ${styles.fee}`}><strong>−۱۷۵٬۰۰۰ تومان</strong><span>کارمزد خدمات چارخونه - ۰٫۵٪:</span></div><div className={styles.row}><strong>۳۴٬۸۲۵٬۰۰۰ تومان</strong><span>مبلغ خالص قابل تجمیع:</span></div></div>
            </button>

            <section className={styles.card} data-node-id="150:1772"><h2 data-node-id="150:1773">مقایسه روش‌ها</h2><div className={styles.compareTable} data-node-id="150:1774"><div className={`${styles.tableRow} ${styles.tableHeader}`}><span>تجمیع در صندوق</span><span>دریافت ماهانه</span><span>ویژگی</span></div><div className={styles.tableRow}><span className={styles.muted}>خیر</span><span className={styles.good}>بله</span><span>دسترسی ماهانه به مبلغ</span></div><div className={styles.tableRow}><span className={styles.good}>بله</span><span className={styles.muted}>خیر</span><span>تجمیع مبالغ</span></div><div className={styles.tableRow}><span className={styles.accent}>بله، طبق شرایط صندوق</span><span className={styles.muted}>خیر</span><span>امکان بهره‌مندی از بازده صندوق</span></div></div></section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="150:1794" />
    </main>
  );
}
