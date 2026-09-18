import Link from "next/link";

export default function AdminPaymentsPage() {
  return (
    <section className="admin-payments" data-name="Admin / Payments / Real Data Boundary">
      <header className="admin-payments__header">
        <div className="admin-payments__header-actions" />
        <div className="admin-payments__heading">
          <h1>پرداخت‌ها</h1>
          <p>این صفحه دیگر داده مالی نمونه نمایش نمی‌دهد.</p>
        </div>
      </header>

      <section className="admin-payments__table-card" role="status">
        <div className="admin-payments__empty-state">
          <h2>Payment queue واقعی هنوز API عملیاتی ندارد</h2>
          <p>
            Pilot Operations V1 فقط case queue، case detail و reconcile کنترل‌شده را expose می‌کند.
            تا وقتی endpoint واقعی ledger/payment ساخته نشده باشد، پنل مبلغ، تراکنش، تسویه یا مغایرت ساختگی نمایش نمی‌دهد.
          </p>
          <p>
            evidence مالی persist‌شده هر پرونده، شامل bank approval، funding allocation، fund freeze و tenant contribution،
            در جزئیات پرونده قابل مشاهده است.
          </p>
          <Link className="admin-payments__action admin-payments__action--primary" href="/admin/cases">
            رفتن به پرونده‌های واقعی
          </Link>
        </div>
      </section>
    </section>
  );
}
