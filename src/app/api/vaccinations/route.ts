import { db } from '@/lib/db';
import { vaccination, vaccinationInsertSchema } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, and, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId requis' }, { status: 400 });
    }

    const results = await db.query.vaccination.findMany({
      where: eq(vaccination.patientId, parseInt(patientId)),
      orderBy: [desc(vaccination.dateVaccination)],
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
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
    const validated = vaccinationInsertSchema.omit({ id: true, createdAt: true }).safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validated.error.flatten()
      }, { status: 400 });
    }

    const [newVaccination] = await db.insert(vaccination).values({
      ...validated.data,
      formationSanitaireId: parseInt(session.user.formationSanitaireId),
      agentId: parseInt(session.user.id),
    }).returning();

    return NextResponse.json({
      success: true,
      data: newVaccination,
      message: 'Vaccination enregistrée avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating vaccination:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
