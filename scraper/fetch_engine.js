/**
 * Flyfast Data Engine
 * 
 * Fetches all 36 airports + checkpoint details from tsa.fromthetraytable.com
 * and writes a single public/wait_times.json file.
 * 
 * This runs via GitHub Actions on a 10-minute cron.
 * The JSON file is committed to the repo → served free via raw.githubusercontent.com
 * 
 * Zero Firebase. Zero cost.
 */

const fs = require('fs');
const path = require('path');

const AIRPORTS_API = 'https://tsa.fromthetraytable.com/api/tsa/airports';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'wait_times.json');

async function fetchAllAirports() {
  console.log('[Engine] Fetching airport list...');
  
  const res = await fetch(AIRPORTS_API, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Flyfast/2.0' }
  });
  
  if (!res.ok) throw new Error(`Airport list fetch failed: HTTP ${res.status}`);
  
  const { airports } = await res.json();
  console.log(`[Engine] Found ${airports.length} airports.`);
  
  const results = [];
  
  for (const airport of airports) {
    try {
      const detailRes = await fetch(`${AIRPORTS_API}/${airport.code}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Flyfast/2.0' }
      });
      
      if (!detailRes.ok) {
        console.warn(`[Engine] ${airport.code}: HTTP ${detailRes.status}, skipping`);
        results.push({
          code: airport.code,
          name: airport.name,
          city: airport.city,
          checkpoints: [],
          error: airport.scrapeError || `HTTP ${detailRes.status}`,
        });
        continue;
      }
      
      const detail = await detailRes.json();
      const checkpoints = (detail.airport?.checkpoints || []).map(cp => ({
        name: cp.name,
        waitMinutes: cp.waitMinutes,
        status: cp.status,
        lanes: cp.lanes || [],
        lastUpdated: cp.lastUpdated,
      }));
      
      results.push({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        checkpoints,
        error: airport.scrapeError || null,
      });
      
      console.log(`[Engine] ${airport.code}: ${checkpoints.length} checkpoints`);
    } catch (err) {
      console.error(`[Engine] ${airport.code}: ${err.message}`);
      results.push({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        checkpoints: [],
        error: err.message,
      });
    }
  }
  
  return results;
}

async function main() {
  const startTime = Date.now();
  
  const airports = await fetchAllAirports();
  
  const payload = {
    updated_at: new Date().toISOString(),
    airport_count: airports.length,
    active_count: airports.filter(a => a.checkpoints.length > 0).length,
    airports: airports.sort((a, b) => a.code.localeCompare(b.code)),
  };
  
  // Ensure public/ exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n[Engine] Done in ${duration}s → ${OUTPUT_FILE}`);
  console.log(`[Engine] ${payload.active_count}/${payload.airport_count} airports with live data.`);
}

main().catch(err => {
  console.error('[Engine] Fatal:', err);
  process.exit(1);
});
