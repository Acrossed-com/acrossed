import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/admin";
import { DashboardTabs } from "./DashboardTabs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const adminResult = await requireAdmin();
  const isAdmin = !!adminResult;

  return (
    <>
      <Nav />
      <div className="mx-auto max-w-page px-6 pt-6">
        <DashboardTabs isAdmin={isAdmin} />
      </div>
      <main className="mx-auto max-w-page px-6 py-8">{children}</main>
      <Footer />
    </>
  );
}
