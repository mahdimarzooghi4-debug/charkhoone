import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "چارخونه",
  description: "پلتفرم ملی چارخونه",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
