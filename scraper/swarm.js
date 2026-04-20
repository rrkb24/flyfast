const { targetAirports, chunkSize } = require('./config');
const { fetchAirport } = require('./agent');

async function launchSwarm() {
  const startTime = Date.now();
  console.log(`[Orchestrator] Booting Flyfast Swarm for ${targetAirports.length} target hubs.`);
  console.log(`[Orchestrator] Concurrent Constraints: ${chunkSize} maximum outbound connections.\n`);

  for (let i = 0; i < targetAirports.length; i += chunkSize) {
    const chunk = targetAirports.slice(i, i + chunkSize);
    console.log(`\n[+] Spawning Chunk Execution: [ ${chunk.join(', ')} ]`);

    // Trigger agents dynamically
    const agentPromises = chunk.map(airportCode => fetchAirport(airportCode));

    // Await constraint barrier
    await Promise.allSettled(agentPromises);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n[Orchestrator] Swarm sequence terminated cleanly in ${duration} seconds.`);
  process.exit(0);
}

// Global execution
launchSwarm();
