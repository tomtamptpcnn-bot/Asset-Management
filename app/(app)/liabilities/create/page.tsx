import { LiabilityForm } from "@/components/forms/liability-form";

export default function CreateLiabilityPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">เพิ่มหนี้สิน</h1>
        <p className="text-sm text-muted-foreground">บันทึกเจ้าหนี้ ยอดผ่อน ดอกเบี้ย และวันครบกำหนดชำระ</p>
      </div>
      <LiabilityForm />
    </div>
  );
}
