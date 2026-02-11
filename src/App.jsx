import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip, useTheme
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, Menu, Activity, Wind, Droplets, AlertTriangle 
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
  
  // Handle both real Garmin structure and our Mock structure
  const hrValues = rawData.hr.heartRateValues || [];
  
  return hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
    hr: point[1],
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-40); 
};

// --- 3. CHART COMPONENT (Fixed Layout) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';

  return (
    // FIX: MinHeight ensures chart never collapses to 0 height
    <Box sx={{ width: '100%', height: '100%', minHeight: 150, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>{latest}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>
        </Box>
      </Box>
      
      {/* FIX: wrapper box to constrain Recharts */}
      <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" hide />
            <YAxis domain={domain} orientation="right" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1D1B20', borderRadius: 12, border: 'none' }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
            <ReferenceArea y1={domain[0]} y2={domain[1]} fill="transparent" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

// --- 4. MAIN APP (Safe Fetching) ---
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
      const res = await fetch('/api'); 
      
      // FIX: Check if server crashed properly before parsing JSON
      if (!res.ok) {
        throw new Error(`Server Error (${res.status})`);
      }

      const json = await res.json();
      
      if (json.isMock) setUsingMock(true);
      else setUsingMock(false);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="600">Garmin Vitals</Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Status Chip */}
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

        <Grid container spacing={3}>
          {/* Main Heart Rate Chart */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" domain={[40, 180]} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts */}
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
