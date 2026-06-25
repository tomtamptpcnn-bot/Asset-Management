import { AssetForm } from "@/components/forms/asset-form";
import { getAsset } from "@/lib/finance-data";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAsset(id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">แก้ไขทรัพย์สิน</h1>
        <p className="text-sm text-muted-foreground">ปรับราคาปัจจุบัน เอกสารแนบ และรายละเอียดเฉพาะประเภท</p>
      </div>
      <AssetForm asset={asset} />
    </div>
  );
}
