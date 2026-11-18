import { db } from '@/lib/db';
import { formationSanitaire } from '@/lib/db/schema/geography';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json({ error: 'districtId requis' }, { status: 400 });
    }

    const data = await db
      .select({ id: formationSanitaire.id, nom: formationSanitaire.nom })
      .from(formationSanitaire)
      .where(and(eq(formationSanitaire.districtId, parseInt(districtId)), eq(formationSanitaire.actif, true)))
      .orderBy(formationSanitaire.nom);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching formations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}