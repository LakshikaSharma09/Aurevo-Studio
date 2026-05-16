import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongodb";
import { Feedback } from "@/models/Feedback";
import { redirect } from "next/navigation";

export default async function AdminFeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await dbConnect();
  const rows = await Feedback.find().sort({ createdAt: -1 }).limit(300).lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Feedback</h1>
      <div className="overflow-x-auto rounded-xl border border-aurevo-border">
        <table className="min-w-full divide-y divide-aurevo-border text-left text-sm">
          <thead className="bg-aurevo-surface/60 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurevo-border text-gray-200">
            {rows.map((r) => (
              <tr key={String(r._id)}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                  {r.createdAt ? new Date(r.createdAt).toISOString() : "—"}
                </td>
                <td className="px-3 py-2">{r.rating ?? "—"}</td>
                <td className="px-3 py-2">{r.email ?? "—"}</td>
                <td className="px-3 py-2">{r.category ?? "—"}</td>
                <td className="max-w-xl whitespace-pre-wrap px-3 py-2">{r.message}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No feedback yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
