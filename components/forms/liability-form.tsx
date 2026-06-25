"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { saveLiability } from "@/lib/finance-actions";
import { type LiabilityItem } from "@/lib/finance-data";
import { liabilityTypes } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function LiabilityForm({ liability }: { liability?: LiabilityItem }) {
  const existing = liability;
  const [type, setType] = useState(existing?.type ?? "AUTO_LOAN");
  const [status, setStatus] = useState(existing?.status ?? "ACTIVE");
  const [totalAmount, setTotalAmount] = useState(existing?.totalAmount ?? 780000);
  const [remaining, setRemaining] = useState(existing?.remainingBalance ?? 312000);
  const paidPercent = totalAmount ? ((totalAmount - remaining) / totalAmount) * 100 : 0;

  return (
    <form action={saveLiability} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="id" value={existing?.id ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="status" value={status} />
      <Card>
        <CardHeader><CardTitle>{existing ? "แก้ไขหนี้สิน" : "เพิ่มหนี้สิน"}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="ชื่อหนี้" defaultValue={existing?.name} />
          <Field id="creditor" label="เจ้าหนี้" defaultValue={existing?.creditor} />
          <div className="space-y-2">
            <Label>ประเภทหนี้</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{liabilityTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>สถานะหนี้</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">กำลังผ่อน</SelectItem>
                <SelectItem value="PAID_OFF">ปิดหนี้แล้ว</SelectItem>
                <SelectItem value="OVERDUE">ค้างชำระ</SelectItem>
                <SelectItem value="RESTRUCTURED">ปรับโครงสร้าง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalAmount">ยอดหนี้ทั้งหมด</Label>
            <Input id="totalAmount" name="totalAmount" type="number" value={totalAmount} onChange={(event) => setTotalAmount(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remaining">ยอดคงเหลือ</Label>
            <Input id="remaining" name="remainingBalance" type="number" value={remaining} onChange={(event) => setRemaining(Number(event.target.value))} />
          </div>
          <Field id="interestRatePerYear" label="ดอกเบี้ยต่อปี (%)" type="number" defaultValue={String(existing?.interestRatePerYear ?? 4.75)} />
          <Field id="interestRatePerMonth" label="ดอกเบี้ยต่อเดือน (%)" type="number" defaultValue="0.40" />
          <Field id="monthlyPayment" label="ยอดผ่อนต่อเดือน" type="number" defaultValue={String(existing?.monthlyPayment ?? 13000)} />
          <Field id="totalInstallments" label="จำนวนงวดทั้งหมด" type="number" defaultValue={String(existing?.totalInstallments ?? 60)} />
          <Field id="paidInstallments" label="ผ่อนไปแล้วกี่งวด" type="number" defaultValue={String(existing?.paidInstallments ?? 36)} />
          <Field id="dueDate" label="วันครบกำหนดชำระ" type="date" defaultValue={existing?.dueDate ?? "2026-07-12"} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea id="note" name="note" placeholder="เช่น เงื่อนไขโปะหนี้ หรือวันตัดรอบบัตร" />
          </div>
        </CardContent>
      </Card>
      <aside className="space-y-4">
        <Card>
          <CardHeader><CardTitle>ความคืบหน้าการผ่อน</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={paidPercent} indicatorClassName="bg-orange-500" />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ชำระแล้ว</span><span>{paidPercent.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดคงเหลือ</span><span>{formatCurrency(remaining)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">งวดคงเหลือ</span><span>{Math.max((existing?.totalInstallments ?? 60) - (existing?.paidInstallments ?? 36), 0)} งวด</span></div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" className="w-full"><Save className="h-4 w-4" />บันทึก</Button>
      </aside>
    </form>
  );
}

function Field({ id, label, type = "text", defaultValue }: { id: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}
