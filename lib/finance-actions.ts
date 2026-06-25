"use server";

import { AssetType, BudgetItemType, CashflowCategory, LiabilityStatus, LiabilityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCashflowCategoryValue, getDemoUserId, hasDatabaseUrl, monthKeyToDate } from "@/lib/finance-data";
import { getMarketQuote } from "@/lib/market-prices";
import { prisma } from "@/lib/prisma";

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
  if (!hasDatabaseUrl()) redirect("/assets");

  const id = String(formData.get("id") ?? "");
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

  revalidateFinancePaths();
  redirect("/assets");
}

export async function deleteAsset(id: string) {
  if (!hasDatabaseUrl()) return;
  await prisma.asset.delete({ where: { id } });
  revalidateFinancePaths();
}

export async function refreshAssetMarketPrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!hasDatabaseUrl()) redirect("/assets");

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { lots: true }
  });
  if (!asset) redirect("/assets");

  let quote;
  try {
    quote = await getMarketQuote(asset.type, asset.symbol);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ดึงราคาตลาดไม่สำเร็จ";
    redirect(`/assets?marketError=${encodeURIComponent(message)}`);
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
  redirect("/assets");
}

export async function saveLiability(formData: FormData) {
  if (!hasDatabaseUrl()) redirect("/liabilities");

  const id = String(formData.get("id") ?? "");
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

  if (id) {
    await prisma.liability.update({ where: { id }, data });
  } else {
    await prisma.liability.create({ data });
  }

  revalidateFinancePaths();
  redirect("/liabilities");
}

export async function deleteLiability(id: string) {
  if (!hasDatabaseUrl()) return;
  await prisma.liability.delete({ where: { id } });
  revalidateFinancePaths();
}

export async function saveDefaultCashflowItem(formData: FormData) {
  if (!hasDatabaseUrl()) redirect(`/income-expense?month=${String(formData.get("month") ?? "")}`);

  const userId = await getDemoUserId();
  const month = String(formData.get("month") ?? "");
  await prisma.defaultCashflowItem.create({
    data: {
      userId,
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "EXPENSE") as BudgetItemType,
      category: getCashflowCategoryValue(String(formData.get("category") ?? "OTHER")) as CashflowCategory,
      amount: numberOrZero(formData.get("amount")),
      dueDay: numberOrNull(formData.get("dueDay")),
      note: nullableString(formData.get("note"))
    }
  });

  revalidatePath("/income-expense");
  redirect(`/income-expense?month=${month}`);
}

export async function saveMonthlyBudgetItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  if (!hasDatabaseUrl()) redirect(`/income-expense?month=${month}`);

  const userId = await getDemoUserId();
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

  revalidatePath("/income-expense");
  redirect(`/income-expense?month=${month}`);
}

export async function createMonthlyItemsFromDefaults(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  if (!hasDatabaseUrl()) redirect(`/income-expense?month=${month}`);

  const userId = await getDemoUserId();
  const monthDate = monthKeyToDate(month);
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

  revalidatePath("/income-expense");
  redirect(`/income-expense?month=${month}`);
}

export async function toggleMonthlyBudgetItemPaid(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  const isPaid = String(formData.get("isPaid") ?? "false") === "true";
  if (!hasDatabaseUrl()) redirect(`/income-expense?month=${month}`);

  await prisma.monthlyBudgetItem.update({
    where: { id },
    data: {
      isPaid,
      paidAt: isPaid ? new Date() : null
    }
  });

  revalidatePath("/income-expense");
  redirect(`/income-expense?month=${month}`);
}

export async function deleteMonthlyBudgetItem(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!hasDatabaseUrl()) redirect(`/income-expense?month=${month}`);

  await prisma.monthlyBudgetItem.delete({ where: { id } });
  revalidatePath("/income-expense");
  redirect(`/income-expense?month=${month}`);
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
