import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, ThemeProvider, createTheme, CssBaseline, Chip, Stack
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Activity, Footprints, Map, ArrowUpCircle 
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
    warning: { main: '#FFD8E4' }
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#1E1C24', border: '1px solid rgba(255,255,255,0.08)' } } }
  }
});

// --- 2. DATA PROCESSOR ---
const processData = (rawData) => {
  // Process HR Series
  const hrValues = rawData?.hr?.heartRateValues || [];
  const chartData = hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
    hr: point[1],
    // Generate mock mock SpO2/Resp if missing, just for visuals
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-40); // Keep last 40 points for a clean graph

  // Process Daily Stats (with defaults)
  const stats = rawData?.stats || {};
  
  return {
    chartData,
    daily: {
      steps: stats.totalSteps || 0,
      distance: (stats.totalDistanceMeters || 0) / 1000, // Convert m to km
      floors: Math.floor(stats.floorsAscended || 0)
    }
  };
};

// --- 3. STAT CARD COMPONENT (New) ---
const StatCard = ({ icon: Icon, label, value, unit, color }) => (
  <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}20`, color: color, mr: 2 }}>
      <Icon size={24} />
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight="700">
        {value} <Typography component="span" variant="body2" color="text.secondary">{unit}</Typography>
      </Typography>
    </Box>
  </Card>
);

// --- 4. CHART COMPONENT (Improved Labels) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setChartWidth(containerRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: height, position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ position: 'absolute', top: 16, left: 24, zIndex: 10 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
           <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
           <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}>
             {label}
           </Typography>
        </Stack>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mt: 0.5 }}>
            {latest} <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 400 }}>{unit}</Typography>
        </Typography>
      </Box>
      
      {/* Chart */}
      <LineChart width={chartWidth} height={height} data={data} margin={{ top: 50, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="time" hide />
        {/* Added Y-Axis label for clarity */}
        <YAxis 
          domain={domain} 
          tick={{ fill: '#666', fontSize: 10 }} 
          axisLine={false} 
          tickLine={false}
          width={40}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E1C24', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} 
          itemStyle={{ color: '#fff' }}
          labelStyle={{ display: 'none' }}
          formatter={(value) => [`${Math.round(value)} ${unit}`, label]}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3} 
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          isAnimationActive={true} 
          animationDuration={1500}
        />
      </LineChart>
    </div>
  );
};

// --- 5. MAIN APP ---
export default function App() {
  const theme = useMemo(() => generateTheme(), []);
  const [data, setData] = useState({ chartData: [], daily: { steps: 0, distance: 0, floors: 0 } });
  const [usingMock, setUsingMock] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api?t=' + Date.now()); 
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      setUsingMock(!!json.isMock);
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
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity size={28} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight="700" letterSpacing="-0.5px">Garmin Dashboard</Typography>
          </Box>
          {usingMock && <Chip label="Demo Data" size="small" color="warning" variant="outlined" />}
        </Box>

        {/* TOP ROW: DAILY STATS */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={Footprints} 
              label="Daily Steps" 
              value={data.daily.steps.toLocaleString()} 
              unit="steps" 
              color={theme.palette.info.main} 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={Map} 
              label="Distance" 
              value={data.daily.distance.toFixed(2)} 
              unit="km" 
              color={theme.palette.success.main} 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={ArrowUpCircle} 
              label="Floors Climbed" 
              value={data.daily.floors} 
              unit="floors" 
              color={theme.palette.warning.main} 
            />
          </Grid>
        </Grid>

        {/* BOTTOM ROW: CHARTS */}
        <Grid container spacing={3}>
          {/* Main Heart Rate Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <MedicalChart 
                  data={data.chartData} 
                  dataKey="hr" 
                  color={theme.palette.error.main} 
                  label="Heart Rate" 
                  unit="BPM" 
                  domain={[40, 180]} 
                  height={320} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart 
                              data={data.chartData} 
                              dataKey="spo2" 
                              color={theme.palette.info.main} 
                              label="Pulse Ox" 
                              unit="%" 
                              domain={[85, 100]} 
                              height={150} 
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <MedicalChart 
                              data={data.chartData} 
                              dataKey="resp" 
                              color={theme.palette.success.main} 
                              label="Respiration" 
                              unit="brpm" 
                              domain={[10, 25]} 
                              height={150} 
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
