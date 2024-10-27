"use client";

import { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from '@/lib/supabase/types';
import 'mapbox-gl/dist/mapbox-gl.css';

type Establishment = Database['public']['Tables']['establishments']['Row'] & {
  cases: Database['public']['Tables']['cases']['Row'][];
};

export default function EstablishmentMap() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 11
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [caseFilter, setCaseFilter] = useState<string>('all'); // 'all', 'low', 'high'

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchEstablishments = async () => {
      const { data } = await supabase
        .from('establishments')
        .select(`
          *,
          cases (*)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (data) setEstablishments(data);
    };

    fetchEstablishments();

    const channel = supabase
      .channel('establishments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'establishments' }, fetchEstablishments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Filter establishments based on search and case count
  const filteredEstablishments = useMemo(() => {
    return establishments.filter(establishment => {
      // Search filter
      if (searchQuery && !establishment.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Case count filter
      const caseCount = establishment.cases.length;
      if (caseFilter === 'low' && caseCount >= 7) return false;
      if (caseFilter === 'high' && caseCount < 7) return false;
      if (caseCount === 0) return false;

      return true;
    });
  }, [establishments, searchQuery, caseFilter]);

  const getMarkerColor = (caseCount: number) => {
    if (caseCount === 0) return null;
    if (caseCount < 7) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const getAnimationColor = (caseCount: number) => {
    if (caseCount === 0) return null;
    if (caseCount < 7) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Restaurant Outbreak Map</CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Case Filter */}
          <Select
            value={caseFilter}
            onValueChange={setCaseFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by cases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="low">Low Risk (1-6 cases)</SelectItem>
              <SelectItem value="high">High Risk (7+ cases)</SelectItem>
            </SelectContent>
          </Select>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm">1-6 cases</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full" />
              <span className="text-sm">7+ cases</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[600px] rounded-md overflow-hidden">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />

            {filteredEstablishments.map((establishment) => {
              const caseCount = establishment.cases.length;
              const markerColor = getMarkerColor(caseCount);
              const animationColor = getAnimationColor(caseCount);
              
              if (caseCount === 0) return null;

              return (
                <Marker
                  key={establishment.id}
                  latitude={establishment.latitude!}
                  longitude={establishment.longitude!}
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setSelectedEstablishment(establishment);
                  }}
                >
                  <div className={`w-6 h-6 ${markerColor} rounded-full flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110`}>
                    <div className={`w-4 h-4 ${animationColor} rounded-full animate-ping absolute`} />
                    <span className="text-white text-xs font-bold">
                      {caseCount}
                    </span>
                  </div>
                </Marker>
              );
            })}

            {selectedEstablishment && (
              <Popup
                latitude={selectedEstablishment.latitude!}
                longitude={selectedEstablishment.longitude!}
                onClose={() => setSelectedEstablishment(null)}
                closeButton={true}
                closeOnClick={false}
                className="min-w-[300px]"
              >
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{selectedEstablishment.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEstablishment.address}</p>
                  <div className="mt-4">
                    <h4 className="font-medium">Case Information</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cases</p>
                        <p className="font-medium">{selectedEstablishment.cases.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Reported</p>
                        <p className="font-medium">
                          {selectedEstablishment.cases.length > 0
                            ? new Date(selectedEstablishment.cases[selectedEstablishment.cases.length - 1].created_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}