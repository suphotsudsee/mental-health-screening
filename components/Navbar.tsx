"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/assess", label: "เริ่มแบบประเมิน" },
  { href: "/history", label: "ประวัติ" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="h-2 w-2 rounded-full bg-sky-600" />
          Mental Health Screening
        </Link>
        <div className="flex items-center gap-2">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 font-medium transition-colors ${
                  active
                    ? "bg-sky-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
