import { notFound } from 'next/navigation';
import { LinkUploadContainer } from '@/features/link-upload/components/views/LinkUploadContainer';
import { validateLinkAccessAction } from '@/features/link-upload/lib/actions/link-data-actions';

interface LinkUploadPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function LinkUploadPage({ params }: LinkUploadPageProps) {
  const { slug } = await params;
  
  const linkValidation = await validateLinkAccessAction({
    slugParts: slug,
  });

  if (!linkValidation.success || !linkValidation.data) {
    notFound();
  }

  return <LinkUploadContainer linkData={linkValidation.data} />;
}