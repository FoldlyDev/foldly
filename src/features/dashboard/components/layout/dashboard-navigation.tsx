'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { useNavigationContext } from '@/features/dashboard';
import {
  LayoutDashboard,
  Link2,
  FileText,
  Settings,
  BarChart3,
  Users,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
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
        label: 'Home',
        href: '/dashboard/home',
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
      {
        id: 'collaborators',
        label: 'Collaborators',
        href: '/dashboard/collaborators',
        icon: Users,
        color: 'success',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        color: 'tertiary',
      },
      {
        id: 'help',
        label: 'Help & Support',
        href: '/dashboard/help',
        icon: HelpCircle,
        color: 'secondary',
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
      icon: 'text-[var(--success-green)] bg-green-50',
      activeIcon: 'text-white bg-[var(--success-green)]',
      activeBg:
        'bg-gradient-to-r from-green-50 to-transparent border-r-2 border-[var(--success-green)]',
      hoverBg: 'hover:bg-green-50',
    },
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard/home') {
      return pathname === '/dashboard/home' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const NavigationContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    // Always expanded on mobile, toggle-based on desktop
    const shouldExpand = isMobile || isDesktopExpanded;

    return (
      <>
        {/* Header with Logo */}
        <div className='p-4 border-b border-[var(--neutral-200)]'>
          <div className='flex items-center justify-center mb-4'>
            <AnimatePresence mode='wait'>
              {shouldExpand ? (
                <motion.div
                  key='large-logo'
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src='/assets/img/logo/foldly_logo_lg.png'
                    alt='Foldly'
                    width={180}
                    height={60}
                    className='h-14 w-auto'
                    priority
                  />
                </motion.div>
              ) : (
                <motion.div
                  key='small-logo'
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src='/assets/img/logo/foldly_logo_sm.png'
                    alt='Foldly'
                    width={44}
                    height={44}
                    className='h-11 w-11'
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div
            className={`
              flex items-center gap-3 p-2 rounded-lg bg-[var(--neutral-50)] hover:bg-[var(--neutral-100)] 
              transition-colors cursor-pointer
              ${shouldExpand ? '' : 'justify-center'}
            `}
          >
            <UserButton
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
                      className='text-sm text-[var(--neutral-600)] leading-none m-0 p-0'
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
                  className='text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider mb-2 px-2'
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
                                ${isActive ? 'text-[var(--quaternary)]' : 'text-[var(--neutral-700)] group-hover:text-[var(--quaternary)]'}
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
        className='lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl border border-[var(--neutral-200)] 
                 shadow-lg hover:shadow-xl transition-all duration-200'
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
              <X className='w-6 h-6 text-[var(--quaternary)]' />
            </motion.div>
          ) : (
            <motion.div
              key='menu'
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className='w-6 h-6 text-[var(--quaternary)]' />
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
                   w-8 h-8 bg-white border border-[var(--neutral-200)] rounded-full
                   items-center justify-center shadow-lg hover:shadow-xl
                   hover:bg-[var(--primary-subtle)] hover:border-[var(--primary)]'
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
              <ChevronLeft className='w-4 h-4 text-[var(--neutral-600)]' />
            </motion.div>
          ) : (
            <motion.div
              key='expand'
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='w-4 h-4 text-[var(--neutral-600)]' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop Navigation */}
      <motion.nav
        animate={{ width: isDesktopExpanded ? 256 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className='hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-[var(--neutral-200)] 
                   shadow-sm z-40 flex-col overflow-hidden'
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
            className='lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[var(--neutral-200)] 
                     shadow-xl z-40 flex flex-col'
          >
            <NavigationContent isMobile={true} />
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
