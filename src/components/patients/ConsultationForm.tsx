'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, Plus, Trash2, Pill, Stethoscope } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const treatmentSchema = z.object({
  dci: z.string().min(1, 'DCI requise'),
  dose: z.string().min(1, 'Dose requise'),
  duree: z.string().min(1, 'Durée requise'),
  frequence: z.string().min(1, 'Fréquence requise'),
});

const consultationSchema = z.object({
  patientId: z.string().optional(),
  motif: z.enum([
    'MALADIE',
    'VACCINATION',
    'CPN',
    'ACCOUCHEMENT',
    'CPON',
    'NUTRITION',
    'PLANNING_FAMILIAL',
    'AUTRE',
  ]),
  cim10Code: z.string().max(10).optional().nullable(),
  cim10Libelle: z.string().max(200).optional().nullable(),
  diagnosticSecondaire: z.array(z.string()).optional(),
  traitement: z.array(treatmentSchema).optional(),
  evolution: z.enum([
    'GUERISON',
    'AMELIORATION',
    'STATIONNAIRE',
    'AGGRAVATION',
    'DECES',
    'REFERENCE',
  ]).optional(),
  refererVersId: z.string().optional().nullable(),
  observations: z.string().max(2000).optional().nullable(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface ConsultationFormProps {
  initialData?: Partial<ConsultationFormData>;
  patientId?: string;
}

export function ConsultationForm({ initialData, patientId }: ConsultationFormProps) {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cim10Suggestions, setCim10Suggestions] = useState<string[]>([]);

  const effectivePatientId = patientId || params.id;

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      motif: 'MALADIE',
      cim10Code: '',
      cim10Libelle: '',
      diagnosticSecondaire: [],
      traitement: [],
      evolution: 'GUERISON',
      refererVersId: '',
      observations: '',
      ...initialData,
    },
  });

  const { fields: traitementFields, append: appendTraitement, remove: removeTraitement } = useFieldArray({
    control: form.control,
    name: 'traitement',
  });

  // Search CIM-10 suggestions
  useEffect(() => {
    const cim10Code = form.watch('cim10Code');
    if (cim10Code && cim10Code.length >= 2) {
      // Debounced search would go here
      // For now, static common codes
      const commonCodes = [
        'A09', 'B50', 'J06', 'J18', 'E11', 'I10', 'J45', 'K59', 'N39', 'O00',
        'A09.0', 'B50.0', 'B50.8', 'B50.9', 'J06.9', 'J18.9', 'E11.9', 'I10', 'J45.9', 'K59.1', 'N39.0', 'O00.0',
      ];
      setCim10Suggestions(
        commonCodes.filter(code => code.toLowerCase().includes(cim10Code.toLowerCase()))
      );
    } else {
      setCim10Suggestions([]);
    }
  }, [form.watch('cim10Code')]);

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          patientId: parseInt(effectivePatientId as string),
          diagnosticSecondaire: data.diagnosticSecondaire || [],
          traitement: data.traitement || [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/agent/patients/${effectivePatientId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const motifLabels: Record<string, string> = {
    MALADIE: 'Maladie',
    VACCINATION: 'Vaccination',
    CPN: 'Consultation Prénatale (CPN)',
    ACCOUCHEMENT: 'Accouchement',
    CPON: 'Consultation Post-Natale (CPON)',
    NUTRITION: 'Nutrition',
    PLANNING_FAMILIAL: 'Planning Familial',
    AUTRE: 'Autre',
  };

  const evolutionLabels: Record<string, string> = {
    GUERISON: 'Guérison',
    AMELIORATION: 'Amélioration',
    STATIONNAIRE: 'Stationnaire',
    AGGRAVATION: 'Aggravation',
    DECES: 'Décès',
    REFERENCE: 'Référence',
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle Consultation</CardTitle>
        <CardDescription>
          Saisissez les détails de la consultation médicale
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert variant="success" className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Consultation enregistrée avec succès !</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Motif & Diagnostic */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Motif & Diagnostic
            </legend>

            <div className="space-y-2">
              <Label>Motif de consultation *</Label>
              <Select
                onValueChange={(value: 'MALADIE' | 'VACCINATION' | 'CPN' | 'ACCOUCHEMENT' | 'CPON' | 'NUTRITION' | 'PLANNING_FAMILIAL' | 'AUTRE') => form.setValue('motif', value)}
                defaultValue={form.getValues('motif')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le motif" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(motifLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cim10Code">Code CIM-10 principal</Label>
                <div className="relative">
                  <Input
                    id="cim10Code"
                    placeholder="Ex: B50.0"
                    {...form.register('cim10Code')}
                    onChange={(e) => {
                      form.setValue('cim10Code', e.target.value.toUpperCase(), { shouldValidate: true });
                    }}
                  />
                  {cim10Suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-auto">
                      {cim10Suggestions.map((code) => (
                        <button
                          key={code}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            form.setValue('cim10Code', code, { shouldValidate: true });
                            setCim10Suggestions([]);
                          }}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cim10Libellé">Libellé CIM-10</Label>
                <Input
                  id="cim10Libellé"
                  placeholder="Libellé du diagnostic"
                  {...form.register('cim10Libelle')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diagnostics secondaires (codes CIM-10)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un code..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim().toUpperCase();
                      if (value) {
                        const current = form.getValues('diagnosticSecondaire') || [];
                        if (!current.includes(value)) {
                          form.setValue('diagnosticSecondaire', [...current, value]);
                        }
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const current = form.getValues('diagnosticSecondaire') || [];
                  if (current.length > 0) {
                    form.setValue('diagnosticSecondaire', current.slice(0, -1));
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {((form.getValues('diagnosticSecondaire') as string[] | undefined) || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {((form.getValues('diagnosticSecondaire') as string[] | undefined) || []).map((code, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {code}
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.getValues('diagnosticSecondaire') || [];
                          form.setValue('diagnosticSecondaire', current.filter((_, i) => i !== index));
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* Traitement / Ordonnance */}
          <fieldset className="space-y-4 border-t pt-6">
            <legend className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Traitement / Ordonnance
            </legend>

            <div className="space-y-3">
              {traitementFields.map((field, index) => (
                <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] items-end">
                  <div className="space-y-1">
                    <Label>DCI</Label>
                    <Input
                      placeholder="Paracétamol"
                      {...form.register(`traitement.${index}.dci`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Dose</Label>
                    <Input
                      placeholder="500 mg"
                      {...form.register(`traitement.${index}.dose`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Durée</Label>
                    <Input
                      placeholder="5 jours"
                      {...form.register(`traitement.${index}.duree`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Fréquence</Label>
                    <Select
                      onValueChange={(value) => form.setValue(`traitement.${index}.frequence`, value)}
                      defaultValue={form.getValues(`traitement.${index}.frequence`)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1/jour">1 fois / jour</SelectItem>
                        <SelectItem value="2/jour">2 fois / jour</SelectItem>
                        <SelectItem value="3/jour">3 fois / jour</SelectItem>
                        <SelectItem value="4/jour">4 fois / jour</SelectItem>
                        <SelectItem value="si_besoin">Si besoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTraitement(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {traitementFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun médicament prescrit
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => appendTraitement({ dci: '', dose: '', duree: '', frequence: '1/jour' })}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un médicament
              </Button>
            </div>
          </fieldset>

          {/* Évolution & Référence */}
          <fieldset className="space-y-4 border-t pt-6">
            <legend className="text-lg font-medium text-foreground mb-4">Évolution & Référence</legend>

            <div className="space-y-2">
              <Label>Évolution</Label>
              <Select
                onValueChange={(value: 'GUERISON' | 'AMELIORATION' | 'STATIONNAIRE' | 'AGGRAVATION' | 'DECES' | 'REFERENCE') => form.setValue('evolution', value)}
                defaultValue={form.getValues('evolution')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'évolution" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(evolutionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refererVersId">Référé vers (si applicable)</Label>
              <Select
                onValueChange={(value: string) => form.setValue('refererVersId', value || undefined)}
                defaultValue={form.getValues('refererVersId') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune (pas de référence)</SelectItem>
                  {/* Les formations seraient chargées dynamiquement */}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si l'évolution est "Référence", une formation de destination est requise
              </p>
            </div>
          </fieldset>

          {/* Observations */}
          <fieldset className="space-y-2 border-t pt-6">
            <legend className="text-lg font-medium text-foreground mb-4">Observations</legend>
            <Textarea
              placeholder="Notes supplémentaires, conseils, rendez-vous de suivi..."
              rows={4}
              {...form.register('observations')}
            />
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Enregistrer la consultation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}