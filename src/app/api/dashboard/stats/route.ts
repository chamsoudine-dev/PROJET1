import { db } from '@/lib/db';
import { patient, consultation, vaccination, stock } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, sql, gte, lte, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formationIdParam = searchParams.get('formationId') || session.user.formationSanitaireId;

    if (!formationIdParam) {
      return NextResponse.json({ error: 'Formation sanitaire non spécifiée' }, { status: 400 });
    }

    const formationId = parseInt(formationIdParam);

    // Dates pour le mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Counts
    const [patientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patient)
      .where(eq(patient.formationCreationId, formationId));

    const [consultationMonthCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(consultation)
      .where(
        and(
          eq(consultation.formationSanitaireId, formationId),
          gte(consultation.dateConsultation, startOfMonth),
          lte(consultation.dateConsultation, endOfMonth)
        )
      );

    const [vaccinationMonthCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vaccination)
      .where(
        and(
          eq(vaccination.formationSanitaireId, formationId),
          gte(vaccination.dateVaccination, startOfMonth),
          lte(vaccination.dateVaccination, endOfMonth)
        )
      );

    // Stock alerts (quantiteActuelle <= 10)
    const [stockAlertCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stock)
      .where(
        and(
          eq(stock.formationSanitaireId, formationId),
          sql`quantite_entree - quantite_sortie <= 10`
        )
      );

    return NextResponse.json({
      data: {
        patientsTotal: Number(patientCount?.count || 0),
        consultationsMois: Number(consultationMonthCount?.count || 0),
        vaccinationsMois: Number(vaccinationMonthCount?.count || 0),
        alertesStock: Number(stockAlertCount?.count || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
