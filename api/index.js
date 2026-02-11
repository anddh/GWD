import pkg from 'garmin-connect';
const { GarminConnect } = pkg;

// --- Helper: Generate Mock Data ---
const generateMockData = (errorMessage) => {
  console.error("SERVING MOCK DATA. Reason:", errorMessage);
  const now = Date.now();
  const mockHR = [];
  for (let i = 0; i < 50; i++) {
    mockHR.push([
      now - (50 - i) * 60 * 1000, 
      65 + Math.floor(Math.random() * 20)
    ]);
  }
  
  return {
    hr: { heartRateValues: mockHR },
    // Mock Daily Stats
    stats: {
      totalSteps: 8432,
      totalDistanceMeters: 5240,
      floorsAscended: 12
    },
    isMock: true,
    debugError: errorMessage 
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  if (!email || !password) {
    return res.status(200).json(generateMockData("Missing Credentials"));
  }

  try {
    const GC = new GarminConnect({ username: email, password: password });
    await GC.login();

    const today = new Date(); 

    // 1. Fetch Heart Rate (Time Series)
    const hr = await GC.getHeartRate(today);

    // 2. Fetch Daily Summary (Steps, Floors, Distance)
    // We wrap this in a try/catch because sometimes summary data isn't ready immediately
    let stats = { totalSteps: 0, totalDistanceMeters: 0, floorsAscended: 0 };
    try {
      const summary = await GC.getUserSummary(today);
      stats = summary;
    } catch (e) {
      console.error("Failed to fetch summary:", e);
    }

    res.status(200).json({ 
      hr, 
      stats, // <--- New Data Field
      isMock: false 
    });

  } catch (error) {
    console.error("Garmin API Error:", error.message);
    res.status(200).json(generateMockData(error.message));
  }
}
