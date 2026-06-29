import Link from "next/link";
import { NAV } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t border-line/40 px-8 py-14">
      <div className="mx-auto flex max-w-content flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <Link href="/" aria-label="inZONE with ACTUS">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.svg" alt="inZONE with ACTUS" className="h-10 w-auto" />
        </Link>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-jp text-[13px] font-light text-black transition-opacity hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-content font-en text-[11px] font-extralight tracking-[0.5px] text-warm">
        © inZONE with ACTUS
      </p>
    </footer>
  );
}
