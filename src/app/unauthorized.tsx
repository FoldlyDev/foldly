import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4'>
      <div className='text-center'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-4'>
            401
          </h1>
          <div className='w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto mb-6'></div>
        </div>

        <h2 className='text-3xl font-bold text-gray-800 mb-4'>Access Denied</h2>

        <p className='text-lg text-gray-600 mb-8 max-w-md mx-auto'>
          You need to be signed in to access this page. Please sign in to
          continue or return to the homepage.
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href='/sign-in'
            className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
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

          <Link
            href='/'
            className='inline-flex items-center px-6 py-3 bg-white text-red-500 font-semibold rounded-lg border-2 border-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
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
        </div>

        <div className='mt-12 text-sm text-gray-500'>
          <p>
            Don't have an account?{' '}
            <Link href='/sign-up' className='text-red-500 hover:underline'>
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
