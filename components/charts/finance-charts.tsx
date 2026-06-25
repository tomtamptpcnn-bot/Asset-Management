"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  getAssetCurrentValue,
  type AssetItem
} from "@/lib/mock-data";
import { type LiabilityItem } from "@/lib/finance-data";
import { formatCurrency } from "@/lib/utils";

const assetColors = ["#0284c7", "#16a34a", "#f59e0b", "#7c3aed", "#06b6d4", "#ef4444", "#64748b"];
const debtColors = ["#f97316", "#ef4444", "#a855f7", "#0f766e"];

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))"
};

export function AssetAllocationChart({ assets = [] }: { assets?: AssetItem[] }) {
  const data = assets.reduce<Array<{ name: string; value: number }>>((rows, item) => {
    const found = rows.find((row) => row.name === item.label);
    if (found) found.value += getAssetCurrentValue(item);
    else rows.push({ name: item.label, value: getAssetCurrentValue(item) });
    return rows;
  }, []);

  return data.length ? (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={96} innerRadius={54} paddingAngle={2}>
          {data.map((_, index) => <Cell key={index} fill={assetColors[index % assetColors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmptyState />
  );
}

export function LiabilityTypeChart({ liabilities = [] }: { liabilities?: LiabilityItem[] }) {
  const data = liabilities.reduce<Array<{ name: string; value: number }>>((rows, item) => {
    const bucket = item.type === "MORTGAGE" || item.type === "AUTO_LOAN" ? "หนี้ระยะยาว" : "หนี้ระยะสั้น";
    const found = rows.find((row) => row.name === bucket);
    if (found) found.value += item.remainingBalance;
    else rows.push({ name: bucket, value: item.remainingBalance });
    return rows;
  }, []);

  return data.length ? (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={96}>
          {data.map((_, index) => <Cell key={index} fill={debtColors[index % debtColors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmptyState />
  );
}

export function MonthlyCashflowChart({ data = [] }: { data?: Array<{ month: string; income: number; expense: number; net?: number }> }) {
  return data.length ? (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={42} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
        <Bar dataKey="income" name="รายรับ" fill="#16a34a" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmptyState height={320} />
  );
}

export function NetWorthLineChart({ data = [] }: { data?: Array<{ month: string; netWorth: number }> }) {
  return data.length ? (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(value) => `${Number(value) / 1000000}m`} tickLine={false} axisLine={false} width={42} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#0284c7" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmptyState height={320} />
  );
}

export function PortfolioAreaChart({ data = [] }: { data?: Array<{ month: string; portfolio: number }> }) {
  return data.length ? (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="portfolioGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(value) => `${Number(value) / 1000000}m`} tickLine={false} axisLine={false} width={42} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="portfolio" name="พอร์ตลงทุน" stroke="#16a34a" fill="url(#portfolioGrowth)" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmptyState height={320} />
  );
}

function ChartEmptyState({ height = 280 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
      ยังไม่มีข้อมูลสำหรับกราฟ
    </div>
  );
}
