"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, PieChart as PieChartIcon } from 'lucide-react';

interface CaseData {
  date: string;
  cases: number;
  movingAverage?: number;
}

interface SymptomData {
  symptom: string;
  count: number;
}

interface LocationData {
  city: string;
  count: number;
}

const TrendsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [cases, setCases] = useState<CaseData[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(timeRange);
    const startDate = new Date(now.setDate(now.getDate() - days));
    return startDate.toISOString();
  };

  const calculateMovingAverage = (data: CaseData[], window: number) => {
    return data.map((item, index) => {
      const start = Math.max(0, index - window + 1);
      const values = data.slice(start, index + 1).map(d => d.cases);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return {
        ...item,
        movingAverage: Number(avg.toFixed(2))
      };
    });
  };

  const calculateWeeklyTotals = (data: CaseData[]) => {
    const weeklyData: { [key: string]: number } = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      weeklyData[weekStart] = (weeklyData[weekStart] || 0) + item.cases;
    });

    return Object.entries(weeklyData).map(([date, cases]) => ({
      date,
      cases
    }));
  };

  const fetchData = async () => {
    const startDate = getDateRange();
    
    try {
      // Fetch cases
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .gte('report_date', startDate)
        .order('report_date', { ascending: true });

      if (casesError) throw casesError;

      if (casesData) {
        // Process daily cases
        const processedCases = casesData.reduce<CaseData[]>((acc, curr) => {
          const date = new Date(curr.report_date).toISOString().split('T')[0];
          const existing = acc.find(item => item.date === date);
          if (existing && curr.patient_count) {
            existing.cases += curr.patient_count;
          } else if (curr.patient_count) {
            acc.push({ date, cases: curr.patient_count });
          }
          return acc;
        }, []);

        // Calculate 7-day moving average
        const casesWithMA = calculateMovingAverage(processedCases, 7);
        setCases(casesWithMA);

        // Calculate weekly totals
        setWeeklyTotals(calculateWeeklyTotals(processedCases));

        // Process symptoms
        const symptomCounts: Record<string, number> = {};
        casesData.forEach(caseItem => {
          if (caseItem.symptoms && caseItem.patient_count) {
            caseItem.symptoms.forEach((symptom: string) => {
              symptomCounts[symptom] = (symptomCounts[symptom] || 0) + caseItem.patient_count!;
            });
          }
        });

        const processedSymptoms = Object.entries(symptomCounts)
          .map(([symptom, count]) => ({ symptom, count }))
          .sort((a, b) => b.count - a.count);
        setSymptoms(processedSymptoms);

        // Process locations
        const locationCounts: Record<string, number> = {};
        casesData.forEach(caseItem => {
          if (caseItem.city && caseItem.patient_count) {
            locationCounts[caseItem.city] = (locationCounts[caseItem.city] || 0) + caseItem.patient_count;
          }
        });

        const processedLocations = Object.entries(locationCounts)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);
        setLocations(processedLocations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading trends data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trend Analysis</h1>
          <p className="text-gray-500 mt-1">Comprehensive disease surveillance trends and patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Daily Cases with Moving Average</CardTitle>
            </div>
            <CardDescription>
              Daily case counts with 7-day moving average trend line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cases} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cases" stroke="#8884d8" name="Daily Cases" />
                  <Line type="monotone" dataKey="movingAverage" stroke="#82ca9d" name="7-day Moving Avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Weekly Case Distribution</CardTitle>
            </div>
            <CardDescription>
              Total cases aggregated by week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTotals} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cases" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              <CardTitle>Symptom Distribution</CardTitle>
            </div>
            <CardDescription>
              Breakdown of reported symptoms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={symptoms.slice(0, 5)}
                    dataKey="count"
                    nameKey="symptom"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {symptoms.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>
              Cases by location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locations.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8">
                    {locations.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendsPage;