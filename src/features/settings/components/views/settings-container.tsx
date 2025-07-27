'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  HardDrive,
  Mail,
  Phone,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
} from 'lucide-react';
import { ContentLoader } from '@/components/ui/feedback/content-loader';

interface SettingsContainerProps {
  initialData?: any;
  isLoading?: boolean;
  error?: string | null;
}

export function SettingsContainer({
  initialData,
  isLoading = false,
  error = null,
}: SettingsContainerProps) {
  const { user } = useUser();
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    website: '',
    bio: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    uploadNotifications: true,
    weeklyReports: false,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    allowIndexing: true,
    dataRetention: '12months',
  });

  const [accountSettings, setAccountSettings] = useState({
    defaultLinkExpiry: 'never',
    maxFileSize: '100MB',
    autoArchive: false,
    twoFactorAuth: false,
  });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'account', label: 'Account', icon: CreditCard },
  ];

  const handleSaveSettings = () => {
    // In a real app, you would make API calls to save settings
    console.log('Saving settings...');
    setHasChanges(false);
    // Show success message
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <div className='home-container w-full mx-auto'>
          <div className='loading-container'>
            <ContentLoader />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)] flex items-center justify-center'>
        <div className='error-container'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='analytics-card w-full max-w-md mx-auto text-center'
          >
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <User className='w-6 h-6 sm:w-8 sm:h-8 text-red-500' />
            </div>
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Settings Unavailable
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='w-full sm:w-auto px-6 py-2.5 bg-[var(--primary)] text-[var(--quaternary)] rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base'
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='home-container w-full mx-auto'>
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='space-y-8'
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
                  <div>
                    <h1 className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                      Settings
                    </h1>
                    <p className='text-[var(--neutral-600)]'>
                      Manage your account, privacy, and notification preferences
                    </p>
                  </div>

                  {hasChanges && (
                    <button
                      onClick={handleSaveSettings}
                      className='px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2 font-medium'
                    >
                      <Save className='w-4 h-4' />
                      Save Changes
                    </button>
                  )}
                </div>
              </motion.div>

              <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
                {/* Sidebar Navigation */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className='lg:col-span-1'
                >
                  <div className='analytics-card'>
                    <nav className='space-y-2'>
                      {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                              ${
                                activeTab === tab.id
                                  ? 'bg-[var(--primary)] text-white'
                                  : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] hover:text-[var(--quaternary)]'
                              }
                            `}
                          >
                            <Icon className='w-5 h-5' />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </motion.div>

                {/* Settings Content */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className='lg:col-span-3'
                >
                  <div className='analytics-card'>
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                      <div className='space-y-6'>
                        <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-6'>
                          Profile Information
                        </h2>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div>
                            <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                              First Name
                            </label>
                            <input
                              type='text'
                              value={profileSettings.firstName}
                              onChange={e => {
                                setProfileSettings(prev => ({
                                  ...prev,
                                  firstName: e.target.value,
                                }));
                                setHasChanges(true);
                              }}
                              className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            />
                          </div>

                          <div>
                            <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                              Last Name
                            </label>
                            <input
                              type='text'
                              value={profileSettings.lastName}
                              onChange={e => {
                                setProfileSettings(prev => ({
                                  ...prev,
                                  lastName: e.target.value,
                                }));
                                setHasChanges(true);
                              }}
                              className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            />
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                            Email Address
                          </label>
                          <input
                            type='email'
                            value={profileSettings.email}
                            onChange={e => {
                              setProfileSettings(prev => ({
                                ...prev,
                                email: e.target.value,
                              }));
                              setHasChanges(true);
                            }}
                            className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                            Bio
                          </label>
                          <textarea
                            value={profileSettings.bio}
                            onChange={e => {
                              setProfileSettings(prev => ({
                                ...prev,
                                bio: e.target.value,
                              }));
                              setHasChanges(true);
                            }}
                            rows={4}
                            className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            placeholder='Tell us about yourself...'
                          />
                        </div>
                      </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                      <div className='space-y-6'>
                        <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-6'>
                          Notification Preferences
                        </h2>

                        <div className='space-y-4'>
                          {Object.entries(notificationSettings).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className='flex items-center justify-between py-3 border-b border-[var(--neutral-100)]'
                              >
                                <div>
                                  <h3 className='font-medium text-[var(--quaternary)]'>
                                    {key
                                      .replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase())}
                                  </h3>
                                  <p className='text-sm text-[var(--neutral-600)]'>
                                    {key === 'emailNotifications' &&
                                      'Receive notifications via email'}
                                    {key === 'uploadNotifications' &&
                                      'Get notified when files are uploaded'}
                                    {key === 'weeklyReports' &&
                                      'Weekly summary of your activity'}
                                    {key === 'securityAlerts' &&
                                      'Important security notifications'}
                                    {key === 'marketingEmails' &&
                                      'Product updates and tips'}
                                  </p>
                                </div>
                                <label className='relative inline-flex items-center cursor-pointer'>
                                  <input
                                    type='checkbox'
                                    checked={value}
                                    onChange={e => {
                                      setNotificationSettings(prev => ({
                                        ...prev,
                                        [key]: e.target.checked,
                                      }));
                                      setHasChanges(true);
                                    }}
                                    className='sr-only peer'
                                  />
                                  <div className='w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-subtle)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--neutral-300)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]'></div>
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Privacy Settings */}
                    {activeTab === 'privacy' && (
                      <div className='space-y-6'>
                        <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-6'>
                          Privacy & Security
                        </h2>

                        <div className='space-y-6'>
                          <div>
                            <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                              Profile Visibility
                            </label>
                            <select
                              value={privacySettings.profileVisibility}
                              onChange={e => {
                                setPrivacySettings(prev => ({
                                  ...prev,
                                  profileVisibility: e.target.value,
                                }));
                                setHasChanges(true);
                              }}
                              className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            >
                              <option value='public'>Public</option>
                              <option value='private'>Private</option>
                              <option value='friends'>Friends Only</option>
                            </select>
                          </div>

                          <div className='flex items-center justify-between py-3 border-b border-[var(--neutral-100)]'>
                            <div>
                              <h3 className='font-medium text-[var(--quaternary)]'>
                                Two-Factor Authentication
                              </h3>
                              <p className='text-sm text-[var(--neutral-600)]'>
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setAccountSettings(prev => ({
                                  ...prev,
                                  twoFactorAuth: !prev.twoFactorAuth,
                                }));
                                setHasChanges(true);
                              }}
                              className={`
                                px-4 py-2 rounded-lg font-medium transition-colors
                                ${
                                  accountSettings.twoFactorAuth
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                                }
                              `}
                            >
                              {accountSettings.twoFactorAuth
                                ? 'Disable'
                                : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Settings */}
                    {activeTab === 'account' && (
                      <div className='space-y-6'>
                        <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-6'>
                          Account Settings
                        </h2>

                        <div className='space-y-6'>
                          <div>
                            <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                              Default Link Expiry
                            </label>
                            <select
                              value={accountSettings.defaultLinkExpiry}
                              onChange={e => {
                                setAccountSettings(prev => ({
                                  ...prev,
                                  defaultLinkExpiry: e.target.value,
                                }));
                                setHasChanges(true);
                              }}
                              className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            >
                              <option value='never'>Never</option>
                              <option value='1day'>1 Day</option>
                              <option value='1week'>1 Week</option>
                              <option value='1month'>1 Month</option>
                              <option value='3months'>3 Months</option>
                            </select>
                          </div>

                          <div>
                            <label className='block text-sm font-medium text-[var(--neutral-700)] mb-2'>
                              Maximum File Size
                            </label>
                            <select
                              value={accountSettings.maxFileSize}
                              onChange={e => {
                                setAccountSettings(prev => ({
                                  ...prev,
                                  maxFileSize: e.target.value,
                                }));
                                setHasChanges(true);
                              }}
                              className='w-full px-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                            >
                              <option value='10MB'>10 MB</option>
                              <option value='50MB'>50 MB</option>
                              <option value='100MB'>100 MB</option>
                              <option value='500MB'>500 MB</option>
                              <option value='1GB'>1 GB</option>
                            </select>
                          </div>

                          <div className='pt-6 border-t border-[var(--neutral-200)]'>
                            <h3 className='font-medium text-red-600 mb-4'>
                              Danger Zone
                            </h3>
                            <div className='space-y-4'>
                              <button className='w-full px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium'>
                                Export All Data
                              </button>
                              <button className='w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium'>
                                Delete Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
