// Files Container Component - Two-Panel Layout
// Left panel: Shared files via links | Right panel: Personal workspace
// Following 2025 React patterns with Zustand store integration

'use client';

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  User,
  Download,
  Copy,
  Share2,
  Trash2,
  Plus,
  FolderPlus,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Files, Folder, File } from '@/components/animate-ui/components/files';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  useAccordionItem,
  Accordion,
} from '@/components/animate-ui/radix/accordion';
import {
  MotionHighlight,
  MotionHighlightItem,
} from '@/components/animate-ui/effects/motion-highlight';
import type {
  AccordionItemProps,
  AccordionTriggerProps,
} from '@/components/animate-ui/radix/accordion';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';

// Custom SharedLink component that uses link icons instead of folder icons
interface SharedLinkTriggerProps extends AccordionTriggerProps {
  sideComponent?: React.ReactNode;
}

function SharedLinkTrigger({
  children,
  className,
  sideComponent,
  ...props
}: SharedLinkTriggerProps) {
  const { isOpen } = useAccordionItem();

  return (
    <AccordionTrigger
      data-slot='shared-link-trigger'
      className='h-auto py-0 hover:no-underline font-normal relative z-10 max-w-full'
      {...props}
      chevron={false}
    >
      <MotionHighlightItem className='size-full'>
        <div className='flex items-center truncate gap-2 p-2 h-10 relative z-10 rounded-lg w-full cursor-default'>
          <span className='flex [&_svg]:size-4 [&_svg]:shrink-0 items-center gap-2 shrink-1 truncate'>
            <motion.span
              key={isOpen ? 'open' : 'close'}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Link2
                className={cn(
                  'w-4 h-4',
                  isOpen ? 'text-blue-600' : 'text-blue-500'
                )}
              />
            </motion.span>
            <span className='shrink-1 text-sm block truncate break-words'>
              {children}
            </span>
          </span>
          {sideComponent}
        </div>
      </MotionHighlightItem>
    </AccordionTrigger>
  );
}

interface SharedLinkProps
  extends Omit<
    AccordionItemProps,
    'value' | 'onValueChange' | 'defaultValue' | 'children'
  > {
  children?: React.ReactNode;
  name: string;
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  defaultOpen?: string[];
  sideComponent?: React.ReactNode;
}

function SharedLink({
  children,
  className,
  name,
  open,
  defaultOpen,
  onOpenChange,
  sideComponent,
  ...props
}: SharedLinkProps) {
  return (
    <AccordionItem
      data-slot='shared-link'
      value={name}
      className='relative border-b-0'
      {...props}
    >
      <SharedLinkTrigger className={className} sideComponent={sideComponent}>
        {name}
      </SharedLinkTrigger>
      {children && (
        <AccordionContent className='relative pb-0 !ml-7 before:absolute before:-left-3 before:inset-y-0 before:w-px before:h-full before:bg-border'>
          <Accordion type='multiple' className='p-2'>
            {children}
          </Accordion>
        </AccordionContent>
      )}
    </AccordionItem>
  );
}

// =============================================================================
// MOCK DATA FOR SHARED LINKS AND PERSONAL WORKSPACE
// =============================================================================

const sharedLinksData = [
  {
    id: 'link-1',
    name: 'Client Project Assets',
    url: 'https://foldly.app/link/abc123',
    createdAt: '2024-01-15',
    folders: [
      {
        name: 'Brand Guidelines',
        files: [
          { name: 'logo-dark.png', size: '2.3 MB', type: 'image' },
          { name: 'logo-light.png', size: '2.1 MB', type: 'image' },
          { name: 'brand-colors.pdf', size: '1.8 MB', type: 'document' },
          { name: 'typography-guide.pdf', size: '3.2 MB', type: 'document' },
        ],
      },
      {
        name: 'Marketing Materials',
        files: [
          { name: 'hero-banner.jpg', size: '4.5 MB', type: 'image' },
          { name: 'product-showcase.mp4', size: '45.2 MB', type: 'video' },
          { name: 'brochure-template.ai', size: '12.8 MB', type: 'design' },
        ],
      },
    ],
    files: [
      { name: 'project-brief.docx', size: '1.2 MB', type: 'document' },
      { name: 'requirements.txt', size: '0.8 KB', type: 'text' },
    ],
  },
  {
    id: 'link-2',
    name: 'Team Collaboration Hub',
    url: 'https://foldly.app/link/def456',
    createdAt: '2024-01-20',
    folders: [
      {
        name: 'Meeting Notes',
        files: [
          { name: 'q1-planning.md', size: '5.2 KB', type: 'text' },
          { name: 'retrospective-jan.md', size: '3.8 KB', type: 'text' },
          { name: 'team-photos.zip', size: '28.5 MB', type: 'archive' },
        ],
      },
      {
        name: 'Resources',
        files: [
          { name: 'team-handbook.pdf', size: '8.7 MB', type: 'document' },
          {
            name: 'onboarding-checklist.xlsx',
            size: '2.1 MB',
            type: 'spreadsheet',
          },
        ],
      },
    ],
    files: [{ name: 'welcome-message.txt', size: '1.5 KB', type: 'text' }],
  },
  {
    id: 'link-3',
    name: 'Design System Library',
    url: 'https://foldly.app/link/ghi789',
    createdAt: '2024-01-25',
    folders: [
      {
        name: 'Components',
        files: [
          { name: 'button-variants.figma', size: '3.4 MB', type: 'design' },
          { name: 'input-fields.sketch', size: '2.8 MB', type: 'design' },
          { name: 'navigation-patterns.xd', size: '5.1 MB', type: 'design' },
        ],
      },
      {
        name: 'Icons',
        files: [
          { name: 'icon-set-v2.svg', size: '1.2 MB', type: 'image' },
          { name: 'icon-library.ai', size: '15.6 MB', type: 'design' },
        ],
      },
    ],
    files: [
      { name: 'design-tokens.json', size: '45.2 KB', type: 'data' },
      { name: 'style-guide.pdf', size: '6.8 MB', type: 'document' },
    ],
  },
];

const personalWorkspaceData = {
  folders: [
    {
      name: 'My Projects',
      folders: [
        {
          name: 'Website Redesign',
          files: [
            { name: 'wireframes.png', size: '3.2 MB', type: 'image' },
            { name: 'mockups-v3.psd', size: '124.8 MB', type: 'design' },
            { name: 'user-feedback.xlsx', size: '2.1 MB', type: 'spreadsheet' },
          ],
        },
        {
          name: 'Mobile App',
          files: [
            { name: 'app-flow.pdf', size: '4.7 MB', type: 'document' },
            { name: 'prototype-demo.mp4', size: '78.3 MB', type: 'video' },
          ],
        },
      ],
      files: [
        { name: 'project-timeline.pdf', size: '1.8 MB', type: 'document' },
      ],
    },
    {
      name: 'Resources',
      folders: [
        {
          name: 'Stock Photos',
          files: [
            { name: 'hero-backgrounds.zip', size: '156.7 MB', type: 'archive' },
            { name: 'product-shots.zip', size: '89.2 MB', type: 'archive' },
          ],
        },
        {
          name: 'Fonts',
          files: [
            { name: 'Inter-Variable.ttf', size: '1.2 MB', type: 'font' },
            { name: 'Roboto-Regular.woff2', size: '67.8 KB', type: 'font' },
          ],
        },
      ],
      files: [
        { name: 'asset-inventory.csv', size: '23.4 KB', type: 'spreadsheet' },
      ],
    },
    {
      name: 'Archive',
      files: [
        { name: 'old-website-backup.zip', size: '45.7 MB', type: 'archive' },
        { name: 'legacy-designs.psd', size: '234.1 MB', type: 'design' },
      ],
    },
  ],
  files: [
    { name: 'notes.txt', size: '2.1 KB', type: 'text' },
    { name: 'todo-list.md', size: '1.8 KB', type: 'text' },
    { name: 'bookmarks.json', size: '15.6 KB', type: 'data' },
  ],
};

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FilesContainerProps {
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'video':
      return '🎥';
    case 'document':
      return '📄';
    case 'spreadsheet':
      return '📊';
    case 'design':
      return '🎨';
    case 'archive':
      return '📦';
    case 'font':
      return '🔤';
    case 'data':
      return '📋';
    case 'text':
      return '📝';
    default:
      return '📎';
  }
};

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FilesContainer = memo(({ className }: FilesContainerProps) => {
  const [draggedFile, setDraggedFile] = useState<any>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((file: any, source: string) => {
    setDraggedFile({ ...file, source });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedFile(null);
    setDragOverTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOverTarget(target);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, target: string) => {
      e.preventDefault();
      if (draggedFile && draggedFile.source === 'shared') {
        // Copy file from shared to personal workspace
        console.log('Copying file to personal workspace:', draggedFile.name);
        // TODO: Implement actual file copying logic
      }
      setDragOverTarget(null);
    },
    [draggedFile]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className={cn('h-full flex gap-6', className)}
    >
      {/* Left Panel - Shared Files via Links */}
      <motion.div variants={panelVariants} className='flex-1 flex flex-col'>
        <div className='flex items-center gap-2 mb-4'>
          <Link2 className='w-5 h-5 text-blue-600' />
          <h2 className='text-lg font-semibold'>Shared Files</h2>
          <Badge variant='secondary' className='ml-auto'>
            {sharedLinksData.length} links
          </Badge>
        </div>

        <div className='flex-1 relative size-full rounded-xl border bg-background overflow-auto'>
          <MotionHighlight
            controlledItems
            mode='parent'
            hover
            className='bg-muted rounded-lg pointer-events-none'
          >
            <Accordion
              type='multiple'
              defaultValue={['Client Project Assets']}
              className='p-2'
            >
              {sharedLinksData.map(link => (
                <SharedLink
                  key={link.id}
                  name={link.name}
                  sideComponent={
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <div
                        className='inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-gray-100 cursor-pointer transition-colors'
                        onClick={e => {
                          e.stopPropagation();
                          console.log('Share link:', link.name);
                        }}
                        title='Share link'
                      >
                        <Share2 className='w-3 h-3' />
                      </div>
                      <div
                        className='inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-gray-100 cursor-pointer transition-colors'
                        onClick={e => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(link.url);
                          console.log('Copied link URL:', link.url);
                        }}
                        title='Copy link URL'
                      >
                        <Copy className='w-3 h-3' />
                      </div>
                    </div>
                  }
                >
                  {/* Folders within the link */}
                  {link.folders.map(folder => (
                    <Folder key={folder.name} name={folder.name}>
                      {folder.files.map(file => (
                        <File
                          key={file.name}
                          name={file.name}
                          draggable
                          onDragStart={() => handleDragStart(file, 'shared')}
                          onDragEnd={handleDragEnd}
                          sideComponent={
                            <div className='flex items-center gap-1 text-xs text-gray-500'>
                              <span>{getFileIcon(file.type)}</span>
                              <span>{file.size}</span>
                            </div>
                          }
                        />
                      ))}
                    </Folder>
                  ))}

                  {/* Files directly in the link */}
                  {link.files.map(file => (
                    <File
                      key={file.name}
                      name={file.name}
                      draggable
                      onDragStart={() => handleDragStart(file, 'shared')}
                      onDragEnd={handleDragEnd}
                      sideComponent={
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <span>{getFileIcon(file.type)}</span>
                          <span>{file.size}</span>
                        </div>
                      }
                    />
                  ))}
                </SharedLink>
              ))}
            </Accordion>
          </MotionHighlight>
        </div>
      </motion.div>

      {/* Divider */}
      <div className='w-px bg-border' />

      {/* Right Panel - Personal Workspace */}
      <motion.div
        variants={panelVariants}
        className='flex-1 flex flex-col'
        onDragOver={e => handleDragOver(e, 'personal')}
        onDrop={e => handleDrop(e, 'personal')}
      >
        <div className='flex items-center gap-2 mb-4'>
          <User className='w-5 h-5 text-green-600' />
          <h2 className='text-lg font-semibold'>My Workspace</h2>
          <div className='flex items-center gap-2 ml-auto'>
            <Button variant='outline' size='sm'>
              <FolderPlus className='w-4 h-4 mr-2' />
              New Folder
            </Button>
            <Button variant='outline' size='sm'>
              <Upload className='w-4 h-4 mr-2' />
              Upload
            </Button>
          </div>
        </div>

        <Files
          className={cn(
            'flex-1 transition-all duration-200',
            dragOverTarget === 'personal' &&
              'ring-2 ring-green-500 ring-offset-2'
          )}
          defaultOpen={['My Projects']}
        >
          {/* Folders */}
          {personalWorkspaceData.folders.map(folder => (
            <Folder
              key={folder.name}
              name={folder.name}
              sideComponent={
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <div
                    className='inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-gray-100 cursor-pointer transition-colors'
                    onClick={e => {
                      e.stopPropagation();
                      console.log('Share folder:', folder.name);
                    }}
                    title='Share folder'
                  >
                    <Share2 className='w-3 h-3' />
                  </div>
                  <div
                    className='inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-red-100 cursor-pointer transition-colors'
                    onClick={e => {
                      e.stopPropagation();
                      console.log('Delete folder:', folder.name);
                    }}
                    title='Delete folder'
                  >
                    <Trash2 className='w-3 h-3 text-red-600' />
                  </div>
                </div>
              }
            >
              {/* Subfolders */}
              {folder.folders?.map(subfolder => (
                <Folder key={subfolder.name} name={subfolder.name}>
                  {subfolder.files.map(file => (
                    <File
                      key={file.name}
                      name={file.name}
                      sideComponent={
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <span>{getFileIcon(file.type)}</span>
                          <span>{file.size}</span>
                        </div>
                      }
                    />
                  ))}
                </Folder>
              ))}

              {/* Files directly in the folder */}
              {folder.files?.map(file => (
                <File
                  key={file.name}
                  name={file.name}
                  sideComponent={
                    <div className='flex items-center gap-1 text-xs text-gray-500'>
                      <span>{getFileIcon(file.type)}</span>
                      <span>{file.size}</span>
                    </div>
                  }
                />
              ))}
            </Folder>
          ))}

          {/* Files in root */}
          {personalWorkspaceData.files.map(file => (
            <File
              key={file.name}
              name={file.name}
              sideComponent={
                <div className='flex items-center gap-1 text-xs text-gray-500'>
                  <span>{getFileIcon(file.type)}</span>
                  <span>{file.size}</span>
                </div>
              }
            />
          ))}
        </Files>
      </motion.div>
    </motion.div>
  );
});

FilesContainer.displayName = 'FilesContainer';

export { FilesContainer };
