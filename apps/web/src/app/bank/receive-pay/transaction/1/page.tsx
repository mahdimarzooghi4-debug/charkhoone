import Link from "next/link";
import BankReceivePayPage from "../../page";
import styles from "./page.module.css";

const transactionRows = [
  ["شناسه تراکنش", "TXN-۹۸۴۵۱۲"],
  ["تاریخ پرداخت", "۱۴۰۵/۰۳/۰۱"],
  ["ساعت پرداخت", "۰۹:۱۵"],
  ["کانال انتقال", "سیستمی (API)"],
  ["نتیجه تراکنش", "موفق"],
] as const;

export default function BankTransactionDetailPage() {
  return (
    <div className={styles.wrap} data-node-id="294:160" data-name="Bank / Transaction Detail">
      <BankReceivePayPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <header className={styles.header}>
          <Link href="/bank/receive-pay" className={styles.closeIcon} aria-label="بستن">×</Link>
          <div className={styles.titleGroup}><span className={styles.status}>انجام‌شده</span><h1 id="transaction-title">جزئیات تراکنش</h1></div>
        </header>
        <div className={styles.body}>
          <section className={styles.summary}><div className={styles.row}><span className={styles.amount}>۵۰۰٬۰۰۰٬۰۰۰ تومان</span><label>مبلغ تراکنش</label></div><div className={styles.divider} /><div className={styles.row}><span>تأمین اصل تسهیلات</span><label>نوع عملیات</label></div></section>

          <section className={styles.section}><div className={styles.sectionTitle}><h2>مسیر انتقال</h2></div><div className={styles.box}><div className={styles.row}><span>بانک نمونه (شعبه مرکزی)</span><label>مبدأ پرداخت</label></div><div className={styles.arrow}>↓</div><div className={styles.row}><span>حساب کنترل‌شده چارخونه در کارگزاری بانک نمونه</span><label>مقصد واریز</label></div></div></section>

          <section className={styles.section}><div className={styles.sectionTitle}><h2>پرونده مرتبط</h2></div><div className={styles.box}><div className={styles.row}><span>۱۴۰۵-۸۳۲۱</span><label>شماره پرونده</label></div><div className={styles.divider} /><div className={styles.row}><span>محمد رضایی</span><label>متقاضی</label></div><div className={styles.divider} /><div className={styles.row}><span>طرح مسکن ویژه</span><label>طرح تسهیلات</label></div><div className={styles.divider} /><Link href="/bank/receive-pay/case/1" className={styles.caseLink}>مشاهده پرونده مالی</Link></div></section>

          <section className={styles.section}><div className={styles.sectionTitle}><h2>اطلاعات تراکنش</h2></div><div className={styles.box}>{transactionRows.map(([label,value],index) => <div key={label}>{index > 0 ? <div className={styles.divider} /> : null}<div className={styles.row}><span>{value}</span><label>{label}</label></div></div>)}</div></section>

          <section className={styles.section}><div className={styles.sectionTitle}><h2>نتیجه پردازش</h2></div><div className={styles.successBox}><div className={styles.successTop}><span>تراکنش با موفقیت انجام شد</span><span>✓</span></div><p>نتیجه تراکنش به‌صورت خودکار از سرویس بانکی / کارگزاری دریافت شده است.</p></div></section>
        </div>
        <footer className={styles.footer}><Link href="/bank/receive-pay" className={styles.closeButton}>بستن</Link></footer>
      </aside>
    </div>
  );
}
