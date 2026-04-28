import { NextResponse } from "next/server";
import { db } from "../../lib/firebaseAdmin";

const UPSTREAM_API = 'https://tsa.fromthetraytable.com/api/tsa/airports';
const CACHE_COLLECTION = 'system_cache';
const CACHE_DOC = 'latest_wait_times';
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

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
        // Skip individual failed airports
      }
    }
  } catch (err) {
    console.error('[API] Upstream fetch failed:', err);
  }

  // Sort keys
  const sortedData: Record<string, any[]> = {};
  Object.keys(airportsData).sort().forEach(key => {
    sortedData[key] = airportsData[key];
  });

  return sortedData;
}

export async function GET() {
  try {
    const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_DOC);
    const doc = await cacheRef.get();
    
    const now = Date.now();
    let isStale = true;

    // 1. Check if we have valid cache data
    if (doc.exists) {
      const data = doc.data();
      const timestampMs = data?.timestampMs || 0;
      
      if (now - timestampMs < CACHE_DURATION_MS) {
        isStale = false;
        console.log('[Smart Cache] Returning cached data from Firestore (Fast)');
        return NextResponse.json({
          updated_at: new Date(timestampMs).toISOString(),
          data: data?.airportsData || {},
          isMock: false,
          source: 'firebase_cache',
        });
      }
    }

    // 2. Data is stale or missing, fetch from upstream
    console.log('[Smart Cache] Data stale. Fetching from TSA Upstream API...');
    const freshData = await fetchFromUpstream();

    // 3. Save to Firestore
    await cacheRef.set({
      timestampMs: now,
      updatedAt: new Date(now).toISOString(),
      airportsData: freshData,
    });
    console.log('[Smart Cache] Saved fresh data to Firestore.');

    return NextResponse.json({
      updated_at: new Date(now).toISOString(),
      data: freshData,
      isMock: false,
      source: 'upstream_fetch',
    });

  } catch (err: any) {
    console.error('[Smart Cache Error]', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
