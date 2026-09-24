import { OrganizationManageUserForm } from "./OrganizationManageUserForm";
import type { OrganizationUser } from "@/components/organization/OrganizationUsersOverview";

const users: Record<string, OrganizationUser> = {
  maryam: { id: "maryam", name: "مریم محمدی", email: "maryam@org.ir", role: "مدیر پنل", access: "دسترسی کامل", lastLogin: "امروز، ۱۶:۴۲", twoFactor: "فعال", active: true },
  ali: { id: "ali", name: "علی رضایی", email: "ali@org.ir", role: "مالی", access: "پرداخت‌ها و پرونده‌ها", lastLogin: "امروز، ۱۱:۰۵", twoFactor: "فعال", active: true },
  sara: { id: "sara", name: "سارا کریمی", email: "sara@org.ir", role: "منابع انسانی", access: "پرسنل و پرونده‌ها", lastLogin: "۱۴۰۵/۰۶/۰۷", twoFactor: "فعال", active: true },
  reza: { id: "reza", name: "رضا حسینی", email: "reza@org.ir", role: "مشاهده‌گر", access: "فقط مشاهده", lastLogin: "۱۴۰۵/۰۶/۰۵", twoFactor: "غیرفعال", active: true },
};

export default async function OrganizationManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = users[id] ?? { id, name: "کاربر جدید", email: "preview@org.ir", role: "مشاهده‌گر", access: "فقط مشاهده", lastLogin: "هنوز وارد نشده", twoFactor: "غیرفعال", active: true };
  return <OrganizationManageUserForm id={id} initial={user} />;
}
