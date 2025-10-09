'use client';

import { BubbleBackground } from '@/components/core/bubble';
import { ArrowLeft } from '@/components/ui/animate-ui/icons/arrow-left';
import { AnimateIcon } from '@/components/ui/animate-ui/icons/icon';
import '@/features/auth/styles/auth-pages.css';

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Bubble background with proper positioning */}
      <div className='fixed inset-0'>
        <BubbleBackground />
      </div>

      {/* Content wrapper */}
      <div className='relative z-10 flex flex-col items-center justify-start min-h-screen'>
        {/* Back button */}
        <a href='/' className='auth-back-button' aria-label='Back to home'>
          <AnimateIcon>
            <ArrowLeft />
          </AnimateIcon>
          Back
        </a>

        {/* Privacy Policy Content */}
        <div className='w-full max-w-4xl mx-auto px-4 py-20'>
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12'>
          <h1 className='text-4xl font-bold mb-6 text-gray-900'>Privacy Policy for Foldly.com</h1>

          <div className='text-sm text-gray-600 mb-8'>
            <strong>Effective Date:</strong> September 18, 2025
          </div>

          <p className='mb-8 text-gray-700'>
            Foldly.com ("we," "our," or "us") respects your privacy and is committed to protecting the
            information you share with us. This Privacy Policy explains how we collect, use, and protect
            your personal data when you use our website and services.
          </p>

          <div className='space-y-8'>
            {/* Section 1 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>1. Information We Collect</h2>
              <p className='mb-4 text-gray-700'>When you use Foldly.com, we may collect the following types of information:</p>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li><strong>Account Information:</strong> If you register, we may collect your name, email address, and password.</li>
                <li><strong>Uploaded Files:</strong> Any files you choose to upload will be stored on our servers and associated with your account.</li>
                <li><strong>Usage Data:</strong> We automatically collect information about your interactions with our site, including IP address, browser type, device information, and pages visited.</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to maintain sessions, improve functionality, and analyze site usage.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>2. How We Use Your Information</h2>
              <p className='mb-4 text-gray-700'>We use the information collected to:</p>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li>Provide and improve our services.</li>
                <li>Securely store and deliver your uploaded files.</li>
                <li>Respond to support inquiries and communicate with you.</li>
                <li>Monitor for misuse, abuse, or security threats.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>3. How We Share Information</h2>
              <p className='mb-4 text-gray-700'>
                We do <strong>not</strong> sell your personal information. We may share information only in these limited cases:
              </p>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li><strong>Service Providers:</strong> With third-party vendors who help operate our website (e.g., hosting, analytics, storage).</li>
                <li><strong>Legal Compliance:</strong> If required by law, regulation, legal process, or governmental request.</li>
                <li><strong>Business Transfers:</strong> If Foldly.com is involved in a merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>4. File Storage and Security</h2>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li>Uploaded files are stored securely and are accessible only to you (or anyone you explicitly share them with).</li>
                <li>We use reasonable technical and organizational measures to protect your files and personal data.</li>
                <li>However, no system is 100% secure; you upload and share files at your own risk.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>5. Your Choices and Rights</h2>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li>You may access, download, or delete your files at any time.</li>
                <li>You may update or delete your account information by logging into your profile.</li>
                <li>You can disable cookies in your browser, but some features may not work correctly.</li>
                <li>Depending on your location, you may have additional rights under applicable privacy laws (e.g., GDPR, CCPA).</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>6. Data Retention</h2>
              <ul className='list-disc pl-6 space-y-2 text-gray-700'>
                <li>Files and personal information are retained as long as your account is active.</li>
                <li>If you delete your account, we will delete or anonymize your data, except where retention is required by law.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>7. Children's Privacy</h2>
              <p className='text-gray-700'>
                Foldly.com is not intended for use by anyone under the age of 13 (or the minimum age of digital
                consent in your jurisdiction). We do not knowingly collect personal data from children.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>8. Changes to This Policy</h2>
              <p className='text-gray-700'>
                We may update this Privacy Policy from time to time. If we make material changes, we will notify
                you by posting the new policy with a revised effective date.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className='text-2xl font-semibold mb-4 text-gray-900'>9. Contact Us</h2>
              <p className='text-gray-700'>
                If you have questions or concerns about this Privacy Policy, contact us at:
              </p>
              <p className='mt-2 text-gray-700'>
                <strong>Email:</strong> <a href='mailto:dev@foldly.com' className='text-blue-600 hover:underline'>dev@foldly.com</a>
              </p>
            </section>
          </div>

          {/* Download PDF Option */}
          <div className='mt-12 pt-8 border-t border-gray-200'>
            <p className='text-center text-gray-600'>
              Need a copy?
              <a
                href='/legal/Privacy Policy.pdf'
                download='Foldly_Privacy_Policy.pdf'
                className='ml-2 text-blue-600 hover:underline font-medium'
              >
                Download PDF version
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}