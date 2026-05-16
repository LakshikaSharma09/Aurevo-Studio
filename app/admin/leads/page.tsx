import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";
import { redirect } from "next/navigation";
import { LeadStatusSelect } from "@/components/LeadStatusSelect";

export default async function AdminLeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await dbConnect();
  const leads = await Lead.find().sort({ createdAt: -1 }).limit(300).lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Leads</h1>
      <div className="overflow-x-auto rounded-xl border border-aurevo-border">
        <table className="min-w-full divide-y divide-aurevo-border text-left text-sm">
          <thead className="bg-aurevo-surface/60 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurevo-border text-gray-200">
            {leads.map((l) => (
              <tr key={String(l._id)}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                  {l.createdAt ? new Date(l.createdAt).toISOString() : "—"}
                </td>
                <td className="px-3 py-2">{l.name}</td>
                <td className="px-3 py-2">{l.email}</td>
                <td className="px-3 py-2">{l.company ?? "—"}</td>
                <td className="max-w-[200px] truncate px-3 py-2">{l.clientUrl ?? "—"}</td>
                <td className="px-3 py-2">
                  <LeadStatusSelect id={String(l._id)} status={l.status} />
                </td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  No leads yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
