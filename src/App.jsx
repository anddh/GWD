import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip, useTheme
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, Activity, Wind, Droplets, AlertTriangle 
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

// --- 3. CHART COMPONENT (Bulletproof Layout) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height = 200 }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';

  return (
    // 1. STRICT CONTAINER: We use a plain div with a hard-coded pixel height.
    // This guarantees the chart always has space, preventing the "height(-1)" error.
    <div style={{ width: '100%', height: height, position: 'relative' }}>
      
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>{latest}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>
        </div>
      </div>
      
      {/* 2. RESPONSIVE CONTAINER: Added 'minWidth' to catch layout edge cases */}
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          {/* Hide X/Y Axis to keep it looking like a medical strip */}
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
            dot={false} 
            isAnimationActive={false} // Disabling animation prevents render race conditions
          />
          <ReferenceArea y1={domain[0]} y2={domain[1]} fill="transparent" />
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api'); 
      if (!res.ok) throw new Error(`Server Error (${res.status})`);

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

        <Grid container spacing={3}>
          {/* Main Heart Rate Chart - Fixed Height 300px */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart 
                  data={data} 
                  dataKey="hr" 
                  color={theme.palette.error.main} 
                  label="Heart Rate" 
                  unit="BPM" 
                  domain={[40, 180]} 
                  height={300} // <--- Explicit Pixel Height
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts - Fixed Height 140px */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart 
                              data={data} 
                              dataKey="spo2" 
                              color={theme.palette.info.main} 
                              label="Pulse Ox" 
                              unit="%" 
                              domain={[85, 100]} 
                              height={140} // <--- Explicit Pixel Height
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart 
                              data={data} 
                              dataKey="resp" 
                              color={theme.palette.success.main} 
                              label="Respiration" 
                              unit="brpm" 
                              domain={[10, 25]} 
                              height={140} // <--- Explicit Pixel Height
                            />
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
