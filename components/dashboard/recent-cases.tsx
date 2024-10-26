"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const recentCases = [
  {
    id: 1,
    establishment: "Seaside Grill",
    date: "2024-03-15",
    symptoms: ["nausea", "fever"],
    status: "active",
  },
  {
    id: 2,
    establishment: "Fresh Foods Market",
    date: "2024-03-14",
    symptoms: ["diarrhea"],
    status: "suspected",
  },
  {
    id: 3,
    establishment: "Downtown Deli",
    date: "2024-03-13",
    symptoms: ["vomiting", "fever"],
    status: "resolved",
  },
];

export default function RecentCases() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {recentCases.map((case_) => (
              <div
                key={case_.id}
                className="flex flex-col space-y-2 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{case_.establishment}</h3>
                  <Badge
                    variant={
                      case_.status === "active"
                        ? "destructive"
                        : case_.status === "suspected"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {case_.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{case_.date}</p>
                <div className="flex gap-2">
                  {case_.symptoms.map((symptom) => (
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