"use client";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-cards">
        <div className="card" id="hero-card-1">
          <div className="card-title">
            <span>Create</span>
            <span>01</span>
          </div>
          <div className="card-title">
            <span>01</span>
            <span>Create</span>
          </div>
        </div>

        <div className="card" id="hero-card-2">
          <div className="card-title">
            <span>Collect</span>
            <span>02</span>
          </div>
          <div className="card-title">
            <span>02</span>
            <span>Collect</span>
          </div>
        </div>

        <div className="card" id="hero-card-3">
          <div className="card-title">
            <span>Organize</span>
            <span>03</span>
          </div>
          <div className="card-title">
            <span>03</span>
            <span>Organize</span>
          </div>
        </div>
      </div>
    </section>
  );
}
