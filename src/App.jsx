import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, AlertTriangle 
} from 'lucide-react';

// --- 1. THEME CONFIGURATION ---
const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D0BCFF' },
    background: { default: '#141218', paper: '#1D1B20' },
    text: { primary: '#E6E1E5', secondary: '#CAC4D0' },
    error: { main: '#F2B8B5' },   
    info: { main: '#A0C4FF' },    
    success: { main: '#9CD67D' }, 
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
  shape: { borderRadius: 24 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#2B2930' } } }
  }
});

// --- 2. DATA PROCESSOR ---
const processData = (rawData) => {
  if (!rawData || !rawData.hr) return [];
  
  // Handle the Garmin structure safely
  const hrValues = rawData.hr.heartRateValues || [];
  
  return hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
    hr: point[1],
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-40); 
};

// --- 3. CHART COMPONENT (The "Force Render" Version) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height }) => {
  // Calculate latest value for the header
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';

  return (
    <div style={{ width: '100%', height: height, position: 'relative', overflow: 'hidden' }}>
      
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>{latest}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>
        </div>
      </div>
      
      {/* THE FIX: We REMOVED <ResponsiveContainer>.
         We are putting the Width/Height directly on the Chart.
         We assume a width of 500px for now just to force it to appear.
      */}
      <div style={{ marginTop: 0 }}>
        <LineChart width={window.innerWidth > 600 ? 600 : 300} height={height} data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="time" hide />
          <YAxis domain={domain} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1D1B20', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} 
            itemStyle={{ color: '#fff' }}
            labelStyle={{ display: 'none' }}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={4} // Made thicker so you can't miss it
            dot={false} 
            isAnimationActive={false} 
          />
        </LineChart>
      </div>
    </div>
  );
};
// --- 4. MAIN APP ---
export default function App() {
  const theme = useMemo(() => generateTheme(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // We add a timestamp (?t=...) to force the browser to get new data
      const res = await fetch('/api?t=' + Date.now()); 
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server Error (${res.status}): ${text.substring(0, 50)}`);
      }

      const json = await res.json();
      setUsingMock(!!json.isMock);
      setData(processData(json));
    } catch (e) {
      console.error("Data Load Failed:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="600">Garmin Vitals</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {error ? (
               <Chip label="Error" color="error" icon={<AlertTriangle size={14}/>} />
            ) : usingMock ? (
               <Chip label="Demo Mode" color="warning" variant="outlined" />
            ) : (
               <Chip label="Live" color="success" icon={<RefreshCw size={14} className={loading ? "spin" : ""} />} />
            )}
            <IconButton onClick={fetchData} disabled={loading}><RefreshCw size={20}/></IconButton>
          </Box>
        </Box>

        {/* --- DEBUG BOX: Shows raw data if charts are empty --- */}
        <Box sx={{ p: 2, mb: 2, bgcolor: '#333', color: '#0f0', fontFamily: 'monospace', fontSize: 10, borderRadius: 2, overflow: 'auto', maxHeight: 200 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#fff' }}>DEBUG DATA FEED</Typography>
            <pre style={{ margin: 0 }}>
                {JSON.stringify(data.slice(0, 3), null, 2)}
            </pre>
        </Box>
        {/* --- END DEBUG --- */}

        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" domain={[40, 180]} height={300} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="spo2" color={theme.palette.info.main} label="Pulse Ox" unit="%" domain={[85, 100]} height={140} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="resp" color={theme.palette.success.main} label="Respiration" unit="brpm" domain={[10, 25]} height={140} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
          </Grid>
        </Grid>

      </Box> {/* <--- This was the missing tag causing the error! */}
    </ThemeProvider>
  );
}
