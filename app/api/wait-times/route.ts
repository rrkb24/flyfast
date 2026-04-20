import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Serves wait times from public/wait_times.json (committed by GitHub Actions).
 * Falls back to live upstream fetch if the file doesn't exist yet.
 * 
 * Zero Firebase. Zero cost. The JSON is refreshed every 10 minutes by the
 * GitHub Action and committed to the repo.
 */

const UPSTREAM_API = 'https://tsa.fromthetraytable.com/api/tsa/airports';

async function readLocalData() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'wait_times.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchFromUpstream(): Promise<Record<string, any[]>> {
  const airportsData: Record<string, any[]> = {};

  try {
    const res = await fetch(UPSTREAM_API, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const payload = await res.json();

    for (const airport of payload.airports) {
      if (!airport.checkpointCount || airport.scrapeError) continue;

      try {
        const detailRes = await fetch(`${UPSTREAM_API}/${airport.code}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();

        if (detail.airport?.checkpoints?.length) {
          airportsData[airport.code] = detail.airport.checkpoints.map((cp: any) => ({
            terminal: cp.name,
            waitTime: cp.waitMinutes ?? 0,
            status: cp.status,
            lanes: cp.lanes,
          }));
        }
      } catch {
        // Skip airports that fail individually
      }
    }
  } catch (err) {
    console.error('[API] Upstream fetch failed:', err);
  }

  return airportsData;
}

export async function GET() {
  // Primary: read from the GitHub-committed JSON file
  const localData = await readLocalData();

  if (localData?.airports) {
    // Transform from the file format to the dashboard format
    const data: Record<string, any[]> = {};

    for (const airport of localData.airports) {
      if (airport.checkpoints.length === 0) continue;

      data[airport.code] = airport.checkpoints.map((cp: any) => ({
        terminal: cp.name,
        waitTime: cp.waitMinutes ?? 0,
        status: cp.status,
        lanes: cp.lanes,
      }));
    }

    return NextResponse.json({
      updated_at: localData.updated_at,
      data,
      isMock: false,
      source: 'github',
    });
  }

  // Fallback: live fetch from upstream (first run before GitHub Action populates the file)
  console.log('[API] No local data file, fetching from upstream...');
  const upstreamData = await fetchFromUpstream();

  const sortedData: Record<string, any[]> = {};
  Object.keys(upstreamData).sort().forEach(key => {
    sortedData[key] = upstreamData[key];
  });

  return NextResponse.json({
    updated_at: new Date().toISOString(),
    data: sortedData,
    isMock: false,
    source: 'upstream_fallback',
  });
}
