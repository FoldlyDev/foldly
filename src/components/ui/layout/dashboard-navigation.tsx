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
        <div className='nav-header'>
          <div className='flex items-center justify-center mb-4'>
            <AnimatedLogoButton
              href='/'
              className='nav-logo-button'
              isCollapsed={!shouldExpand}
            />
          </div>

          {/* User Profile */}
          <div
            className={`
              flex items-center gap-3 p-2 rounded-lg foldly-glass
              hover:bg-neutral-100 dark:hover:bg-white/10 
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
                className='flex-1 min-w-0 nav-show-expanded'
              >
                <div className='flex items-center gap-2 h-8'>
                  <div className='w-2 h-2 bg-[var(--success-green)] rounded-full'></div>
                  <div className='flex items-center justify-center h-8'>
                    <p className='nav-user-status'>Online</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className='nav-body scrollbar-thin'>
          {navigationData.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              className='nav-section'
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
                  className='nav-section-header mb-2 px-2'
                >
                  {section.title}
                </motion.h3>
              )}

              <div className="nav-items-container">
                {section.items.map(item => {
                  const isActive = isActiveRoute(item.href);
                  const IconComponent = item.icon;

                  return (
                    <Link key={item.id} href={item.href} className='nav-item block'>
                      <div
                        className={`
                          group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                          ${isActive ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-neutral-100 dark:hover:bg-white/5'}
                          cursor-pointer
                          ${shouldExpand ? '' : 'justify-center'}
                        `}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId='activeIndicator'
                            className='absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full'
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
                          nav-icon-container nav-icon--${item.color}
                          ${isActive ? 'nav-icon--active' : ''}
                        `}
                        >
                          <IconComponent className='nav-icon' />
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
                                nav-item-label
                                ${isActive ? 'nav-item-label--active' : ''}
                              `}
                              >
                                {item.label}
                              </p>
                            </div>

                            <div className='flex items-center gap-1 h-8'>
                              {item.badge && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className='nav-badge px-1.5 py-0.5 bg-[var(--primary)] text-white rounded-full badge-bounce'
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
                                  <ChevronRight className='w-3 h-3 text-current' />
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
        className='lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl
                 shadow-lg hover:shadow-xl transition-all duration-200
                 nav-menu-button'
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
              <X className='w-6 h-6 nav-toggle-icon' />
            </motion.div>
          ) : (
            <motion.div
              key='menu'
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className='w-6 h-6 nav-toggle-icon' />
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
          left: isDesktopExpanded ? '240px' : '64px',
        }}
        className='hidden lg:flex fixed top-4 z-50 transition-all duration-300
                   w-8 h-8 rounded-full
                   items-center justify-center shadow-lg hover:shadow-xl
                   nav-toggle-button'
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
              <ChevronLeft className='w-4 h-4 nav-toggle-icon' />
            </motion.div>
          ) : (
            <motion.div
              key='expand'
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='w-4 h-4 nav-toggle-icon' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop Navigation */}
      <motion.nav
        animate={{ width: isDesktopExpanded ? 256 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`hidden lg:flex fixed left-0 top-0 bottom-0
                   shadow-sm z-40 flex-col overflow-hidden
                   dashboard-navigation nav-sidebar-desktop
                   ${isDesktopExpanded ? 'nav-expanded' : 'nav-collapsed'}`}
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
            className='lg:hidden fixed left-0 top-0 bottom-0 w-64
                     shadow-xl z-40 flex flex-col
                     dashboard-navigation nav-sidebar-mobile'
          >
            <NavigationContent isMobile={true} />
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
