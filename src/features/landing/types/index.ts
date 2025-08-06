export interface AnimationProps {
  'data-animate-type'?: 'scramble' | 'reveal' | 'line-reveal';
  'data-animate-delay'?: string;
  'data-animate-on-scroll'?: string;
}

export interface HeroCard {
  id: string;
  title: string;
  number: string;
  backContent?: string[];
}

export interface SkillCard {
  id: string;
  moveNumber: string;
  title: string;
}

export interface ServiceCard extends HeroCard {
  frontTitle: string;
  backTitle: string;
  services: string[];
}

export interface SpotlightImage {
  src: string;
  alt: string;
  row: number;
  position: number;
}

export interface OutroSkill {
  text: string;
  variant: 'skill-var-1' | 'skill-var-2' | 'skill-var-3';
}

export interface OutroStrip {
  id: string;
  skills: OutroSkill[];
  speed: number;
}

export interface MenuLink {
  href: string;
  label: string;
}

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterSection {
  title: string;
  links?: FooterLink[];
  content?: string[];
}

export interface WorkSlide {
  id: number;
  image: string;
  title: string;
  category: string;
  year: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  tags: string[];
}

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  images: string[];
  nextProject?: {
    title: string;
    link: string;
  };
}

export interface AnimationOptions {
  delay?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
}

export interface ScrollTriggerOptions {
  trigger: string | Element;
  start?: string;
  end?: string;
  pin?: boolean;
  pinSpacing?: boolean;
  scrub?: boolean | number;
  markers?: boolean;
  onUpdate?: (self: any) => void;
  onEnter?: (self: any) => void;
  onLeave?: (self: any) => void;
  onEnterBack?: (self: any) => void;
  onLeaveBack?: (self: any) => void;
}

export interface Slide {
  slideTitle: string;
  slideDescription: string;
  slideUrl: string;
  slideTags: string[];
  slideImg: string;
}

export interface GalleryCard {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface SkillObject {
  name: string;
  category: 'os-1' | 'os-2' | 'os-3';
}

export interface ProjectMeta {
  title: string;
  url: string;
  type: string;
  date: string;
  categories: string[];
  client: string;
  stack: string[];
}

export interface TransitionState {
  isTransitioning: boolean;
  targetSection?: string;
}