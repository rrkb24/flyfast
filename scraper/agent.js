const { syncAirportData } = require('./db');

async function fetchAirport(airportCode) {
  try {
    const url = `https://tsa.fromthetraytable.com/api/tsa/airports/${airportCode}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Flyfast/1.0 Node Swarm Agent',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
       console.error(`[Agent-Worker] Error fetching ${airportCode}: HTTP ${res.status}`);
       return;
    }

    const payload = await res.json();
    
    if (payload?.airport?.checkpoints) {
       await syncAirportData(airportCode, payload.airport.checkpoints);
    } else {
       console.warn(`[Agent-Worker] Payload missing checkpoint schema for ${airportCode}`);
    }
  } catch (err) {
    console.error(`[Agent-Worker] Exception on ${airportCode}:`, err.message);
  }
}

module.exports = { fetchAirport };
