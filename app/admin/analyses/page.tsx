import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { redirect } from "next/navigation";

export default async function AdminAnalysesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await dbConnect();
  const rows = await Analysis.find().sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Analyses</h1>
      <div className="space-y-4">
        {rows.map((r) => (
          <div
            key={String(r._id)}
            className="rounded-xl border border-aurevo-border bg-aurevo-surface/30 p-4 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-gray-400">
              <span>{r.createdAt ? new Date(r.createdAt).toISOString() : ""}</span>
              <span className="text-aurevo-accent">{r.model}</span>
            </div>
            <p className="mt-2 truncate text-gray-200">{r.finalUrl ?? r.url}</p>
            {r.error ? (
              <p className="mt-2 text-red-400">{r.error}</p>
            ) : (
              <p className="mt-2 text-gray-300">
                {(r.structured as { summary?: string })?.summary ?? ""}
              </p>
            )}
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-gray-500">No analyses recorded yet.</p>
        ) : null}
      </div>
    </div>
  );
}
