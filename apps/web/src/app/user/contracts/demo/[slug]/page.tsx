import Link from "next/link";
import { notFound } from "next/navigation";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import styles from "./page.module.css";
const demos = {
  pounak: { name: "پونک", role: "مالک", status: "فعال", date: "۱ آبان ۱۴۰۶",
    amount: "۱۴٬۹۲۵٬۰۰۰ تومان", label: "دریافتی بعدی" },
  vanak: { name: "ونک", role: "مالک", status: "در حال تکمیل فرایند",
    date: "پس از تأیید طرفین", amount: "در انتظار", label: "وضعیت دریافت" },
  jordan: { name: "جردن", role: "مستأجر", status: "پایان‌یافته",
    date: "۱ فروردین ۱۴۰۵", amount: "تسویه در پیش‌نمایش موجود نیست", label: "وضعیت تسویه" },
} as const;
export default async function SampleContractDetail({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  if (!(slug in demos)) notFound();
  const entry = demos[slug as keyof typeof demos];
  return (
    <main className={styles.page} dir="ltr">
      <section className={styles.content} dir="rtl">
        <header><h1>جزئیات قرارداد {entry.name} (نمونه)</h1>
          <p>این قرارداد فقط دادهٔ نمایشی دارد و به پرونده واقعی، بانک یا خودنویس متصل نیست.</p></header>
        <article className={styles.card}>
          <h2>{entry.name}</h2><dl>
            <div><dt>نقش</dt><dd>{entry.role}</dd></div>
            <div><dt>وضعیت</dt><dd>{entry.status}</dd></div>
            <div><dt>تاریخ مرتبط</dt><dd>{entry.date}</dd></div>
            <div><dt>{entry.label}</dt><dd>{entry.amount}</dd></div>
          </dl>
          <p>اسناد، تأییدها و مانده مالی واقعی این قرارداد نمونه در دسترس نیست.</p>
          <Link href="/user/contracts" className={styles.primary}>بازگشت به قراردادها</Link>
          <Link href="/user/properties" className={styles.secondary}>بازگشت به املاک</Link>
        </article>
      </section><UserPanelSidebar />
    </main>
  );
}
