import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, AlertTriangle, Activity 
} from 'lucide-react';

// --- 1. THEME ---
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
  const hrValues = rawData.hr.heartRateValues || [];
  return hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
    hr: point[1],
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-40); 
};

// --- 3. CHART COMPONENT (Responsive & Animated) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';

  return (
    // 99% width prevents overflow scrollbars that confuse Recharts
    <div style={{ width: '99%', height: height, position: 'relative' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>{latest}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>
        </div>
      </div>
      
      {/* Responsive Container Restored */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
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
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 0, fill: color }} // Add a glowing dot at each point
            activeDot={{ r: 6 }}
            isAnimationActive={true} // ANIMATION ON!
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
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
    // Silent update (don't show loading spinner every time)
    try {
      const res = await fetch('/api?t=' + Date.now()); 
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      setUsingMock(!!json.isMock);
      setData(processData(json));
    } catch (e) {
      console.error("Update failed:", e);
      // Don't show error UI for transient network blips, just log it
    }
  };

  useEffect(() => { 
    fetchData(); // 1. Initial Fetch
    
    // 2. Set up Auto-Refresh (Every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity size={32} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight="600">Garmin Vitals</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
             {usingMock && <Chip label="Demo Mode" color="warning" variant="outlined" />}
             <Chip label="Live Sync" color="success" variant="filled" />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" domain={[40, 180]} height={300} />
              </CardContent>
            </Card>
          </Grid>
          
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
      </Box>
    </ThemeProvider>
  );
}
