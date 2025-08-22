// Global type declarations

interface Window {
  lenis?: {
    scrollTo: (target: number | string | HTMLElement, options?: {
      offset?: number;
      immediate?: boolean;
      duration?: number;
      easing?: (t: number) => number;
      onComplete?: () => void;
    }) => void;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
    destroy: () => void;
    start: () => void;
    stop: () => void;
    raf: (time: number) => void;
    resize: () => void;
  };
}