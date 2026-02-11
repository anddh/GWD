// --- FIX START ---
// We cannot use: import { GarminConnect } from 'garmin-connect';
// We must import the whole package 'pkg' and extract the class from it.
import pkg from 'garmin-connect';
const { GarminConnect } = pkg;
// --- FIX END ---

// --- Helper: Generate Mock Data (Safety Net) ---
const generateMockData = (errorMessage) => {
  console.log("SERVING MOCK DATA. Reason:", errorMessage); // Log to server console
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
    isMock: true,
    debugError: errorMessage // Sends the error to the frontend for debugging
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // 1. Check Credentials
  if (!email || !password) {
    return res.status(200).json(generateMockData("Missing Credentials in Vercel Settings"));
  }

  try {
    // 2. Initialize Garmin Wrapper
    const GC = new GarminConnect({ username: email, password: password });
    
    // 3. Login (This is usually where 2FA fails)
    await GC.login();

    // 4. Fetch Real Data
    const today = new Date().toISOString().split('T')[0];
    const [hr, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    // 5. Success!
    res.status(200).json({ 
      hr, 
      spo2, 
      resp, 
      isMock: false 
    });

  } catch (error) {
    // 6. FAILURE SAFETY NET
    // If login fails, we return Mock Data so the dashboard doesn't crash.
    console.error("Garmin API Error:", error.message);
    res.status(200).json(generateMockData(error.message));
  }
}
