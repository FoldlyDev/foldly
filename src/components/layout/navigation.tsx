"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <nav className="landing-nav">
      <div className="logo">
        <span>Foldly</span>
      </div>
      <div className="nav-links">
        <Link href="/sign-in" className="menu-btn">
          <span>Sign In</span>
        </Link>
      </div>
    </nav>
  );
}
