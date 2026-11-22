import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = ['/auth/login', '/auth/register', '/auth/two-factor', '/api/auth'];
const apiAuthPrefix = '/api/auth';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isPublicPath = publicPaths.some((path) => nextUrl.pathname.startsWith(path));
  const isApiAuth = nextUrl.pathname.startsWith(apiAuthPrefix);

  // Injecter headers RLS pour les requêtes API
  const response = NextResponse.next();

  // Récupérer le token depuis les cookies
  const token = req.cookies.get('next-auth.session-token')?.value ||
                req.cookies.get('__session')?.value;

  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      user = payload.user as any;

      if (user) {
        response.headers.set('x-pg-role', mapRoleToPgRole(user.role));
        response.headers.set('x-user-id', user.id);
        if (user.formationSanitaireId) {
          response.headers.set('x-formation-id', user.formationSanitaireId);
        }
        if (user.regionId) {
          response.headers.set('x-region-id', user.regionId);
        }
      }
    } catch {
      // Token invalide
    }
  }

  // Protection routes
  if (!user && !isPublicPath && !isApiAuth) {
    const loginUrl = new URL('/auth/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirection selon rôle après login
  if (user && (nextUrl.pathname === '/auth/login' || nextUrl.pathname === '/')) {
    const role = user.role;
    let redirectPath = '/agent';
    switch (role) {
      case 'ADMIN_NATIONAL':
        redirectPath = '/admin';
        break;
      case 'SUPERVISEUR_NATIONAL':
        redirectPath = '/superviseur-national';
        break;
      case 'SUPERVISEUR_REGIONAL':
        redirectPath = '/superviseur-regional';
        break;
      case 'AGENT_SANTE':
        redirectPath = '/agent';
        break;
    }
    return NextResponse.redirect(new URL(redirectPath, nextUrl.origin));
  }

  // Vérification accès par rôle
  if (user) {
    const pathname = nextUrl.pathname;

    // Admin national : tout accès
    if (user.role === 'ADMIN_NATIONAL') {
      return response;
    }

    // Superviseur national : lecture seule, pas admin
    if (user.role === 'SUPERVISEUR_NATIONAL') {
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return NextResponse.redirect(new URL('/superviseur-national', nextUrl.origin));
      }
      return response;
    }

    // Superviseur régional : sa région seulement
    if (user.role === 'SUPERVISEUR_REGIONAL') {
      if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/national') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/national')
      ) {
        return NextResponse.redirect(new URL('/superviseur-regional', nextUrl.origin));
      }
      return response;
    }

    // Agent : sa formation seulement
    if (user.role === 'AGENT_SANTE') {
      if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/national') ||
        pathname.startsWith('/regional') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/national') ||
        pathname.startsWith('/api/regional')
      ) {
        return NextResponse.redirect(new URL('/agent', nextUrl.origin));
      }
      return response;
    }
  }

  return response;
}

function mapRoleToPgRole(role: string): string {
  switch (role) {
    case 'ADMIN_NATIONAL':
      return 'role_admin_national';
    case 'SUPERVISEUR_NATIONAL':
      return 'role_superviseur_national';
    case 'SUPERVISEUR_REGIONAL':
      return 'role_superviseur_regional';
    case 'AGENT_SANTE':
      return 'role_agent_sante';
    default:
      return 'role_agent_sante';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png$).*)',
  ],
};