import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const role = session.user.role;

  switch (role) {
    case 'ADMIN_NATIONAL':
      redirect('/admin/dashboard');
    case 'SUPERVISEUR_NATIONAL':
      redirect('/national/dashboard');
    case 'SUPERVISEUR_REGIONAL':
      redirect('/regional/dashboard');
    case 'AGENT_SANTE':
      redirect('/agent/dashboard');
    default:
      redirect('/auth/login');
  }
}