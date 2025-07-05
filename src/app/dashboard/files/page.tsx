import type { Metadata } from 'next';
import { FilesContainer } from '@/features/files';

export const metadata: Metadata = {
  title: 'Files & Downloads | Foldly',
  description: 'View and manage all files collected through your links',
};

export default function FilesPage() {
  // In a real app, you would fetch data here on the server
  // const filesData = await getFilesData();

  return (
    <FilesContainer
    // initialData={filesData}
    // isLoading={false}
    // error={null}
    />
  );
}
