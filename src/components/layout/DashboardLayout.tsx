'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Baby,
  HeartPulse,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  Activity,
  Building2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { NetworkStatusIndicator } from '@/components/layout/NetworkStatus';
import { auth } from '@/lib/auth/config';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/agent/dashboard', icon: LayoutDashboard, roles: ['AGENT_SANTE'] },
  { label: 'Patients', href: '/agent/patients', icon: Users, roles: ['AGENT_SANTE'] },
  { label: 'Consultations', href: '/agent/consultations', icon: Stethoscope, roles: ['AGENT_SANTE'] },
  { label: 'Vaccinations', href: '/agent/vaccinations', icon: Pill, roles: ['AGENT_SANTE'] },
  { label: 'Santé maternelle', href: '/agent/maternel', icon: Baby, roles: ['AGENT_SANTE'] },
  { label: 'Pharmacie', href: '/agent/pharmacie', icon: Package, roles: ['AGENT_SANTE'] },
  { label: 'Rapports', href: '/agent/rapports', icon: FileText, roles: ['AGENT_SANTE'] },
];

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    formationSanitaireId?: string | null;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user.role)
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN_NATIONAL': return 'Administrateur national';
      case 'SUPERVISEUR_NATIONAL': return 'Superviseur national';
      case 'SUPERVISEUR_REGIONAL': return 'Superviseur régional';
      case 'AGENT_SANTE': return 'Agent de santé';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN_NATIONAL': return Shield;
      case 'SUPERVISEUR_NATIONAL': return Activity;
      case 'SUPERVISEUR_REGIONAL': return MapPin;
      case 'AGENT_SANTE': return Building2;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href={`/${user.role === 'ADMIN_NATIONAL' ? 'admin' : user.role === 'SUPERVISEUR_NATIONAL' ? 'national' : user.role === 'SUPERVISEUR_REGIONAL' ? 'regional' : 'agent'}/dashboard`} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">SantéNum</span>
            </Link>
            <button
              className="lg:hidden p-1 rounded hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Network Status */}
          <div className="border-t p-4">
            <NetworkStatusIndicator />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:pl-8">
              <h1 className="text-lg font-semibold truncate">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Tableau de bord'}
              </h1>
            </div>

            {/* Right side - User menu + Network */}
            <div className="flex items-center gap-4">
              <NetworkStatusIndicator />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="px-2 py-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Separator />
                  <DropdownMenuItem asChild>
                    <Link href="/agent/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/agent/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Wrapper for server components
export async function DashboardLayoutWrapper({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return null; // Will be redirected by middleware
  }

  return (
    <DashboardLayout
      user={{
        name: `${session.user.prenom} ${session.user.nom}`,
        email: session.user.email,
        role: session.user.role,
        formationSanitaireId: session.user.formationSanitaireId,
      }}
    >
      {children}
    </DashboardLayout>
  );
}