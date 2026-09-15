import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/7d135077-0bf9-420c-bc76-5201017f7071.png",
  avatar: "https://www.figma.com/api/mcp/asset/d1ff3033-1363-4a19-b8ce-7ba75da52d60.png",
  calculator: "https://www.figma.com/api/mcp/asset/e3dab72e-26fc-4734-ac8e-cfb11ec9ce86.svg",
  quickFile: "https://www.figma.com/api/mcp/asset/b16749dc-7072-4b74-91f8-d073bb63471c.svg",
  quickHome: "https://www.figma.com/api/mcp/asset/5d5785f5-8017-413c-8274-ed7a91ca068b.svg",
  navHome: "https://www.figma.com/api/mcp/asset/355cc457-6aec-40df-b7cc-1abed37fe7b5.svg",
  navFile: "https://www.figma.com/api/mcp/asset/69a4deb7-1d16-4105-aa13-14ca2fe5f649.svg",
  navCard: "https://www.figma.com/api/mcp/asset/3396fbbb-9681-482a-90db-cefc605ca86b.svg",
  navUser: "https://www.figma.com/api/mcp/asset/f60658ee-0ca0-44b6-8814-a24a4e762150.svg",
} as const;

const quickAccess = [
  { label: "ماشین‌حساب", icon: assets.calculator, nodeId: "144:205" },
  { label: "ثبت کد رهگیری", icon: assets.quickFile, nodeId: "144:211" },
  { label: "املاک من", icon: assets.quickHome, nodeId: "144:217" },
];

const navItems = [
  { label: "خانه", icon: assets.navHome, active: true, nodeId: "144:291" },
  { label: "قراردادها", icon: assets.navFile, active: false, nodeId: "144:294" },
  { label: "دریافت و پرداخت", icon: assets.navCard, active: false, nodeId: "144:297" },
  { label: "حساب من", icon: assets.navUser, active: false, nodeId: "144:300" },
];

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "orange" | "blue" | "red" | "gray" }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

export default function UserHomePage() {
  return (
    <main className={styles.page} data-node-id="144:154" data-name="Web App / Home">
      <section className={styles.mainContent} data-node-id="144:155" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="144:156" data-name="Header Bar">
          <div className={styles.headerText} data-node-id="144:159" data-name="Header Right">
            <h1 data-node-id="144:160">خانه</h1>
            <p data-node-id="144:161">سلام، علی رضایی</p>
          </div>
        </header>

        <section className={styles.overviewGrid} data-node-id="144:162" data-name="Overview Grid">
          <article className={styles.overviewCard} data-node-id="144:163">
            <p className={styles.cardLabel} data-node-id="144:164">قراردادهای فعال</p>
            <strong className={styles.primaryValue} data-node-id="144:165">۲ قرارداد</strong>
            <p className={styles.cardHint} data-node-id="144:166">۱ قرارداد به‌عنوان مستأجر، ۱ قرارداد به‌عنوان مالک</p>
          </article>

          <article className={styles.overviewCard} data-node-id="144:167">
            <div className={styles.cardTopRow} data-node-id="144:168">
              <Badge tone="orange">پرداخت</Badge>
              <p className={styles.cardLabel} data-node-id="144:172">پرداخت بعدی</p>
            </div>
            <strong className={styles.accentValue} data-node-id="144:173">۱۸٬۵۰۰٬۰۰۰ تومان</strong>
            <p className={styles.cardHint} data-node-id="144:174">سررسید: ۱۵ آبان ۱۴۰۵</p>
          </article>

          <article className={styles.overviewCard} data-node-id="144:175">
            <div className={styles.cardTopRow} data-node-id="144:176">
              <Badge>دریافت</Badge>
              <p className={styles.cardLabel} data-node-id="144:179">دریافتی بعدی</p>
            </div>
            <strong className={styles.primaryValue} data-node-id="144:180">۱۹٬۹۰۰٬۰۰۰ تومان</strong>
            <p className={styles.cardHint} data-node-id="144:181">پس از کسر کارمزد خدمات چارخونه · سررسید: ۱۵ آبان ۱۴۰۵</p>
          </article>

          <article className={styles.overviewCard} data-node-id="144:182">
            <p className={styles.cardLabel} data-node-id="144:183">نیاز به اقدام</p>
            <strong className={styles.dangerValue} data-node-id="144:184">۱ مورد</strong>
            <p className={styles.cardHint} data-node-id="144:185">یک قرارداد نیاز به بررسی دارد</p>
          </article>
        </section>

        <section className={styles.membershipCard} data-node-id="184:413" data-name="Membership Status Card">
          <div className={styles.membershipTitle} data-node-id="184:414">
            <Badge>فعال</Badge>
            <strong data-node-id="184:417">عضویت چارخونه</strong>
          </div>
          <div className={styles.membershipInfo} data-node-id="184:418">
            <span className={styles.verticalDivider} data-node-id="184:419" />
            <span className={styles.infoPair}><span>سقف تأمین مالی</span><strong>تا ۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span>
            <span className={styles.infoPair}><span>دفعات باقی‌مانده</span><strong>۱ بار</strong></span>
          </div>
        </section>

        <section className={styles.actionsSection} data-node-id="144:186" data-name="Action Section">
          <h2 data-node-id="144:187">اقدام‌های موردنیاز</h2>
          <article className={styles.actionCard} data-node-id="144:188">
            <button type="button" className={styles.actionButton} data-node-id="144:189">بررسی قرارداد</button>
            <div className={styles.actionContent} data-node-id="144:192">
              <div className={styles.actionTitleRow} data-node-id="144:193">
                <Badge tone="blue">مالک</Badge>
                <Badge tone="orange">نیاز به اقدام</Badge>
                <strong data-node-id="144:199">تأیید نهایی قرارداد</strong>
              </div>
              <p data-node-id="144:200">قرارداد سعادت‌آباد با نقش مالک آماده تأیید نهایی است.</p>
            </div>
          </article>
          <article className={styles.actionCard} data-node-id="184:429">
            <button type="button" className={styles.actionButton} data-node-id="184:430">مشاهده قراردادها</button>
            <div className={styles.actionContent} data-node-id="184:433">
              <div className={styles.actionTitleRow} data-node-id="184:434">
                <Badge>مستأجر</Badge>
                <Badge tone="orange">نیاز به اقدام</Badge>
                <strong data-node-id="184:440">فعال‌سازی عضویت چارخونه</strong>
              </div>
              <p data-node-id="184:441">برای ادامه فرایند تأمین مالی این قرارداد، عضویت مناسب خود را انتخاب کنید.</p>
            </div>
          </article>
        </section>

        <section className={styles.contractsSplit} data-node-id="144:201" data-name="Contracts & Shortcuts Split">
          <div className={styles.quickBlock} data-node-id="144:202" data-name="Quick Access Block">
            <h2 data-node-id="144:203">دسترسی سریع</h2>
            <div className={styles.quickList} data-node-id="144:204">
              {quickAccess.map((item) => (
                <div key={item.label} className={styles.quickItem} data-node-id={item.nodeId}>
                  <span className={styles.chevron}>‹</span>
                  <span className={styles.quickLabel}>
                    <span>{item.label}</span>
                    <span className={styles.quickIcon}><img src={item.icon} alt="" width={16} height={16} /></span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.recentBlock} data-node-id="144:223" data-name="Recent Contracts Block">
            <div className={styles.sectionHeader} data-node-id="144:224">
              <button type="button">مشاهده همه قراردادها</button>
              <h2 data-node-id="144:226">قراردادهای اخیر</h2>
            </div>
            <div className={styles.contractList} data-node-id="144:227">
              <article className={styles.contractCard} data-node-id="144:228">
                <div className={styles.contractHeader} data-node-id="144:229">
                  <div className={styles.badgeRow}><Badge>مستأجر</Badge><Badge>فعال</Badge></div>
                  <strong data-node-id="144:235">سعادت‌آباد</strong>
                </div>
                <div className={styles.divider} />
                <div className={styles.contractMeta} data-node-id="144:237">
                  <strong data-node-id="144:238">پرداخت بعدی: ۱۸٬۵۰۰٬۰۰۰ تومان</strong>
                  <span data-node-id="144:239">تا ۱۵ مهر ۱۴۰۶</span>
                </div>
              </article>
              <article className={styles.contractCard} data-node-id="144:240">
                <div className={styles.contractHeader} data-node-id="144:241">
                  <div className={styles.badgeRow}><Badge tone="blue">مالک</Badge><Badge>فعال</Badge></div>
                  <strong data-node-id="144:247">پونک</strong>
                </div>
                <div className={styles.divider} />
                <div className={styles.contractMeta} data-node-id="144:249">
                  <strong data-node-id="144:250">دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان</strong>
                  <span data-node-id="144:251">تا ۱ آبان ۱۴۰۶</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.financialSection} data-node-id="144:252" data-name="Financial Section">
          <h2 data-node-id="144:253">دریافت و پرداخت</h2>
          <div className={styles.activityTable} data-node-id="144:254" data-name="Activity Table">
            <div className={styles.tableHeader} data-node-id="144:255">
              <span>وضعیت</span><span>تاریخ</span><span>مبلغ</span><span>قرارداد</span><span>نوع</span>
            </div>
            <div className={styles.tableRow} data-node-id="144:262">
              <span><Badge tone="orange">در انتظار پرداخت</Badge></span>
              <span className={styles.muted}>۱۵ آبان ۱۴۰۵</span>
              <strong>۱۸٬۵۰۰٬۰۰۰ تومان</strong>
              <span>سعادت‌آباد</span>
              <span><Badge tone="red">پرداخت</Badge></span>
            </div>
            <div className={styles.tableRow} data-node-id="144:274">
              <span><Badge tone="gray">آینده</Badge></span>
              <span className={styles.muted}>۱ آذر ۱۴۰۵</span>
              <strong>۱۵٬۰۰۰٬۰۰۰ تومان</strong>
              <span>پونک</span>
              <span><Badge>دریافت</Badge></span>
            </div>
          </div>
        </section>
      </section>

      <aside className={styles.sidebar} data-node-id="144:284" data-name="Right Sidebar">
        <div className={styles.sidebarTop} data-node-id="144:285" data-name="Brand Block">
          <div className={styles.sidebarLogo} data-node-id="142:1418">
            <img src={assets.logo} alt="چارخونه" width={127} height={55} />
          </div>
          <nav className={styles.nav} data-node-id="144:290" aria-label="ناوبری حساب کاربری">
            {navItems.map((item) => (
              <div key={item.label} className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`} data-node-id={item.nodeId}>
                <span>{item.label}</span>
                <img src={item.icon} alt="" width={20} height={20} />
              </div>
            ))}
          </nav>
        </div>
        <div className={styles.profile} data-node-id="144:303" data-name="User Profile Block">
          <img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} />
          <div className={styles.profileText} data-node-id="144:305">
            <strong data-node-id="144:306">علی رضایی</strong>
            <span data-node-id="144:307">۰۹۱۲•••••۶۷</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
