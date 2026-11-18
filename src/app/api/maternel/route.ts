import { db } from '@/lib/db';
import { cpn, cpnInsertSchema, accouchement, accouchementInsertSchema, cpon, cponInsertSchema } from '@/lib/db/schema';
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

    const [cpnData, accouchementData, cponData] = await Promise.all([
      db.query.cpn.findMany({
        where: eq(cpn.patientId, parseInt(patientId)),
        orderBy: [desc(cpn.dateCpn)],
      }),
      db.query.accouchement.findMany({
        where: eq(accouchement.patientId, parseInt(patientId)),
        orderBy: [desc(accouchement.dateAccouchement)],
      }),
      db.query.cpon.findMany({
        where: eq(cpon.patientId, parseInt(patientId)),
        orderBy: [desc(cpon.dateCpon)],
      }),
    ]);

    return NextResponse.json({ data: { cpn: cpnData, accouchements: accouchementData, cpon: cponData } });
  } catch (error) {
    console.error('Error fetching maternel data:', error);
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
    const { type, ...data } = body;

    const formationId = parseInt(session.user.formationSanitaireId);
    const agentId = parseInt(session.user.id);

    switch (type) {
      case 'cpn': {
        const validated = cpnInsertSchema.omit({ id: true, createdAt: true }).safeParse(data);
        if (!validated.success) {
          return NextResponse.json({ error: 'Données invalides', details: validated.error.flatten() }, { status: 400 });
        }
        const [created] = await db.insert(cpn).values({
          ...validated.data,
          formationSanitaireId: formationId,
          agentId,
        }).returning();
        return NextResponse.json({ success: true, data: created, message: 'CPN enregistrée' }, { status: 201 });
      }

      case 'accouchement': {
        const validated = accouchementInsertSchema.omit({ id: true, createdAt: true }).safeParse(data);
        if (!validated.success) {
          return NextResponse.json({ error: 'Données invalides', details: validated.error.flatten() }, { status: 400 });
        }
        const [created] = await db.insert(accouchement).values({
          ...validated.data,
          formationSanitaireId: formationId,
          agentId,
        }).returning();
        return NextResponse.json({ success: true, data: created, message: 'Accouchement enregistré' }, { status: 201 });
      }

      case 'cpon': {
        const validated = cponInsertSchema.omit({ id: true, createdAt: true }).safeParse(data);
        if (!validated.success) {
          return NextResponse.json({ error: 'Données invalides', details: validated.error.flatten() }, { status: 400 });
        }
        const [created] = await db.insert(cpon).values({
          ...validated.data,
          formationSanitaireId: formationId,
          agentId,
        }).returning();
        return NextResponse.json({ success: true, data: created, message: 'CPON enregistrée' }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating maternel record:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}