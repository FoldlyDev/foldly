"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement[]>([]);
  const isTransitioning = useRef(false);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define coverPage as a regular function so it's hoisted
  function coverPage(url: string) {
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = "auto";
    }

    const tl = gsap.timeline({
      onComplete: () => router.push(url),
    });

    tl.to(blocksRef.current, {
      scaleX: 1,
      duration: 0.4,
      stagger: 0.02,
      ease: "power2.out",
      transformOrigin: "left",
    });
  }

  const handleRouteChange = useCallback((url: string) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    coverPage(url);
  }, []);

  const onAnchorClick = useCallback(
    (e: any) => {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 ||
        e.currentTarget.target === "_blank"
      ) {
        return;
      }

      const href = e.currentTarget.href;
      const url = new URL(href).pathname;
      
      // Skip transition for dashboard routes
      if (url.startsWith('/dashboard') || pathname.startsWith('/dashboard')) {
        return; // Let the browser handle navigation normally
      }

      e.preventDefault();
      if (url !== pathname) {
        handleRouteChange(url);
      }
    },
    [pathname, handleRouteChange]
  );

  const revealPage = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    gsap.set(blocksRef.current, { scaleX: 1, transformOrigin: "right" });

    gsap.to(blocksRef.current, {
      scaleX: 0,
      duration: 0.4,
      stagger: 0.02,
      ease: "power2.out",
      transformOrigin: "right",
      onComplete: () => {
        isTransitioning.current = false;
        if (overlayRef.current) {
          overlayRef.current.style.pointerEvents = "none";
        }
      },
    });

    revealTimeoutRef.current = setTimeout(() => {
      if (blocksRef.current.length > 0) {
        const firstBlock = blocksRef.current[0];
        if (firstBlock && (gsap.getProperty(firstBlock, "scaleX") as number) > 0) {
          gsap.to(blocksRef.current, {
            scaleX: 0,
            duration: 0.2,
            ease: "power2.out",
            transformOrigin: "right",
            onComplete: () => {
              isTransitioning.current = false;
              if (overlayRef.current) {
                overlayRef.current.style.pointerEvents = "none";
              }
            },
          });
        }
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const createBlocks = () => {
      if (!overlayRef.current) return;
      overlayRef.current.innerHTML = "";
      blocksRef.current = [];

      for (let i = 0; i < 20; i++) {
        const block = document.createElement("div");
        block.className = "block";
        overlayRef.current.appendChild(block);
        blocksRef.current.push(block);
      }
    };

    createBlocks();

    gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

    revealPage();

    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      link.addEventListener("click", onAnchorClick);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", onAnchorClick);
      });
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [router, pathname, onAnchorClick, revealPage]);

  return (
    <>
      <div ref={overlayRef} className="transition-overlay" />
      {children}
    </>
  );
};

export default PageTransition;