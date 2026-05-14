import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
      }
    );
  }, []);

  if (!position) {
    return <p>Loading map...</p>;
  }

  return (
    <div className="rounded-2xl overflow-hidden mt-6">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>
            You are here
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}