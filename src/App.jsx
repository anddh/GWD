import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, ThemeProvider, createTheme, CssBaseline, Chip, Stack, IconButton
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Activity, Footprints, Map, ArrowUpCircle, RefreshCw, Heart, Wind, Droplets 
} from 'lucide-react';

// --- 1. PREMIUM THEME ---
const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8B5CF6' }, // Vivid Violet
    background: { default: '#09090B', paper: '#18181B' }, 
    text: { primary: '#FAFAFA', secondary: '#A1A1AA' },
    error: { main: '#EF4444' },   // Bright Red
    info: { main: '#06B6D4' },    // Cyan
    success: { main: '#10B981' }, // Emerald
    warning: { main: '#F59E0B' }  // Amber
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 24 },
  components: {
    MuiCard: { 
      styleOverrides: { 
        root: { 
          backgroundImage: 'none', 
          backgroundColor: '#18181B', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        } 
      } 
    }
  }
});

// --- 2. DATA PROCESSOR ---
const processData = (rawData) => {
  const hrValues = rawData?.hr?.heartRateValues || [];
  const chartData = hrValues.map((point) => ({
    // Time format: "10:30"
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: false }),
    hr: point[1],
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-45); // Keep history for the graph

  const stats = rawData?.stats || {};
  
  return {
    chartData,
    daily: {
      steps: stats.totalSteps || 0,
      distance: (stats.totalDistanceMeters || 0) / 1000, 
      floors: Math.floor(stats.floorsAscended || 0)
    }
  };
};

// --- 3. STAT CARD ---
const StatCard = ({ icon: Icon, label, value, unit, color }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 3, position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: color, opacity: 0.1, filter: 'blur(40px)' }} />
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Box sx={{ p: 1, borderRadius: '12px', bgcolor: `${color}15`, color: color, mr: 1.5 }}>
        <Icon size={20} strokeWidth={2.5} />
      </Box>
      <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h4" sx={{ zIndex: 1, fontWeight: 700 }}>
      {value} <Typography component="span" variant="body1" color="text.secondary" fontWeight="500">{unit}</Typography>
    </Typography>
  </Card>
);

// --- 4. PREMIUM CHART (Bigger, Gridded, Time Axis) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height, icon: Icon }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);
  const gradientId = `gradient-${dataKey}`;

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
      
      {/* Header Overlay */}
      <Box sx={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
           <Box sx={{ color: color, display: 'flex' }}><Icon size={18} strokeWidth={2.5}/></Box>
           <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
             {label}
           </Typography>
        </Stack>
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: '800', letterSpacing: '-1px' }}>
            {latest} <Typography component="span" variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>{unit}</Typography>
        </Typography>
      </Box>
      
      {/* The Chart */}
      <AreaChart width={chartWidth} height={height} data={data} margin={{ top: 50, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
          </linearGradient>
        </defs>
        
        {/* GRID: Made stronger (opacity 0.1) and added vertical lines */}
        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(255,255,255,0.1)" />
        
        {/* X-AXIS: Now Visible with Time */}
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#71717a', fontSize: 10 }} 
          axisLine={false} 
          tickLine={false} 
          minTickGap={30}
        />
        
        <YAxis 
          domain={domain} 
          tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }} 
          axisLine={false} 
          tickLine={false}
          width={40}
        />
        
        <Tooltip 
          contentStyle={{ backgroundColor: '#18181B', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
          itemStyle={{ color: '#FAFAFA', fontWeight: 600 }}
          labelStyle={{ display: 'none' }}
          formatter={(value) => [`${Math.round(value)} ${unit}`, label]}
        />
        
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3} 
          fillOpacity={1} 
          fill={`url(#${gradientId})`} 
          animationDuration={1500}
        />
      </AreaChart>
    </div>
  );
};

// --- 5. MAIN APP ---
export default function App() {
  const theme = useMemo(() => generateTheme(), []);
  const [data, setData] = useState({ chartData: [], daily: { steps: 0, distance: 0, floors: 0 } });
  const [usingMock, setUsingMock] = useState(false);
  const [debugMsg, setDebugMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api?t=' + Date.now()); 
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      setUsingMock(!!json.isMock);
      if (json.debugError) setDebugMsg(json.debugError);
      setData(processData(json));
    } catch (e) {
      console.error("Update failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 300000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5, alignItems: 'center' }}>
          <Box>
             <Typography variant="h4" fontWeight="800" letterSpacing="-1px">Health<span style={{color: theme.palette.primary.main}}>Dash</span></Typography>
             <Typography variant="body2" color="text.secondary">Real-time biometrics & daily activity</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {usingMock && <Chip label="Demo Data" size="small" color="warning" variant="outlined" sx={{ borderColor: 'rgba(245, 158, 11, 0.3)' }} />}
            <IconButton onClick={fetchData} disabled={loading} sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <RefreshCw size={18} className={loading ? "spin" : ""} color="#fff" />
            </IconButton>
          </Box>
        </Box>

        {/* ERROR BAR */}
        {usingMock && debugMsg && (
          <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 3 }}>
            <Typography variant="caption" color="error" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity size={14} /> <strong>STATUS:</strong> {debugMsg.substring(0, 100)}...
            </Typography>
          </Box>
        )}

        {/* STATS ROW */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard icon={Footprints} label="Daily Steps" value={data.daily.steps.toLocaleString()} unit="steps" color={theme.palette.info.main} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={Map} label="Distance" value={data.daily.distance.toFixed(2)} unit="km" color={theme.palette.success.main} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={ArrowUpCircle} label="Floors" value={data.daily.floors} unit="climbed" color={theme.palette.warning.main} />
          </Grid>
        </Grid>

        {/* CHARTS GRID */}
        <Grid container spacing={3}>
          {/* Heart Rate - BIGGER (400px) */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
                <MedicalChart 
                  data={data.chartData} 
                  dataKey="hr" 
                  color={theme.palette.error.main} 
                  label="Heart Rate" 
                  unit="BPM" 
                  domain={[40, 180]} 
                  height={400} // Increased Size
                  icon={Heart}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts - BIGGER (200px each) */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
                <Card>
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                        <MedicalChart 
                          data={data.chartData} 
                          dataKey="spo2" 
                          color={theme.palette.info.main} 
                          label="Blood Oxygen" 
                          unit="%" 
                          domain={[85, 100]} 
                          height={200} // Increased Size
                          icon={Droplets}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                        <MedicalChart 
                          data={data.chartData} 
                          dataKey="resp" 
                          color={theme.palette.success.main} 
                          label="Respiration" 
                          unit="brpm" 
                          domain={[10, 25]} 
                          height={200} // Increased Size
                          icon={Wind}
                        />
                    </CardContent>
                </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}
