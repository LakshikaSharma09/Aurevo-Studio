import Link from "next/link";

const pillars = [
  {
    title: "Assistant layer",
    body: "Answer visitor questions, route leads, and keep tone consistent with your brand—without burning down your support inbox.",
  },
  {
    title: "Operational automation",
    body: "Forms, notifications, CRM handoffs, scheduling hooks—whatever repeats should not eat your team alive.",
  },
  {
    title: "Trust-first delivery",
    body: "Guardrails, validation, privacy review, and staged rollouts so automation helps you—never surprises you.",
  },
];

const steps = [
  "Discovery call to align outcomes, constraints, and stack.",
  "Technical pass on the site + integrations you already use.",
  "Phased implementation with instrumentation and tuning.",
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-aurevo-accent">
            Aurevo Studio
          </p>
          <h1 className="text-balance text-4xl font-semibold text-white sm:text-5xl">
            AI automation for websites that should work while you sleep.
          </h1>
          <p className="max-w-2xl text-lg text-gray-300">
            We build the same patterns on our own site—chat, structured capture, feedback, and
            AI-assisted analysis—so you can experience the product before you buy the service.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className="rounded-lg bg-aurevo-accent px-5 py-3 text-sm font-semibold text-aurevo-ink no-underline hover:bg-teal-300"
            >
              Analyze your site
            </Link>
            <Link
              href="/book"
              className="rounded-lg border border-aurevo-border px-5 py-3 text-sm font-semibold text-white no-underline hover:border-aurevo-accent/60"
            >
              Book a consultation
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Prefer human-first? We will never ship black-box automations without clear ownership.
          </p>
        </div>
        <div className="rounded-2xl border border-aurevo-border bg-gradient-to-br from-aurevo-surface to-aurevo-ink p-6 shadow-2xl">
          <p className="text-sm font-semibold text-aurevo-accent">Live on this property</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-aurevo-accent">•</span>
              Streaming assistant (“Ask Aurevo”) grounded in our services.
            </li>
            <li className="flex gap-2">
              <span className="text-aurevo-accent">•</span>
              URL analysis demo with structured automation ideas.
            </li>
            <li className="flex gap-2">
              <span className="text-aurevo-accent">•</span>
              Lead + feedback APIs stored in MongoDB with admin review.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">What we automate</h2>
          <p className="mt-2 max-w-2xl text-gray-400">
            Pick a lane to start; most teams stack these over time as trust grows.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-aurevo-border bg-aurevo-surface/40 p-5"
            >
              <h3 className="text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">How engagements run</h2>
          <ol className="space-y-3 text-sm text-gray-300">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aurevo-border text-xs font-bold text-aurevo-accent">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-dashed border-aurevo-border p-6">
          <h3 className="text-lg font-semibold text-white">Proof, not promises</h3>
          <p className="mt-2 text-sm text-gray-400">
            Case studies and logos land here next. For now, use the analyzer and assistant on
            this site—they are the same integration patterns we ship for clients.
          </p>
          <Link href="/feedback" className="mt-4 inline-block text-sm font-semibold">
            Tell us what you would like to see as social proof →
          </Link>
        </div>
      </section>
    </div>
  );
}
