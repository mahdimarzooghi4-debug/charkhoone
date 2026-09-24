import Link from "next/link";
import BrokerageSettingsManageUserPage from "../page";
import { DeactivateUserButton } from "./DeactivateUserButton";

const userNames: Record<string, string> = {
  "ali-rezaei": "علی رضایی",
  "maryam-ahmadi": "مریم احمدی",
  "reza-kazemi": "رضا کاظمی",
  "sara-mohammadi": "سارا محمدی",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrokerageDeactivateUserPage({ params }: PageProps) {
  const { id } = await params;
  const userName = userNames[id] ?? userNames["ali-rezaei"];

  return (
    <div
      className="brokerage-deactivate-user"
      data-node-id="406:2"
      data-name="Brokerage / Settings / Deactivate User Confirmation"
    >
      <BrokerageSettingsManageUserPage params={Promise.resolve({ id })} />

      <div className="brokerage-deactivate-user__backdrop" aria-hidden="true" />

      <section
        className="brokerage-deactivate-user__modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="brokerage-deactivate-user-title"
        aria-describedby="brokerage-deactivate-user-description"
      >
        <div className="brokerage-deactivate-user__copy">
          <h1 id="brokerage-deactivate-user-title">غیرفعال کردن کاربر؟</h1>
          <p id="brokerage-deactivate-user-description">
            با غیرفعال شدن «{userName}»، دسترسی او به پنل کارگزاری فوراً قطع می‌شود. اطلاعات و سوابق فعالیت کاربر حفظ خواهد شد.
          </p>
        </div>

        <p className="brokerage-deactivate-user__warning">
          این کاربر بعداً دوباره قابل فعال‌سازی است.
        </p>

        <div className="brokerage-deactivate-user__actions">
          <Link
            className="brokerage-deactivate-user__button brokerage-deactivate-user__button--cancel"
            href={`/brokerage/settings/users/${id}`}
          >
            انصراف
          </Link>
          <DeactivateUserButton id={id} />
        </div>
      </section>
    </div>
  );
}
