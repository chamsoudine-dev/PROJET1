import { db } from '@/lib/db';
import { district } from '@/lib/db/schema/geography';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');

    if (!regionId) {
      return NextResponse.json({ error: 'regionId requis' }, { status: 400 });
    }

    const data = await db
      .select({ id: district.id, nom: district.nom })
      .from(district)
      .where(eq(district.regionId, parseInt(regionId)))
      .orderBy(district.nom);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}