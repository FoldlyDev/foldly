"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <nav className="fixed w-screen p-8 flex justify-between items-center z-[100]">
      <div className="logo">
        <span className="text-sm p-3 rounded-sm font-medium uppercase tracking-wide bg-neutral-800 text-neutral-50 font-sans">
          Foldly
        </span>
      </div>
      <div className="nav-links">
        <Link href="/sign-in" className="no-underline">
          <span className="text-sm p-3 rounded-sm font-medium uppercase tracking-wide bg-neutral-100 text-neutral-800 transition-all duration-300 ease-in-out hover:bg-neutral-800 hover:text-neutral-50 font-sans">
            Sign In
          </span>
        </Link>
      </div>
    </nav>
  );
}
