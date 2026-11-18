import { db } from '@/lib/db';
import { region } from '@/lib/db/schema/geography';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await db
      .select({ id: region.id, nom: region.nom })
      .from(region)
      .orderBy(region.nom);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}