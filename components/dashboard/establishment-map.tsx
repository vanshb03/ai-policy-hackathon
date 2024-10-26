"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function EstablishmentMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outbreak Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-accent rounded-md flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Map integration will display establishment locations and outbreak hotspots
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}