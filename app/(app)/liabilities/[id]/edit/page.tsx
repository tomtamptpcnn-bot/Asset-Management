import { LiabilityForm } from "@/components/forms/liability-form";
import { getLiability } from "@/lib/finance-data";

export default async function EditLiabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const liability = await getLiability(id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">แก้ไขหนี้สิน</h1>
        <p className="text-sm text-muted-foreground">อัปเดตยอดคงเหลือ งวดผ่อน และสถานะหนี้</p>
      </div>
      <LiabilityForm liability={liability} />
    </div>
  );
}
