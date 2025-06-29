import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function NotFound() {
  const { userId } = await auth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <div className='text-center'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#4f46e5] mb-4'>
            404
          </h1>
          <div className='w-24 h-1 bg-gradient-to-r from-[#6c47ff] to-[#4f46e5] mx-auto mb-6'></div>
        </div>

        <h2 className='text-3xl font-bold text-gray-800 mb-4'>
          Oops! Page not found
        </h2>

        <p className='text-lg text-gray-600 mb-8 max-w-md mx-auto'>
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href='/'
            className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#6c47ff] to-[#4f46e5] text-white font-semibold rounded-lg hover:from-[#5a3ad6] hover:to-[#4338ca] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
              />
            </svg>
            Go Home
          </Link>

          {userId && (
            <Link
              href='/dashboard'
              className='inline-flex items-center px-6 py-3 bg-white text-[#6c47ff] font-semibold rounded-lg border-2 border-[#6c47ff] hover:bg-[#6c47ff] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
            >
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
              Dashboard
            </Link>
          )}

          {!userId && (
            <Link
              href='/sign-in'
              className='inline-flex items-center px-6 py-3 bg-white text-[#6c47ff] font-semibold rounded-lg border-2 border-[#6c47ff] hover:bg-[#6c47ff] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
            >
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                />
              </svg>
              Sign In
            </Link>
          )}
        </div>

        <div className='mt-12 text-sm text-gray-500'>
          <p>
            Need help? Contact us at{' '}
            <a
              href='mailto:support@foldly.com'
              className='text-[#6c47ff] hover:underline'
            >
              support@foldly.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
