import { auth } from '@/lib/auth/config';
import { PatientList } from '@/components/patients/PatientList';
import { redirect } from 'next/navigation';

export default async function PatientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'AGENT_SANTE') {
    redirect('/auth/login');
  }

  return (
    <div className="container-narrow py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Registre des Patients</h1>
        <a href="/agent/patients/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau patient
        </a>
      </div>
      <PatientList />
    </div>
  );
}