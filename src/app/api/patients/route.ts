import { db } from '@/lib/db';
import { patient, patientInsertSchema } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const offset = (page - 1) * limit;

    // RLS sera appliqué via le middleware qui définit current_setting('app.current_formation_id')
    const results = await db.query.patient.findMany({
      where: and(
        query ? or(
          ilike(patient.nom, `%${query}%`),
          ilike(patient.prenom, `%${query}%`),
          ilike(patient.identifiantNational, `%${query}%`)
        ) : undefined
      ),
      limit,
      offset,
      orderBy: [desc(patient.createdAt)],
    });

    return NextResponse.json({
      data: results,
      page,
      limit,
      hasMore: results.length === limit
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur peut créer des patients dans sa formation
    if (!session.user.formationSanitaireId) {
      return NextResponse.json({ error: 'Formation sanitaire non définie' }, { status: 400 });
    }

    const body = await request.json();
    const validated = patientInsertSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validated.error.flatten()
      }, { status: 400 });
    }

    // Générer un ID national unique
    const idNational = `SN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const [newPatient] = await db.insert(patient).values({
      ...validated.data,
      identifiantNational: idNational,
      formationCreationId: parseInt(session.user.formationSanitaireId),
      createdBy: parseInt(session.user.id),
    }).returning();

    return NextResponse.json({
      success: true,
      data: newPatient,
      message: 'Patient créé avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}