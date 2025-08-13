'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ClientOnlyUserButton from '@/components/ui/core/client-only-user-button';
import { AnimatedLogoButton } from '@/components/ui/core';
import { useNavigationContext } from './dashboard-layout-wrapper';
import {
  LayoutDashboard,
  Link2,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'success';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationData: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'home',
        label: 'Workspace',
        href: '/dashboard/workspace',
        icon: LayoutDashboard,
        color: 'primary',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        color: 'secondary',
      },
    ],
  },
  {
    title: 'File Collection',
    items: [
      {
        id: 'links',
        label: 'Upload Links',
        href: '/dashboard/links',
        icon: Link2,
        badge: 'New',
        color: 'primary',
      },
      {
        id: 'files',
        label: 'Files',
        href: '/dashboard/files',
        icon: FileText,
        color: 'tertiary',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        id: 'billing',
        label: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
        color: 'success',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        color: 'tertiary',
      },
    ],
  },
];

export function DashboardNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isExpanded, setIsExpanded } = useNavigationContext();
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Update context when desktop expansion state changes
  useEffect(() => {
    setIsExpanded(isDesktopExpanded);
  }, [isDesktopExpanded, setIsExpanded]);

  const colorClasses = {
    primary: {
      icon: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
      activeIcon: 'text-white bg-[var(--primary)]',
      activeBg:
        'bg-gradient-to-r from-[var(--primary-subtle)] to-transparent border-r-2 border-[var(--primary)]',
      hoverBg: 'hover:bg-[var(--primary-subtle)]',
    },
    secondary: {
      icon: 'text-[var(--secondary)] bg-[var(--secondary-subtle)]',
      activeIcon: 'text-white bg-[var(--secondary)]',
      activeBg:
        'bg-gradient-to-r from-[var(--secondary-subtle)] to-transparent border-r-2 border-[var(--secondary)]',
      hoverBg: 'hover:bg-[var(--secondary-subtle)]',
    },
    tertiary: {
      icon: 'text-[var(--tertiary)] bg-[var(--tertiary-subtle)]',
      activeIcon: 'text-white bg-[var(--tertiary)]',
      activeBg:
        'bg-gradient-to-r from-[var(--tertiary-subtle)] to-transparent border-r-2 border-[var(--tertiary)]',
      hoverBg: 'hover:bg-[var(--tertiary-subtle)]',
    },
    success: {
      icon: 'text-[var(--success-green)] bg-[var(--success-green)]/10',
      activeIcon: 'text-white bg-[var(--success-green)]',
      activeBg:
        'bg-gradient-to-r from-[var(--success-green)]/10 to-transparent border-r-2 border-[var(--success-green)]',
      hoverBg: 'hover:bg-[var(--success-green)]/10',
    },
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard/workspace') {
      return pathname === '/dashboard/workspace' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const NavigationContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    // Always expanded on mobile, toggle-based on desktop
    const shouldExpand = isMobile || isDesktopExpanded;

    return (
      <>
        {/* Header with Logo */}
        <div className='p-4 border-b border-border dark:border-white/10'>
          <div className='flex items-center justify-center mb-4'>
            <AnimatedLogoButton href='/' className='nav-logo-button' />
          </div>

          {/* User Profile */}
          <div
            className={`
              flex items-center gap-3 p-2 rounded-lg bg-muted hover:bg-muted/80 
              dark:bg-white/5 dark:hover:bg-white/10 
              transition-colors cursor-pointer
              ${shouldExpand ? '' : 'justify-center'}
            `}
          >
            <ClientOnlyUserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
            {shouldExpand && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className='flex-1 min-w-0'
              >
                <div className='flex items-center gap-2 h-8'>
                  <div className='w-2 h-2 bg-[var(--success-green)] rounded-full'></div>
                  <div className='flex items-center justify-center h-8'>
                    <p
                      className='text-sm leading-none m-0 p-0 text-foreground dark:text-white/90'
                      style={{ lineHeight: '1', margin: '0', padding: '0' }}
                    >
                      Online
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className='flex-1 p-3 space-y-4 overflow-y-auto'>
          {navigationData.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              {shouldExpand && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className='text-xs font-semibold uppercase tracking-wider mb-2 px-2 text-muted-foreground dark:text-white/50'
                >
                  {section.title}
                </motion.h3>
              )}

              <div className='space-y-1'>
                {section.items.map(item => {
                  const isActive = isActiveRoute(item.href);
                  const colors = colorClasses[item.color];
                  const IconComponent = item.icon;

                  return (
                    <Link key={item.id} href={item.href}>
                      <div
                        className={`
                          group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                          ${isActive ? colors.activeBg : colors.hoverBg}
                          cursor-pointer
                          ${shouldExpand ? '' : 'justify-center'}
                        `}
                      >
                        {/* Active Indicator */}
                        {isActive && shouldExpand && (
                          <motion.div
                            layoutId='activeIndicator'
                            className='absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] 
                                     to-[var(--secondary)] rounded-r-full'
                            transition={{
                              type: 'spring',
                              damping: 20,
                              stiffness: 300,
                            }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={`
                          relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                          ${isActive ? colors.activeIcon : colors.icon}
                          group-hover:scale-105
                        `}
                        >
                          <IconComponent className='w-4 h-4' />
                        </div>

                        {/* Label */}
                        {shouldExpand && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className='flex-1 flex items-center justify-between h-8'
                          >
                            <div className='flex items-center justify-center h-8'>
                              <p
                                className={`
                                font-medium text-sm transition-colors leading-none m-0 p-0
                                ${isActive ? 'text-foreground dark:text-white' : 'text-muted-foreground dark:text-white/70 group-hover:text-foreground dark:group-hover:text-white'}
                              `}
                                style={{
                                  lineHeight: '1',
                                  margin: '0',
                                  padding: '0',
                                }}
                              >
                                {item.label}
                              </p>
                            </div>

                            <div className='flex items-center gap-1 h-8'>
                              {item.badge && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className='px-1.5 py-0.5 text-xs font-medium bg-[var(--primary)] text-white rounded-full'
                                >
                                  {item.badge}
                                </motion.span>
                              )}

                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className='text-[var(--primary)]'
                                >
                                  <ChevronRight className='w-3 h-3' />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl border border-border
                 shadow-lg hover:shadow-xl transition-all duration-200
                 bg-card dark:bg-[rgba(2,6,24,0.85)]
                 dark:backdrop-blur-[12px] dark:border-white/10'
      >
        <AnimatePresence mode='wait'>
          {isOpen ? (
            <motion.div
              key='close'
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className='w-6 h-6 text-foreground dark:text-white' />
            </motion.div>
          ) : (
            <motion.div
              key='menu'
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className='w-6 h-6 text-foreground dark:text-white' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className='lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40'
          />
        )}
      </AnimatePresence>

      {/* Desktop Toggle Button - Top Right Corner */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
        style={{
          left: isDesktopExpanded ? '240px' : '64px'
        }}
        className='hidden lg:flex fixed top-4 z-50 transition-all duration-300
                   w-8 h-8 rounded-full border border-border
                   items-center justify-center shadow-lg hover:shadow-xl
                   bg-card hover:bg-primary/10 hover:border-primary
                   dark:bg-[rgba(2,6,24,0.85)] dark:backdrop-blur-[12px]
                   dark:border-white/10 dark:hover:bg-white/5 dark:hover:border-white/20'
      >
        <AnimatePresence mode='wait'>
          {isDesktopExpanded ? (
            <motion.div
              key='collapse'
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className='w-4 h-4 text-muted-foreground dark:text-white/70' />
            </motion.div>
          ) : (
            <motion.div
              key='expand'
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='w-4 h-4 text-muted-foreground dark:text-white/70' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop Navigation */}
      <motion.nav
        animate={{ width: isDesktopExpanded ? 256 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className='hidden lg:flex fixed left-0 top-0 bottom-0 border-r border-border
                   shadow-sm z-40 flex-col overflow-hidden
                   bg-background dark:bg-[rgba(2,6,24,0.85)]
                   dark:backdrop-blur-[12px] dark:border-white/10'
      >
        <NavigationContent isMobile={false} />
      </motion.nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='lg:hidden fixed left-0 top-0 bottom-0 w-64 border-r border-border
                     shadow-xl z-40 flex flex-col
                     bg-background dark:bg-[rgba(2,6,24,0.85)]
                     dark:backdrop-blur-[12px] dark:border-white/10'
          >
            <NavigationContent isMobile={true} />
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
