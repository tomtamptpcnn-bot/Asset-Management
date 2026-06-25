"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { deleteLiability } from "@/lib/finance-actions";
import { type LiabilityItem } from "@/lib/finance-data";
import { formatCurrency } from "@/lib/utils";

export function LiabilityList({ initialRows }: { initialRows: LiabilityItem[] }) {
  const [rows, setRows] = useState(initialRows);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>รายการหนี้สิน</CardTitle>
        <Button asChild size="sm" variant="outline"><Link href="/liabilities/create">เพิ่ม</Link></Button>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 font-medium">ชื่อหนี้</th>
                <th className="py-3 font-medium">เจ้าหนี้</th>
                <th className="py-3 text-right font-medium">ยอดคงเหลือ</th>
                <th className="py-3 text-right font-medium">ผ่อน/เดือน</th>
                <th className="py-3 font-medium">ความคืบหน้า</th>
                <th className="py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const paid = ((item.totalAmount - item.remainingBalance) / item.totalAmount) * 100;
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-muted-foreground">{item.creditor}</td>
                    <td className="py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(item.remainingBalance)}</td>
                    <td className="py-3 text-right text-orange-600 dark:text-orange-400">{formatCurrency(item.monthlyPayment)}</td>
                    <td className="py-3"><Progress value={paid} indicatorClassName="bg-orange-500" /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline"><Link href={`/liabilities/${item.id}/edit`}><Pencil className="h-4 w-4" />แก้ไข</Link></Button>
                        <ConfirmDelete onConfirm={() => {
                          setRows(rows.filter((row) => row.id !== item.id));
                          void deleteLiability(item.id);
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {rows.map((item) => {
            const paid = ((item.totalAmount - item.remainingBalance) / item.totalAmount) * 100;
            return (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.creditor}</p></div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(item.remainingBalance)}</p>
                </div>
                <div className="mt-4"><Progress value={paid} indicatorClassName="bg-orange-500" /></div>
                <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">ผ่อนต่อเดือน</span><span>{formatCurrency(item.monthlyPayment)}</span></div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/liabilities/${item.id}/edit`}>แก้ไข</Link></Button>
                  <ConfirmDelete onConfirm={() => {
                    setRows(rows.filter((row) => row.id !== item.id));
                    void deleteLiability(item.id);
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
