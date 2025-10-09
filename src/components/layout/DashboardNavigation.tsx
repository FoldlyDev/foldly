"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatedLogoButton } from "@/components/buttons/AnimatedLogoButton";
import { useNavigationContext } from "@/components/layout/DashboardLayout";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  LogOut,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  color: "primary" | "secondary" | "tertiary" | "success";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationData: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        id: "home",
        label: "Personal Space",
        href: "/dashboard/workspace",
        icon: LayoutDashboard,
        color: "primary",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        color: "secondary",
      },
    ],
  },
  {
    title: "File Collection",
    items: [
      {
        id: "links",
        label: "My Links",
        href: "/dashboard/links",
        icon: Link2,
        // badge: 'New',
        color: "primary",
      },
      {
        id: "files",
        label: "Shared Files",
        href: "/dashboard/files",
        icon: FileText,
        color: "tertiary",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        id: "billing",
        label: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        color: "success",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        color: "tertiary",
      },
    ],
  },
];

// User Profile Button Component
function UserProfileButton({ shouldExpand }: { shouldExpand: boolean }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileClick = () => {
    router.push("/dashboard/settings");
  };

  // Show fallback during SSR and initial client render
  const showImage = mounted && isLoaded && user?.imageUrl;

  return (
    <button
      onClick={handleProfileClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg foldly-glass
        hover:bg-neutral-100 dark:hover:bg-white/10 
        transition-colors cursor-pointer w-full
        ${shouldExpand ? "" : "justify-center"}
      `}
    >
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {showImage ? (
          <Image
            src={user.imageUrl}
            alt={user.fullName || "User profile"}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.firstName?.[0] ||
              user?.emailAddresses?.[0]?.emailAddress?.[0] ||
              "U"}
          </div>
        )}
      </div>

      <AnimatePresence>
        {shouldExpand && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 nav-show-expanded"
          >
            <div className="flex items-center gap-2 h-8">
              <div className="w-2 h-2 bg-[var(--success-green)] rounded-full"></div>
              <div className="flex items-center justify-center h-8">
                <p className="nav-user-status">Online</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

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
      // Store original body styles
      const originalStyle = window.getComputedStyle(document.body).overflow;

      // Immediately prevent scrolling
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = "";
        document.body.style.width = "";
      };
    }
  }, [isOpen]);

  // Update context when desktop expansion state changes
  useEffect(() => {
    setIsExpanded(isDesktopExpanded);
  }, [isDesktopExpanded, setIsExpanded]);

  const colorClasses = {
    primary: {
      icon: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      activeIcon: "text-white bg-blue-600",
      activeBg:
        "bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-transparent border-r-2 border-blue-600",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    secondary: {
      icon: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
      activeIcon: "text-white bg-purple-600",
      activeBg:
        "bg-gradient-to-r from-purple-50 dark:from-purple-900/20 to-transparent border-r-2 border-purple-600",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
    },
    tertiary: {
      icon: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20",
      activeIcon: "text-white bg-gray-600",
      activeBg:
        "bg-gradient-to-r from-gray-50 dark:from-gray-900/20 to-transparent border-r-2 border-gray-600",
      hoverBg: "hover:bg-gray-50 dark:hover:bg-gray-900/20",
    },
    success: {
      icon: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
      activeIcon: "text-white bg-green-600",
      activeBg:
        "bg-gradient-to-r from-green-50 dark:from-green-900/20 to-transparent border-r-2 border-green-600",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/20",
    },
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard/workspace") {
      return pathname === "/dashboard/workspace" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const NavigationContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    // Always expanded on mobile, toggle-based on desktop
    const shouldExpand = isMobile || isDesktopExpanded;
    const { signOut } = useClerk();
    const router = useRouter();

    const handleLogout = async () => {
      await signOut();
      router.push("/");
    };

    return (
      <>
        {/* Header with Logo */}
        <div className="nav-header px-3">
          <div className="flex items-center justify-center mb-4">
            <AnimatedLogoButton
              href="/"
              className="nav-logo-button"
              isCollapsed={!shouldExpand}
            />
          </div>

          {/* User Profile */}
          <UserProfileButton shouldExpand={shouldExpand} />
        </div>

        {/* Navigation Sections */}
        <div className="nav-body scrollbar-thin">
          {navigationData.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              className="nav-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <AnimatePresence>
                {shouldExpand && (
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="nav-section-header mb-2 px-2"
                  >
                    {section.title}
                  </motion.h3>
                )}
              </AnimatePresence>

              <div className="nav-items-container">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const colors = colorClasses[item.color];
                  const IconComponent = item.icon;

                  return (
                    <Link key={item.id} href={item.href} className="nav-item">
                      <div
                        className={`
                          group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                          cursor-pointer
                          ${shouldExpand ? "" : "justify-center"}
                        `}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="nav-active-indicator"
                            style={{
                              left: shouldExpand ? 0 : "-8px",
                            }}
                            transition={{
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={`
                          nav-icon-container nav-icon--${item.color}
                          ${isActive ? "nav-icon--active" : ""}
                          flex items-center justify-center
                        `}
                        >
                          <IconComponent className="nav-icon w-5 h-5" />
                        </div>

                        {/* Label */}
                        {shouldExpand && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex items-center justify-between h-8"
                          >
                            <div className="flex items-center justify-center h-8">
                              <p
                                className={`
                                nav-item-label
                                ${isActive ? "nav-item-label--active" : ""}
                              `}
                              >
                                {item.label}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 h-8">
                              {item.badge && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="nav-badge px-1.5 py-0.5 bg-[var(--primary)] text-white rounded-full badge-bounce"
                                >
                                  {item.badge}
                                </motion.span>
                              )}

                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="text-[var(--primary)]"
                                >
                                  <ChevronRight className="w-3 h-3" />
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

        {/* Logout Button at Bottom */}
        <div className="nav-footer mt-auto p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 p-3 rounded-lg w-full
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors cursor-pointer
              ${shouldExpand ? "" : "justify-center"}
            `}
          >
            {/* Logout Icon */}
            <div className="flex items-center justify-center text-red-600 dark:text-red-400">
              <LogOut className="w-5 h-5" />
            </div>

            {/* Logout Label */}
            <AnimatePresence>
              {shouldExpand && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Logout
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
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
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl cursor-pointer
                 shadow-lg hover:shadow-xl transition-all duration-200
                 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                 nav-menu-button"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 nav-toggle-icon" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-6 h-6 nav-toggle-icon" />
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            style={{ willChange: "opacity" }}
          />
        )}
      </AnimatePresence>

      {/* Desktop Toggle Button - Top Right Corner */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
        style={{
          left: isDesktopExpanded ? "240px" : "64px",
        }}
        className="hidden lg:flex fixed top-4 z-50 transition-all duration-300
                   w-8 h-8 rounded-full cursor-pointer
                   items-center justify-center shadow-lg hover:shadow-xl
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   nav-toggle-button group"
      >
        <AnimatePresence mode="wait">
          {isDesktopExpanded ? (
            <motion.div
              key="collapse"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-4 h-4 nav-toggle-icon" />
            </motion.div>
          ) : (
            <motion.div
              key="expand"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 nav-toggle-icon" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop Navigation */}
      <motion.nav
        animate={{ width: isDesktopExpanded ? 256 : 80 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`hidden lg:flex fixed left-0 top-0 bottom-0
                   shadow-sm z-40 flex-col overflow-hidden
                   dashboard-navigation nav-sidebar-desktop
                   ${isDesktopExpanded ? "nav-expanded" : "nav-collapsed"}`}
      >
        <NavigationContent isMobile={false} />
      </motion.nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ transform: "translateZ(0)" }} // Force hardware acceleration
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72
                     shadow-xl z-40 flex flex-col
                     dashboard-navigation nav-sidebar-mobile"
          >
            <NavigationContent isMobile={true} />
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
