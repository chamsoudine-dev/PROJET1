'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, Edit, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  createdAt: string;
}

interface PatientResponse {
  data: Patient[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      }

      const response = await fetch(`/api/patients?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des patients');
      }

      const result: PatientResponse = await response.json();
      setPatients(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedQuery]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const getAge = (patient: Patient): string => {
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

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Liste des patients ({total})</CardTitle>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                }
              }}
            />
          </div>
        </div>
      </CardHeader>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 text-destructive p-4 mb-4 rounded-lg">
          {error}
        </div>
      )}

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">ID National</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead className="w-24">Sexe</TableHead>
                    <TableHead className="w-28">Âge</TableHead>
                    <TableHead>Localité</TableHead>
                    <TableHead className="w-32">Créé le</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun patient trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{patient.identifiantNational}</TableCell>
                        <TableCell className="font-medium">{patient.nom}</TableCell>
                        <TableCell>{patient.prenom}</TableCell>
                        <TableCell>
                          <Badge variant={patient.sexe === 'M' ? 'default' : 'secondary'}>
                            {patient.sexe === 'M' ? 'M' : 'F'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getAge(patient)}</TableCell>
                        <TableCell>
                          {patient.village || patient.quartier ? (
                            <span className="text-sm">
                              {patient.village || ''}
                              {patient.village && patient.quartier ? ', ' : ''}
                              {patient.quartier || ''}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(patient.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a href={`/agent/patients/${patient.id}`} className="text-primary hover:underline text-sm">
                              <Eye className="w-4 h-4 inline mr-1" /> Voir
                            </a>
                            <a href={`/agent/patients/${patient.id}/edit`} className="text-muted-foreground hover:text-primary text-sm">
                              <Edit className="w-4 h-4 inline mr-1" /> Modifier
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}