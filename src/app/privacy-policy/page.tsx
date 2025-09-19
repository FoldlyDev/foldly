'use client';

import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = '/legal/Privacy Policy.pdf';
    link.download = 'Foldly_Privacy_Policy.pdf';
    link.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close the tab after a short delay to ensure download starts
    setTimeout(() => {
      // Try to close the tab/window
      window.close();

      // If window.close() doesn't work (common in tabs not opened by script),
      // redirect to a friendly message or the homepage
      setTimeout(() => {
        // If we're still here after 500ms, the tab didn't close
        // Redirect to homepage or show a message
        window.location.href = '/';
      }, 500);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Downloading Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">
          Your download should start automatically. If it doesn't,
          <a
            href="/legal/Privacy Policy.pdf"
            download="Foldly_Privacy_Policy.pdf"
            className="text-primary hover:underline ml-1"
          >
            click here
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          This tab will close automatically, or you'll be redirected to the homepage.
        </p>
      </div>
    </div>
  );
}