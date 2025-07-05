
'use client';

import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface LocationMapProps {
    position: {
        lat: number;
        lng: number;
    };
}

export function LocationMap({ position }: LocationMapProps) {
    return (
        <div style={{ height: '400px', width: '100%' }} className="rounded-lg overflow-hidden">
            <Map
                defaultCenter={position}
                defaultZoom={14}
                mapId="acoof-user-location-map"
                className="w-full h-full"
            >
                <AdvancedMarker position={position} />
            </Map>
        </div>
    );
}
