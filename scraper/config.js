require('dotenv').config();

const getServiceAccount = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
       // Support raw JSON strings
       const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
       if (parsed.private_key) {
           parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
       }
       return parsed;
    }
  } catch (err) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT. Ensure it is strict JSON.", err.message);
  }
  return null;
};

module.exports = {
  firebaseServiceAccount: getServiceAccount(),
  collectionName: 'wait_times',
  targetAirports: [
    'ATL', 'BNA', 'BOS', 'BWI', 'CLE', 'CLT', 'CVG', 'DAL', 'DCA', 'DEN',
    'DFW', 'DTW', 'EWR', 'FLL', 'HOU', 'IAD', 'IAH', 'JAX', 'JFK', 'LAS',
    'LAX', 'LGA', 'MCO', 'MIA', 'MSP', 'OMA', 'ORD', 'PBI', 'PDX', 'PHL',
    'PHX', 'PIT', 'SAN', 'SEA', 'SFO', 'SLC'
  ],
  chunkSize: 5
};
