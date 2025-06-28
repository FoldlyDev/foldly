import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Foldly Dashboard
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <nav className='flex space-x-8'>
                <a
                  href='/dashboard'
                  className='text-gray-900 hover:text-[#6c47ff] px-3 py-2 rounded-md text-sm font-medium'
                >
                  Dashboard
                </a>
                <a
                  href='/dashboard/links'
                  className='text-gray-500 hover:text-[#6c47ff] px-3 py-2 rounded-md text-sm font-medium'
                >
                  Links
                </a>
                <a
                  href='/dashboard/files'
                  className='text-gray-500 hover:text-[#6c47ff] px-3 py-2 rounded-md text-sm font-medium'
                >
                  Files
                </a>
                <a
                  href='/dashboard/settings'
                  className='text-gray-500 hover:text-[#6c47ff] px-3 py-2 rounded-md text-sm font-medium'
                >
                  Settings
                </a>
              </nav>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
