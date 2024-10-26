"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Database } from '@/lib/supabase/types';
import { format } from 'date-fns';

type Case = Database['public']['Tables']['cases']['Row'] & {
  establishments: Database['public']['Tables']['establishments']['Row'] | null;
};

export default function RecentCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchCases = async () => {
      const { data } = await supabase
        .from('cases')
        .select('*, establishments(*)')
        .order('report_date', { ascending: false })
        .limit(10);

      if (data) setCases(data);
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
        <CardTitle>Recent Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {cases.map((case_) => (
              <div
                key={case_.id}
                className="flex flex-col space-y-2 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{case_.establishments?.name}</h3>
                  <Badge
                    variant={
                      case_.status === 'confirmed'
                        ? "destructive"
                        : case_.status === 'suspected'
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {case_.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(case_.report_date), 'PPP')}
                </p>
                <div className="flex gap-2">
                  {case_.symptoms?.map((symptom) => (
                    <Badge key={symptom} variant="outline">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}