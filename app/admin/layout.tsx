import Link from "next/link";
import { auth } from "@/auth";
import { AdminBar } from "@/components/AdminBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="space-y-8">
      {session ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-aurevo-border bg-aurevo-surface/40 px-4 py-3">
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/leads" className="text-gray-300 no-underline hover:text-white">
              Leads
            </Link>
            <Link href="/admin/feedback" className="text-gray-300 no-underline hover:text-white">
              Feedback
            </Link>
            <Link href="/admin/analyses" className="text-gray-300 no-underline hover:text-white">
              Analyses
            </Link>
          </nav>
          <AdminBar />
        </div>
      ) : null}
      {children}
    </div>
  );
}
