# پلتفرم ملی چارخونه

این مخزن کد پلتفرم ملی چارخونه است.

## وضعیت

Bootstrap اولیه پروژه بر اساس سند فنی نسخه ۳ انجام می‌شود. قواعد مالی و دامنه باید مطابق سند فنی مصوب پیاده‌سازی شوند و هیچ API شریک بیرونی تا زمان دریافت قرارداد واقعی، عملیاتی فرض نمی‌شود.

## معماری هدف

- Web: Next.js + TypeScript
- Backend: ASP.NET Core روی .NET 10 LTS
- Data: PostgreSQL + EF Core + Npgsql
- Architecture: Modular Monolith با API و Worker مستقل
- Background jobs/events: RabbitMQ
- Identity: OIDC/Keycloak (پیشنهادی؛ اتصال واقعی در فاز مربوطه)
- Documents: Private Object Storage
- Deployment: Linux + Docker + Nginx

## ساختار مخزن

```text
apps/
  web/          رابط کاربری Next.js
src/
  Charkhoone.Api/
  Charkhoone.Worker/
  Charkhoone.Domain/
  Charkhoone.Application/
  Charkhoone.Infrastructure/
tests/
  Charkhoone.Domain.Tests/
  Charkhoone.Api.Tests/
docs/
  architecture/
```

> این مخزن در مرحله bootstrap است؛ اتصال بانک، صندوق، خودنویس و اعتبارسنجی تا دریافت API واقعی فقط با قرارداد داخلی و adapter آزمایشی در محیط توسعه انجام خواهد شد.
