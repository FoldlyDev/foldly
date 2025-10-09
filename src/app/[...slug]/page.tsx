import { notFound } from 'next/navigation';
import { Uploads } from '@/modules/uploads';
import { validateLinkAccessAction } from '@/modules/uploads/lib/actions/link-data-actions';

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

  return <Uploads linkData={linkValidation.data} />;
}