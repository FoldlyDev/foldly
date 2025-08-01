import { Metadata } from 'next';
import '@/features/link-upload/styles/upload-theme.css';

export const metadata: Metadata = {
  title: 'Upload Files - Foldly',
  description: 'Upload files securely',
};

export default function LinkUploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}