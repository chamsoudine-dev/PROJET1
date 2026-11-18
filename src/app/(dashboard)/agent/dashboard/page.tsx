import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayout';
import { NetworkStatusBadge } from '@/components/layout/NetworkStatus';
import { Users, Stethoscope, Pill, Baby, Package, FileText, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AgentDashboardPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Tableau de bord Agent</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre formation sanitaire</p>
          </div>
          <div className="flex items-center gap-4">
            <NetworkStatusBadge />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients enregistrés</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1 247</div>
              <p className="text-xs text-muted-foreground">+12 cette semaine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultations (mois)</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 456</div>
              <p className="text-xs text-muted-foreground">+8% vs mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vaccinations (mois)</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 891</div>
              <p className="text-xs text-muted-foreground">+5% vs mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
              <p className="text-xs text-muted-foreground">Nécessitent attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/agent/patients/new">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                  <Users className="w-8 h-8 text-primary" />
                  <span className="text-center">Nouveau<br />patient</span>
                </Button>
              </Link>
              <Link href="/agent/consultations/new">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                  <span className="text-center">Nouvelle<br />consultation</span>
                </Button>
              </Link>
              <Link href="/agent/vaccinations/new">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                  <Pill className="w-8 h-8 text-blue-600" />
                  <span className="text-center">Vaccination</span>
                </Button>
              </Link>
              <Link href="/agent/maternel/new">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 w-full">
                  <Baby className="w-8 h-8 text-pink-600" />
                  <span className="text-center">Suivi<br />maternel</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activité récente</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/patients">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: 'Il y a 10 min', action: 'Nouveau patient', details: 'Amadou Diallo - SN-2026-A7F3K9', type: 'patient' },
                { time: 'Il y a 25 min', action: 'Consultation', details: 'Mariama Sow - Paludisme (B50.0)', type: 'consultation' },
                { time: 'Il y a 1h', action: 'Vaccination', details: 'Fatou Diallo - PENTA dose 2', type: 'vaccination' },
                { time: 'Il y a 2h', action: 'CPN', details: 'Aissatou Ba - CPN #3', type: 'maternel' },
                { time: 'Il y a 3h', action: 'Nouveau patient', details: 'Moussa Traoré - SN-2026-B9K2L1', type: 'patient' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {item.type === 'patient' && <Users className="w-5 h-5 text-primary" />}
                      {item.type === 'consultation' && <Stethoscope className="w-5 h-5 text-green-600" />}
                      {item.type === 'vaccination' && <Pill className="w-5 h-5 text-blue-600" />}
                      {item.type === 'maternel' && <Baby className="w-5 h-5 text-pink-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutWrapper>
  );
}