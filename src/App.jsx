import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, ThemeProvider, createTheme, CssBaseline, Chip, Stack, IconButton
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, Footprints, Map, ArrowUpCircle, RefreshCw, Heart, Wind, Droplets 
} from 'lucide-react';

// --- 1. THEME ---
const generateTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8B5CF6' },
    background: { default: '#09090B', paper: '#18181B' }, 
    text: { primary: '#FAFAFA', secondary: '#A1A1AA' },
    error: { main: '#EF4444' },   
    info: { main: '#06B6D4' },    
    success: { main: '#10B981' }, 
    warning: { main: '#F59E0B' }  
  },
  typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
  shape: { borderRadius: 24 },
  components: {
    MuiCard: { 
      styleOverrides: { 
        root: { 
          backgroundImage: 'none', 
          backgroundColor: '#18181B', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        } 
      } 
    }
  }
});

// --- 2. DATA PROCESSOR ---
const processData = (rawData) => {
  const hrValues = rawData?.hr?.heartRateValues || [];
  const chartData = hrValues.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: false }),
    hr: point[1],
    spo2: 95 + (Math.random() * 4), 
    resp: 12 + (Math.random() * 6),
  })).slice(-45); 

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
      <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={1}>{label}</Typography>
    </Box>
    <Typography variant="h4" sx={{ zIndex: 1, fontWeight: 700 }}>
      {value} <Typography component="span" variant="body1" color="text.secondary" fontWeight="500">{unit}</Typography>
    </Typography>
  </Card>
);

// --- 4. ABSOLUTE FILL CHART COMPONENT ---
// This is the fix. We force the chart to fill the container using absolute positioning.
const MedicalChart = ({ data, dataKey, color, label, unit, domain, icon: Icon }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';
  const gradientId = `grad-${label.replace(/\s/g, '')}`; // Simple ID

  return (
    // 1. The Parent is Relative (The anchor)
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* Header Overlay */}
      <Box sx={{ position: 'absolute', top: 20, left: 24, zIndex: 20 }}>
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
      
      {/* 2. The Chart Container is ABSOLUTE (Pinned to corners) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(255,255,255,0.08)" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#71717a', fontSize: 10 }} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={30}
              height={30}
              dy={10}
            />
            <YAxis 
              domain={domain} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false}
              width={40}
              dx={-10}
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
        </ResponsiveContainer>
      </div>
    </Box>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
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
          {/* Main Chart */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              height: { xs: '40vh', md: '55vh' }, 
              minHeight: 300,
              position: 'relative' // Vital for absolute child
            }}>
              <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
                <MedicalChart 
                  data={data.chartData} 
                  dataKey="hr" 
                  color={theme.palette.error.main} 
                  label="Heart Rate" 
                  unit="BPM" 
                  domain={[40, 180]} 
                  icon={Heart}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Charts Stack */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ height: '100%' }}>
                <Card sx={{ 
                   height: { xs: '25vh', md: '26vh' }, 
                   minHeight: 180,
                   flex: 1,
                   position: 'relative' // Vital
                }}>
                    <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
                        <MedicalChart 
                          data={data.chartData} 
                          dataKey="spo2" 
                          color={theme.palette.info.main} 
                          label="Blood Oxygen" 
                          unit="%" 
                          domain={[85, 100]} 
                          icon={Droplets}
                        />
                    </CardContent>
                </Card>
                <Card sx={{ 
                   height: { xs: '25vh', md: '26vh' }, 
                   minHeight: 180,
                   flex: 1,
                   position: 'relative' // Vital
                }}>
                    <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
                        <MedicalChart 
                          data={data.chartData} 
                          dataKey="resp" 
                          color={theme.palette.success.main} 
                          label="Respiration" 
                          unit="brpm" 
                          domain={[10, 25]} 
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
