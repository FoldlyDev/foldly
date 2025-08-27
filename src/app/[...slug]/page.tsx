import { notFound } from 'next/navigation';
import { LinkUploadContainer } from '@/features/link-upload/components/views/LinkUploadContainer';
// TODO: Uncomment when validateLinkAccessAction is re-implemented with new tree
// import { validateLinkAccessAction } from '@/features/link-upload/lib/actions/validate-link-access';

interface LinkUploadPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function LinkUploadPage({ params }: LinkUploadPageProps) {
  const { slug } = await params;
  
  // TODO: Re-implement link validation with new tree system
  // const linkValidation = await validateLinkAccessAction({
  //   slugParts: slug,
  // });

  // if (!linkValidation.success || !linkValidation.data) {
  //   notFound();
  // }

  // Temporary placeholder data until validation is re-implemented
  const mockLinkData = {
    id: 'temp-id',
    title: 'Link Upload (Temporary)',
    slug: slug.join('/'),
    branding: { enabled: false }
  };

  return <LinkUploadContainer linkData={mockLinkData} />;
}