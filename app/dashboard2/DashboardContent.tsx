// DashboardContent.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  AlertTriangle, Utensils, Users, Building2, 
  ThermometerSun, TrendingUp, AlertCircle
} from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AlertRow = Tables['alerts']['Row'] & {
  establishments: Tables['establishments']['Row'][];
};
type CaseRow = Tables['cases']['Row'] & {
  establishments: Tables['establishments']['Row'][];
};
type EstablishmentRow = Tables['establishments']['Row'] & {
  cases: { count: number }[];
};

interface DashboardData {
  alertStats: Tables['alerts']['Row'][];
  caseStats: CaseRow[];
  symptomsData: Pick<Tables['cases']['Row'], 'symptoms'>[];
  foodsData: Pick<Tables['cases']['Row'], 'foods_consumed'>[];
  recentAlerts: AlertRow[];
  locationData: EstablishmentRow[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend: number;
  trendValue: number;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue, description }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
          <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(trendValue)}%
          </span>
          <span className="text-muted-foreground ml-2">vs last period</span>
        </div>
      )}
    </CardContent>
  </Card>
);

interface SeverityPieChartProps {
  data: Tables['alerts']['Row'][];
}

const SeverityPieChart: React.FC<SeverityPieChartProps> = ({ data }) => {
  const COLORS = {
    high: '#ef4444',
    medium: '#f97316',
    low: '#22c55e'
  };

  const processedData = Object.entries(
    data.reduce((acc: Record<string, number>, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={processedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default function DashboardContent({ data }: { data: DashboardData }) {
  // Process case trends
  const caseTrends = data.caseStats.reduce((acc: Record<string, number>, caseItem) => {
    const date = new Date(caseItem.report_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const symptomsCounts = data.symptomsData.reduce((acc: Record<string, number>, item) => {
    if (item.symptoms) {
      item.symptoms.forEach((symptom) => {
        acc[symptom] = (acc[symptom] || 0) + 1;
      });
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-6 space-y-6">
        {/* High Priority Alerts */}
        {data.recentAlerts.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              {data.recentAlerts.length} high-severity alerts require attention
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Alerts"
            value={data.alertStats.length}
            icon={AlertTriangle}
            trend={10}
            trendValue={15}
            description="Current active alerts"
          />
          <StatCard
            title="Total Cases"
            value={data.caseStats.length}
            icon={Utensils}
            trend={5}
            trendValue={8}
            description="Reported cases this period"
          />
          <StatCard
            title="Affected Patients"
            value={data.caseStats.reduce((sum, c) => (c.patient_count || 0) + sum, 0)}
            icon={Users}
            trend={-2}
            trendValue={3}
            description="Total affected individuals"
          />
          <StatCard
            title="Monitored Establishments"
            value={data.locationData.length}
            icon={Building2}
            trend={0}
            trendValue={0}
            description="Active monitoring locations"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Column - Charts and Analysis */}
          <div className="lg:col-span-4 space-y-6">
            {/* Case Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Case Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={Object.entries(caseTrends).map(([date, count]) => ({ date, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Symptoms Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ThermometerSun className="mr-2 h-5 w-5" />
                  Common Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(symptomsCounts).map(([name, count]) => ({ name, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alerts and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Alert Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SeverityPieChart data={data.alertStats} />
              </CardContent>
            </Card>

            {/* Recent High-Priority Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  High Priority Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-lg bg-red-50 border border-red-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{alert.establishments[0].name}</h4>
                          <p className="text-sm text-gray-600">
                            {alert.establishments[0].city}, {alert.establishments[0].state}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          {alert.case_count} cases
                        </span>
                      </div>
                      <p className="text-sm mt-2">{alert.details}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}