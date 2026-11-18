import { db } from '@/lib/db';
import { patient } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const result = await db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });

    if (!result) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!session.user.formationSanitaireId) {
      return NextResponse.json({ error: 'Formation sanitaire non définie' }, { status: 400 });
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const validated = body;

    if (!validated.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validated.error.flatten()
      }, { status: 400 });
    }

    const [updated] = await db
      .update(patient)
      .set({
        ...validated.data,
        updatedAt: new Date(),
      })
      .where(eq(patient.id, patientId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Patient mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent supprimer
    if (session.user.role !== 'ADMIN_NATIONAL') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await db.delete(patient).where(eq(patient.id, patientId));

    return NextResponse.json({ success: true, message: 'Patient supprimé' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}