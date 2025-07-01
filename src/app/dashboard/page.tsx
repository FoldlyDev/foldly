import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to the new home page
  redirect('/dashboard/home');
}
