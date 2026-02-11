import { GarminConnect } from 'garmin-connect';

// --- Helper: Generate Fake Data if Real Data Fails ---
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
    isMock: true // Flag to tell frontend we are in demo mode
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // 1. If credentials missing, return Mock Data immediately
  if (!email || !password) {
    console.warn("No credentials found. Returning Mock Data.");
    return res.status(200).json(generateMockData());
  }

  try {
    // 2. Try to Login
    const GC = new GarminConnect({ username: email, password: password });
    
    // 2FA or Bad Password will throw an error here:
    await GC.login();

    // 3. Fetch Real Data
    const today = new Date().toISOString().split('T')[0];
    const [hr, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    // 4. Return Real Data
    res.status(200).json({ hr, spo2, resp, isMock: false });

  } catch (error) {
    // 5. SAFETY NET: If login fails, log error but return Mock Data
    console.error("Garmin Login Failed:", error.message);
    res.status(200).json(generateMockData());
  }
}
