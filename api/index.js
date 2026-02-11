// api/index.js

// 1. NOTICE: We commented out the library. 
// If the server was crashing because of the import, this fixes it instantly.
// import { GarminConnect } from 'garmin-connect';

export default async function handler(req, res) {
  // 2. Generate Fake Data locally
  const now = Date.now();
  const mockHR = [];
  
  for (let i = 0; i < 50; i++) {
    mockHR.push([
      now - (50 - i) * 60 * 1000, 
      65 + Math.floor(Math.random() * 20)
    ]);
  }

  const mockData = {
    hr: { heartRateValues: mockHR },
    spo2: 98, 
    resp: 15,
    isMock: true
  };

  // 3. Return it immediately
  res.status(200).json(mockData);
}
