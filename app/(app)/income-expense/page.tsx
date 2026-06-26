import { ArrowDown, ArrowUp, CalendarDays, ListPlus, Plus } from "lucide-react";
import { DefaultCashflowManager } from "@/components/default-cashflow-manager";
import { MonthlyCashflowChart } from "@/components/charts/finance-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  createMonthlyItemsFromDefaults,
  deleteMonthlyBudgetItem,
  saveMonthlyBudgetItem,
  toggleMonthlyBudgetItemPaid
} from "@/lib/finance-actions";
import { cashflowCategoryOptions, getCurrentMonthKey, getMonthlyBudget } from "@/lib/finance-data";
import { type BudgetItemType, type MonthlyBudgetItem } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default async function IncomeExpensePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonthKey();
  const { defaults, items } = await getMonthlyBudget(month);
  const incomeItems = items.filter((item) => item.type === "INCOME");
  const expenseItems = items.filter((item) => item.type === "EXPENSE");
  const paidIncome = sumItems(incomeItems.filter((item) => item.isPaid));
  const pendingIncome = sumItems(incomeItems.filter((item) => !item.isPaid));
  const paidExpense = sumItems(expenseItems.filter((item) => item.isPaid));
  const pendingExpense = sumItems(expenseItems.filter((item) => !item.isPaid));
  const plannedIncome = paidIncome + pendingIncome;
  const plannedExpense = paidExpense + pendingExpense;
  const paidExpensePercent = plannedExpense ? (paidExpense / plannedExpense) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">รายรับรายจ่าย</h1>
          <p className="text-sm text-muted-foreground">วางแผนรายเดือนจากรายการ default และติ๊กสถานะว่ารับ/จ่ายแล้วหรือยัง</p>
        </div>
        <form className="flex items-center gap-2">
          <Input name="month" type="month" defaultValue={month} className="w-44" />
          <Button variant="outline"><CalendarDays className="h-4 w-4" />ดูเดือน</Button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CashCard title="รายรับที่ได้รับแล้ว" value={paidIncome} tone="income" />
        <CashCard title="รายรับที่ยังไม่ได้รับ" value={pendingIncome} tone="pending" />
        <CashCard title="รายจ่ายที่จ่ายแล้ว" value={paidExpense} tone="expense" />
        <CashCard title="รายจ่ายที่ยังไม่จ่าย" value={pendingExpense} tone="pendingExpense" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>ยอดคงเหลือเดือน {month}</CardTitle>
          <CardDescription>รวมจากรายการที่ติ๊กแล้วและยังไม่ติ๊กในเดือนนี้</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryBlock title="คงเหลือตามแผน" value={plannedIncome - plannedExpense} positive={plannedIncome >= plannedExpense} />
            <SummaryBlock title="คงเหลือจากรายการที่เกิดแล้ว" value={paidIncome - paidExpense} positive={paidIncome >= paidExpense} />
            <SummaryBlock title="ภาระที่ยังไม่จ่าย" value={pendingExpense} positive={false} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">จ่ายแล้ว</span>
              <span>{paidExpensePercent.toFixed(0)}%</span>
            </div>
            <Progress value={paidExpensePercent} indicatorClassName="bg-orange-500" />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <MonthlyItemCard title="รายรับเดือนนี้" type="INCOME" month={month} items={incomeItems} />
        <MonthlyItemCard title="รายจ่ายเดือนนี้" type="EXPENSE" month={month} items={expenseItems} />
      </section>

      <Card>
        <CardContent className="p-4">
          <form action={createMonthlyItemsFromDefaults}>
            <input type="hidden" name="month" value={month} />
            <Button variant="outline"><ListPlus className="h-4 w-4" />สร้างรายการเดือนนี้จาก default</Button>
          </form>
        </CardContent>
      </Card>

      <DefaultCashflowManager defaults={defaults} month={month} />

      <Card>
        <CardHeader>
          <CardTitle>กราฟรายรับ-รายจ่ายรายเดือน</CardTitle>
          <CardDescription>ภาพรวมย้อนหลังจะแสดงเมื่อมีข้อมูลรายเดือน</CardDescription>
        </CardHeader>
        <CardContent><MonthlyCashflowChart /></CardContent>
      </Card>
    </div>
  );
}

function MonthlyItemCard({ title, type, month, items }: { title: string; type: BudgetItemType; month: string; items: MonthlyBudgetItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{type === "INCOME" ? "ติ๊กเมื่อได้รับเงินแล้ว" : "ติ๊กเมื่อจ่ายแล้ว"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CashflowForm action={saveMonthlyBudgetItem} month={month} fixedType={type} />
        <div className="space-y-3">
          {items.length ? items.map((item) => <BudgetRow key={item.id} item={item} month={month} />) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">ยังไม่มีรายการในเดือนนี้</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetRow({ item, month }: { item: MonthlyBudgetItem; month: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.category} · {item.dueDate ?? month}</p>
        </div>
        <p className={item.type === "INCOME" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>
          {formatCurrency(item.amount)}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <form action={toggleMonthlyBudgetItemPaid}>
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="isPaid" value={String(!item.isPaid)} />
          <Button variant={item.isPaid ? "secondary" : "outline"} size="sm" className="h-9">
            <input readOnly checked={item.isPaid} type="checkbox" className="h-4 w-4 accent-current" />
            {item.isPaid ? "เรียบร้อยแล้ว" : "ยังไม่เรียบร้อย"}
          </Button>
        </form>
        <form action={deleteMonthlyBudgetItem}>
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="id" value={item.id} />
          <Button variant="ghost" size="sm">ลบ</Button>
        </form>
      </div>
    </div>
  );
}

function CashflowForm({
  action,
  month,
  fixedType,
  includeDueDay = false
}: {
  action: (formData: FormData) => Promise<void>;
  month: string;
  fixedType?: BudgetItemType;
  includeDueDay?: boolean;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="month" value={month} />
      {fixedType ? <input type="hidden" name="type" value={fixedType} /> : (
        <select name="type" defaultValue="EXPENSE" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="INCOME">รายรับ</option>
          <option value="EXPENSE">รายจ่าย</option>
        </select>
      )}
      <Input name="name" placeholder="ชื่อรายการ" required />
      <select
        name="category"
        defaultValue={fixedType === "INCOME" ? "SIDE_INCOME" : "OTHER"}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        {cashflowCategoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Input name="amount" type="number" placeholder="จำนวนเงิน" required />
      {includeDueDay ? <Input name="dueDay" type="number" min={1} max={31} placeholder="วันที่ประจำเดือน" /> : <Input name="dueDate" type="date" defaultValue={`${month}-25`} />}
      <Button className="sm:col-span-2"><Plus className="h-4 w-4" />เพิ่มรายการ</Button>
    </form>
  );
}

function CashCard({ title, value, tone }: { title: string; value: number; tone: "income" | "expense" | "pending" | "pendingExpense" }) {
  const color = tone === "income" ? "text-emerald-600 dark:text-emerald-400" : tone === "expense" || tone === "pendingExpense" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400";
  const Icon = tone === "income" || tone === "pending" ? ArrowUp : ArrowDown;
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${color}`}>{formatCurrency(value)}</p>
        </div>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardContent>
    </Card>
  );
}

function SummaryBlock({ title, value, positive }: { title: string; value: number; positive: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`mt-1 text-xl font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(value)}</p>
    </div>
  );
}

function sumItems(items: MonthlyBudgetItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
