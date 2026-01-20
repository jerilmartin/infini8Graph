import { redirect } from 'next/navigation';

export default function Home() {
  // Simply redirect to login page
  redirect('/login');
}
