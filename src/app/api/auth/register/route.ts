import { db } from '@/lib/db';
import { utilisateur, roleUtilisateurEnum, statutUtilisateurEnum } from '@/lib/db/schema/users';
import { hashPassword } from '@/lib/utils/crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  telephone: z.string().max(20).optional(),
  role: z.enum(['ADMIN_NATIONAL', 'SUPERVISEUR_NATIONAL', 'SUPERVISEUR_REGIONAL', 'AGENT_SANTE']),
  regionId: z.string().optional(),
  districtId: z.string().optional(),
  formationSanitaireId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, prenom, nom, telephone, role, regionId, districtId, formationSanitaireId } = parsed.data;

    // Vérifier si email existe déjà
    const existing = await db
      .select({ id: utilisateur.id })
      .from(utilisateur)
      .where(eq(utilisateur.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // Hash mot de passe
    const passwordHash = await hashPassword(password);

    // Déterminer statut initial
    // Seuls les agents s'inscrivent eux-mêmes -> EN_ATTENTE
    // Les superviseurs régionaux sont créés par admin national
    const statut = role === 'AGENT_SANTE' ? 'EN_ATTENTE' : 'ACTIF';

    // Insérer utilisateur
    const [newUser] = await db
      .insert(utilisateur)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        prenom,
        nom,
        telephone: telephone || null,
        role,
        regionId: regionId ? parseInt(regionId) : null,
        districtId: districtId ? parseInt(districtId) : null,
        formationSanitaireId: parseInt(formationSanitaireId),
        statut,
        totpEnabled: false,
        createdBy: null,
      })
      .returning({ id: utilisateur.id });

    if (!newUser) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      message: statut === 'EN_ATTENTE'
        ? 'Inscription réussie. Votre compte est en attente de validation par le superviseur régional.'
        : 'Compte créé avec succès.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de l\'inscription' }, { status: 500 });
  }
}