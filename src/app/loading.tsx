import { ContentLoader } from '@/components/ui/feedback/content-loader';

export default function Loading() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-subtle'>
      <div className='flex flex-col items-center gap-4'>
        <ContentLoader size='lg' />
        <p className='text-neutral-600 text-sm font-medium'>
          Loading Foldly...
        </p>
      </div>
    </div>
  );
}