"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-manager";
import { cashflowCategoryOptions } from "@/lib/finance-data";
import {
  deleteMonthlyBudgetItemById,
  saveMonthlyBudgetItemInline,
  toggleMonthlyBudgetItemPaidById
} from "@/lib/finance-actions";
import { type BudgetItemType, type MonthlyBudgetItem } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function MonthlyBudgetManager({
  title,
  type,
  month,
  items
}: {
  title: string;
  type: BudgetItemType;
  month: string;
  items: MonthlyBudgetItem[];
}) {
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<MonthlyBudgetItem | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();
  const formKey = `${editing?.id ?? "create"}-${formVersion}`;
  const categoryValue = useMemo(() => getCategoryValue(editing?.category, type), [editing, type]);

  useEffect(() => {
    setRows(items);
  }, [items]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveMonthlyBudgetItemInline(formData);

      showToast({
        tone: result.ok ? "success" : "error",
        title: result.ok ? result.message : "บันทึกรายการรายเดือนไม่สำเร็จ",
        description: result.ok ? undefined : result.message
      });

      if (result.ok && result.item) {
        setRows((current) => {
          const exists = current.some((item) => item.id === result.item?.id);
          const nextRows = exists
            ? current.map((item) => (item.id === result.item?.id ? result.item : item))
            : [...current, result.item];
          return nextRows.filter(Boolean) as MonthlyBudgetItem[];
        });
        setEditing(null);
        setFormVersion((current) => current + 1);
      }

      router.refresh();
    });
  }

  async function handleToggle(item: MonthlyBudgetItem) {
    const nextPaid = !item.isPaid;
    const result = await toggleMonthlyBudgetItemPaidById(item.id, nextPaid, month);

    showToast({
      tone: result.ok ? "success" : "error",
      title: result.ok ? result.message : "อัปเดตสถานะไม่สำเร็จ",
      description: result.ok ? undefined : result.message
    });

    if (result.ok && result.item) {
      setRows((current) => current.map((row) => (row.id === item.id ? result.item! : row)));
      if (editing?.id === item.id) setEditing(result.item);
    }

    router.refresh();
  }

  async function handleDelete(id: string) {
    const previousRows = rows;
    setRows((current) => current.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);

    const result = await deleteMonthlyBudgetItemById(id);

    showToast({
      tone: result.ok ? "success" : "error",
      title: result.ok ? "ลบรายการรายเดือนสำเร็จ" : "ลบรายการรายเดือนไม่สำเร็จ",
      description: result.ok ? undefined : result.message
    });

    if (!result.ok) setRows(previousRows);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{type === "INCOME" ? "ติ๊กเมื่อได้รับเงินแล้ว" : "ติ๊กเมื่อจ่ายแล้ว"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form key={formKey} onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="type" value={type} />
          <Input name="name" placeholder="ชื่อรายการ" defaultValue={editing?.name ?? ""} required />
          <select
            name="category"
            defaultValue={categoryValue}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {cashflowCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input name="amount" type="number" placeholder="จำนวนเงิน" defaultValue={editing?.amount ?? ""} required />
          <Input name="dueDate" type="date" defaultValue={editing?.dueDate ?? `${month}-25`} />
          <Input name="note" placeholder="หมายเหตุ" defaultValue={editing?.note ?? ""} className="sm:col-span-2" />
          <Button className="sm:col-span-2" disabled={isPending}>
            {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isPending ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
          </Button>
          {editing ? (
            <Button type="button" variant="outline" className="sm:col-span-2" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
              ยกเลิกแก้ไข
            </Button>
          ) : null}
        </form>

        {rows.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="w-32 py-3 font-medium">สถานะ</th>
                    <th className="min-w-44 py-3 font-medium">รายการ</th>
                    <th className="w-32 py-3 font-medium">หมวดหมู่</th>
                    <th className="w-28 py-3 font-medium">วันที่</th>
                    <th className="w-32 py-3 text-right font-medium">จำนวนเงิน</th>
                    <th className="min-w-40 py-3 font-medium">หมายเหตุ</th>
                    <th className="w-40 py-3 text-right font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <BudgetTableRow
                      key={item.id}
                      item={item}
                      month={month}
                      onDelete={() => void handleDelete(item.id)}
                      onEdit={() => setEditing(item)}
                      onToggle={() => void handleToggle(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {rows.map((item) => (
                <BudgetCardRow
                  key={item.id}
                  item={item}
                  month={month}
                  onDelete={() => void handleDelete(item.id)}
                  onEdit={() => setEditing(item)}
                  onToggle={() => void handleToggle(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">ยังไม่มีรายการในเดือนนี้</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetTableRow({
  item,
  month,
  onDelete,
  onEdit,
  onToggle
}: {
  item: MonthlyBudgetItem;
  month: string;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3">
        <Button type="button" variant={item.isPaid ? "secondary" : "outline"} size="sm" className="h-8 w-28 justify-start" onClick={onToggle}>
          <input readOnly checked={item.isPaid} type="checkbox" className="h-4 w-4 accent-current" />
          {item.isPaid ? "แล้ว" : "ยัง"}
        </Button>
      </td>
      <td className="max-w-56 py-3 font-medium">
        <span className="block truncate">{item.name}</span>
      </td>
      <td className="py-3 text-muted-foreground">{item.category}</td>
      <td className="py-3 text-muted-foreground">{item.dueDate ?? month}</td>
      <td className={item.type === "INCOME" ? "py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400" : "py-3 text-right font-semibold text-red-600 dark:text-red-400"}>
        {formatCurrency(item.amount)}
      </td>
      <td className="max-w-48 py-3 text-muted-foreground">
        <span className="block truncate">{item.note ?? "-"}</span>
      </td>
      <td className="py-3">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            แก้ไข
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>ลบ</Button>
        </div>
      </td>
    </tr>
  );
}

function BudgetCardRow({
  item,
  month,
  onDelete,
  onEdit,
  onToggle
}: {
  item: MonthlyBudgetItem;
  month: string;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.category} · {item.dueDate ?? month}</p>
          {item.note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.note}</p> : null}
        </div>
        <p className={item.type === "INCOME" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>
          {formatCurrency(item.amount)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant={item.isPaid ? "secondary" : "outline"} size="sm" className="h-9" onClick={onToggle}>
          <input readOnly checked={item.isPaid} type="checkbox" className="h-4 w-4 accent-current" />
          {item.isPaid ? "เรียบร้อยแล้ว" : "ยังไม่เรียบร้อย"}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            แก้ไข
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>ลบ</Button>
        </div>
      </div>
    </div>
  );
}

function getCategoryValue(label: string | undefined, type: BudgetItemType) {
  const matched = cashflowCategoryOptions.find((option) => option.label === label || option.value === label);
  if (matched) return matched.value;
  return type === "INCOME" ? "SIDE_INCOME" : "OTHER";
}
