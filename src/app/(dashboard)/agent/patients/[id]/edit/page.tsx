import { auth } from '@/lib/auth/config';
import { PatientForm } from '@/components/patients/PatientForm';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPatientPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'AGENT_SANTE') {
    redirect('/auth/login');
  }

  const { id } = await params;

  return (
    <div className="container-narrow py-6">
      <div className="mb-6">
        <a href={`/agent/patients/${id}`} className="text-primary hover:underline flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au patient
        </a>
      </div>
      <PatientForm isEditing={true} patientId={id} />
    </div>
  );
}