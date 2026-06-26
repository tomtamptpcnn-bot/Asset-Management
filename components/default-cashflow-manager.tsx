"use client";

import { Pencil, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-manager";
import { cashflowCategoryOptions } from "@/lib/finance-data";
import { deleteDefaultCashflowItemById, saveDefaultCashflowItemInline } from "@/lib/finance-actions";
import { type BudgetItemType, type DefaultCashflowItem } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function DefaultCashflowManager({ defaults, month }: { defaults: DefaultCashflowItem[]; month: string }) {
  const [rows, setRows] = useState(defaults);
  const [editing, setEditing] = useState<DefaultCashflowItem | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();
  const formKey = `${editing?.id ?? "create"}-${formVersion}`;
  const categoryValue = useMemo(() => getCategoryValue(editing?.category, editing?.type), [editing]);

  useEffect(() => {
    setRows(defaults);
  }, [defaults]);

  function handleDeleted(id: string) {
    setRows((current) => current.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveDefaultCashflowItemInline(formData);

      showToast({
        tone: result.ok ? "success" : "error",
        title: result.ok ? result.message : "บันทึกรายการ default ไม่สำเร็จ",
        description: result.ok ? undefined : result.message
      });

      if (result.ok && result.item) {
        setRows((current) => {
          const exists = current.some((item) => item.id === result.item?.id);
          const nextRows = exists
            ? current.map((item) => (item.id === result.item?.id ? result.item : item))
            : [...current, result.item];
          return nextRows.filter(Boolean) as DefaultCashflowItem[];
        });
        setEditing(null);
        setFormVersion((current) => current + 1);
      }

      router.refresh();
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>รายการ default</CardTitle>
          <CardDescription>รายการประจำที่ใช้สร้างแผนของแต่ละเดือน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {rows.length ? (
              rows.map((item) => <DefaultCashflowCard key={item.id} item={item} onDeleted={handleDeleted} onEdit={() => setEditing(item)} />)
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
                ยังไม่มีรายการ default
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "แก้ไขรายการ default" : "เพิ่มรายการ default"}</CardTitle>
          <CardDescription>บันทึกไว้ใช้ซ้ำในเดือนถัดไป</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={formKey} onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <input type="hidden" name="month" value={month} />
            <select
              name="type"
              defaultValue={editing?.type ?? "EXPENSE"}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="INCOME">รายรับ</option>
              <option value="EXPENSE">รายจ่าย</option>
            </select>
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
            <Input name="dueDay" type="number" min={1} max={31} placeholder="วันที่ประจำเดือน" defaultValue={editing?.dueDay ?? ""} />
            <Input name="note" placeholder="หมายเหตุ" defaultValue={editing?.note ?? ""} />
            <input type="hidden" name="isActive" value="true" />
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
        </CardContent>
      </Card>
    </section>
  );
}

function DefaultCashflowCard({ item, onDeleted, onEdit }: { item: DefaultCashflowItem; onDeleted: (id: string) => void; onEdit: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete() {
    const result = await deleteDefaultCashflowItemById(item.id);

    showToast({
      tone: result.ok ? "success" : "error",
      title: result.ok ? "ลบรายการ default สำเร็จ" : "ลบรายการ default ไม่สำเร็จ",
      description: result.ok ? undefined : result.message
    });

    if (result.ok) onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.category} · วันที่ {item.dueDay ?? "-"}</p>
          {item.note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.note}</p> : null}
        </div>
        <p className={item.type === "INCOME" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>
          {formatCurrency(item.amount)}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          แก้ไข
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" variant="destructive" className="flex-1">ลบ</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-semibold">ยืนยันการลบรายการ default</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                รายการนี้จะไม่ถูกใช้สร้างแผนรายเดือนใหม่อีกต่อไป
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild><Button variant="outline">ยกเลิก</Button></AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="button" variant="destructive" onClick={() => void handleDelete()}>ยืนยันลบ</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function getCategoryValue(label?: string, type?: BudgetItemType) {
  const matched = cashflowCategoryOptions.find((option) => option.label === label || option.value === label);
  if (matched) return matched.value;
  return type === "INCOME" ? "SIDE_INCOME" : "OTHER";
}
