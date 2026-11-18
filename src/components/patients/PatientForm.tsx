'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

const patientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenom: z.string().min(1, 'Le prénom est requis').max(100),
  dateNaissance: z.string().optional().nullable(),
  ageEstime: z.coerce.number().int().min(0).max(120).optional().nullable(),
  sexe: z.enum(['M', 'F']),
  village: z.string().max(100).optional().nullable(),
  quartier: z.string().max(100).optional().nullable(),
  telephone: z.string().max(20).optional().nullable(),
  personneContactNom: z.string().max(100).optional().nullable(),
  personneContactTel: z.string().max(20).optional().nullable(),
}).refine((data) => data.dateNaissance || data.ageEstime, {
  message: 'Date de naissance ou âge estimé est requis',
  path: ['dateNaissance'],
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  initialData?: Partial<PatientFormData>;
  isEditing?: boolean;
  patientId?: string;
}

export function PatientForm({ initialData, isEditing = false, patientId }: PatientFormProps) {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      dateNaissance: '',
      ageEstime: undefined,
      sexe: 'M',
      village: '',
      quartier: '',
      telephone: '',
      personneContactNom: '',
      personneContactTel: '',
      ...initialData,
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/patients/${patientId || params.id}`
        : '/api/patients';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/agent/patients');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isEditing && patientId) {
      router.push(`/agent/patients/${patientId}`);
    } else {
      router.push('/agent/patients');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Modifier le patient' : 'Nouveau patient'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Mettez à jour les informations du patient'
            : 'Remplissez les champs pour créer un nouveau patient'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert variant="success" className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Patient sauvegardé avec succès !</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identité */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-medium text-foreground mb-4">Identité</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Nom de famille"
                  {...form.register('nom')}
                  required
                />
                {form.formState.errors.nom && (
                  <p className="text-sm text-destructive">{form.formState.errors.nom.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Prénom(s)"
                  {...form.register('prenom')}
                  required
                />
                {form.formState.errors.prenom && (
                  <p className="text-sm text-destructive">{form.formState.errors.prenom.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sexe">Sexe *</Label>
                <Select
                  onValueChange={(value: 'M' | 'F') => form.setValue('sexe', value, { shouldValidate: true })}
                  defaultValue={form.getValues('sexe')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  max={format(new Date(), 'yyyy-MM-dd')}
                  {...form.register('dateNaissance')}
                  onChange={(e) => {
                    form.setValue('dateNaissance', e.target.value, { shouldValidate: true });
                    if (e.target.value) {
                      form.setValue('ageEstime', undefined, { shouldValidate: true });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageEstime">Âge estimé (si date inconnue)</Label>
                <Input
                  id="ageEstime"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="Ex: 25"
                  {...form.register('ageEstime')}
                  onChange={(e) => {
                    form.setValue('ageEstime', e.target.value ? parseInt(e.target.value) : undefined, { shouldValidate: true });
                    if (e.target.value) {
                      form.setValue('dateNaissance', '', { shouldValidate: true });
                    }
                  }}
                />
              </div>
            </div>
          </fieldset>

          {/* Localisation */}
          <fieldset className="space-y-4 border-t pt-6">
            <legend className="text-lg font-medium text-foreground mb-4">Localisation</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="village">Village / Localité</Label>
                <Input
                  id="village"
                  placeholder="Nom du village"
                  {...form.register('village')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quartier">Quartier</Label>
                <Input
                  id="quartier"
                  placeholder="Quartier (optionnel)"
                  {...form.register('quartier')}
                />
              </div>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-4 border-t pt-6">
            <legend className="text-lg font-medium text-foreground mb-4">Contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone patient (optionnel)</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+227 XX XX XX XX"
                  {...form.register('telephone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personneContactNom">Personne de contact</Label>
                <Input
                  id="personneContactNom"
                  placeholder="Nom de la personne à contacter"
                  {...form.register('personneContactNom')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personneContactTel">Téléphone contact</Label>
                <Input
                  id="personneContactTel"
                  type="tel"
                  placeholder="+227 XX XX XX XX"
                  {...form.register('personneContactTel')}
                />
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Enregistrer les modifications' : 'Créer le patient'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}