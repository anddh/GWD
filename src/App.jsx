import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, IconButton, ThemeProvider, createTheme, CssBaseline, Chip
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea 
} from 'recharts';
import { 
  RefreshCw, Activity, AlertTriangle 
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

// --- 3. CHART COMPONENT (The "Manual Math" Fix) ---
const MedicalChart = ({ data, dataKey, color, label, unit, domain, height }) => {
  const latest = data.length ? Math.round(data[data.length - 1][dataKey]) : '--';
  
  // 1. We calculate the width manually using a ref
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300); // Default start width

  useEffect(() => {
    // Function to measure the container
    const updateWidth = () => {
      if (containerRef.current) {
        // Subtract padding to be safe
        setChartWidth(containerRef.current.offsetWidth - 10);
      }
    };

    // Measure immediately
    updateWidth();

    // Measure again if window resizes
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: height, position: 'relative', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}>
