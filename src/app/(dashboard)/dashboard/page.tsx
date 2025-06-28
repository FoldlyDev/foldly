import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900 mb-4'>
                Welcome to your Foldly Dashboard
              </h1>
              <div className='bg-white rounded-lg shadow p-6 mb-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-4'>
                  Account Information
                </h2>
                <div className='space-y-2 text-left'>
                  <p>
                    <span className='font-medium'>Name:</span> {user?.firstName}{' '}
                    {user?.lastName}
                  </p>
                  <p>
                    <span className='font-medium'>Email:</span>{' '}
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                  <p>
                    <span className='font-medium'>User ID:</span> {userId}
                  </p>
                  <p>
                    <span className='font-medium'>Member since:</span>{' '}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='bg-white rounded-lg shadow p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                    Upload Links
                  </h3>
                  <p className='text-3xl font-bold text-[#6c47ff]'>0</p>
                  <p className='text-sm text-gray-600'>Total links created</p>
                </div>
                <div className='bg-white rounded-lg shadow p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                    Files Collected
                  </h3>
                  <p className='text-3xl font-bold text-[#6c47ff]'>0</p>
                  <p className='text-sm text-gray-600'>Files received</p>
                </div>
                <div className='bg-white rounded-lg shadow p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                    Storage Used
                  </h3>
                  <p className='text-3xl font-bold text-[#6c47ff]'>0 MB</p>
                  <p className='text-sm text-gray-600'>of unlimited</p>
                </div>
              </div>
              <div className='mt-8'>
                <button className='bg-[#6c47ff] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5a3dd9] transition-colors'>
                  Create Your First Upload Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
