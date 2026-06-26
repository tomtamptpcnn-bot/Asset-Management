"use server";

import { AssetType, BudgetItemType, CashflowCategory, LiabilityStatus, LiabilityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCashflowCategoryValue, getDemoUserId, hasDatabaseUrl, monthKeyToDate } from "@/lib/finance-data";
import { getMarketQuote } from "@/lib/market-prices";
import { prisma } from "@/lib/prisma";

type ActionResult = {
  ok: boolean;
  message: string;
};

type AssetLotInput = {
  purchasedAt: string;
  quantity: number;
  unitPurchasePrice: number;
  purchaseAmount: number;
  currentUnitPrice: number;
  currentValue: number;
  note?: string;
};

export async function saveAsset(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!hasDatabaseUrl()) redirect(withToast("/assets", "error", "บันทึกทรัพย์สินไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const name = String(formData.get("name") ?? "");
  const type = String(formData.get("type") ?? "OTHER") as AssetType;
  const symbol = nullableString(formData.get("symbol"));
  const note = nullableString(formData.get("note"));
  const targetValue = numberOrNull(formData.get("targetValue"));
  const lots = parseLots(String(formData.get("lots") ?? "[]"));
  const purchasePrice = lots.reduce((sum, lot) => sum + lot.purchaseAmount, 0);
  const currentValue = lots.reduce((sum, lot) => sum + lot.currentValue, 0);
  const quantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const userId = await getDemoUserId();

  const data = {
    userId,
    name,
    type,
    note,
    symbol,
    quantity,
    purchasePrice,
    currentValue,
    targetValue,
    purchasedAt: lots[0]?.purchasedAt ? new Date(lots[0].purchasedAt) : null,
    averageBuyPrice: quantity ? purchasePrice / quantity : null,
    currentPrice: quantity ? currentValue / quantity : null
  };

  try {
    if (id) {
      await prisma.asset.update({
        where: { id },
        data: {
          ...data,
          lots: {
            deleteMany: {},
            create: lots.map(mapLotInput)
          }
        }
      });
    } else {
      await prisma.asset.create({
        data: {
          ...data,
          lots: {
            create: lots.map(mapLotInput)
          }
        }
      });
    }
  } catch (error) {
    redirect(withToast(id ? `/assets/${id}/edit` : "/assets/create", "error", "บันทึกทรัพย์สินไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidateFinancePaths();
  redirect(withToast("/assets", "success", id ? "แก้ไขทรัพย์สินสำเร็จ" : "เพิ่มทรัพย์สินสำเร็จ"));
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  if (!hasDatabaseUrl()) return { ok: false, message: "ยังไม่ได้ตั้งค่า DATABASE_URL" };

  try {
    await prisma.asset.delete({ where: { id } });
    revalidateFinancePaths();
    return { ok: true, message: "ลบทรัพย์สินสำเร็จ" };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function refreshAssetMarketPrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!hasDatabaseUrl()) redirect(withToast("/assets", "error", "รีเฟรชราคาไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { lots: true }
  });
  if (!asset) redirect(withToast("/assets", "error", "ไม่พบทรัพย์สินที่ต้องการรีเฟรช"));

  let quote;
  try {
    quote = await getMarketQuote(asset.type, asset.symbol);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ดึงราคาตลาดไม่สำเร็จ";
    redirect(withToast("/assets", "error", "รีเฟรชราคาไม่สำเร็จ", message));
  }
  const quantity = asset.lots.reduce((sum, lot) => sum + lot.quantity.toNumber(), 0);
  const currentValue = quantity * quote.price;

  await prisma.$transaction([
    ...asset.lots.map((lot) =>
      prisma.assetLot.update({
        where: { id: lot.id },
        data: {
          currentUnitPrice: quote.price,
          currentValue: lot.quantity.toNumber() * quote.price
        }
      })
    ),
    prisma.asset.update({
      where: { id },
      data: {
        quantity,
        currentPrice: quote.price,
        currentValue
      }
    }),
    prisma.priceHistory.create({
      data: {
        assetId: id,
        price: quote.price,
        value: currentValue,
        source: "API",
        pricedAt: quote.pricedAt
      }
    })
  ]);

  revalidateFinancePaths();
  redirect(withToast("/assets", "success", "รีเฟรชราคาตลาดสำเร็จ"));
}

export async function saveLiability(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!hasDatabaseUrl()) redirect(withToast("/liabilities", "error", "บันทึกหนี้สินไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const userId = await getDemoUserId();
  const totalInstallments = numberOrNull(formData.get("totalInstallments"));
  const paidInstallments = numberOrZero(formData.get("paidInstallments"));
  const totalAmount = numberOrZero(formData.get("totalAmount"));
  const remainingBalance = numberOrZero(formData.get("remainingBalance"));

  const data = {
    userId,
    name: String(formData.get("name") ?? ""),
    creditor: String(formData.get("creditor") ?? ""),
    type: String(formData.get("type") ?? "INSTALLMENT") as LiabilityType,
    totalAmount,
    remainingBalance,
    interestRatePerYear: numberOrNull(formData.get("interestRatePerYear")),
    interestRatePerMonth: numberOrNull(formData.get("interestRatePerMonth")),
    monthlyPayment: numberOrZero(formData.get("monthlyPayment")),
    totalInstallments,
    paidInstallments,
    dueDate: nullableString(formData.get("dueDate")) ? new Date(String(formData.get("dueDate"))) : null,
    status: String(formData.get("status") ?? "ACTIVE") as LiabilityStatus
  };

  try {
    if (id) {
      await prisma.liability.update({ where: { id }, data });
    } else {
      await prisma.liability.create({ data });
    }
  } catch (error) {
    redirect(withToast(id ? `/liabilities/${id}/edit` : "/liabilities/create", "error", "บันทึกหนี้สินไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidateFinancePaths();
  redirect(withToast("/liabilities", "success", id ? "แก้ไขหนี้สินสำเร็จ" : "เพิ่มหนี้สินสำเร็จ"));
}

export async function deleteLiability(id: string): Promise<ActionResult> {
  if (!hasDatabaseUrl()) return { ok: false, message: "ยังไม่ได้ตั้งค่า DATABASE_URL" };

  try {
    await prisma.liability.delete({ where: { id } });
    revalidateFinancePaths();
    return { ok: true, message: "ลบหนี้สินสำเร็จ" };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function saveDefaultCashflowItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "บันทึกรายการ default ไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const userId = await getDemoUserId();
  const data = {
    userId,
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "EXPENSE") as BudgetItemType,
    category: getCashflowCategoryValue(String(formData.get("category") ?? "OTHER")) as CashflowCategory,
    amount: numberOrZero(formData.get("amount")),
    dueDay: numberOrNull(formData.get("dueDay")),
    note: nullableString(formData.get("note")),
    isActive: String(formData.get("isActive") ?? "true") === "true"
  };

  try {
    if (id) {
      await prisma.defaultCashflowItem.update({ where: { id }, data });
    } else {
      await prisma.defaultCashflowItem.create({ data });
    }
  } catch (error) {
    redirect(withToast(redirectPath, "error", "บันทึกรายการ default ไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", id ? "แก้ไขรายการ default สำเร็จ" : "เพิ่มรายการ default สำเร็จ"));
}

export async function deleteDefaultCashflowItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "ลบรายการ default ไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  try {
    await prisma.defaultCashflowItem.delete({ where: { id } });
  } catch (error) {
    redirect(withToast(redirectPath, "error", "ลบรายการ default ไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", "ลบรายการ default สำเร็จ"));
}

export async function deleteDefaultCashflowItemById(id: string): Promise<ActionResult> {
  if (!hasDatabaseUrl()) return { ok: false, message: "ยังไม่ได้ตั้งค่า DATABASE_URL" };

  try {
    await prisma.defaultCashflowItem.delete({ where: { id } });
    revalidatePath("/income-expense");
    return { ok: true, message: "ลบรายการ default สำเร็จ" };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function saveMonthlyBudgetItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "บันทึกรายการรายเดือนไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const userId = await getDemoUserId();
  try {
    await prisma.monthlyBudgetItem.create({
      data: {
        userId,
        month: monthKeyToDate(month),
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? "EXPENSE") as BudgetItemType,
        category: getCashflowCategoryValue(String(formData.get("category") ?? "OTHER")) as CashflowCategory,
        amount: numberOrZero(formData.get("amount")),
        dueDate: nullableString(formData.get("dueDate")) ? new Date(String(formData.get("dueDate"))) : null,
        note: nullableString(formData.get("note"))
      }
    });
  } catch (error) {
    redirect(withToast(redirectPath, "error", "บันทึกรายการรายเดือนไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", "เพิ่มรายการรายเดือนสำเร็จ"));
}

export async function createMonthlyItemsFromDefaults(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "สร้างรายการเดือนนี้ไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  const userId = await getDemoUserId();
  const monthDate = monthKeyToDate(month);
  try {
    const defaults = await prisma.defaultCashflowItem.findMany({
      where: { userId, isActive: true }
    });
    const existing = await prisma.monthlyBudgetItem.findMany({
      where: { userId, month: monthDate, defaultItemId: { in: defaults.map((item) => item.id) } },
      select: { defaultItemId: true }
    });
    const existingIds = new Set(existing.map((item) => item.defaultItemId));
    const itemsToCreate = defaults.filter((item) => !existingIds.has(item.id));

    await prisma.monthlyBudgetItem.createMany({
      data: itemsToCreate.map((item) => ({
        userId,
        defaultItemId: item.id,
        month: monthDate,
        name: item.name,
        type: item.type,
        category: item.category,
        amount: item.amount,
        dueDate: item.dueDay ? new Date(`${month}-${String(item.dueDay).padStart(2, "0")}T00:00:00.000Z`) : null,
        note: item.note
      }))
    });
  } catch (error) {
    redirect(withToast(redirectPath, "error", "สร้างรายการเดือนนี้ไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", "สร้างรายการเดือนนี้จาก default สำเร็จ"));
}

export async function toggleMonthlyBudgetItemPaid(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  const isPaid = String(formData.get("isPaid") ?? "false") === "true";
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "อัปเดตสถานะไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  try {
    await prisma.monthlyBudgetItem.update({
      where: { id },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null
      }
    });
  } catch (error) {
    redirect(withToast(redirectPath, "error", "อัปเดตสถานะไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", isPaid ? "บันทึกว่าทำรายการแล้ว" : "บันทึกว่ายังไม่เรียบร้อย"));
}

export async function deleteMonthlyBudgetItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  const redirectPath = `/income-expense?month=${month}`;
  if (!hasDatabaseUrl()) redirect(withToast(redirectPath, "error", "ลบรายการรายเดือนไม่สำเร็จ", "ยังไม่ได้ตั้งค่า DATABASE_URL"));

  try {
    await prisma.monthlyBudgetItem.delete({ where: { id } });
  } catch (error) {
    redirect(withToast(redirectPath, "error", "ลบรายการรายเดือนไม่สำเร็จ", getErrorMessage(error)));
  }

  revalidatePath("/income-expense");
  redirect(withToast(redirectPath, "success", "ลบรายการรายเดือนสำเร็จ"));
}

function parseLots(value: string): AssetLotInput[] {
  try {
    const lots = JSON.parse(value) as AssetLotInput[];
    return lots.length
      ? lots.map((lot) => ({
          purchasedAt: lot.purchasedAt,
          quantity: Number(lot.quantity),
          unitPurchasePrice: Number(lot.unitPurchasePrice),
          purchaseAmount: Number(lot.purchaseAmount),
          currentUnitPrice: Number(lot.currentUnitPrice),
          currentValue: Number(lot.currentValue),
          note: lot.note
        }))
      : [];
  } catch {
    return [];
  }
}

function mapLotInput(lot: AssetLotInput) {
  return {
    purchasedAt: new Date(lot.purchasedAt),
    quantity: lot.quantity,
    unitPurchasePrice: lot.unitPurchasePrice,
    purchaseAmount: lot.purchaseAmount,
    currentUnitPrice: lot.currentUnitPrice,
    currentValue: lot.currentValue,
    note: lot.note
  };
}

function nullableString(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue ? stringValue : null;
}

function numberOrZero(value: FormDataEntryValue | null) {
  return Number(value ?? 0) || 0;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const numberValue = Number(value ?? "");
  return Number.isFinite(numberValue) && String(value ?? "").trim() !== "" ? numberValue : null;
}

function revalidateFinancePaths() {
  ["/dashboard", "/assets", "/liabilities", "/reports", "/income-expense"].forEach((path) => revalidatePath(path));
}

function withToast(path: string, tone: "success" | "error", title: string, description?: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("toast", tone);
  params.set("toastTitle", title);
  if (description) params.set("toastDescription", description);
  return `${pathname}?${params.toString()}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "เกิดข้อผิดพลาด กรุณาลองใหม่";
}
