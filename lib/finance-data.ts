import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type AssetItem, type AssetLot, type DefaultCashflowItem, type MonthlyBudgetItem } from "@/lib/mock-data";

export type LiabilityItem = {
  id: string;
  name: string;
  creditor: string;
  type: string;
  label: string;
  totalAmount: number;
  remainingBalance: number;
  interestRatePerYear: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDate: string;
  status: string;
};

const demoEmail = "demo@example.com";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getDemoUserId() {
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo User"
    },
    select: { id: true }
  });
  return user.id;
}

export async function getAssets(): Promise<AssetItem[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const userId = await getDemoUserId();
    const rows = await prisma.asset.findMany({
      where: { userId },
      include: { lots: { orderBy: { purchasedAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });

    return rows.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      label: getAssetTypeLabel(asset.type),
      note: asset.note ?? "",
      attachmentUrl: asset.attachmentUrl ?? undefined,
      symbol: asset.symbol ?? undefined,
      dividendsReceived: toNumber(asset.dividendsReceived),
      targetValue: toNumber(asset.targetValue),
      lots: asset.lots.map((lot): AssetLot => ({
        id: lot.id,
        purchasedAt: lot.purchasedAt.toISOString().slice(0, 10),
        quantity: toNumber(lot.quantity),
        unitPurchasePrice: toNumber(lot.unitPurchasePrice),
        purchaseAmount: toNumber(lot.purchaseAmount),
        currentUnitPrice: toNumber(lot.currentUnitPrice),
        currentValue: toNumber(lot.currentValue),
        note: lot.note ?? undefined,
        attachmentUrl: lot.attachmentUrl ?? undefined,
        goldWeightBaht: toNumber(lot.goldWeightBaht),
        goldWeightGram: toNumber(lot.goldWeightGram),
        dividendsReceived: toNumber(lot.dividendsReceived)
      }))
    }));
  } catch {
    return [];
  }
}

export async function getMonthlyBudget(month = getCurrentMonthKey()): Promise<{
  month: string;
  defaults: DefaultCashflowItem[];
  items: MonthlyBudgetItem[];
}> {
  if (!hasDatabaseUrl()) {
    return {
      month,
      defaults: [],
      items: []
    };
  }

  try {
    const userId = await getDemoUserId();
    const monthDate = monthKeyToDate(month);
    const [defaults, items] = await Promise.all([
      prisma.defaultCashflowItem.findMany({
        where: { userId, isActive: true },
        orderBy: [{ type: "asc" }, { dueDay: "asc" }, { name: "asc" }]
      }),
      prisma.monthlyBudgetItem.findMany({
        where: { userId, month: monthDate },
        orderBy: [{ type: "asc" }, { dueDate: "asc" }, { name: "asc" }]
      })
    ]);

    return {
      month,
      defaults: defaults.map((item): DefaultCashflowItem => ({
        id: item.id,
        name: item.name,
        type: item.type,
        category: getCashflowCategoryLabel(item.category),
        amount: toNumber(item.amount),
        dueDay: item.dueDay ?? undefined,
        isActive: item.isActive
      })),
      items: items.map((item): MonthlyBudgetItem => ({
        id: item.id,
        defaultItemId: item.defaultItemId ?? undefined,
        month,
        name: item.name,
        type: item.type,
        category: getCashflowCategoryLabel(item.category),
        amount: toNumber(item.amount),
        dueDate: item.dueDate?.toISOString().slice(0, 10),
        isPaid: item.isPaid,
        paidAt: item.paidAt?.toISOString().slice(0, 10)
      }))
    };
  } catch {
    return {
      month,
      defaults: [],
      items: []
    };
  }
}

export async function getAsset(id: string): Promise<AssetItem | undefined> {
  const assets = await getAssets();
  return assets.find((asset) => asset.id === id);
}

export async function getLiabilities(): Promise<LiabilityItem[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const userId = await getDemoUserId();
    const rows = await prisma.liability.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });

    return rows.map((liability) => ({
      id: liability.id,
      name: liability.name,
      creditor: liability.creditor,
      type: liability.type,
      label: getLiabilityTypeLabel(liability.type),
      totalAmount: toNumber(liability.totalAmount),
      remainingBalance: toNumber(liability.remainingBalance),
      interestRatePerYear: toNumber(liability.interestRatePerYear),
      monthlyPayment: toNumber(liability.monthlyPayment),
      totalInstallments: liability.totalInstallments ?? 0,
      paidInstallments: liability.paidInstallments,
      dueDate: liability.dueDate?.toISOString().slice(0, 10) ?? "",
      status: liability.status
    }));
  } catch {
    return [];
  }
}

export async function getLiability(id: string): Promise<LiabilityItem | undefined> {
  const liabilities = await getLiabilities();
  return liabilities.find((liability) => liability.id === id);
}

export async function getDashboardData() {
  const [assets, liabilities] = await Promise.all([getAssets(), getLiabilities()]);
  return {
    assets,
    liabilities
  };
}

export function getAssetTypeLabel(type: string) {
  const labels: Record<string, string> = {
    CASH: "เงินสด",
    BANK_DEPOSIT: "เงินฝากธนาคาร",
    GOLD: "ทองคำ",
    STOCK: "หุ้น",
    FUND: "กองทุน",
    CRYPTO: "คริปโต",
    LIFE_INSURANCE: "ประกันชีวิต",
    PROPERTY: "ที่ดิน/บ้าน/รถ",
    OTHER: "ทรัพย์สินอื่น ๆ"
  };
  return labels[type] ?? type;
}

export function getLiabilityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SHORT_TERM: "หนี้ระยะสั้น",
    LONG_TERM: "หนี้ระยะยาว",
    CREDIT_CARD: "บัตรเครดิต",
    PERSONAL_LOAN: "สินเชื่อส่วนบุคคล",
    MORTGAGE: "ผ่อนบ้าน",
    AUTO_LOAN: "ผ่อนรถ",
    INSTALLMENT: "ผ่อนสินค้า",
    INFORMAL_OTHER: "หนี้นอกระบบ/อื่น ๆ"
  };
  return labels[type] ?? type;
}

export function getCashflowCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    SALARY: "เงินเดือน",
    BONUS: "โบนัส/ปันผล",
    SIDE_INCOME: "รายได้เสริม",
    FOOD: "อาหาร",
    TRANSPORT: "เดินทาง",
    DEBT_PAYMENT: "ค่าผ่อน",
    INSURANCE: "ประกัน",
    SHOPPING: "ช้อปปิ้ง",
    HOUSING: "ที่อยู่อาศัย",
    FAMILY: "ครอบครัว",
    HEALTH: "สุขภาพ",
    EDUCATION: "การศึกษา",
    OTHER: "อื่น ๆ"
  };
  return labels[category] ?? category;
}

export function getCashflowCategoryValue(label: string) {
  const values: Record<string, string> = {
    "เงินเดือน": "SALARY",
    "โบนัส/ปันผล": "BONUS",
    "รายได้เสริม": "SIDE_INCOME",
    "อาหาร": "FOOD",
    "เดินทาง": "TRANSPORT",
    "ค่าผ่อน": "DEBT_PAYMENT",
    "ประกัน": "INSURANCE",
    "ช้อปปิ้ง": "SHOPPING",
    "ที่อยู่อาศัย": "HOUSING",
    "ครอบครัว": "FAMILY",
    "สุขภาพ": "HEALTH",
    "การศึกษา": "EDUCATION",
    "อื่น ๆ": "OTHER"
  };
  return values[label] ?? (isCashflowCategory(label) ? label : "OTHER");
}

export const cashflowCategoryOptions = [
  { value: "SALARY", label: "เงินเดือน" },
  { value: "BONUS", label: "โบนัส/ปันผล" },
  { value: "SIDE_INCOME", label: "รายได้เสริม" },
  { value: "FOOD", label: "อาหาร" },
  { value: "TRANSPORT", label: "เดินทาง" },
  { value: "DEBT_PAYMENT", label: "ค่าผ่อน" },
  { value: "INSURANCE", label: "ประกัน" },
  { value: "SHOPPING", label: "ช้อปปิ้ง" },
  { value: "HOUSING", label: "ที่อยู่อาศัย" },
  { value: "FAMILY", label: "ครอบครัว" },
  { value: "HEALTH", label: "สุขภาพ" },
  { value: "EDUCATION", label: "การศึกษา" },
  { value: "OTHER", label: "อื่น ๆ" }
] as const;

function isCashflowCategory(value: string) {
  return cashflowCategoryOptions.some((option) => option.value === value);
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function monthKeyToDate(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}
