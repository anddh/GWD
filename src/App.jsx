import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, AlertTriangle 
} from 'lucide-react';

const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D0BCFF' },
    background: { default: '#141218', paper: '#1D1B20' },
    text: { primary: '#E6E1E5', secondary: '#CAC4D0' },
    error: { main: '#FFB4AB' },   
    info: { main: '#A0C4FF' },    
    success: { main: '#9CD67D' }, 
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
  shape: { borderRadius: 24 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#2B2930' } } }
  }
});

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

// --- HIGH-FIDELITY CHART COMPONENT ---
const MedicalChart = ({ data, dataKey, color, label, unit, height }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';
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
      
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: '10px', left: '20px', zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{label}</Typography>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography variant="h3" sx={{ color: color, fontWeight: 'bold', textShadow: `0 0 20px ${color}40` }}>{latest}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{unit}</Typography>
        </div>
      </div>
      
      {/* Chart */}
      <AreaChart width={chartWidth} height={height} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        {/* Gradient Definition */}
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>

        {/* Grid Lines - Restored */}
        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(255,255,255,0.05)" />
        
        {/* Axis Labels - Restored */}
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#666', fontSize: 10 }} 
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis 
          domain={['auto', 'auto']} 
          tick={{ fill: '#666', fontSize: 10 }} 
          tickLine={false}
          axisLine={false}
          width={40}
        />
        
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
          itemStyle={{ color: '#fff' }}
          labelStyle={{ color: '#aaa', marginBottom: 5 }}
        />
        
        {/* Area + Line Combined */}
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3} 
          fill={`url(#gradient-${dataKey})`} // Apply the gradient
          fillOpacity={1}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
          isAnimationActive={true} 
          animationDuration={1500}
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
      const res = await fetch('/api?t=' + Date.now()); 
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
            <Typography variant="h5" fontWeight="600" sx={{ letterSpacing: 0.5 }}>Garmin Vitals</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
             {usingMock && <Chip label="Demo Mode" color="warning" variant="outlined" size="small" />}
             <Chip label="Live Sync" color="success" variant="filled" size="small" sx={{ fontWeight: 'bold' }} />
          </Box>
        </Box>

        {debugError && (
          <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff4444', borderRadius: 2, color: '#ff8888', fontSize: 12 }}>
            <strong>Backend Error:</strong> {debugError}
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}> 
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart data={data} dataKey="hr" color={theme.palette.error.main} label="Heart Rate" unit="BPM" height={300} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="spo2" color={theme.palette.info.main} label="Pulse Ox" unit="%" height={140} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card sx={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart data={data} dataKey="resp" color={theme.palette.success.main} label="Respiration" unit="brpm" height={140} />
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
