# پلتفرم ملی چارخونه

Bootstrap اولیه مخزن بر اساس سند فنی نسخه ۳.

## پشته فنی

- Web: Next.js + TypeScript
- Backend: ASP.NET Core روی .NET 10 LTS
- Data: PostgreSQL + EF Core + Npgsql
- Architecture: Modular Monolith با API و Worker مستقل
- Background: RabbitMQ
- Identity: OIDC/Keycloak به‌عنوان پیشنهاد فعلی؛ هنوز اتصال عملیاتی نشده است
- Deployment target: Linux + Docker + Nginx

## ساختار

```text
apps/web/                    Next.js
src/Charkhoone.Domain/       قواعد قطعی دامنه
src/Charkhoone.Application/  use caseها و قراردادهای داخلی
src/Charkhoone.Infrastructure/ PostgreSQL/EF و adapterها
src/Charkhoone.Api/          REST API
src/Charkhoone.Worker/       پردازش پس‌زمینه
tests/                       آزمون‌ها
docs/architecture/           تصمیم‌ها و قواعد فنی
```

## اجرای زیرساخت محلی

```bash
docker compose up -d
```

## Backend

نیازمند .NET 10 SDK:

```bash
dotnet restore Charkhoone.slnx
dotnet build Charkhoone.slnx
dotnet test Charkhoone.slnx
dotnet run --project src/Charkhoone.Api
```

پس از اجرا:

- `GET /health`
- `GET /api/v1`

## Web

نیازمند Node.js 22+:

```bash
cd apps/web
npm install
npm run dev
```

## نکته مهم دامنه

قواعد مالی مصوب در `docs/architecture/domain-rules.md` ثبت شده‌اند. رتبه اعتباری از سرویس بیرونی دریافت می‌شود؛ چارخونه رتبه تولید نمی‌کند. API شرکای واقعی هنوز در اختیار پروژه نیست و هیچ mock توسعه‌ای نباید به‌عنوان اتصال عملیاتی استفاده شود.
