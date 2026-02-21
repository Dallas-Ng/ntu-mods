import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Module {
  code: string;
  title: string;
  au: string;
  searchKeys?: string[];
  notAvailableToProgramme?: string;
}

/**
 * GET /api/data/modules
 * Returns paginated list of modules for a given year and semester
 * Query params: year, semester, skip (default: 0), limit (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200); // Max 200

    // Validate parameters
    if (!year || !semester) {
      return NextResponse.json(
        { error: 'Missing required parameters: year and semester' },
        { status: 400 }
      );
    }

    const metadataPath = path.join(
      process.cwd(),
      `src/data/api/metadata/${year}_${semester}.json`
    );

    // Check if file exists
    try {
      await fs.access(metadataPath);
    } catch {
      return NextResponse.json(
        { error: `No data available for ${year} semester ${semester}` },
        { status: 404 }
      );
    }

    const data = await fs.readFile(metadataPath, 'utf-8');
    const modulesObj = JSON.parse(data);

    // Convert object to array and apply pagination
    const modulesArray = Object.values(modulesObj) as Module[];
    const total = modulesArray.length;
    const paginated = modulesArray.slice(skip, skip + limit);

    return NextResponse.json(
      {
        modules: paginated,
        total,
        hasMore: skip + limit < total,
        page: Math.floor(skip / limit),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
