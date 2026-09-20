import Link from "next/link";
import { AccountModalScaffold } from "@/components/account/AccountModalScaffold";
import styles from "./page.module.css";
import { PreviewAction } from "@/components/user/PreviewAction";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/6736d0ce-6971-4b94-9276-f83c4a84ae34.png",
  avatar: "https://www.figma.com/api/mcp/asset/79bbaac6-783f-423a-9888-04c9e78739fe.png",
  chevron: "https://www.figma.com/api/mcp/asset/daceb9ec-5611-4e59-b00b-a2059d6ae6ad.svg",
  home: "https://www.figma.com/api/mcp/asset/d9e54092-9944-40b1-85f5-b8ce0ff96bff.svg",
  contracts: "https://www.figma.com/api/mcp/asset/29abadd3-edab-4347-b004-0a3bffb6c401.svg",
  payments: "https://www.figma.com/api/mcp/asset/41827c54-583e-4893-b7d3-f3c2a757c94a.svg",
  account: "https://www.figma.com/api/mcp/asset/cf0742fc-5c63-4960-a1d9-81f6aa00b783.svg",
} as const;

export default function ProfileImagePage() {
  return (
    <AccountModalScaffold assets={assets} nodeId="175:459">
      <section className={styles.modal} data-node-id="175:540" data-name="Change Profile Image Modal">
        <header className={styles.modalHeader} data-node-id="175:541">
          <Link href="/user/account" className={styles.closeButton} aria-label="بستن">✕</Link>
          <h1 data-node-id="175:544">تصویر پروفایل</h1>
        </header>

        <div className={styles.modalBody} data-node-id="175:545">
          <p data-node-id="175:546">تصویرها نمونه طراحی‌اند؛ بارگذاری، ثبت یا حذف واقعی انجام نمی‌شود.</p>
          <div className={styles.avatarPreview} data-node-id="175:547">
            <span className={styles.currentAvatar} data-node-id="175:548">ع ر</span>
            <span className={styles.previewCaption} data-node-id="175:550">تصویر فعلی</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.sourceField} data-node-id="175:552">
            <label data-node-id="175:553">منبع بارگذاری تصویر</label>
            <div className={styles.selectLike} data-node-id="175:554">
              <span aria-hidden="true">▾</span>
              <strong data-node-id="175:556">بارگذاری از گالری محلی (دستگاه)</strong>
            </div>
          </div>
        </div>

        <div className={styles.actions} data-node-id="175:557">
          <Link href="/user/account/profile-image/preview" className={styles.primaryAction} data-node-id="175:558">نمایش تصویر نمونه</Link>
          <PreviewAction label="حذف تصویر فعلی" title="حذف تصویر پروفایل" message="در این پیش‌نمایش تصویری در حساب واقعی ذخیره نشده که حذف شود؛ تصویر فعلی فقط نمونه طراحی است." className={styles.destructiveAction} />
          <Link href="/user/account" className={styles.cancelAction} data-node-id="175:562">انصراف</Link>
        </div>
      </section>
    </AccountModalScaffold>
  );
}
