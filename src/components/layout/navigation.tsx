"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <nav className="fixed w-screen p-8 flex justify-between items-center z-[100]">
      <div className="logo">
        <span
          className="text-sm p-3 rounded-sm font-medium uppercase tracking-wide bg-[--dark] text-[--light]"
          style={{ fontFamily: '"Inter", sans-serif', letterSpacing: "0.5px" }}
        >
          Foldly
        </span>
      </div>
      <div className="nav-links">
        <Link href="/sign-in" className="no-underline">
          <span
            className="text-sm p-3 rounded-sm font-medium uppercase tracking-wide bg-[--light2] text-[--dark] transition-all duration-300 ease-in-out hover:bg-[--dark] hover:text-[--light]"
            style={{
              fontFamily: '"Inter", sans-serif',
              letterSpacing: "0.5px",
            }}
          >
            Sign In
          </span>
        </Link>
      </div>
    </nav>
  );
}
