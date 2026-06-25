import { AssetAllocationChart, MonthlyCashflowChart, NetWorthLineChart, PortfolioAreaChart } from "@/components/charts/finance-charts";
import { SummaryCard } from "@/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/finance-data";
import { getTotals } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { BadgeDollarSign, ChartNoAxesCombined, TrendingUp, Wallet } from "lucide-react";

export default async function ReportsPage() {
  const { assets, liabilities } = await getDashboardData();
  const totals = getTotals(assets, liabilities);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">รายงาน</h1>
        <p className="text-sm text-muted-foreground">วิเคราะห์กำไร/ขาดทุน Net Worth กระแสเงินสด และการเติบโตของพอร์ต</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Net Worth" value={formatCurrency(totals.netWorth)} detail="ฐานะสุทธิล่าสุด" icon={BadgeDollarSign} tone="profit" />
        <SummaryCard title="พอร์ตลงทุน" value={formatCurrency(1970000)} detail="จาก Area Chart" icon={TrendingUp} tone="profit" />
        <SummaryCard title="Cash Flow มิ.ย." value={formatCurrency(49300)} detail="รายรับ - รายจ่าย" icon={Wallet} tone="asset" />
        <SummaryCard title="กำไรสะสม" value={formatCurrency(totals.profitLoss)} detail="เทียบราคาซื้อ" icon={ChartNoAxesCombined} tone="profit" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>สัดส่วนทรัพย์สิน</CardTitle><CardDescription>Pie Chart</CardDescription></CardHeader><CardContent><AssetAllocationChart assets={assets} /></CardContent></Card>
        <Card><CardHeader><CardTitle>กระแสเงินสด</CardTitle><CardDescription>Bar Chart</CardDescription></CardHeader><CardContent><MonthlyCashflowChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Net Worth ย้อนหลัง</CardTitle><CardDescription>Line Chart</CardDescription></CardHeader><CardContent><NetWorthLineChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>การเติบโตของพอร์ต</CardTitle><CardDescription>Area Chart</CardDescription></CardHeader><CardContent><PortfolioAreaChart /></CardContent></Card>
      </section>
    </div>
  );
}
