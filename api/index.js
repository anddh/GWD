import pkg from 'garmin-connect';
const { GarminConnect } = pkg;

// --- GLOBAL CACHE (The Anti-Ban Shield) ---
// This variable lives outside the function, so it persists as long as the server is "warm".
let CACHE = {
  data: null,
  timestamp: 0
};

// cache duration: 10 minutes (in milliseconds)
const CACHE_DURATION = 10 * 60 * 1000; 

const generateMockData = (errorMessage) => {
  console.error("SERVING MOCK DATA. Reason:", errorMessage);
  const now = Date.now();
  const mockSeries = [];
  for (let i = 0; i < 50; i++) {
    mockSeries.push([now - (50 - i) * 60 * 1000, 65 + Math.floor(Math.random() * 20)]);
  }
  return {
    hr: { heartRateValues: mockSeries },
    stress: { stressValues: mockSeries.map(p => [p[0], 20 + Math.random() * 40]) },
    bodyBat: { bodyBatteryValues: mockSeries.map(p => [p[0], 80 - (Math.random() * 10)]) },
    spo2: null, 
    resp: null,
    isMock: true,
    debugError: errorMessage 
  };
};

export default async function handler(req, res) {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  // 1. CHECK CACHE FIRST
  // If we have data and it is less than 10 minutes old, return it immediately.
  // DO NOT connect to Garmin.
  if (CACHE.data && (Date.now() - CACHE.timestamp < CACHE_DURATION)) {
    // console.log("Serving from Cache (No Garmin API call)");
    return res.status(200).json(CACHE.data);
  }

  if (!email || !password) {
    return res.status(200).json(generateMockData("Missing Credentials"));
  }

  try {
    const GC = new GarminConnect({ username: email, password: password });
    
    // 2. Login
    await GC.login();

    // 3. Fetch Data (Now fetching Stress & Body Battery too!)
    const today = new Date(); 

    const [hr, stress, bodyBat, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getStressDaily(today),
      GC.getBodyBattery(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    const freshData = { 
      hr, 
      stress, 
      bodyBat, 
      spo2, // Might be null (API limits)
      resp, // Might be null
      isMock: false 
    };

    // 4. SAVE TO CACHE
    CACHE.data = freshData;
    CACHE.timestamp = Date.now();

    res.status(200).json(freshData);

  } catch (error) {
    console.error("Garmin API Error:", error.message);
    res.status(200).json(generateMockData(error.message));
  }
}
