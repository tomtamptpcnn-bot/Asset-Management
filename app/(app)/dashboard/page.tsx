import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, Landmark } from "lucide-react";
import { SummaryCard } from "@/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationChart, LiabilityTypeChart, MonthlyCashflowChart, NetWorthLineChart, PortfolioAreaChart } from "@/components/charts/finance-charts";
import { AssetList } from "@/components/asset-list";
import { getDashboardData } from "@/lib/finance-data";
import { getTotals } from "@/lib/mock-data";
import { formatCurrency, formatPercent, getChangeClass } from "@/lib/utils";

export default async function DashboardPage() {
  const { assets, liabilities } = await getDashboardData();
  const totals = getTotals(assets, liabilities);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">สรุปทรัพย์สิน หนี้สิน กำไร/ขาดทุน และกระแสเงินสด</p>
        </div>
        <p className={`text-sm font-medium ${getChangeClass(totals.profitLoss)}`}>
          กำไร/ขาดทุนรวม {formatCurrency(totals.profitLoss)} ({formatPercent(totals.profitLossPercent)})
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="ทรัพย์สินรวม" value={formatCurrency(totals.totalAssets)} detail="รวมมูลค่าปัจจุบันทุกประเภท" icon={Landmark} tone="asset" />
        <SummaryCard title="หนี้สินรวม" value={formatCurrency(totals.totalLiabilities)} detail="ยอดคงเหลือที่ต้องชำระ" icon={ArrowDownRight} tone="debt" />
        <SummaryCard title="Net Worth" value={formatCurrency(totals.netWorth)} detail="ทรัพย์สิน - หนี้สิน" icon={BadgeDollarSign} tone="profit" />
        <SummaryCard title="กำไร/ขาดทุน" value={formatCurrency(totals.profitLoss)} detail={formatPercent(totals.profitLossPercent)} icon={ArrowUpRight} tone={totals.profitLoss >= 0 ? "profit" : "debt"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>สัดส่วนทรัพย์สิน</CardTitle>
            <CardDescription>Pie Chart แยกตามประเภท</CardDescription>
          </CardHeader>
          <CardContent><AssetAllocationChart assets={assets} /></CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>หนี้ระยะสั้น/ยาว</CardTitle>
            <CardDescription>แยกจากประเภทหนี้สิน</CardDescription>
          </CardHeader>
          <CardContent><LiabilityTypeChart liabilities={liabilities} /></CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Net Worth ย้อนหลัง</CardTitle>
            <CardDescription>Line Chart รายเดือน</CardDescription>
          </CardHeader>
          <CardContent><NetWorthLineChart /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>รายรับรายจ่ายรายเดือน</CardTitle>
            <CardDescription>Bar Chart รายรับ รายจ่าย และเงินเหลือสุทธิ</CardDescription>
          </CardHeader>
          <CardContent><MonthlyCashflowChart /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>การเติบโตของพอร์ต</CardTitle>
            <CardDescription>Area Chart มูลค่าพอร์ตลงทุน</CardDescription>
          </CardHeader>
          <CardContent><PortfolioAreaChart /></CardContent>
        </Card>
      </section>

      <AssetList initialRows={assets} limit={5} />
    </div>
  );
}
