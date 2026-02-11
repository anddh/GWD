// --- 1. CRITICAL FIX: CommonJS Import ---
// We must import the whole package first, then extract the class.
// This prevents the "Named export not found" crash on Vercel.
import pkg from 'garmin-connect';
const { GarminConnect } = pkg;

// --- 2. Helper: Generate Mock Data (Safety Net) ---
const generateMockData = (errorMessage) => {
  console.error("SERVING MOCK DATA. Reason:", errorMessage);
  const now = Date.now();
  const mockHR = [];
  
  // Generate 50 points of data ending now
  for (let i = 0; i < 50; i++) {
    mockHR.push([
      now - (50 - i) * 60 * 1000, 
      65 + Math.floor(Math.random() * 20)
    ]);
  }
  
  return {
    hr: { heartRateValues: mockHR },
    spo2: null, 
    resp: null,
    isMock: true,
    debugError: errorMessage 
  };
};

// --- 3. Main Handler ---
export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // Check Credentials
  if (!email || !password) {
    return res.status(200).json(generateMockData("Missing Credentials in Vercel"));
  }

  try {
    // Initialize Garmin Wrapper
    const GC = new GarminConnect({ username: email, password: password });
    
    // Login (This will fail if 2FA is triggered)
    await GC.login();

    // --- CRITICAL FIX: Date Object ---
    // We pass a real Date object, not a string. 
    // This prevents the "getTimezoneOffset is not a function" error.
    const today = new Date(); 

    // Fetch Heart Rate
    const hr = await GC.getHeartRate(today);

    // Success!
    res.status(200).json({ 
      hr, 
      spo2: null, // Disabled to prevent API mismatch errors for now
      resp: null, 
      isMock: false 
    });

  } catch (error) {
    // FAILURE SAFETY NET
    // If login fails, we return Mock Data so the dashboard works visually.
    console.error("Garmin API Error:", error.message);
    res.status(200).json(generateMockData(error.message));
  }
}
