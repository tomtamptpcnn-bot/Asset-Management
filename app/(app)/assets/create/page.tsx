import { AssetForm } from "@/components/forms/asset-form";

export default function CreateAssetPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">เพิ่มทรัพย์สิน</h1>
        <p className="text-sm text-muted-foreground">กรอกข้อมูลและดูผลกำไร/ขาดทุนแบบทันที</p>
      </div>
      <AssetForm />
    </div>
  );
}
