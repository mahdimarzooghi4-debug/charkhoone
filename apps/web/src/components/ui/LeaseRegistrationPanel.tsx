import { Button } from "./Button";
import { LeaseContractCard } from "./LeaseContractCard";
import { TextField } from "./TextField";

export function LeaseRegistrationPanel() {
  return (
    <section className="ch-registration-panel" aria-labelledby="lease-registration-title" data-node-id="35:197">
      <h1 id="lease-registration-title" className="ch-registration-panel__title" data-node-id="35:198">
        ثبت قرارداد اجاره
      </h1>

      <p className="ch-registration-panel__description" data-node-id="35:199">
        لطفاً اطلاعات خود را وارد کنید تا قرارداد اجاره شما ثبت شود.
      </p>

      <TextField
        id="mobile-number"
        label="شماره موبایل"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="شماره موبایل خود را وارد کنید"
        aria-describedby="lease-registration-title"
      />

      <Button data-node-id="35:204">ادامه</Button>

      <div className="ch-divider" role="separator" data-node-id="35:211" />

      <LeaseContractCard title="قرارداد اجاره آپارتمان" startDate="۱۴۰۴/۰۱/۰۱" />
    </section>
  );
}
