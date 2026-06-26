export const assetTypes = [
  { value: "CASH", label: "เงินสด" },
  { value: "BANK_DEPOSIT", label: "เงินฝากธนาคาร" },
  { value: "GOLD", label: "ทองคำ" },
  { value: "STOCK", label: "หุ้น" },
  { value: "FUND", label: "กองทุน" },
  { value: "CRYPTO", label: "คริปโต" },
  { value: "LIFE_INSURANCE", label: "ประกันชีวิต" },
  { value: "PROPERTY", label: "ที่ดิน/บ้าน/รถ" },
  { value: "OTHER", label: "ทรัพย์สินอื่น ๆ" }
] as const;

export const liabilityTypes = [
  { value: "SHORT_TERM", label: "หนี้ระยะสั้น" },
  { value: "LONG_TERM", label: "หนี้ระยะยาว" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "PERSONAL_LOAN", label: "สินเชื่อส่วนบุคคล" },
  { value: "MORTGAGE", label: "ผ่อนบ้าน" },
  { value: "AUTO_LOAN", label: "ผ่อนรถ" },
  { value: "INSTALLMENT", label: "ผ่อนสินค้า" },
  { value: "INFORMAL_OTHER", label: "หนี้นอกระบบ/อื่น ๆ" }
] as const;

export type AssetLot = {
  id: string;
  purchasedAt: string;
  quantity: number;
  unitPurchasePrice: number;
  purchaseAmount: number;
  currentUnitPrice: number;
  currentValue: number;
  note?: string;
  attachmentUrl?: string;
  goldWeightBaht?: number;
  goldWeightGram?: number;
  dividendsReceived?: number;
};

export type AssetItem = {
  id: string;
  name: string;
  type: string;
  label: string;
  note: string;
  attachmentUrl?: string;
  symbol?: string;
  dividendsReceived?: number;
  targetValue?: number;
  lots: AssetLot[];
};

export type BudgetItemType = "INCOME" | "EXPENSE";

export type DefaultCashflowItem = {
  id: string;
  name: string;
  type: BudgetItemType;
  category: string;
  amount: number;
  dueDay?: number;
  isActive: boolean;
  note?: string;
};

export type MonthlyBudgetItem = {
  id: string;
  defaultItemId?: string;
  month: string;
  name: string;
  type: BudgetItemType;
  category: string;
  amount: number;
  dueDate?: string;
  isPaid: boolean;
  paidAt?: string;
  note?: string;
};

export function getTotals(assetRows: AssetItem[] = [], liabilityRows: Array<{ remainingBalance: number }> = []) {
  const totalAssets = assetRows.reduce((sum, item) => sum + getAssetCurrentValue(item), 0);
  const totalPurchase = assetRows.reduce((sum, item) => sum + getAssetPurchaseAmount(item), 0);
  const totalLiabilities = liabilityRows.reduce((sum, item) => sum + item.remainingBalance, 0);
  const profitLoss = totalAssets - totalPurchase;
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    profitLoss,
    profitLossPercent: totalPurchase ? (profitLoss / totalPurchase) * 100 : 0
  };
}

export function getAssetQuantity(asset: AssetItem) {
  return asset.lots.reduce((sum, lot) => sum + lot.quantity, 0);
}

export function getAssetPurchaseAmount(asset: AssetItem) {
  return asset.lots.reduce((sum, lot) => sum + lot.purchaseAmount, 0);
}

export function getAssetCurrentValue(asset: AssetItem) {
  return asset.lots.reduce((sum, lot) => sum + lot.currentValue, 0);
}

export function getAssetAverageBuyPrice(asset: AssetItem) {
  const quantity = getAssetQuantity(asset);
  return quantity ? getAssetPurchaseAmount(asset) / quantity : 0;
}
