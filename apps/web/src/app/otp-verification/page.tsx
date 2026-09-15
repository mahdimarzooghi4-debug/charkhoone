import Link from "next/link";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

const otpLogo =
  "https://www.figma.com/api/mcp/asset/69553b44-1652-4f5c-a671-b3dd52bea8e9.png";

const otpDigits = [
  { boxId: "167:190", textId: "167:191", value: "۴" },
  { boxId: "167:192", textId: "167:193", value: "۸" },
  { boxId: "167:194", textId: "167:195", value: "۲" },
  { boxId: "167:196", textId: "167:197", value: "۱" },
  { boxId: "167:198", textId: "167:199", value: "۶" },
];

export default function OtpVerificationPage() {
  return (
    <main
      className={styles.page}
      data-node-id="167:175"
      data-name="Web App / OTP Verification"
    >
      <div className={styles.split} data-node-id="167:176" data-name="Split Container">
        <section className={styles.showcase} data-node-id="167:177" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="167:178">
            چارخونه
          </p>
          <h1 className={styles.tagline} data-node-id="167:179">
            همراه مستأجر، حامی مالک
          </h1>
          <p className={styles.description} data-node-id="167:180">
            چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.
          </p>
        </section>

        <section className={styles.card} data-node-id="167:181" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="142:1460" data-name="Logo Header">
            <img
              className={styles.logo}
              src={otpLogo}
              alt="چارخونه"
              width={140}
              height={60}
              data-node-id="142:1461"
            />
          </div>

          <div className={styles.headers} data-node-id="167:185" data-name="Card Headers">
            <h2 data-node-id="167:186">کد تأیید را وارد کنید</h2>
            <p data-node-id="167:187">کد ارسال‌شده به شماره ۰۹۱۲•••••۶۷ را وارد کنید.</p>
          </div>

          <div className={styles.otpSection} data-node-id="167:188" data-name="OTP Input Section">
            <div
              className={styles.digits}
              data-node-id="167:189"
              data-name="Digits Track"
              aria-label="کد نمونه تأیید"
            >
              {otpDigits.map((digit) => (
                <div
                  key={digit.boxId}
                  className={styles.digitBox}
                  data-node-id={digit.boxId}
                  data-name={`Digit Box ${digit.value}`}
                >
                  <span data-node-id={digit.textId}>{digit.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.resend} data-node-id="167:200" data-name="Resend Section">
            <span data-node-id="167:201">کد را دریافت نکردید؟</span>
            <strong data-node-id="167:202">ارسال مجدد تا ۰۰:۵۹</strong>
          </div>

          <div className={styles.action} data-node-id="167:203" data-name="Action Wrapper">
            <Button type="button" className={styles.submit} data-node-id="167:204">
              تأیید و ورود
            </Button>
          </div>

          <Link
            href="/login"
            className={styles.changeMobile}
            data-node-id="167:207"
            data-name="Secondary Action Wrapper"
          >
            <span data-node-id="167:208">تغییر شماره موبایل</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
