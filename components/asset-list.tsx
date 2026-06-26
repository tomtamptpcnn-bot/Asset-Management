"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Pencil, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/toast-manager";
import { deleteAsset, refreshAssetMarketPrice } from "@/lib/finance-actions";
import {
  getAssetAverageBuyPrice,
  getAssetCurrentValue,
  getAssetPurchaseAmount,
  getAssetQuantity,
  type AssetItem
} from "@/lib/mock-data";
import { formatCurrency, getChangeClass } from "@/lib/utils";

export function AssetList({ initialRows, limit }: { initialRows: AssetItem[]; limit?: number }) {
  const [rows, setRows] = useState<AssetItem[]>(initialRows);
  const router = useRouter();
  const { showToast } = useToast();
  const visibleRows = limit ? rows.slice(0, limit) : rows;

  async function handleDelete(id: string) {
    const previousRows = rows;
    setRows((current) => current.filter((row) => row.id !== id));
    const result = await deleteAsset(id);

    showToast({
      tone: result.ok ? "success" : "error",
      title: result.ok ? "ลบทรัพย์สินสำเร็จ" : "ลบทรัพย์สินไม่สำเร็จ",
      description: result.ok ? undefined : result.message
    });

    if (!result.ok) setRows(previousRows);
    router.refresh();
  }

  if (visibleRows.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">ยังไม่มีทรัพย์สิน</p>
            <p className="text-sm text-muted-foreground">เริ่มบันทึกเพื่อให้ระบบคำนวณ Net Worth</p>
          </div>
          <Button asChild><Link href="/assets/create">เพิ่มทรัพย์สิน</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>รายการทรัพย์สิน</CardTitle>
        <Button asChild size="sm" variant="outline"><Link href="/assets/create">เพิ่ม</Link></Button>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 font-medium">ชื่อ</th>
                <th className="py-3 font-medium">ประเภท</th>
                <th className="py-3 text-right font-medium">ราคาซื้อ</th>
                <th className="py-3 text-right font-medium">มูลค่าปัจจุบัน</th>
                <th className="py-3 font-medium">เป้าหมาย</th>
                <th className="py-3 text-right font-medium">กำไร/ขาดทุน</th>
                <th className="py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item) => {
                const purchaseAmount = getAssetPurchaseAmount(item);
                const currentValue = getAssetCurrentValue(item);
                const quantity = getAssetQuantity(item);
                const averageBuyPrice = getAssetAverageBuyPrice(item);
                const marketUnitPrice = quantity ? currentValue / quantity : 0;
                const pl = currentValue - purchaseAmount;
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-muted-foreground">{item.label} · {item.lots.length} ล็อต · {quantity.toLocaleString("th-TH")} หน่วย</td>
                    <td className="py-3 text-right">{formatCurrency(purchaseAmount)}</td>
                    <td className="py-3 text-right">
                      <p>{formatCurrency(currentValue)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">ตลาด {formatCurrency(marketUnitPrice)} / หน่วย</p>
                    </td>
                    <td className="py-3">
                      <GoalProgress currentValue={currentValue} targetValue={item.targetValue} />
                    </td>
                    <td className="py-3 text-right">
                      <p className={`font-medium ${getChangeClass(pl)}`}>{formatCurrency(pl)}</p>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <RefreshPriceButton asset={item} />
                        <Button asChild size="sm" variant="outline"><Link href={`/assets/${item.id}/edit`}><Pencil className="h-4 w-4" />แก้ไข</Link></Button>
                        <ConfirmDelete onConfirm={() => void handleDelete(item.id)} />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">เฉลี่ย {formatCurrency(averageBuyPrice)} / หน่วย</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {visibleRows.map((item) => {
            const purchaseAmount = getAssetPurchaseAmount(item);
            const currentValue = getAssetCurrentValue(item);
            const pl = currentValue - purchaseAmount;
            const quantity = getAssetQuantity(item);
            const marketUnitPrice = quantity ? currentValue / quantity : 0;
            return (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.label} · {item.lots.length} ล็อต</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${getChangeClass(pl)}`}>{formatCurrency(pl)}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">ราคาซื้อ</p><p>{formatCurrency(purchaseAmount)}</p></div>
                  <div><p className="text-muted-foreground">ปัจจุบัน</p><p>{formatCurrency(currentValue)}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">ราคาตลาด/หน่วย</p><p>{formatCurrency(marketUnitPrice)}</p></div>
                </div>
                {item.targetValue ? (
                  <div className="mt-4">
                    <GoalProgress currentValue={currentValue} targetValue={item.targetValue} />
                  </div>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <RefreshPriceButton asset={item} mobile />
                  <Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/assets/${item.id}/edit`}>แก้ไข</Link></Button>
                  <ConfirmDelete onConfirm={() => void handleDelete(item.id)} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RefreshPriceButton({ asset, mobile = false }: { asset: AssetItem; mobile?: boolean }) {
  const canRefresh =
    asset.type === "GOLD" ||
    ((asset.type === "STOCK" || asset.type === "FUND" || asset.type === "CRYPTO") && Boolean(asset.symbol));

  if (!canRefresh) return null;

  return (
    <form action={refreshAssetMarketPrice} className={mobile ? "flex-1" : ""}>
      <input type="hidden" name="id" value={asset.id} />
      <Button type="submit" size="sm" variant="outline" className={mobile ? "w-full" : ""}>
        <RefreshCcw className="h-4 w-4" />
        รีเฟรชราคา
      </Button>
    </form>
  );
}

function GoalProgress({ currentValue, targetValue }: { currentValue: number; targetValue?: number }) {
  if (!targetValue) {
    return <p className="text-sm text-muted-foreground">ยังไม่ตั้งเป้าหมาย</p>;
  }

  const percent = targetValue ? (currentValue / targetValue) * 100 : 0;
  const remaining = Math.max(targetValue - currentValue, 0);

  return (
    <div className="min-w-44 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{formatCurrency(targetValue)}</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{percent.toFixed(0)}%</span>
      </div>
      <Progress value={percent} indicatorClassName="bg-emerald-500" />
      <p className="text-xs text-muted-foreground">เหลืออีก {formatCurrency(remaining)}</p>
    </div>
  );
}
