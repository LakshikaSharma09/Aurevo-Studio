import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-aurevo-border bg-aurevo-surface/50 py-10 text-sm text-gray-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="max-w-xl">
          Aurevo Studio practices what we sell: AI-assisted chat, structured lead capture,
          and feedback loops on our own site—so you can see the experience before you buy
          it.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/terms" className="text-gray-400 no-underline hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="text-gray-400 no-underline hover:text-white">
            Privacy
          </Link>
          <Link href="/book" className="text-aurevo-accent no-underline hover:text-aurevo-accentDim">
            Book a call
          </Link>
        </div>
      </div>
    </footer>
  );
}
