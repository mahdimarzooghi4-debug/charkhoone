import Link from "next/link";
import styles from "./UserPanelExit.module.css";

/**
 * Web /user routes are Figma presentation previews today.
 * The action returns to the public login screen; it is NOT an OIDC/session logout.
 */
export function UserPanelExit() {
  return (
    <div className={styles.footer}>
      <Link
        href="/login"
        className={styles.exit}
        aria-label="خروج از پیش‌نمایش و بازگشت به صفحه ورود"
        title="بازگشت به صفحه ورود (حالت نمایشی)"
      >
        <span aria-hidden="true">←</span>
        <span>خروج</span>
      </Link>
    </div>
  );
}
