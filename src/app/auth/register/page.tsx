'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Mail, Lock, User, MapPin, Building2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    prenom: '',
    nom: '',
    telephone: '',
    role: 'AGENT_SANTE',
    regionId: '',
    districtId: '',
    formationSanitaireId: '',
  });

  // Dynamic data
  const [regions, setRegions] = useState<Array<{id: number; nom: string}>>([]);
  const [districts, setDistricts] = useState<Array<{id: number; nom: string}>>([]);
  const [formations, setFormations] = useState<Array<{id: number; nom: string}>>([]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  // Load regions on mount
  useEffect(() => {
    loadRegions();
  }, []);

  async function loadRegions() {
    try {
      const data = await fetch('/api/auth/regions').then(r => r.json());
      setRegions(data);
    } catch {}
  }

  async function loadDistricts(regionId: string) {
    if (!regionId) {
      setDistricts([]);
      setFormations([]);
      updateField('districtId', '');
      updateField('formationSanitaireId', '');
      return;
    }
    try {
      const data = await fetch(`/api/auth/districts?regionId=${regionId}`).then(r => r.json());
      setDistricts(data);
      setFormations([]);
      updateField('districtId', '');
      updateField('formationSanitaireId', '');
    } catch {}
  }

  async function loadFormations(districtId: string) {
    if (!districtId) {
      setFormations([]);
      updateField('formationSanitaireId', '');
      return;
    }
    try {
      const data = await fetch(`/api/auth/formations?districtId=${districtId}`).then(r => r.json());
      setFormations(data);
      updateField('formationSanitaireId', '');
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 12) {
      setErrorMessage('Le mot de passe doit contenir au moins 12 caractères');
      setIsLoading(false);
      return;
    }
    if (!formData.regionId || !formData.districtId || !formData.formationSanitaireId) {
      setErrorMessage('Veuillez sélectionner région, district et formation sanitaire');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Erreur lors de l\'inscription');
        return;
      }

      setSuccessMessage('Inscription réussie ! Votre compte est en attente de validation par le superviseur régional.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        prenom: '',
        nom: '',
        telephone: '',
        role: 'AGENT_SANTE',
        regionId: '',
        districtId: '',
        formationSanitaireId: '',
      });
      setDistricts([]);
      setFormations([]);
    } catch {
      setErrorMessage('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Inscription Agent de Santé</CardTitle>
          <CardDescription>
            Créez votre compte pour accéder à Santé Numérique Niger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Informations personnelles */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium">Informations personnelles</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => updateField('prenom', e.target.value)}
                      placeholder="Votre prénom"
                      required
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => updateField('nom', e.target.value)}
                      placeholder="Votre nom"
                      required
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="votre@formation.ne"
                    required
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => updateField('telephone', e.target.value)}
                  placeholder="+227 XX XX XX XX"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </fieldset>

            {/* Step 2: Affectation géographique */}
            <fieldset className="space-y-4 border-t pt-6">
              <legend className="text-lg font-medium">Affectation géographique</legend>
              <p className="text-sm text-muted-foreground">
                Sélectionnez votre région, district et formation sanitaire d'affectation
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="regionId">Région</Label>
                  <Select
                    value={formData.regionId}
                    onValueChange={(value) => {
                      updateField('regionId', value);
                      loadDistricts(value);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="districtId">District sanitaire</Label>
                  <Select
                    value={formData.districtId}
                    onValueChange={(value) => {
                      updateField('districtId', value);
                      loadFormations(value);
                    }}
                    disabled={isLoading || districts.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formationSanitaireId">Formation sanitaire</Label>
                  <Select
                    value={formData.formationSanitaireId}
                    onValueChange={(value) => updateField('formationSanitaireId', value)}
                    disabled={isLoading || formations.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une formation" />
                    </SelectTrigger>
                    <SelectContent>
                      {formations.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* Step 3: Sécurité */}
            <fieldset className="space-y-4 border-t pt-6">
              <legend className="text-lg font-medium">Sécurité du compte</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Min. 12 caractères"
                      required
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Au moins 12 caractères, majuscule, minuscule, chiffre, caractère spécial
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              <Shield className="mr-2 h-4 w-4" />
              S'inscrire
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Votre compte sera validé par le superviseur régional de votre région.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Plateforme du Ministère de la Santé Publique du Niger
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}