import { db } from '@/lib/db';
import { stock, medicament, mouvementStock, typeMouvementStockEnum } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!session.user.formationSanitaireId) {
      return NextResponse.json({ error: 'Formation sanitaire non définie' }, { status: 400 });
    }

    const formationId = parseInt(session.user.formationSanitaireId);

    const results = await db.query.stock.findMany({
      where: eq(stock.formationSanitaireId, formationId),
      with: {
        medicament: true,
      },
      orderBy: [desc(stock.datePeremption)],
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Error fetching stock:', error);
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
    const { medicamentId, lotNumero, datePeremption, quantite, typeMouvement, motif, prixUnitaire, fournisseur } = body;

    const formationId = parseInt(session.user.formationSanitaireId);
    const agentId = parseInt(session.user.id);

    // Trouver ou créer le lot dans stock
    let targetStock = await db.query.stock.findFirst({
      where: and(
        eq(stock.formationSanitaireId, formationId),
        eq(stock.medicamentId, medicamentId),
        eq(stock.lotNumero, lotNumero)
      ),
    });

    if (!targetStock) {
      if (typeMouvement !== 'ENTREE') {
        return NextResponse.json({ error: 'Lot introuvable pour cette sortie/ajustement' }, { status: 400 });
      }

      const [created] = await db.insert(stock).values({
        formationSanitaireId: formationId,
        medicamentId,
        lotNumero,
        datePeremption,
        quantiteEntree: quantite,
        quantiteSortie: 0,
        prixUnitaire,
        fournisseur,
      }).returning();
      targetStock = created;
    } else {
      // Mettre à jour les quantités dans stock
      if (typeMouvement === 'ENTREE') {
        await db.update(stock)
          .set({
            quantiteEntree: sql`${stock.quantiteEntree} + ${quantite}`,
            updatedAt: new Date(),
          })
          .where(eq(stock.id, targetStock.id));
      } else {
        await db.update(stock)
          .set({
            quantiteSortie: sql`${stock.quantiteSortie} + ${quantite}`,
            updatedAt: new Date(),
          })
          .where(eq(stock.id, targetStock.id));
      }
    }

    // targetStock is guaranteed to be defined here (either found existing, or created new)
    const finalStock = targetStock as typeof targetStock & { id: number };
    const [mouvement] = await db.insert(mouvementStock).values({
      stockId: finalStock.id,
      typeMouvement,
      quantite,
      motif,
      agentId,
    }).returning();

    return NextResponse.json({
      success: true,
      data: mouvement,
      message: 'Mouvement de stock enregistré'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
