import { db } from '@/lib/db';
import { patient, consultation, vaccination, cpn, accouchement, stock, medicament } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'patients';
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const formationIdParam = searchParams.get('formationId') || session.user.formationSanitaireId;

    if (!formationIdParam) {
      return NextResponse.json({ error: 'Formation sanitaire non spécifiée' }, { status: 400 });
    }

    const formationId = parseInt(formationIdParam);
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let data: any[] = [];
    let filename = `export-${type}-${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'patients':
        data = await db.query.patient.findMany({
          where: and(
            eq(patient.formationCreationId, formationId),
            gte(patient.createdAt, start),
            lte(patient.createdAt, end)
          ),
          orderBy: [desc(patient.createdAt)],
        });
        filename = `patients-${formationId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}`;
        break;

      case 'consultations':
        data = await db.query.consultation.findMany({
          where: and(
            eq(consultation.formationSanitaireId, formationId),
            gte(consultation.dateConsultation, start),
            lte(consultation.dateConsultation, end)
          ),
          orderBy: [desc(consultation.dateConsultation)],
        });
        filename = `consultations-${formationId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}`;
        break;

      case 'vaccinations':
        data = await db.query.vaccination.findMany({
          where: and(
            eq(vaccination.formationSanitaireId, formationId),
            gte(vaccination.dateVaccination, start),
            lte(vaccination.dateVaccination, end)
          ),
          orderBy: [desc(vaccination.dateVaccination)],
        });
        filename = `vaccinations-${formationId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}`;
        break;

      case 'maternel':
        const [cpnData, accouchementData] = await Promise.all([
          db.query.cpn.findMany({
            where: and(
              eq(cpn.formationSanitaireId, formationId),
              gte(cpn.dateCpn, start),
              lte(cpn.dateCpn, end)
            ),
            orderBy: [desc(cpn.dateCpn)],
          }),
          db.query.accouchement.findMany({
            where: and(
              eq(accouchement.formationSanitaireId, formationId),
              gte(accouchement.dateAccouchement, start),
              lte(accouchement.dateAccouchement, end)
            ),
            orderBy: [desc(accouchement.dateAccouchement)],
          }),
        ]);
        return NextResponse.json({
          data: { cpn: cpnData, accouchements: accouchementData },
          filename: `maternel-${formationId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}`,
        });

      case 'stock':
        const stockData = await db.query.stock.findMany({
          where: eq(stock.formationSanitaireId, formationId),
          with: { medicament: true },
        });
        filename = `stock-${formationId}-${new Date().toISOString().split('T')[0]}`;
        data = stockData;
        break;

      default:
        return NextResponse.json({ error: 'Type d\'export non supporté' }, { status: 400 });
    }

    if (format === 'xlsx' || format === 'excel') {
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, type);

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    // CSV format
    if (data.length === 0) {
      return NextResponse.json({ data: [], filename: `${filename}.csv` });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}