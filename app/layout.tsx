import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Asset Ledger",
  description: "บันทึกและวิเคราะห์ทรัพย์สิน หนี้สิน รายรับ รายจ่ายส่วนบุคคล"
};

export const preferredRegion = "sin1";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
