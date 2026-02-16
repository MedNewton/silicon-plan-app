// src/app/api/sectors/damodaran/route.ts

import { NextResponse } from 'next/server';
import { resolveSectorToDamodaran, getDamodaranIndustries } from '@/lib/sectorMapping';
import type { OnboardingSector } from '@/types/sectors';

/**
 * POST /api/sectors/damodaran
 * Resolve Damodaran industries for a given onboarding sector and optional ATECO code
 * 
 * Body: { onboardingSector: string, atecoCode?: string }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      onboardingSector: string;
      atecoCode?: string;
    };

    const { onboardingSector, atecoCode } = body;

    if (!onboardingSector) {
      return new NextResponse('onboardingSector is required', { status: 400 });
    }

    const resolution = resolveSectorToDamodaran(
      onboardingSector as OnboardingSector,
      atecoCode
    );

    if (!resolution) {
      return new NextResponse('Invalid onboarding sector', { status: 400 });
    }

    return NextResponse.json(resolution);
  } catch (error) {
    console.error('Error in POST /api/sectors/damodaran:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(message, { status: 500 });
  }
}

/**
 * GET /api/sectors/damodaran
 * Get all available Damodaran industries
 */
export async function GET() {
  try {
    const industries = getDamodaranIndustries();
    return NextResponse.json({ industries });
  } catch (error) {
    console.error('Error in GET /api/sectors/damodaran:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(message, { status: 500 });
  }
}
