import { ContentLoader } from '@/components/ui/content-loader';

export default function DashboardLoading() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
      <ContentLoader size='lg' />
      <p className='text-neutral-600 text-sm font-medium'>
        Loading dashboard...
      </p>
    </div>
  );
}
