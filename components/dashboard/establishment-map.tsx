"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Map, { Marker, Popup } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'establishments' }, () => {
        fetchEstablishments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

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
    <Card>
      <CardHeader>
        <CardTitle>Outbreak Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-md overflow-hidden">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            {establishments.map((establishment) => {
              const caseCount = establishment.cases.length;
              const markerColor = getMarkerColor(caseCount);
              const animationColor = getAnimationColor(caseCount);
              
              // Don't render marker if there are no cases
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
                className="min-w-[200px]"
              >
                <div className="p-2">
                  <h3 className="font-semibold">{selectedEstablishment.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEstablishment.address}</p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Cases: </span>
                    {selectedEstablishment.cases.length}
                  </p>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}