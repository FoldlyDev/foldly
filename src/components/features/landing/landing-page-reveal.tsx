"use client";

import { useEffect, useRef } from "react";
import { initLandingAnimations } from "@/lib/animations/landing-animations";

export function LandingPageReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize landing page reveal animations when component mounts
    if (typeof window !== "undefined" && containerRef.current) {
      // Use requestAnimationFrame to ensure DOM is fully painted
      requestAnimationFrame(() => {
        initLandingPageRevealAnimation(containerRef.current!);
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="landing-page-reveal">
      {/* Preloader overlay */}
      <div className="preloader">
        <div className="intro-title">
          <h1>FOLDLY</h1>
        </div>
        <div className="outro-title">
          <h1>F</h1>
        </div>
      </div>

      {/* Split overlay for reveal effect */}
      <div className="split-overlay">
        <div className="intro-title">
          <h1>FOLDLY</h1>
        </div>
        <div className="outro-title">
          <h1>F</h1>
        </div>
      </div>

      {/* Tags overlay */}
      <div className="tags-overlay">
        <div className="tag tag-1">
          <p>Simple</p>
        </div>
        <div className="tag tag-2">
          <p>Secure</p>
        </div>
        <div className="tag tag-3">
          <p>Fast</p>
        </div>
      </div>

      {/* Main container with navigation, hero image, and card */}
      <div className="container">
        <nav>
          <p id="logo">Foldly</p>
          <p>Menu</p>
        </nav>

        <div className="card">
          <h1>FOLDLY</h1>
        </div>

        <footer>
          <p>Scroll Down</p>
          <p>Made with Foldly</p>
        </footer>
      </div>
    </div>
  );
}

function initLandingPageRevealAnimation(container: HTMLElement) {
  // Dynamic import to ensure GSAP loads properly in Next.js
  import("gsap")
    .then(({ gsap }) => {
      import("gsap/SplitText")
        .then(({ SplitText }) => {
          import("gsap/CustomEase")
            .then(({ CustomEase }) => {
              console.log("🎉 Loading GSAP with SplitText and CustomEase...");

              gsap.registerPlugin(SplitText, CustomEase);

              // Create custom ease following template
              CustomEase.create("hop", ".8, 0, .3, 1");

              // Split text elements exactly like the template
              const splitTextElements = (
                selector: string,
                type = "words,chars",
                addFirstChar = false
              ) => {
                const elements = container.querySelectorAll(selector);
                elements.forEach((element) => {
                  const splitText = new SplitText(element, {
                    type,
                    wordsClass: "word",
                    charsClass: "char",
                  });

                  if (type.includes("chars")) {
                    splitText.chars.forEach((char, index) => {
                      const originalText = char.textContent;
                      char.innerHTML = `<span>${originalText}</span>`;

                      if (addFirstChar && index === 0) {
                        char.classList.add("first-char");
                      }
                    });
                  }
                });
              };

              // Split all text elements following template exactly
              splitTextElements(".intro-title h1", "words, chars", true);
              splitTextElements(".outro-title h1");
              splitTextElements(".tag p", "words");
              splitTextElements(".card h1", "words, chars", true);

              console.log("✅ Text splitting complete");

              const isMobile = window.innerWidth <= 1000;

              // Set initial states following template exactly
              gsap.set(
                [
                  ".split-overlay .intro-title .first-char span",
                  ".split-overlay .outro-title .char span",
                ],
                { y: "0%" }
              );

              gsap.set(".split-overlay .intro-title .first-char", {
                x: isMobile ? "7.5rem" : "18rem",
                y: isMobile ? "-1rem" : "-2.75rem",
                fontWeight: "900",
                scale: 0.75,
              });

              gsap.set(".split-overlay .outro-title .char", {
                x: isMobile ? "-3rem" : "-8rem",
                fontSize: isMobile ? "6rem" : "14rem",
                fontWeight: "500",
              });

              // Make elements visible now that they're set up
              gsap.set([".intro-title", ".outro-title", ".tag"], {
                opacity: 1,
              });

              console.log("✅ Initial states set, starting animation...");

              // Create timeline following template timing EXACTLY
              const tl = gsap.timeline({ defaults: { ease: "hop" } });
              const tags = gsap.utils.toArray(".tag");

              // Animate tags first (0.5-0.8s)
              tags.forEach((tag, index) => {
                tl.to(
                  (tag as Element).querySelectorAll("p .word"),
                  {
                    y: "0%",
                    duration: 0.75,
                  },
                  0.5 + index * 0.1
                );
              });

              // TEXT ANIMATION HAPPENS FIRST - NOT AFTER REVEAL!
              tl.to(
                ".preloader .intro-title .char span",
                {
                  y: "0%",
                  duration: 0.75,
                  stagger: 0.05,
                },
                0.5 // Start at 0.5s
              )
                .to(
                  ".preloader .intro-title .char:not(.first-char) span",
                  {
                    y: "100%", // Move non-first characters out
                    duration: 0.75,
                    stagger: 0.05,
                  },
                  2 // At 2s
                )
                .to(
                  ".preloader .outro-title .char span",
                  {
                    y: "0%", // Show "F"
                    duration: 0.75,
                    stagger: 0.075,
                  },
                  2.5 // At 2.5s
                )
                .to(
                  ".preloader .intro-title .first-char",
                  {
                    x: isMobile ? "9rem" : "21.25rem",
                    duration: 1,
                  },
                  3.5 // At 3.5s
                )
                .to(
                  ".preloader .outro-title .char",
                  {
                    x: isMobile ? "-3rem" : "-8rem",
                    duration: 1,
                  },
                  3.5 // At 3.5s
                )
                .to(
                  ".preloader .intro-title .first-char",
                  {
                    x: isMobile ? "7.5rem" : "18rem",
                    y: isMobile ? "-1rem" : "-2.75rem",
                    fontWeight: "900",
                    scale: 0.75,
                    duration: 0.75,
                  },
                  4.5 // At 4.5s
                )
                .to(
                  ".preloader .outro-title .char",
                  {
                    x: isMobile ? "-3rem" : "-8rem",
                    fontSize: isMobile ? "6rem" : "14rem",
                    fontWeight: "500",
                    duration: 0.75,
                    onComplete: () => {
                      // Set up clip paths for reveal
                      gsap.set(".preloader", {
                        clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
                      });
                      gsap.set(".split-overlay", {
                        clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                      });
                    },
                  },
                  4.5 // At 4.5s
                )
                .to(
                  ".container",
                  {
                    clipPath: "polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)",
                    duration: 1,
                  },
                  5 // At 5s
                );

              // Hide tags
              tags.forEach((tag, index) => {
                tl.to(
                  (tag as Element).querySelectorAll("p .word"),
                  {
                    y: "100%",
                    duration: 0.75,
                  },
                  5.5 + index * 0.1
                );
              });

              // REVEAL ANIMATION HAPPENS AT 6s - AFTER TEXT ANIMATION
              tl.to(
                [".preloader", ".split-overlay"],
                {
                  y: (i) => (i === 0 ? "-50%" : "50%"),
                  duration: 1,
                },
                6 // At 6s
              )
                .to(
                  ".container",
                  {
                    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    duration: 1,
                  },
                  6 // At 6s
                )
                .to(
                  ".container .card",
                  {
                    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    duration: 0.75,
                  },
                  6.25 // At 6.25s
                )
                .to(
                  ".container .card h1 .char span",
                  {
                    y: "0%",
                    duration: 0.75,
                    stagger: 0.05,
                  },
                  6.5 // At 6.5s
                )
                .call(
                  () => {
                    console.log(
                      "🎬 Reveal animation complete! Showing main content..."
                    );

                    // Hide the reveal container and show main content
                    const revealContainer = document.querySelector(
                      ".landing-page-reveal"
                    ) as HTMLElement;
                    const mainContent = document.querySelector(
                      ".main-content"
                    ) as HTMLElement;

                    if (revealContainer && mainContent) {
                      // Hide reveal container
                      gsap.to(revealContainer, {
                        opacity: 0,
                        duration: 0.5,
                        onComplete: () => {
                          revealContainer.style.display = "none";

                          // Show main content
                          mainContent.style.display = "block";
                          gsap.fromTo(
                            mainContent,
                            { opacity: 0 },
                            {
                              opacity: 1,
                              duration: 0.8,
                              onComplete: () => {
                                console.log(
                                  "✅ Main content revealed! Initializing card animations..."
                                );

                                // Initialize landing animations for the revealed content
                                try {
                                  initLandingAnimations();
                                  console.log(
                                    "🃏 Card animations initialized!"
                                  );
                                } catch (error) {
                                  console.error(
                                    "❌ Error initializing card animations:",
                                    error
                                  );
                                }
                              },
                            }
                          );
                        },
                      });
                    } else {
                      console.error(
                        "❌ Could not find reveal container or main content!"
                      );
                    }
                  },
                  [],
                  7.5
                ); // At 7.5s - after all animations complete

              console.log(
                "✅ Landing page reveal animation initialized with exact template timing"
              );
            })
            .catch((error) => {
              console.error("❌ Failed to load CustomEase:", error);
            });
        })
        .catch((error) => {
          console.error("❌ Failed to load SplitText:", error);
        });
    })
    .catch((error) => {
      console.error("❌ Failed to load GSAP:", error);
    });
}
