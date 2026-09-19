import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/626df1e6-03df-4743-84ee-c2c4d0be4723.png",
  avatar: "https://www.figma.com/api/mcp/asset/bc53abf3-a993-4eb0-bad4-980514910585.png",
  gaugeBase: "https://www.figma.com/api/mcp/asset/b0318515-277f-44c4-88de-0bd321e7b83e.svg",
  gaugeValue: "https://www.figma.com/api/mcp/asset/07b57efe-d774-4e0b-985f-0dde72a7d84e.svg",
  depositSlider: "https://www.figma.com/api/mcp/asset/bb1127d1-22ce-40c4-abc9-b64974febe13.svg",
  rentSlider: "https://www.figma.com/api/mcp/asset/69d3e40e-94cb-4374-b220-b27597c169c0.svg",
  home: "https://www.figma.com/api/mcp/asset/4ac155b0-a8f4-45a1-ba91-a3cfe67e9cbb.svg",
  contracts: "https://www.figma.com/api/mcp/asset/bea492e0-5a1b-48de-99dc-603b4d4aef58.svg",
  payments: "https://www.figma.com/api/mcp/asset/bbf3d22e-83e-4bd2-b572-05e73b75db4c.svg",
  account: "https://www.figma.com/api/mcp/asset/3db53e14-14d6-40aa-9f32-74d8d09f46af.svg",
} as const;

const metrics = [
  ["حداقل قابل تأمین", "۳۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["حداکثر قابل تأمین", "۴۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["آورده موردنیاز شما", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", false],
  ["مزیت نسبت به شرایط عمومی", "۲٬۰۰۰٬۰۰۰ تومان کمتر", true],
] as const;

function SliderFixture({ label, value, min, max, image }: { label: string; value: string; min: string; max: string; image: string }) {
  return (
    <div className={styles.sliderWidget}>
      <div className={styles.sliderHeader}><strong>{value}</strong><span>{label}</span></div>
      <div className={styles.sliderGraphic}><img src={image} alt="" /></div>
      <div className={styles.sliderLabels}><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <main className={styles.page} data-node-id="150:588" data-name="Web App / Calculator">
      <section className={styles.mainContent} data-node-id="150:589">
        <header className={styles.header} data-node-id="150:590"><h1 data-node-id="150:592">ماشین‌حساب</h1><p data-node-id="150:593">سلام، علی رضایی</p></header>
        <section className={styles.pageHeader} data-node-id="150:594"><h2 data-node-id="150:595">محاسبه شرایط تأمین مالی مسکن</h2><p data-node-id="150:596">با وارد کردن مبلغ رهن و اجاره ماهانه، شرایط تقریبی تأمین مالی را بررسی کنید.</p></section>

        <div className={styles.columns} data-node-id="150:597">
          <section className={styles.resultsCard} data-node-id="150:598">
            <div className={styles.cardHeader} data-node-id="150:599"><h2 data-node-id="150:600">برآورد شرایط تأمین مالی</h2><p data-node-id="150:601">براساس اطلاعات واردشده</p></div>
            <div className={styles.gaugeArea} data-node-id="150:602">
              <div className={styles.gauge} data-node-id="150:603">
                <span className={styles.gaugeBase}><img src={assets.gaugeBase} alt="" /></span>
                <span className={styles.gaugeValue}><img src={assets.gaugeValue} alt="" /></span>
                <div className={styles.gaugeText}><strong data-node-id="150:607">۴۵۰ میلیون</strong><span data-node-id="150:608">تومان</span></div>
              </div>
              <div className={styles.gaugeLimits} data-node-id="150:609"><span>۴۵۰٬۰۰۰٬۰۰۰ (حداکثر)</span><span>۳۵۰٬۰۰۰٬۰۰۰ (حداقل)</span></div>
            </div>
            <div className={styles.divider} />
            <div className={styles.metricsGrid} data-node-id="150:613">
              {metrics.map(([label, value, highlight]) => <article key={label} className={`${styles.metric} ${highlight ? styles.metricHighlight : ""}`}><span>{label}</span><strong>{value}</strong></article>)}
            </div>
            <section className={styles.comparison} data-node-id="150:632"><h3 data-node-id="150:633">مقایسه شرایط</h3><div className={styles.comparisonRows}><div className={styles.generalRow}><strong>۲۰٬۵۰۰٬۰۰۰ تومان در ماه</strong><span>شرایط عمومی:</span></div><div className={styles.userRow}><strong>۱۸٬۵۰۰٬۰۰۰ تومان در ماه</strong><span>شرایط قابل استفاده شما:</span></div></div><span className={styles.savingBadge} data-node-id="150:641">۲٬۰۰۰٬۰۰۰ تومان کمتر در ماه</span></section>
            <p className={styles.disclaimer} data-node-id="150:643">نتیجه ماشین‌حساب تقریبی است و شرایط نهایی پس از ثبت قرارداد، بررسی واجد شرایط بودن و انتخاب طرح مشخص می‌شود.</p>
          </section>

          <section className={styles.inputsCard} data-node-id="150:644">
            <div className={styles.cardHeader} data-node-id="150:645"><h2 data-node-id="150:646">اطلاعات قرارداد</h2><p data-node-id="150:647">مبالغ تقریبی قرارداد موردنظر را وارد کنید.</p></div>
            <SliderFixture label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" min="۰ میلیون تومان" max="۱ میلیارد تومان" image={assets.depositSlider} />
            <SliderFixture label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" min="بدون اجاره" max="۵۰ میلیون تومان" image={assets.rentSlider} />
            <div className={styles.divider} />
            <section className={styles.estimate} data-node-id="150:671"><span data-node-id="150:672">پرداخت ماهانه تقریبی تأمین مالی</span><strong data-node-id="150:673">۱۸٬۵۰۰٬۰۰۰ تومان</strong><small data-node-id="150:674">مبلغ نهایی پس از انتخاب طرح و بررسی شرایط شما مشخص می‌شود.</small></section>
          </section>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1913">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav} aria-label="ناوبری حساب کاربری"><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit />
      </aside>
    </main>
  );
}
