"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';  
import {Button} from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MapPin, Calendar, Search, TrendingUp, Users, Activity } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';

interface CaseData {
  id: string;
  report_date: string;
  patient_count: number;
  symptoms: string[];
  establishment_id: string;
  status: string;
  notes: string;
  establishments?: {
    name: string;
    city: string;
    state: string;
  };
}

interface DailyCases {
  date: string;
  cases: number;
}

interface SymptomData {
  symptom: string;
  count: number;
}

const CasesPage = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [dailyCases, setDailyCases] = useState<DailyCases[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const fetchCases = async () => {
    const startDate = getDateRange();
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        establishments (
          name,
          city,
          state
        )
      `)
      .gte('report_date', startDate)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      setError(error.message);
      return;
    }

    setCases(data || []);

    // Process daily cases data
    const dailyData = (data || []).reduce<Record<string, number>>((acc, curr) => {
      const date = new Date(curr.report_date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (curr.patient_count || 0);
      return acc;
    }, {});

    const processedDailyCases = Object.entries(dailyData)
      .map(([date, cases]) => ({ date, cases }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyCases(processedDailyCases);

    // Process symptoms data
    const symptomCounts: Record<string, number> = {};
    (data || []).forEach((caseItem) => {
      if (caseItem.symptoms && caseItem.patient_count) {
        caseItem.symptoms.forEach((symptom: string) => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + caseItem.patient_count;
        });
      }
    });

    const processedSymptoms = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);

    setSymptoms(processedSymptoms);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchCases();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const { toast } = useToast();

  // Add this effect to handle the progress bar
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (isAnalyzing) {
      setProgress(0);
      setShowProgress(true);
      const startTime = Date.now();
      const duration = 25000; // 25 seconds

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);
        
        if (elapsed >= duration) {
          clearInterval(progressInterval);
        }
      }, 100);

      // Cleanup timeout
      timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        setShowProgress(false);
        setProgress(0);
      }, duration);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [isAnalyzing]);

  const router = useRouter();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5000/api/food-safety/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        // Clear progress bar on success
        setShowProgress(false);
        setProgress(0);
        
        toast({
          title: "Analysis Complete",
          description: `Generated ${data.alerts_generated} alerts. Cost: $${data.costs.total_cost.toFixed(2)}`,
        });
        
        // Redirect to alerts page after successful analysis
        router.push('/alerts');
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to analysis server. Make sure the Flask server is running.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.establishments?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      caseItem.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || caseItem.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPatients = cases.reduce((sum, curr) => sum + (curr.patient_count || 0), 0);
  const activePatients = cases
    .filter(c => c.status.toLowerCase() === 'active')
    .reduce((sum, curr) => sum + (curr.patient_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading cases...</div>
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
        {showProgress && (
            <div className="fixed bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg p-4 border z-50">
                <div className="flex justify-between bg-white items-center mb-2">
                <span className="text-sm font-medium">Analyzing Cases</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
            </div>
            )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Case Management</h1>
        <div className="flex gap-4">
             <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
            >
                {isAnalyzing ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Analyzing...
                </div>
                ) : (
                "Analyse Cases"
                )}
            </Button>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cases" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Symptom Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptoms.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symptom" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <div className="text-sm text-gray-500">Total Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{activePatients}</div>
                <div className="text-sm text-gray-500">Active Cases</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {((dailyCases[dailyCases.length - 1]?.cases || 0) / (dailyCases[0]?.cases || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Case Rate Change</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search cases..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(caseItem.report_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {caseItem.establishments?.name}
                          <br />
                          <span className="text-sm text-gray-500">
                            {caseItem.establishments?.city}, {caseItem.establishments?.state}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.patient_count}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {caseItem.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="secondary">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">{caseItem.notes}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesPage;