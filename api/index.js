import { GarminConnect } from 'garmin-connect';

export default async function handler(req, res) {
  // 1. Grab secrets from the environment
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  if (!email || !password) {
    return res.status(500).json({ error: 'Missing credentials' });
  }

  try {
    // 2. Login to Garmin
    const GC = new GarminConnect({ username: email, password: password });
    await GC.login();

    // 3. Get today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 4. Fetch the data concurrently
    const [hr, spo2, resp] = await Promise.all([
      GC.getHeartRate(today),
      GC.getPulseOx(today),
      GC.getRespiration(today)
    ]);

    // 5. Send it back to the frontend
    res.status(200).json({ hr, spo2, resp });

  } catch (error) {
    console.error("Garmin Error:", error);
    res.status(500).json({ error: 'Failed to fetch data from Garmin' });
  }
}
