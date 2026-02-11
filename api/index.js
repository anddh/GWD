// api/index.js
import { GarminConnect } from 'garmin-connect';

// --- Helper to generate fake data if Garmin blocks us ---
const generateMockData = () => {
  const now = Date.now();
  const mockHR = [];
  // Generate 50 points of data ending now
  for (let i = 0; i < 50; i++) {
    mockHR.push([
      now - (50 - i) * 60 * 1000, // Time: 1 min intervals
      60 + Math.floor(Math.random() * 40) // HR: 60-100 bpm
    ]);
  }
  return {
    hr: { heartRateValues: mockHR }, // Matches Garmin structure exactly
    spo2: null, 
    resp: null
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // 1. If no keys, return mock data immediately (Dev Mode)
  if (!email || !password) {
    console.warn("No credentials found. Serving Mock Data.");
    return res.status(200).json(generateMockData());
  }

  try {
    // 2. Try to Login to Garmin
    const GC = new GarminConnect({ username: email, password: password });
    
    // This is where it usually fails (2FA or IP ban)
    await GC.login();

    const today = new Date().toISOString().split('T')[0];
    
    const [hr, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    // 3. Success! Return real data
    res.status(200).json({ hr, spo2, resp });

  } catch (error) {
    // 4. FAILURE! Log the error but return MOCK DATA so the UI doesn't break
    console.error("Garmin Login Failed (likely 2FA or Bad Password):", error.message);
    
    // Return fake data with a flag so you know it's fake
    const mock = generateMockData();
    res.status(200).json({ ...mock, isMock: true });
  }
}
