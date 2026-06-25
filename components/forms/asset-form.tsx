"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveAsset } from "@/lib/finance-actions";
import { assetTypes, type AssetItem, type AssetLot } from "@/lib/mock-data";
import { formatCurrency, formatPercent, getChangeClass } from "@/lib/utils";

export function AssetForm({ asset }: { asset?: AssetItem }) {
  const existing = asset;
  const [type, setType] = useState(existing?.type ?? "GOLD");
  const [lots, setLots] = useState<AssetLot[]>(
    existing?.lots ?? [
      {
        id: "new-lot-1",
        purchasedAt: "2026-06-25",
        quantity: 1,
        unitPurchasePrice: 35600,
        purchaseAmount: 35600,
        currentUnitPrice: 41000,
        currentValue: 41000,
        note: ""
      }
    ]
  );

  const purchasePrice = lots.reduce((sum, lot) => sum + lot.purchaseAmount, 0);
  const currentValue = lots.reduce((sum, lot) => sum + lot.currentValue, 0);
  const [targetValue, setTargetValue] = useState(existing?.targetValue ?? Math.max(currentValue * 1.25, 100000));
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const averageBuyPrice = totalQuantity ? purchasePrice / totalQuantity : 0;
  const marketUnitPrice = totalQuantity ? currentValue / totalQuantity : 0;
  const goldWeightGram = totalQuantity * 15.244;
  const profit = currentValue - purchasePrice;
  const profitPercent = purchasePrice ? (profit / purchasePrice) * 100 : 0;
  const targetPercent = targetValue ? (currentValue / targetValue) * 100 : 0;

  const title = useMemo(() => (existing ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"), [existing]);

  function updateLot(id: string, field: keyof AssetLot, value: string) {
    setLots((currentLots) =>
      currentLots.map((lot) => {
        if (lot.id !== id) return lot;
        const numericFields: Array<keyof AssetLot> = [
          "quantity",
          "unitPurchasePrice",
          "purchaseAmount",
          "currentUnitPrice",
          "currentValue",
          "goldWeightBaht",
          "goldWeightGram",
          "dividendsReceived"
        ];
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        const nextLot = { ...lot, [field]: nextValue };

        if (field === "quantity" || field === "unitPurchasePrice") {
          nextLot.purchaseAmount = Number(nextLot.quantity) * Number(nextLot.unitPurchasePrice);
        }
        if (field === "quantity" || field === "currentUnitPrice") {
          nextLot.currentValue = Number(nextLot.quantity) * Number(nextLot.currentUnitPrice);
        }
        return nextLot;
      })
    );
  }

  function addLot() {
    setLots((currentLots) => [
      ...currentLots,
      {
        id: `new-lot-${currentLots.length + 1}`,
        purchasedAt: "2026-06-25",
        quantity: 1,
        unitPurchasePrice: 0,
        purchaseAmount: 0,
        currentUnitPrice: 0,
        currentValue: 0,
        note: ""
      }
    ]);
  }

  function removeLot(id: string) {
    setLots((currentLots) => currentLots.filter((lot) => lot.id !== id));
  }

  return (
    <form action={saveAsset} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="id" value={existing?.id ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="lots" value={JSON.stringify(lots)} />
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">ชื่อทรัพย์สิน</Label>
            <Input id="name" name="name" defaultValue={existing?.name} placeholder="เช่น ทองคำแท่ง, BTC, กองทุน RMF" />
          </div>
          <div className="space-y-2">
            <Label>ประเภท</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {assetTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">แนบรูปภาพหรือเอกสาร</Label>
            <Input id="attachment" name="attachment" type="file" />
          </div>
          {(type === "STOCK" || type === "FUND" || type === "CRYPTO") && (
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol สำหรับดึงราคาตลาด</Label>
              <Input id="symbol" name="symbol" defaultValue={existing?.symbol ?? (type === "CRYPTO" ? "BTC" : "")} placeholder={type === "CRYPTO" ? "BTC" : "AAPL หรือ SET:AOT"} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="targetValue">เป้าหมายมูลค่าทรัพย์สิน</Label>
            <Input id="targetValue" name="targetValue" type="number" value={targetValue} onChange={(event) => setTargetValue(Number(event.target.value))} />
          </div>

          <section className="space-y-3 rounded-lg border p-4 sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">ล็อตการซื้อ</h3>
                <p className="text-sm text-muted-foreground">เพิ่มหลายรายการได้เมื่อซื้อสินทรัพย์เดียวกันคนละวันหรือคนละราคา</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLot}><Plus className="h-4 w-4" />เพิ่มล็อต</Button>
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 font-medium">วันที่ซื้อ</th>
                    <th className="py-2 font-medium">จำนวน</th>
                    <th className="py-2 font-medium">ราคาซื้อต่อหน่วย</th>
                    <th className="py-2 font-medium">ราคาปัจจุบันต่อหน่วย</th>
                    <th className="py-2 text-right font-medium">มูลค่าปัจจุบัน</th>
                    <th className="py-2 text-right font-medium">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id} className="border-b last:border-0">
                      <td className="py-2 pr-2"><Input type="date" value={lot.purchasedAt} onChange={(event) => updateLot(lot.id, "purchasedAt", event.target.value)} /></td>
                      <td className="py-2 pr-2"><Input type="number" step="0.00000001" value={lot.quantity} onChange={(event) => updateLot(lot.id, "quantity", event.target.value)} /></td>
                      <td className="py-2 pr-2"><Input type="number" value={lot.unitPurchasePrice} onChange={(event) => updateLot(lot.id, "unitPurchasePrice", event.target.value)} /></td>
                      <td className="py-2 pr-2"><Input type="number" value={lot.currentUnitPrice} onChange={(event) => updateLot(lot.id, "currentUnitPrice", event.target.value)} /></td>
                      <td className="py-2 text-right">{formatCurrency(lot.currentValue)}</td>
                      <td className="py-2 text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLot(lot.id)} disabled={lots.length === 1} aria-label="ลบล็อต">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {lots.map((lot, index) => (
                <div key={lot.id} className="rounded-lg border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">ล็อตที่ {index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLot(lot.id)} disabled={lots.length === 1} aria-label="ลบล็อต">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LotField label="วันที่ซื้อ" type="date" value={lot.purchasedAt} onChange={(value) => updateLot(lot.id, "purchasedAt", value)} />
                    <LotField label="จำนวน" type="number" value={lot.quantity} onChange={(value) => updateLot(lot.id, "quantity", value)} />
                    <LotField label="ราคาซื้อต่อหน่วย" type="number" value={lot.unitPurchasePrice} onChange={(value) => updateLot(lot.id, "unitPurchasePrice", value)} />
                    <LotField label="ราคาปัจจุบันต่อหน่วย" type="number" value={lot.currentUnitPrice} onChange={(value) => updateLot(lot.id, "currentUnitPrice", value)} />
                  </div>
                  <p className="mt-3 text-right text-sm text-muted-foreground">มูลค่าปัจจุบัน {formatCurrency(lot.currentValue)}</p>
                </div>
              ))}
            </div>
          </section>

          {type === "GOLD" && (
            <section className="grid gap-3 rounded-lg border p-4 sm:col-span-2 sm:grid-cols-2">
              <h3 className="text-sm font-semibold sm:col-span-2">ข้อมูลทองคำ</h3>
              <ReadOnlyMetric label="น้ำหนักรวม" value={`${totalQuantity.toLocaleString("th-TH")} บาททอง`} />
              <ReadOnlyMetric label="น้ำหนักรวมโดยประมาณ" value={`${goldWeightGram.toLocaleString("th-TH", { maximumFractionDigits: 2 })} กรัม`} />
              <ReadOnlyMetric label="ราคาซื้อเฉลี่ย" value={`${formatCurrency(averageBuyPrice)} / บาททอง`} />
              <ReadOnlyMetric label="ราคาตลาดล่าสุด" value={`${formatCurrency(marketUnitPrice)} / บาททอง`} />
              <ReadOnlyMetric label="ราคาซื้อรวม" value={formatCurrency(purchasePrice)} />
              <ReadOnlyMetric label="มูลค่าปัจจุบัน" value={formatCurrency(currentValue)} />
            </section>
          )}

          {type === "STOCK" && (
            <section className="grid gap-4 rounded-lg border p-4 sm:col-span-2 sm:grid-cols-2">
              <h3 className="text-sm font-semibold sm:col-span-2">ข้อมูลหุ้น</h3>
              <Field id="stockSymbol" label="ชื่อหุ้น" defaultValue={existing?.symbol ?? "AOT"} />
              <Field id="shares" label="จำนวนหุ้นรวม" defaultValue={String(totalQuantity)} />
              <Field id="avgBuy" label="ราคาซื้อเฉลี่ย" defaultValue={averageBuyPrice.toFixed(2)} />
              <Field id="stockCurrent" label="ราคาปัจจุบัน" defaultValue="58.00" />
              <Field id="dividend" label="เงินปันผลที่ได้รับ" defaultValue={String(existing?.dividendsReceived ?? 0)} />
            </section>
          )}

          {type === "CRYPTO" && (
            <section className="grid gap-4 rounded-lg border p-4 sm:col-span-2 sm:grid-cols-2">
              <h3 className="text-sm font-semibold sm:col-span-2">ข้อมูลคริปโต</h3>
              <Field id="coin" label="เหรียญ" defaultValue={existing?.symbol ?? "BTC"} />
              <Field id="coinAmount" label="จำนวนเหรียญรวม" defaultValue={String(totalQuantity)} />
              <Field id="coinAvg" label="ราคาซื้อเฉลี่ย" defaultValue={averageBuyPrice.toFixed(2)} />
              <Field id="coinCurrent" label="ราคาปัจจุบัน" defaultValue="2855000" />
            </section>
          )}

          {type === "LIFE_INSURANCE" && (
            <section className="grid gap-4 rounded-lg border p-4 sm:col-span-2 sm:grid-cols-2">
              <h3 className="text-sm font-semibold sm:col-span-2">ข้อมูลประกันชีวิต</h3>
              <Field id="policyName" label="ชื่อกรมธรรม์" defaultValue="สะสมทรัพย์ 15/10" />
              <Field id="insurer" label="บริษัทประกัน" defaultValue="บริษัทประกัน A" />
              <Field id="premium" label="เบี้ยที่จ่ายต่อเดือน/ปี" defaultValue="36000" />
              <Field id="surrender" label="มูลค่าเวนคืน" defaultValue="142000" />
              <Field id="coverage" label="ทุนประกัน" defaultValue="1000000" />
              <Field id="maturity" label="วันที่ครบสัญญา" type="date" defaultValue="2037-06-01" />
            </section>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea id="note" name="note" defaultValue={existing?.note} placeholder="รายละเอียดเพิ่มเติม" />
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader><CardTitle>สรุปกำไร/ขาดทุน</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">ราคาซื้อ</span><span>{formatCurrency(purchasePrice)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">จำนวนรวม</span><span>{totalQuantity.toLocaleString("th-TH")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">ราคาเฉลี่ย</span><span>{formatCurrency(averageBuyPrice)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">มูลค่าปัจจุบัน</span><span>{formatCurrency(currentValue)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">เป้าหมาย</span><span>{formatCurrency(targetValue)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">เหลืออีก</span><span>{formatCurrency(Math.max(targetValue - currentValue, 0))}</span></div>
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">ความคืบหน้าเป้าหมาย</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{targetPercent.toFixed(0)}%</span>
              </div>
              <Progress value={targetPercent} indicatorClassName="bg-emerald-500" />
            </div>
            <div className={`flex justify-between gap-3 font-semibold ${getChangeClass(profit)}`}><span>กำไร/ขาดทุน</span><span>{formatCurrency(profit)}</span></div>
            <div className={`flex justify-between gap-3 font-semibold ${getChangeClass(profit)}`}><span>เปอร์เซ็นต์</span><span>{formatPercent(profitPercent)}</span></div>
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
      <Input id={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function LotField({ label, type, value, onChange }: { label: string; type: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
