"use client";

export function AnimatedCards() {
  return (
    <section className="cards">
      <div className="cards-container">
        <div className="card" id="card-1">
          <div className="card-wrapper">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div className="card-title">
                  <span>Create</span>
                  <span>01</span>
                </div>
                <div className="card-title">
                  <span>01</span>
                  <span>Create</span>
                </div>
              </div>
              <div className="flip-card-back">
                <div className="card-title">
                  <span>Create</span>
                  <span>01</span>
                </div>
                <div className="card-copy">
                  <p>Custom Links</p>
                  <p>Brand Your Page</p>
                  <p>Set Expiration</p>
                  <p>Add Instructions</p>
                  <p>Control Access</p>
                  <p>Track Progress</p>
                </div>
                <div className="card-title">
                  <span>01</span>
                  <span>Create</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" id="card-2">
          <div className="card-wrapper">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div className="card-title">
                  <span>Collect</span>
                  <span>02</span>
                </div>
                <div className="card-title">
                  <span>02</span>
                  <span>Collect</span>
                </div>
              </div>
              <div className="flip-card-back">
                <div className="card-title">
                  <span>Collect</span>
                  <span>02</span>
                </div>
                <div className="card-copy">
                  <p>Drag & Drop</p>
                  <p>No Login Required</p>
                  <p>Large File Support</p>
                  <p>Progress Tracking</p>
                  <p>Auto Notifications</p>
                  <p>Secure Storage</p>
                </div>
                <div className="card-title">
                  <span>02</span>
                  <span>Collect</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" id="card-3">
          <div className="card-wrapper">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div className="card-title">
                  <span>Organize</span>
                  <span>03</span>
                </div>
                <div className="card-title">
                  <span>03</span>
                  <span>Organize</span>
                </div>
              </div>
              <div className="flip-card-back">
                <div className="card-title">
                  <span>Organize</span>
                  <span>03</span>
                </div>
                <div className="card-copy">
                  <p>Auto Folders</p>
                  <p>Smart Tagging</p>
                  <p>Search & Filter</p>
                  <p>Bulk Operations</p>
                  <p>Export Options</p>
                  <p>Cloud Sync</p>
                </div>
                <div className="card-title">
                  <span>03</span>
                  <span>Organize</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
