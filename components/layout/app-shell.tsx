"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  Sun,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/assets", label: "ทรัพย์สิน", icon: PiggyBank },
  { href: "/liabilities", label: "หนี้สิน", icon: CreditCard },
  { href: "/income-expense", label: "รายรับจ่าย", icon: WalletCards },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/settings", label: "ตั้งค่า", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Personal Finance</p>
            <h1 className="text-lg font-semibold">Asset Ledger</h1>
          </div>
        </div>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs text-muted-foreground">ฐานะการเงินส่วนบุคคล</p>
              <h2 className="text-lg font-semibold">Asset Ledger</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/assets/create"><Plus className="h-4 w-4" />เพิ่มทรัพย์สิน</Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="hidden h-4 w-4 dark:block" />
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card px-1 py-2 lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] text-muted-foreground", active && "text-primary")}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
