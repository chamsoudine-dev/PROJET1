import { db } from '@/lib/db';
import { consultation, consultationInsertSchema } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const whereClause = patientId ? eq(consultation.patientId, parseInt(patientId)) : undefined;

    const results = await db.query.consultation.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(consultation.createdAt)],
    });

    return NextResponse.json({
      data: results,
      page,
      limit,
      hasMore: results.length === limit
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!session.user.formationSanitaireId) {
      return NextResponse.json({ error: 'Formation sanitaire non définie' }, { status: 400 });
    }

    const body = await request.json();

    // Validation basique
    const validated = consultationInsertSchema.safeParse({
      ...body,
      formationSanitaireId: parseInt(session.user.formationSanitaireId),
      agentId: parseInt(session.user.id),
      dateConsultation: new Date().toISOString(),
    });

    if (!validated.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validated.error.flatten()
      }, { status: 400 });
    }

    const [newConsultation] = await db.insert(consultation).values({
      ...validated.data,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newConsultation,
      message: 'Consultation créée avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}