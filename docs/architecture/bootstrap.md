# Bootstrap فنی

## مرزهای اولیه

- `Charkhoone.Domain`: قواعد قطعی و invariantهای دامنه؛ بدون وابستگی زیرساختی.
- `Charkhoone.Application`: use caseها و قراردادهای داخلی.
- `Charkhoone.Infrastructure`: PostgreSQL/EF Core و بعداً adapterهای شرکا.
- `Charkhoone.Api`: REST API نسخه‌دار.
- `Charkhoone.Worker`: پردازش پس‌زمینه، outbox و reconciliation در مراحل بعد.
- `apps/web`: رابط Next.js/TypeScript.

## قواعد اتصال بیرونی

تا زمان دریافت API واقعی بانک، صندوق، سازمان، خودنویس و اعتبارسنجی، اتصال عملیاتی ادعا نمی‌شود. mock/fake فقط در محیط توسعه و پشت قرارداد داخلی مستقل مجاز است.

## مرحله بعد

1. تثبیت state machine پرونده و قرارداد در کد و آزمون.
2. طراحی اولین migration پس از نهایی‌شدن موجودیت‌های P0.
3. تعریف قراردادهای adapter بدون وابستگی به DTOهای شریک.
4. پیاده‌سازی outbox/inbox و idempotency برای عملیات حساس.
5. پیاده‌سازی UI از Figma بعد از استخراج design context صفحات هدف.
