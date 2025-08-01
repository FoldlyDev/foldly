import { notFound } from 'next/navigation';
import { LinkUploadContainer } from '@/features/link-upload/components/views/LinkUploadContainer';
import { validateLinkAccessAction } from '@/features/link-upload/lib/actions/validate-link-access';

interface LinkUploadPageProps {
  params: {
    slug: string[];
  };
}

export default async function LinkUploadPage({ params }: LinkUploadPageProps) {
  const { slug } = params;
  
  // Validate link access and get link data
  const linkValidation = await validateLinkAccessAction({
    slugParts: slug,
  });

  if (!linkValidation.success || !linkValidation.data) {
    notFound();
  }

  return <LinkUploadContainer linkData={linkValidation.data} />;
}