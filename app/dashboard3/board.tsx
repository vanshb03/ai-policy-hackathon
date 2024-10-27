"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AlertRow = Tables['alerts']['Row'];
type CaseRow = Tables['cases']['Row'];
type EstablishmentRow = Tables['establishments']['Row'];

interface AlertWithEstablishment extends AlertRow {
  establishments?: EstablishmentRow;
}

interface CaseData {
  date: string;
  cases: number;
}

interface SymptomData {
  symptom: string;
  count: number;
}

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DiseaseMonitoringDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [alerts, setAlerts] = useState<AlertWithEstablishment[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(timeRange);
    const startDate = new Date(now.setDate(now.getDate() - days));
    return startDate.toISOString();
  };

  const fetchAlerts = async () => {
    const startDate = getDateRange();
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        establishments (
          name,
          city,
          state
        )
      `)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching alerts:', error);
      setError(error.message);
    } else {
      setAlerts(data || []);
    }
  };

  const fetchCases = async () => {
    const startDate = getDateRange();
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .gte('report_date', startDate)
      .order('report_date', { ascending: true });

    if (error) {
      console.error('Error fetching cases:', error);
      setError(error.message);
      return;
    }

    if (!data) {
      setCases([]);
      setSymptoms([]);
      return;
    }

    // Process cases data for the trend chart
    const processedData = data.reduce<CaseData[]>((acc, curr: CaseRow) => {
      const date = new Date(curr.report_date).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing && curr.patient_count) {
        existing.cases += curr.patient_count;
      } else if (curr.patient_count) {
        acc.push({ date, cases: curr.patient_count });
      }
      return acc;
    }, []);
    setCases(processedData);

    // Process symptoms data with proper typing
    const symptomCounts: Record<string, number> = {};
    data.forEach((caseItem: CaseRow) => {
      if (caseItem.symptoms && caseItem.patient_count) {
        caseItem.symptoms.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + caseItem.patient_count!;
        });
      }
    });
    
    const processedSymptoms: SymptomData[] = Object.entries(symptomCounts).map(
      ([symptom, count]): SymptomData => ({
        symptom,
        count
      })
    );
    setSymptoms(processedSymptoms);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAlerts(), fetchCases()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
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

  const totalCases = cases.reduce((sum, day) => sum + day.cases, 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disease Surveillance Dashboard</h1>
        <div className="flex gap-2">
          <select 
            className="p-2 border rounded"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{alerts.length}</div>
                <div className="text-sm text-gray-500">Requiring attention</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Case Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={cases}>
                    <Line type="monotone" dataKey="cases" stroke="#2563eb" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCases}</div>
                <div className="text-sm text-gray-500">Past {timeRange}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="pt-6">
              {alerts.map(alert => (
                <Alert key={alert.id} className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {alert.alert_type}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{alert.establishments?.name}</span>
                      </div>
                      <div className="mt-1">
                        {alert.case_count} cases reported - {alert.details}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Case Progression Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cases}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cases" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Symptom Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={symptoms}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symptom" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Key Insights</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      {((cases[cases.length - 1]?.cases / cases[0]?.cases - 1) * 100).toFixed(1)}% 
                      change in cases over the selected period
                    </li>
                    <li>{alerts.length} active alerts requiring attention</li>
                    <li>
                      Most common symptoms: {
                        symptoms
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 2)
                          .map(s => s.symptom)
                          .join(', ')
                      }
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold mb-2">Recommendations</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Increase inspection frequency in affected areas</li>
                    <li>Issue public health advisory for establishments with active alerts</li>
                    <li>Monitor food supply chain connections between affected locations</li>
                    <li>Conduct targeted testing for suspected pathogens</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiseaseMonitoringDashboard;