"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Database } from '@/lib/supabase/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// type Case = Database['public']['Tables']['cases']['Row'];

export default function CasesTrend() {
  const [data, setData] = useState<{ date: string; cases: number; }[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchCases = async () => {
      const endDate = new Date();
      const startDate = subMonths(endDate, 6);

      const { data: cases } = await supabase
        .from('cases')
        .select('report_date, patient_count')
        .gte('report_date', startOfMonth(startDate).toISOString())
        .lte('report_date', endOfMonth(endDate).toISOString());

      if (cases) {
        const monthlyData = cases.reduce((acc, curr) => {
          const month = format(new Date(curr.report_date), 'yyyy-MM');
          acc[month] = (acc[month] || 0) + (curr.patient_count || 1);
          return acc;
        }, {} as Record<string, number>);

        const formattedData = Object.entries(monthlyData).map(([date, cases]) => ({
          date,
          cases,
        }));

        setData(formattedData);
      }
    };

    fetchCases();

    const channel = supabase
      .channel('cases-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        fetchCases();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cases Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="cases" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}