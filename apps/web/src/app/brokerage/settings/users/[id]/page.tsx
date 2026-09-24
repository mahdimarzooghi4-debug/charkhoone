import { ManageUserForm } from "./ManageUserForm";

type PanelUser = {
  name: string;
  mobile: string;
  role: string;
  access: string;
  status: "فعال" | "غیرفعال";
};

const users: Record<string, PanelUser> = {
  "ali-rezaei": { name: "علی رضایی", mobile: "۰۹۱۲۳۴۵۶۷۸۹", role: "کارشناس عملیات", access: "پرونده‌ها و منابع", status: "فعال" },
  "maryam-ahmadi": { name: "مریم احمدی", mobile: "—", role: "عملیات مالی", access: "مالی و انتقال", status: "فعال" },
  "reza-kazemi": { name: "رضا کاظمی", mobile: "—", role: "مدیر پنل", access: "کامل", status: "فعال" },
  "sara-mohammadi": { name: "سارا محمدی", mobile: "—", role: "ناظر", access: "فقط مشاهده", status: "غیرفعال" },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrokerageSettingsManageUserPage({ params }: PageProps) {
  const { id } = await params;
  const user = users[id] ?? users["ali-rezaei"];
  return <ManageUserForm id={id} initial={user} />;
}
