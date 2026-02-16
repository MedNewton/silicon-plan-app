// src/app/api/sectors/ateco/search/route.ts

import { NextResponse } from 'next/server';
import { searchAtecoCodes, getAteco2DigitCodes } from '@/lib/sectorMapping';

/**
 * GET /api/sectors/ateco/search?q=<query>
 * Search ATECO codes by code or macro name
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') ?? '';

    // If query is empty, return all ATECO codes
    const results = !query || query.trim().length === 0
      ? getAteco2DigitCodes().map((ateco) => ({
          code: ateco.code,
          macroCode: ateco.macroCode,
          macroName: ateco.macroName,
          description: ateco.description,
          displayLabel: `${ateco.code} - ${ateco.description}`,
        }))
      : searchAtecoCodes(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in GET /api/sectors/ateco/search:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(message, { status: 500 });
  }
}
