import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-bold tracking-tight text-gray-900'>
            Welcome back to Foldly
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Sign in to manage your file collection links
          </p>
        </div>
        <div className='flex justify-center'>
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-[#6c47ff] hover:bg-[#5a3dd9]',
                card: 'shadow-xl',
              },
            }}
            redirectUrl='/dashboard'
          />
        </div>
      </div>
    </div>
  );
}
