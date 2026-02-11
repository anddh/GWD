import { GarminConnect } from 'garmin-connect';

// --- 1. Helper: Generate Fake Data (The Safety Net) ---
// We use this if Garmin login fails so the app doesn't crash.
const generateMockData = () => {
  const now = Date.now();
  const mockHR = [];
  
  // Generate 50 points of data ending now
  for (let i = 0; i < 50; i++) {
    mockHR.push([
      now - (50 - i) * 60 * 1000, 
      65 + Math.floor(Math.random() * 20) // Random HR between 65-85
    ]);
  }
  
  return {
    hr: { heartRateValues: mockHR },
    spo2: null, 
    resp: null,
    isMock: true // Tells the frontend to show the "Demo Mode" chip
  };
};

// --- 2. Main Handler ---
export default async function handler(req, res) {
  // Grab secrets from Vercel Environment Variables
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // A. If no credentials, return Mock Data immediately
  if (!email || !password) {
    console.warn("No credentials found. Serving Mock Data.");
    return res.status(200).json(generateMockData());
  }

  try {
    // B. Initialize Garmin Wrapper
    const GC = new GarminConnect({ username: email, password: password });
    
    // C. Log in to Garmin (This is where it might fail if 2FA is on)
    await GC.login();

    // D. Fetch Real Data for Today
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all 3 metrics in parallel for speed
    const [hr, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    // E. Success! Return real data
    res.status(200).json({ 
      hr, 
      spo2, 
      resp, 
      isMock: false 
    });

  } catch (error) {
    // F. FAILURE SAFETY NET
    // If login fails, log the error on the server console...
    console.error("Garmin Login Failed:", error.message);
    
    // ...but send Mock Data to the frontend so it looks beautiful.
    res.status(200).json(generateMockData());
  }
}
