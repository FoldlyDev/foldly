'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import { Link2, Hash, Share2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserLinks } from '../../hooks/use-files-data';
import { LinkTree } from '../trees/link-tree';
import { recalculateLinkStatsAction } from '../../lib/actions';
import type { LinksPanelProps, LinkSection } from '../../types/links';
import type { LinkType } from '../../types';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/animate-ui/radix/accordion';

export function LinksPanel({ isMobile }: LinksPanelProps) {
  const { data: linksData, isLoading, isError } = useUserLinks();

  // One-time recalculation of link stats to fix any mismatches
  useEffect(() => {
    if (!linksData || isLoading) return;

    // Recalculate stats for all links to ensure accuracy
    const recalculateStats = async () => {
      const allLinks = [
        linksData.baseLink,
        ...(linksData.topicLinks || []),
        ...(linksData.generatedLinks || []),
      ].filter(Boolean);

      for (const link of allLinks) {
        if (link?.id) {
          try {
            await recalculateLinkStatsAction(link.id);
          } catch (error) {
            console.error(
              `Failed to recalculate stats for link ${link.id}:`,
              error
            );
          }
        }
      }
    };

    // Run once on mount
    recalculateStats();
  }, []); // Empty deps to run only once

  // Transform real data into sections - always include all sections
  const linkSections: LinkSection[] = useMemo(() => {
    const sections: LinkSection[] = [];

    // Base link section - always show
    if (linksData?.baseLink) {
      sections.push({
        type: 'base',
        title: 'Base Link',
        icon: <Link2 className='h-4 w-4' />,
        items: [
          {
            id: linksData.baseLink.id,
            name: `foldly.com/${linksData.baseLink.slug}`,
            filesCount: linksData.baseLink.totalFiles,
            slug: linksData.baseLink.slug,
          },
        ],
      });
    } else if (!isLoading) {
      sections.push({
        type: 'base',
        title: 'Base Link',
        icon: <Link2 className='h-4 w-4' />,
        items: [],
      });
    }

    // Topic links section - always show
    sections.push({
      type: 'topic' as LinkType,
      title: 'Topic Links',
      icon: <Hash className='h-4 w-4' />,
      ...(linksData?.topicLinks?.length && {
        count: linksData.topicLinks.length,
      }),
      items:
        linksData?.topicLinks?.map(link => ({
          id: link.id,
          name: link.topic || link.title,
          filesCount: link.totalFiles,
          slug: link.slug,
          topic: link.topic,
        })) || [],
    });

    // Generated links section - always show
    sections.push({
      type: 'generated',
      title: 'Generated Links',
      icon: <Share2 className='h-4 w-4' />,
      ...(linksData?.generatedLinks?.length && {
        count: linksData.generatedLinks.length,
      }),
      items:
        linksData?.generatedLinks?.map(link => ({
          id: link.id,
          name: link.title,
          filesCount: link.totalFiles,
          slug: link.slug,
        })) || [],
    });

    return sections;
  }, [linksData, isLoading]);

  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    e.dataTransfer.setData('linkId', linkId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Stable callbacks for file selection and refresh
  const handleBaseLinkFilesSelected = useCallback((fileIds: string[]) => {
    console.log('Files selected in base link:', fileIds);
  }, []);

  const handleBaseLinkRefresh = useCallback(() => {
    console.log('Refresh requested for base link');
  }, []);

  const handleLinkFilesSelected = useCallback((fileIds: string[], linkType: string, linkId: string) => {
    console.log(`Files selected in ${linkType} link ${linkId}:`, fileIds);
  }, []);

  const handleLinkRefresh = useCallback((linkType: string, linkId: string) => {
    console.log(`Refresh requested for ${linkType} link ${linkId}`);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className='links-panel-container'>
        <div className='links-panel-header'>
          <h2 className='links-panel-title'>Your Links</h2>
          <p className='links-panel-subtitle'>Loading links...</p>
        </div>
        <div className='links-panel-content'>
          <div className='flex items-center justify-center h-32'>
            <Loader2 className='h-6 w-6 animate-spin opacity-50' />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className='links-panel-container'>
        <div className='links-panel-header'>
          <h2 className='links-panel-title'>Your Links</h2>
          <p className='links-panel-subtitle'>Failed to load links</p>
        </div>
        <div className='links-panel-content'>
          <div className='text-center p-4 opacity-60'>
            <p className='text-sm'>Unable to fetch your links.</p>
            <p className='text-xs mt-1'>Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='links-panel-container'>
      <div className='links-panel-header'>
        <h2 className='links-panel-title'>Your Links</h2>
      </div>

      <div className='links-panel-content'>
        <Accordion type='multiple' className='w-full space-y-2'>
          {linkSections.map(section => (
            <AccordionItem key={section.type} value={section.type}>
              <AccordionTrigger className='px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg hover:no-underline'>
                <div className='flex items-center gap-2'>
                  {section.icon}
                  <span className='text-sm md:text-base font-medium'>
                    {section.title}
                  </span>
                  {section.count !== undefined && section.count > 0 && (
                    <span className='text-xs md:text-sm opacity-70'>
                      ({section.count})
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className='px-3 pb-2'>
                {/* Base link section - single tree directly */}
                {section.type === 'base' ? (
                  section.items &&
                  section.items.length > 0 &&
                  linksData?.baseLink ? (
                    <LinkTree
                      linkData={linksData.baseLink}
                      linkType='base'
                      onFilesSelected={handleBaseLinkFilesSelected}
                      onRefresh={handleBaseLinkRefresh}
                    />
                  ) : (
                    <div className='text-center py-4 opacity-60'>
                      <p className='text-sm'>No base link created yet</p>
                      <p className='text-xs mt-1'>
                        Create your first link to start collecting files
                      </p>
                    </div>
                  )
                ) : /* Topic and Generated links sections - nested accordions for each link */
                section.type === ('topic' as LinkType) ||
                  section.type === 'generated' ? (
                  section.items && section.items.length > 0 ? (
                    <Accordion
                      type='single'
                      collapsible
                      className='w-full space-y-1 mt-1'
                    >
                      {section.items.map(item => {
                        // Get the full link data for the tree
                        const fullLinkData =
                          section.type === ('topic' as LinkType)
                            ? linksData?.topicLinks?.find(l => l.id === item.id)
                            : linksData?.generatedLinks?.find(
                                l => l.id === item.id
                              );

                        if (!fullLinkData) return null;

                        return (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            className='border-0'
                          >
                            <AccordionTrigger
                              className={cn(
                                'px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md hover:no-underline',
                                'border border-transparent hover:border-black/10 dark:hover:border-white/10',
                                !isMobile && 'draggable'
                              )}
                              draggable={!isMobile}
                              onDragStart={e =>
                                !isMobile && handleDragStart(e, item.id)
                              }
                            >
                              <div className='flex items-center gap-2 w-full'>
                                <Link2 className='h-3 w-3 opacity-50' />
                                <span className='text-xs font-medium flex-1 text-left truncate'>
                                  {item.name}
                                </span>
                                <span className='text-[10px] opacity-50 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded'>
                                  {item.filesCount}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className='pl-4 pr-2 pb-2 pt-1'>
                              <LinkTree
                                linkData={fullLinkData}
                                linkType={section.type}
                                onFilesSelected={(fileIds) => handleLinkFilesSelected(fileIds, section.type, item.id)}
                                onRefresh={() => handleLinkRefresh(section.type, item.id)}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <div className='text-center py-4 opacity-60'>
                      {section.type === ('topic' as LinkType) ? (
                        <>
                          <p className='text-sm'>No topic links available</p>
                          <p className='text-xs mt-1'>
                            Topic links allow categorized file collection
                          </p>
                        </>
                      ) : (
                        <>
                          <p className='text-sm'>No generated links</p>
                          <p className='text-xs mt-1'>
                            Generated links are created from workspace folders
                          </p>
                        </>
                      )}
                    </div>
                  )
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
