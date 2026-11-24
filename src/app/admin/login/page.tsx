import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Login do painel",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-4 py-12">
      <Logo href="/" />
      <AdminLogin />
    </div>
  );
}
