import Link from "next/link";

const cases = {
  "1405-8321": { displayId: "۱۴۰۵-۸۳۲۱", owner: "رضا کاظمی", principal: "۶۵۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۶/۱۸", yield: "۱۸٬۴۰۰٬۰۰۰ تومان" },
  "1405-7942": { displayId: "۱۴۰۵-۷۹۴۲", owner: "مریم احمدی", principal: "۴۸۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۶/۲۲", yield: "۱۳٬۱۰۰٬۰۰۰ تومان" },
  "1405-7810": { displayId: "۱۴۰۵-۷۸۱۰", owner: "حسین محمدی", principal: "۷۲۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۰۱", yield: "۱۹٬۶۰۰٬۰۰۰ تومان" },
  "1405-7664": { displayId: "۱۴۰۵-۷۶۶۴", owner: "نرگس کریمی", principal: "۳۹۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۰۵", yield: "۱۰٬۸۰۰٬۰۰۰ تومان" },
  "1405-7519": { displayId: "۱۴۰۵-۷۵۱۹", owner: "امیر حسینی", principal: "۵۶۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۱۲", yield: "—" },
  "1405-6128": { displayId: "۱۴۰۵-۶۱۲۸", owner: "نازنین اکبری", principal: "۵۹۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۱۸", yield: "۱۵٬۹۰۰٬۰۰۰ تومان" },
  "1405-4912": { displayId: "۱۴۰۵-۴۹۱۲", owner: "مهدی حسینی", principal: "۷۸۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۲۱", yield: "۲۱٬۳۰۰٬۰۰۰ تومان" },
  "1405-3874": { displayId: "۱۴۰۵-۳۸۷۴", owner: "لیلا محمدی", principal: "۴۶۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۶/۲۹", yield: "۱۲٬۷۰۰٬۰۰۰ تومان" },
  "1405-2756": { displayId: "۱۴۰۵-۲۷۵۶", owner: "آرش مرادی", principal: "۶۲۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۰۸", yield: "۱۷٬۸۰۰٬۰۰۰ تومان" },
  "1405-1943": { displayId: "۱۴۰۵-۱۹۴۳", owner: "الهام صادقی", principal: "۵۴۰٬۰۰۰٬۰۰۰ تومان", due: "۱۴۰۵/۰۷/۱۵", yield: "—" },
} as const;

type CaseId = keyof typeof cases;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrokerageCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = cases[id as CaseId] ?? cases["1405-8321"];

  return (
    <section className="brokerage-case-detail" data-node-id="368:2" data-name="Brokerage / Financial Case Detail">
      <header className="brokerage-case-detail__header">
        <Link href="/brokerage/cases" className="brokerage-case-detail__back">‹ بازگشت به پرونده‌ها</Link>
        <div>
          <h1>جزئیات پرونده مالی</h1>
          <p>پرونده {item.displayId} — {item.owner}</p>
        </div>
      </header>

      <section className="brokerage-case-summary">
        <div className="brokerage-case-summary__facts">
          <div><span>کل اصل منابع</span><strong>{item.principal}</strong></div>
          <div><span>سررسید بعدی مالک</span><strong>{item.due}</strong></div>
          <div><span>مدل دریافتی مالک</span><strong>ماهانه — سررسید قرارداد</strong></div>
        </div>
        <div className="brokerage-case-summary__identity">
          <div><span className="brokerage-badge brokerage-badge--success">فعال</span><strong>پرونده {item.displayId}</strong></div>
          <p>مالک: {item.owner} • قرارداد ۱۲ ماهه • شروع ۱۴۰۵/۰۲/۱۸</p>
        </div>
      </section>

      <div className="brokerage-case-detail__two-column">
        <section className="brokerage-detail-panel brokerage-detail-panel--resources">
          <div className="brokerage-detail-panel__heading">
            <h2>اصل منابع پرونده</h2>
            <p>منابع در حساب چارخونه نزد کارگزاری نگهداری می‌شوند و به‌صورت دفتری تفکیک شده‌اند.</p>
          </div>
          <div className="brokerage-resource-line">
            <strong>۱۵۰٬۰۰۰٬۰۰۰ تومان</strong>
            <div><b>وجه مستأجر</b><span>دریافت ۱۴۰۵/۰۲/۱۵ • TXN-۹۸۳۲۳۰</span></div>
          </div>
          <div className="brokerage-resource-line">
            <strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong>
            <div><b>اصل تأمین مالی</b><span>منبع: صندوق مسکن نمونه • تسویه ۱۴۰۵/۰۶/۰۱</span></div>
          </div>
          <div className="brokerage-resource-total"><strong>{item.principal}</strong><span>جمع اصل منابع تفکیک‌شده</span></div>
        </section>

        <section className="brokerage-detail-panel">
          <div className="brokerage-detail-panel__heading">
            <h2>برنامه مدیریت تا سررسید مالک</h2>
            <p>مدل دریافتی مالک مشخص می‌کند منابع تا چه تاریخی باید نقدشونده و آماده پرداخت باشند.</p>
          </div>
          <div className="brokerage-schedule-grid">
            <div><span>تسویه صندوق</span><strong>ابتدای ماه — ۱۴۰۵/۰۶/۰۱</strong></div>
            <div><span>سررسید مالک</span><strong>{item.due}</strong></div>
            <div><span>مدت قابل مدیریت این دوره</span><strong>۱۷ روز</strong></div>
            <div><span>وضعیت نقدشوندگی</span><strong>آماده‌سازی طبق سررسید</strong></div>
          </div>
          <p className="brokerage-schedule-note">منابع این پرونده تا سررسید مالک مدیریت می‌شوند؛ پرداخت مالک در تاریخ قرارداد انجام می‌شود، نه ابتدای ماه.</p>
        </section>
      </div>

      <section className="brokerage-detail-panel brokerage-yield-panel">
        <div className="brokerage-detail-panel__heading">
          <h2>سود ایجادشده برای این پرونده</h2>
          <p>کارگزاری سود حاصل از مدیریت منابع این پرونده را محاسبه و گزارش می‌کند؛ کل سود ایجادشده در تسویه تجمیعی به چارخونه منتقل می‌شود.</p>
        </div>
        <div className="brokerage-yield-grid">
          <article><span>حداقل سود مورد انتظار</span><strong>۲۰٪</strong><small>کف سود؛ بدون سقف</small></article>
          <article className="brokerage-yield-grid__highlight"><span>سود ایجادشده تا امروز</span><strong>{item.yield}</strong><small>محاسبه‌شده بابت منابع این پرونده</small></article>
          <article><span>وضعیت انتقال سود</span><strong>در تجمیع سود چارخونه</strong><small>در انتظار انتقال دوره‌ای</small></article>
          <article><span>تخصیص به مالک</span><strong>توسط چارخونه انجام می‌شود</strong><small>کارگزاری فقط سود را گزارش می‌کند</small></article>
        </div>
      </section>

      <section className="brokerage-detail-panel brokerage-events-panel">
        <div className="brokerage-detail-panel__heading">
          <h2>وضعیت جاری و آخرین رویدادها</h2>
          <p>کارگزاری اصل منابع را تفکیک نگه می‌دارد و سود ساخته‌شده را در Pool تجمیعی چارخونه گزارش می‌کند.</p>
        </div>
        <div className="brokerage-event-list">
          <div className="brokerage-event-row"><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><div><span className="brokerage-badge brokerage-badge--success">ثبت‌شده</span><b>تسویه منبع صندوق برای دوره شهریور</b><time>۱۴۰۵/۰۶/۰۱</time></div></div>
          <div className="brokerage-event-row"><strong>{item.yield}</strong><div><span className="brokerage-badge brokerage-badge--success">ثبت‌شده</span><b>ثبت بازده منتسب به پرونده تا امروز</b><time>۱۴۰۵/۰۶/۰۸</time></div></div>
          <div className="brokerage-event-row"><strong>آماده‌سازی منابع تا موعد</strong><div><span className="brokerage-badge brokerage-badge--warning">سررسید</span><b>سررسید بعدی مالک</b><time>{item.due}</time></div></div>
        </div>
      </section>
    </section>
  );
}
