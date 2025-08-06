declare module 'gsap/SplitText' {
  export interface SplitTextOptions {
    type?: string;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    position?: string;
    absolute?: boolean;
    tag?: string;
    span?: boolean;
    wordDelimiter?: string;
    specialChars?: string[];
  }

  export class SplitText {
    constructor(element: string | Element | Element[] | NodeList, options?: SplitTextOptions);
    
    chars: Element[];
    words: Element[];
    lines: Element[];
    
    split(options?: SplitTextOptions): void;
    revert(): void;
    
    static create(element: string | Element | Element[] | NodeList, options?: SplitTextOptions): SplitText;
  }
}

declare module 'gsap/ScrollTrigger' {
  import { gsap } from 'gsap';

  export interface ScrollTriggerInstance {
    vars: ScrollTriggerConfig;
    progress: number;
    direction: number;
    isActive: boolean;
    
    kill(): void;
    refresh(): void;
    update(): void;
    enable(): void;
    disable(): void;
    
    scroll(): number;
    scroll(value: number): void;
  }

  export interface ScrollTriggerConfig {
    trigger?: string | Element;
    start?: string | number | (() => string | number);
    end?: string | number | (() => string | number);
    endTrigger?: string | Element;
    pin?: boolean | string | Element;
    pinSpacing?: boolean;
    pinType?: 'fixed' | 'transform';
    pinnedContainer?: string | Element;
    markers?: boolean | object;
    
    onEnter?: (self: ScrollTriggerInstance) => void;
    onLeave?: (self: ScrollTriggerInstance) => void;
    onEnterBack?: (self: ScrollTriggerInstance) => void;
    onLeaveBack?: (self: ScrollTriggerInstance) => void;
    onUpdate?: (self: ScrollTriggerInstance) => void;
    onToggle?: (self: ScrollTriggerInstance) => void;
    onRefresh?: (self: ScrollTriggerInstance) => void;
    onComplete?: () => void;
    onReverseComplete?: () => void;
    
    scrub?: boolean | number;
    snap?: number | number[] | object | (() => number);
    invalidateOnRefresh?: boolean;
    anticipatePin?: number;
    preventOverlaps?: boolean | string;
    fastScrollEnd?: boolean | number;
    horizontal?: boolean;
    once?: boolean;
    id?: string;
    scroller?: string | Element | Window;
    
    refreshPriority?: number;
    toggleActions?: string;
    toggleClass?: string | object;
  }

  export class ScrollTrigger {
    static create(config: ScrollTriggerConfig): ScrollTriggerInstance;
    static refresh(safe?: boolean): void;
    static update(): void;
    static getAll(): ScrollTriggerInstance[];
    static getById(id: string): ScrollTriggerInstance | undefined;
    static kill(): void;
    static enable(): void;
    static disable(): void;
    static config(vars: object): void;
    static scrollerProxy(scroller: string | Element, vars: object): void;
    static clearScrollMemory(): void;
    static defaults(config: Partial<ScrollTriggerConfig>): void;
    static batch(targets: gsap.TweenTarget, config: ScrollTriggerConfig): ScrollTriggerInstance[];
    static isInViewport(element: Element, ratio?: number): boolean;
    static positionInViewport(element: Element, referencePoint?: string): number;
    static maxScroll(scroller?: Element | Window): number;
    
    static addEventListener(type: string, callback: Function): void;
    static removeEventListener(type: string, callback: Function): void;
    
    static isTouch: number;
    static version: string;
  }
}