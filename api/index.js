import pkg from 'garmin-connect';
const { GarminConnect } = pkg;

// --- GLOBAL CACHE (The Stealth Fix) ---
// By putting this outside the handler, we keep the session alive
// between requests so we don't have to log in every time.
let GC_CLIENT = null;

const generateMockData = (errorMessage) => {
  console.error("SERVING MOCK DATA. Reason:", errorMessage);
  const now = Date.now();
  const mockHR = [];
  for (let i = 0; i < 50; i++) {
    mockHR.push([now - (50 - i) * 60 * 1000, 65 + Math.floor(Math.random() * 20)]);
  }
  return {
    hr: { heartRateValues: mockHR },
    stats: { totalSteps: 0, totalDistanceMeters: 0, floorsAscended: 0 },
    isMock: true,
    debugError: errorMessage 
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  if (!email || !password) return res.status(200).json(generateMockData("Missing Credentials"));

  try {
    // 1. Initialize or Reuse Client
    if (!GC_CLIENT) {
      console.log("Initializing New Garmin Session...");
      GC_CLIENT = new GarminConnect({ username: email, password: password });
      await GC_CLIENT.login();
    }

    const today = new Date();

    // 2. Try to fetch data with existing session
    // We wrap this in a sub-try/catch. If it fails (session expired), we re-login.
    let hr, stats;
    
    try {
        // Attempt fetch
        hr = await GC_CLIENT.getHeartRate(today);
    } catch (sessionError) {
        console.warn("Session expired? Re-logging in...", sessionError.message);
        // Retry Login
        await GC_CLIENT.login();
        // Retry Fetch
        hr = await GC_CLIENT.getHeartRate(today);
    }

    // 3. Fetch Summary (Safely)
    try {
       const summary = await GC_CLIENT.getUserSummary(today);
       stats = Array.isArray(summary) ? summary[0] : summary;
    } catch (e) {
       stats = { totalSteps: 0, totalDistanceMeters: 0, floorsAscended: 0 };
    }

    res.status(200).json({ hr, stats, isMock: false });

  } catch (error) {
    console.error("Critical API Error:", error.message);
    // If the re-login failed, we reset the client so next time we start fresh
    GC_CLIENT = null;
    res.status(200).json(generateMockData(error.message)); // <--- Pass the Cloudflare error to frontend
  }
}
