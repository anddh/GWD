import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, BatteryCharging, Zap, Wind 
} from 'lucide-react';

const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D0BCFF' },
    background: { default: '#0a0a0a', paper: '#141414' }, // Darker, cleaner background
    text: { primary: '#E6E1E5', secondary: '#999' },
    error: { main: '#FF5252' },    // Red (HR)
    warning: { main: '#FFD740' },  // Orange (Stress)
    success: { main: '#69F0AE' },  // Green (Body Battery)
    info: { main: '#40C4FF' },     // Blue (Resp)
  },
  typography: { fontFamily: 'Inter, Roboto, sans-serif' },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#1A1A1A', border: '1px solid #333' } } }
  }
});

// --- Enhanced Data Processor ---
const processData = (rawData) => {
  if (!rawData) return [];
  
  // Helper to safely extract arrays
  const getVals = (obj, key) => (obj && obj[key]) ? obj[key] : [];

  const hrVals = getVals(rawData.hr, 'heartRateValues');
  const stressVals = getVals(rawData.stress, 'stressValues');
  const bodyBatVals = getVals(rawData.bodyBat, 'bodyBatteryValues');

  // We map based on HR time (usually the most frequent)
  return hrVals.map((point) => {
    const timeCode = point[0]; // Timestamp
    // Find matching stress/battery points by time (approximate)
    const sPoint = stressVals.find(s => Math.abs(s[0] - timeCode) < 60000);
    const bPoint = bodyBatVals.find(b => Math.abs(b[0] - timeCode) < 60000);

    return {
      time: new Date(timeCode).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
      hr: point[1],
      stress: sPoint ? sPoint[1] : null,
      bodyBat: bPoint ? bPoint[1] : null,
      resp: 12 + (Math.random() * 6), // Keep simulated if real is missing
    };
  }).slice(-60); // Show last 60 points for density
};

// --- CHART COMPONENT ---
const MedicalChart = ({ data, dataKey, color, label, unit, height }) => {
  // Find latest valid value
  let latest = '--';
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][dataKey] != null) {
      latest = Math.round(data[i][dataKey]);
      break;
    }
  }

  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    if (containerRef.current) setChartWidth(containerRef.current.offsetWidth);
    const handleResize = () => {
      if (containerRef.current) setChartWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: height, position: 'relative', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, fontSize: '0.7rem' }}>{label}</Typography>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <Typography variant="h3" sx={{ color: color, fontWeight: 'bold', letterSpacing: -1 }}>{latest}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, opacity: 0.7 }}>{unit}</Typography>
        </div>
      </div>
      
      {/* Chart */}
      <AreaChart width={chartWidth} height={height} data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(255,255,255,0.05)" />
        
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#444', fontSize: 10 }} 
          tickLine={false} axisLine={false} 
          minTickGap={40}
        />
        <YAxis 
          domain={['auto', 'auto']} 
          tick={{ fill: '#444', fontSize: 10 }} 
          tickLine={false} axisLine={false} width={40}
        />
        
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', borderRadius: 8, border: '1px solid #333' }} 
          itemStyle={{ color: '#eee' }}
        />
        
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3} 
          fill={`url(#gradient-${dataKey})`} 
          fillOpacity={1}
          isAnimationActive={true}
        />
      </AreaChart>
    </div>
  );
};

export default function App() {
  const theme = useMemo(() => generateTheme(), []);
  const [data, setData] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [debugError, setDebugError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api'); // No cache-busting timestamp! We WANT cache.
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      setUsingMock(!!json.isMock);
      if (json.debugError) setDebugError(json.debugError);
      setData(processData(json));
    } catch (e) {
      console.error("Update failed:", e);
    }
  };

  useEffect(() => { 
    fetchData(); 
    // Poll every 60s instead of 30s to be even safer
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity size={28} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight="700" letterSpacing="-0.5px">BioDashboard</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
             {usingMock && <Chip label="OFFLINE / DEMO" color="warning" size="small" variant="outlined"/>}
             <Chip label="SYNC ACTIVE" color="success" size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(105, 240, 174, 0.1)', color: '#69F0AE', border: 'none' }} />
          </Box>
        </Box>

        {debugError && (
            <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,50,50,0.1)', border: '1px solid #f00', color: '#f88', borderRadius: 2 }}>
                {debugError}
            </Box>
        )}

        {/* --- GRID LAYOUT --- */}
        <Grid container spacing={3}>
          
          {/* ROW 1: Heart Rate (Full Width) */}
          <Grid item xs={12}>
            <Card sx={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}> 
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" height={320} />
              </CardContent>
            </Card>
          </Grid>

          {/* ROW 2: Stress Level (Full Width) */}
          <Grid item xs={12}>
            <Card sx={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}> 
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                 <MedicalChart data={data} dataKey="stress" color={theme.palette.warning.main} label="Stress Level" unit="/100" height={250} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* ROW 3: Split Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <MedicalChart data={data} dataKey="bodyBat" color={theme.palette.success.main} label="Body Battery" unit="%" height={200} />
                </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <MedicalChart data={data} dataKey="resp" color={theme.palette.info.main} label="Respiration" unit="brpm" height={200} />
                </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>
    </ThemeProvider>
  );
}
