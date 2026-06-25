import { Bell, Database, Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">ตั้งค่า</h1>
        <p className="text-sm text-muted-foreground">โปรไฟล์ ความปลอดภัย การแจ้งเตือน และการเชื่อมต่อฐานข้อมูล</p>
      </div>
      <section className="grid gap-4 xl:grid-cols-2">
        <SettingsCard icon={UserRound} title="โปรไฟล์" description="ข้อมูลผู้ใช้งาน">
          <Label htmlFor="name">ชื่อ</Label>
          <Input id="name" defaultValue="ต๋อมแต๋ม" />
          <Label htmlFor="email">อีเมล</Label>
          <Input id="email" type="email" defaultValue="demo@example.com" />
        </SettingsCard>
        {/* <SettingsCard icon={Lock} title="ความปลอดภัย" description="NextAuth/JWT พร้อม Prisma Adapter">
          <Label htmlFor="auth">Auth mode</Label>
          <Input id="auth" defaultValue="NextAuth v5 + Prisma Adapter" />
          <Button className="mt-2">บันทึกการตั้งค่า</Button>
        </SettingsCard>
        <SettingsCard icon={Bell} title="การแจ้งเตือน" description="วันครบกำหนดชำระและราคาเปลี่ยนแปลง">
          <Label htmlFor="due">เตือนก่อนครบกำหนดชำระ</Label>
          <Input id="due" defaultValue="3 วัน" />
          <Label htmlFor="price">แจ้งเตือนกำไร/ขาดทุน</Label>
          <Input id="price" defaultValue="เมื่อเปลี่ยนเกิน 5%" />
        </SettingsCard>
        <SettingsCard icon={Database} title="ฐานข้อมูล" description="PostgreSQL ผ่าน Prisma ORM">
          <Label htmlFor="db">DATABASE_URL</Label>
          <Input id="db" defaultValue="postgresql://.../personal_finance" />
          <Button variant="outline" className="mt-2">ทดสอบการเชื่อมต่อ</Button>
        </SettingsCard> */}
      </section>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Icon className="h-5 w-5" /></div>
        <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );
}
