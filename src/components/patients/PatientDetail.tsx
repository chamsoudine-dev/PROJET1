'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ArrowLeft, Edit, Calendar, MapPin, Phone, User, AlertCircle, Stethoscope, Pill, Baby, HeartPulse } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  identifiantNational: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  ageEstime: number | null;
  sexe: 'M' | 'F';
  village: string | null;
  quartier: string | null;
  telephone: string | null;
  personneContactNom: string | null;
  personneContactTel: string | null;
  createdAt: string;
  updatedAt: string;
  consultationsCount?: number;
  lastConsultation?: string;
}

interface PatientDetailProps {
  patientId: string;
}

export function PatientDetail({ patientId }: PatientDetailProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Patient non trouvé');
          }
          throw new Error('Erreur lors du chargement');
        }
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const getAge = (): string => {
    if (!patient) return '';
    if (patient.dateNaissance) {
      const birth = new Date(patient.dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} ans`;
    }
    return patient.ageEstime ? `${patient.ageEstime} ans (estimé)` : 'Âge inconnu';
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error || !patient) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Patient non trouvé'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Patient */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-3">
              {patient.nom} {patient.prenom}
              <Badge variant={patient.sexe === 'M' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {patient.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground">ID: {patient.identifiantNational}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/agent/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Âge</p>
            <p className="font-medium">{getAge()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Date de naissance</p>
            <p className="font-medium">{formatDate(patient.dateNaissance)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Téléphone</p>
            <p className="font-medium">{patient.telephone || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Enregistré le</p>
            <p className="font-medium">{formatDate(patient.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Localisation & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localisation & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Village / Localité</p>
            <p className="font-medium">{patient.village || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Quartier</p>
            <p className="font-medium">{patient.quartier || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Personne de contact</p>
            <p className="font-medium">{patient.personneContactNom || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Téléphone contact</p>
            <p className="font-medium">{patient.personneContactTel || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions / Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/agent/patients/${patient.id}/consultations/new`}>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                <Stethoscope className="w-8 h-8 text-primary" />
                <span className="text-center">Nouvelle<br />consultation</span>
              </Button>
            </Link>
            <Link href={`/agent/patients/${patient.id}/vaccinations/new`}>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                <Pill className="w-8 h-8 text-green-600" />
                <span className="text-center">Vaccination</span>
              </Button>
            </Link>
            <Link href={`/agent/patients/${patient.id}/maternel/new`}>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                <Baby className="w-8 h-8 text-pink-600" />
                <span className="text-center">Suivi<br />maternel</span>
              </Button>
            </Link>
            <Link href={`/agent/patients/${patient.id}/consultations`}>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                <HeartPulse className="w-8 h-8 text-red-600" />
                <span className="text-center">Historique<br />consultations</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      {(patient.consultationsCount !== undefined || patient.lastConsultation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total consultations</p>
              <p className="text-2xl font-bold text-primary">{patient.consultationsCount || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernière consultation</p>
              <p className="font-medium">{formatDate(patient.lastConsultation)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}