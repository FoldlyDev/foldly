"use client";

export function PreloaderIntro() {
  return (
    <>
      <div className="preloader">
        <div className="intro-title">
          <h1>Foldly</h1>
        </div>
        <div className="outro-title">
          <h1>Files</h1>
        </div>
      </div>

      <div className="split-overlay">
        <div className="intro-title">
          <h1>Foldly</h1>
        </div>
        <div className="outro-title">
          <h1>Files</h1>
        </div>
      </div>

      <div className="tags-overlay">
        <div className="tag tag-1">
          <p>Dead Simple</p>
        </div>
        <div className="tag tag-2">
          <p>File Collection</p>
        </div>
        <div className="tag tag-3">
          <p>Zero Friction</p>
        </div>
      </div>
    </>
  );
}
