import { AssetList } from "@/components/asset-list";
import { Card, CardContent } from "@/components/ui/card";
import { getAssets } from "@/lib/finance-data";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ marketError?: string }> }) {
  const params = await searchParams;
  const assets = await getAssets();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">ทรัพย์สิน</h1>
        <p className="text-sm text-muted-foreground">บันทึกเงินสด เงินฝาก ทอง หุ้น กองทุน คริปโต ประกัน และทรัพย์สินอื่น ๆ</p>
      </div>
      {params.marketError ? (
        <Card className="border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
          <CardContent className="p-4 text-sm">{params.marketError}</CardContent>
        </Card>
      ) : null}
      <AssetList initialRows={assets} />
    </div>
  );
}
