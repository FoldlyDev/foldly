"use client";

import Link from "next/link";

export function OutroSection() {
  return (
    <section className="outro">
      <div className="outro-content">
        <h1>Ready to simplify file collection?</h1>
        <div className="cta-buttons">
          <Link href="/sign-up" className="cta-primary">
            Start Free
          </Link>
          <Link href="/sign-in" className="cta-secondary">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
