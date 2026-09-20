import Link from "next/link";
import { AccountModalScaffold } from "@/components/account/AccountModalScaffold";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/8f3d3544-e75c-4250-b33a-b41bfd3302f5.png",
  avatar: "https://www.figma.com/api/mcp/asset/046a8302-e395-4e6c-895f-a2c1a4d7299c.png",
  chevron: "https://www.figma.com/api/mcp/asset/daceb9ec-5611-4e59-b00b-a2059d6ae6ad.svg",
  home: "https://www.figma.com/api/mcp/asset/8c14ad79-7c07-41ff-8827-6800424779e2.svg",
  contracts: "https://www.figma.com/api/mcp/asset/001e3251-84cb-4536-9f9a-f0f50b32a130.svg",
  payments: "https://www.figma.com/api/mcp/asset/1330034a-d2ab-4d53-97e0-57de01ede560.svg",
  account: "https://www.figma.com/api/mcp/asset/2239c558-3868-4c26-ad4d-a9c715f52019.svg",
} as const;

const selectedPhoto = "/brand/dashboard-avatar.png";

export default function ProfileImagePreviewPage() {
  return (
    <AccountModalScaffold assets={assets} nodeId="175:578">
      <section className={styles.modal} data-node-id="175:659" data-name="Change Profile Image Preview Modal">
        <header className={styles.modalHeader} data-node-id="175:660">
          <Link href="/user/account" className={styles.closeButton} aria-label="بستن">✕</Link>
          <h1 data-node-id="175:663">تصویر پروفایل</h1>
        </header>

        <div className={styles.modalBody} data-node-id="175:664">
          <p data-node-id="175:665">این تصویر نمونه طراحی است و از دستگاه شما بارگذاری نشده است.</p>
          <div className={styles.avatarPreview} data-node-id="175:666">
            <span className={styles.photoFrame} data-node-id="175:667"><img src={selectedPhoto} alt="پیش‌نمایش تصویر پروفایل" width={130} height={130} /></span>
            <span className={styles.previewCaption} data-node-id="175:669">پیش‌نمایش تصویر جدید</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.actions} data-node-id="175:671">
          <Link href="/user/account" className={styles.primaryAction} data-node-id="175:672">بازگشت به حساب (بدون ذخیره)</Link>
          <Link href="/user/account/profile-image" className={styles.outlineAction} data-node-id="175:674">انتخاب تصویر دیگر</Link>
          <Link href="/user/account" className={styles.cancelAction} data-node-id="175:676">انصراف</Link>
        </div>
      </section>
    </AccountModalScaffold>
  );
}
