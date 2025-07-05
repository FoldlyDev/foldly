/**
 * Seed data for testing the complete Zustand flow
 * Simulates a realistic set of links for development and testing
 */

import type { LinkData } from '../types';

export const createSeedLinks = (username: string = 'testuser'): LinkData[] => [
  // Base/Personal Collection Link
  {
    id: 'link_base_001',
    name: 'Personal Collection',
    title: 'Personal Collection',
    slug: username,
    username: username,
    linkType: 'base',
    isPublic: true,
    status: 'active',
    url: `foldly.io/${username}`,
    uploads: 24,
    views: 156,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 7 days ago
    requireEmail: false,
    requirePassword: false,
    maxFiles: 500,
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
    allowedFileTypes: ['*'],
    autoCreateFolders: true,
    settings: {
      allowMultiple: true,
      maxFileSize: '100MB',
      customMessage:
        'Welcome to my personal file collection. Upload any files you need to share with me.',
    },
  },

  // Topic Links
  {
    id: 'link_topic_001',
    name: 'Client Onboarding',
    title: 'Client Onboarding',
    slug: username,
    username: username,
    topic: 'client-onboarding',
    linkType: 'custom',
    isPublic: false,
    status: 'active',
    url: `foldly.io/${username}/client-onboarding`,
    uploads: 12,
    views: 89,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    createdAt: new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 3 days ago
    expiresAt: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 30 days from now
    requireEmail: true,
    requirePassword: false,
    maxFiles: 50,
    maxFileSize: 25 * 1024 * 1024, // 25MB in bytes
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
    autoCreateFolders: true,
    settings: {
      allowMultiple: true,
      maxFileSize: '25MB',
      customMessage:
        'Please upload your onboarding documents here. We need: ID, proof of address, and signed contracts.',
    },
  },

  {
    id: 'link_topic_002',
    name: 'Project Assets',
    title: 'Project Assets',
    slug: username,
    username: username,
    topic: 'project-assets',
    linkType: 'custom',
    isPublic: true,
    status: 'active',
    url: `foldly.io/${username}/project-assets`,
    uploads: 45,
    views: 234,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    createdAt: new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 14 days ago
    requireEmail: false,
    requirePassword: false,
    maxFiles: 200,
    maxFileSize: 250 * 1024 * 1024, // 250MB in bytes
    allowedFileTypes: [
      '.psd',
      '.ai',
      '.sketch',
      '.fig',
      '.jpg',
      '.png',
      '.svg',
    ],
    autoCreateFolders: false,
    settings: {
      allowMultiple: true,
      maxFileSize: '250MB',
      customMessage:
        'Upload design assets, mockups, and source files for the project.',
    },
  },

  {
    id: 'link_topic_003',
    name: 'Resume Collection',
    title: 'Resume Collection',
    slug: username,
    username: username,
    topic: 'resume-collection',
    linkType: 'custom',
    isPublic: true,
    status: 'paused',
    url: `foldly.io/${username}/resume-collection`,
    uploads: 67,
    views: 145,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdAt: new Date(
      Date.now() - 21 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 21 days ago
    expiresAt: new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 1 day ago (expired)
    requireEmail: true,
    requirePassword: false,
    maxFiles: 100,
    maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
    allowedFileTypes: ['.pdf', '.doc', '.docx'],
    autoCreateFolders: true,
    settings: {
      allowMultiple: false, // Only one resume per person
      maxFileSize: '10MB',
      customMessage:
        'Submit your resume for our open positions. Please include a cover letter in your document.',
    },
  },

  {
    id: 'link_topic_004',
    name: 'Wedding Photos',
    title: 'Wedding Photos',
    slug: username,
    username: username,
    topic: 'wedding-photos',
    linkType: 'custom',
    isPublic: false,
    status: 'active',
    url: `foldly.io/${username}/wedding-photos`,
    uploads: 156,
    views: 45,
    lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    createdAt: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 5 days ago
    requireEmail: false,
    requirePassword: true,
    maxFiles: 1000,
    maxFileSize: 500 * 1024 * 1024, // 500MB in bytes
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.raw', '.tiff'],
    autoCreateFolders: true,
    settings: {
      allowMultiple: true,
      maxFileSize: '500MB',
      customMessage:
        'Share your wedding photos with the happy couple! All photos will be organized by date.',
    },
  },

  {
    id: 'link_topic_005',
    name: 'Team Presentations',
    title: 'Team Presentations',
    slug: username,
    username: username,
    topic: 'team-presentations',
    linkType: 'custom',
    isPublic: true,
    status: 'expired',
    url: `foldly.io/${username}/team-presentations`,
    uploads: 8,
    views: 23,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    createdAt: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 30 days ago
    expiresAt: new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // 3 days ago
    requireEmail: true,
    requirePassword: false,
    maxFiles: 20,
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
    allowedFileTypes: ['.ppt', '.pptx', '.pdf', '.key'],
    autoCreateFolders: false,
    settings: {
      allowMultiple: true,
      maxFileSize: '100MB',
      customMessage:
        'Upload your quarterly presentation files here. Deadline was last week.',
    },
  },
];

/**
 * Initialize the links store with seed data
 * Call this function to populate the store for testing
 */
export const initializeSeedData = (
  setLinks: (links: LinkData[]) => void,
  username?: string
) => {
  const seedLinks = createSeedLinks(username);
  setLinks(seedLinks);
  console.log('🌱 Seed data initialized with', seedLinks.length, 'links');
  return seedLinks;
};
