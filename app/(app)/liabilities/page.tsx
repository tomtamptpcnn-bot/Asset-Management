import { LiabilityList } from "@/components/liability-list";
import { getLiabilities } from "@/lib/finance-data";

export default async function LiabilitiesPage() {
  const liabilities = await getLiabilities();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">หนี้สิน</h1>
        <p className="text-sm text-muted-foreground">ติดตามยอดคงเหลือ ดอกเบี้ย งวดผ่อน และความคืบหน้าการปิดหนี้</p>
      </div>
      <LiabilityList initialRows={liabilities} />
    </div>
  );
}
