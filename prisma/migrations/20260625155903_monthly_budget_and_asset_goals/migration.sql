-- CreateEnum
CREATE TYPE "BudgetItemType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "targetValue" DECIMAL(18,2);

-- CreateTable
CREATE TABLE "DefaultCashflowItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BudgetItemType" NOT NULL,
    "category" "CashflowCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "dueDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultCashflowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBudgetItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultItemId" TEXT,
    "month" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BudgetItemType" NOT NULL,
    "category" "CashflowCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DefaultCashflowItem_userId_type_isActive_idx" ON "DefaultCashflowItem"("userId", "type", "isActive");

-- CreateIndex
CREATE INDEX "MonthlyBudgetItem_userId_month_type_isPaid_idx" ON "MonthlyBudgetItem"("userId", "month", "type", "isPaid");

-- AddForeignKey
ALTER TABLE "DefaultCashflowItem" ADD CONSTRAINT "DefaultCashflowItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBudgetItem" ADD CONSTRAINT "MonthlyBudgetItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBudgetItem" ADD CONSTRAINT "MonthlyBudgetItem_defaultItemId_fkey" FOREIGN KEY ("defaultItemId") REFERENCES "DefaultCashflowItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
