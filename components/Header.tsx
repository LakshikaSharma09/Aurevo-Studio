import Link from "next/link";

const nav = [
  { href: "/analyze", label: "Analyze" },
  { href: "/book", label: "Book" },
  { href: "/feedback", label: "Feedback" },
];

export function Header() {
  return (
    <header className="border-b border-aurevo-border bg-aurevo-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2 text-inherit no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-aurevo-accent to-teal-700 text-aurevo-ink font-bold">
            A
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-200 group-hover:text-white">
            Aurevo Studio
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-300 no-underline hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/privacy"
            className="text-sm text-gray-500 no-underline hover:text-gray-300"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
