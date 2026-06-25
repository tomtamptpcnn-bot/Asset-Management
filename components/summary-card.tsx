import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "asset" | "debt" | "profit" | "warning";
};

const tones = {
  asset: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  debt: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  profit: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
};

export function SummaryCard({ title, value, detail, icon: Icon, tone = "asset" }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-normal">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
