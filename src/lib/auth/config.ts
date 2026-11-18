import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { utilisateur, roleUtilisateurEnum } from '@/lib/db/schema/users';
import { verifyPassword } from '@/lib/utils/crypto';
import { z } from 'zod';

export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        totpCode: { label: 'Code 2FA', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
            totpCode: z.string().optional(),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password, totpCode } = parsed.data;

        const user = await db
          .select()
          .from(utilisateur)
          .where(eq(utilisateur.email, email.toLowerCase()))
          .limit(1);

        if (!user[0]) return null;

        const dbUser = user[0];

        // Vérifier statut
        if (dbUser.statut !== 'ACTIF') return null;

        // Vérifier verrouillage
        if (dbUser.verrouilleJusqu && new Date(dbUser.verrouilleJusqu) > new Date()) {
          return null;
        }

        // Vérifier mot de passe
        const valid = await verifyPassword(password, dbUser.passwordHash);
        if (!valid) {
          const echecs = (dbUser.echecsConnexion ?? 0) + 1;
          let verrouilleJusqu: Date | null = null;
          if (echecs >= 10) verrouilleJusqu = new Date(Date.now() + 60 * 60 * 1000);
          else if (echecs >= 5) verrouilleJusqu = new Date(Date.now() + 15 * 60 * 1000);

          await db
            .update(utilisateur)
            .set({ echecsConnexion: echecs, verrouilleJusqu })
            .where(eq(utilisateur.id, dbUser.id));

          return null;
        }

        // 2FA obligatoire pour admin et superviseurs
        const rolesRequiring2FA = ['ADMIN_NATIONAL', 'SUPERVISEUR_NATIONAL', 'SUPERVISEUR_REGIONAL'];

        if (rolesRequiring2FA.includes(dbUser.role) && dbUser.totpEnabled) {
          if (!totpCode) {
            throw new Error('2FA_REQUIRED');
          }
        }

        // Réinitialiser échecs sur succès
        await db
          .update(utilisateur)
          .set({
            echecsConnexion: 0,
            verrouilleJusqu: null,
            dernierConnexion: new Date(),
          })
          .where(eq(utilisateur.id, dbUser.id));

        return {
          id: dbUser.id.toString(),
          email: dbUser.email,
          prenom: dbUser.prenom,
          nom: dbUser.nom,
          role: dbUser.role,
          regionId: dbUser.regionId?.toString() || null,
          districtId: dbUser.districtId?.toString() || null,
          formationSanitaireId: dbUser.formationSanitaireId?.toString() || null,
          totpEnabled: dbUser.totpEnabled ?? false,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 15 * 60,
    updateAge: 5 * 60,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.prenom = user.prenom;
        token.nom = user.nom;
        token.role = user.role;
        token.regionId = user.regionId;
        token.districtId = user.districtId;
        token.formationSanitaireId = user.formationSanitaireId;
        token.totpEnabled = user.totpEnabled;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user = {
        id: token.id,
        email: token.email,
        prenom: token.prenom,
        nom: token.nom,
        role: token.role,
        regionId: token.regionId,
        districtId: token.districtId,
        formationSanitaireId: token.formationSanitaireId,
        totpEnabled: token.totpEnabled,
      };
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);

export type UserRole = (typeof roleUtilisateurEnum.enumValues)[number];

export interface SessionUser {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  regionId: string | null;
  districtId: string | null;
  formationSanitaireId: string | null;
  totpEnabled: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
  interface User {
    role: UserRole;
    regionId: string | null;
    districtId: string | null;
    formationSanitaireId: string | null;
    totpEnabled: boolean;
  }
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
  interface User {
    role: UserRole;
    regionId: string | null;
    districtId: string | null;
    formationSanitaireId: string | null;
    totpEnabled: boolean;
  }
}
