import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip, useTheme
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, Menu, Activity, Wind, Droplets 
} from 'lucide-react';

// --- 1. THEME CONFIGURATION ---
const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D0BCFF' },
    background: { default: '#141218', paper: '#1D1B20' },
    text: { primary: '#E6E1E5', secondary: '#CAC4D0' },
    error: { main: '#F2B8B5' },   // HR Color
    info: { main: '#A0C4FF' },    // SPO2 Color
    success: { main: '#9CD67D' }, // Resp Color
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
  
  // Extract HR values: Garmin sends [[timestamp, value], [timestamp, value]]
  const hrValues = rawData.hr.heartRateValues || [];
  
  return hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
    hr: point[1],
    // Simulating the other metrics aligning for visual demo (real alignment is complex)
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-40); // Only show last 40 points
};

// --- 3. CHART COMPONENT ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain }) => {
  const theme = useTheme();
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>{latest}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.1} />
          <XAxis dataKey="time" hide />
          <YAxis domain={domain} orientation="right" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#1D1B20', borderRadius: 12, border: 'none' }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
          <ReferenceArea y1={domain[0]} y2={domain[1]} fill="transparent" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// --- 4. MAIN APP ---
export default function App() {
  const theme = useMemo(() => generateTheme(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api'); // Calls your secure backend
      const json = await res.json();
      setData(processData(json));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h5" fontWeight="600">Garmin Vitals</Typography>
          <Chip 
            label={loading ? "Syncing..." : "Live"} 
            color={loading ? "default" : "success"} 
            icon={<RefreshCw size={14} className={loading ? "spin" : ""} />} 
            onClick={fetchData}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Heart Rate (Large) */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 350 }}>
              <CardContent sx={{ height: '100%', p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" domain={[40, 180]} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Stats */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ height: 160 }}>
                        <CardContent sx={{ height: '100%', p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="spo2" color={theme.palette.info.main} label="Pulse Ox" unit="%" domain={[85, 100]} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card sx={{ height: 160 }}>
                        <CardContent sx={{ height: '100%', p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="resp" color={theme.palette.success.main} label="Respiration" unit="brpm" domain={[10, 25]} />
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
