"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AlertsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>High Risk Alert</AlertTitle>
          <AlertDescription>
            Multiple cases reported at Seaside Grill, Downtown - 12 affected
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Moderate Risk Alert</AlertTitle>
          <AlertDescription>
            Pattern detected: Similar symptoms across 3 establishments
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Monitoring Alert</AlertTitle>
          <AlertDescription>
            New case reported at Fresh Foods Market
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}