import { useEffect, useState } from "react";

export default function LocationTracker() {
  const [location, setLocation] = useState<any>(null);

useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}, []);

  return (
    <div className="p-4 rounded-xl bg-black text-white">
      <h2 className="text-xl font-bold mb-2">
        Live Location
      </h2>

      {location ? (
        <>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lng}</p>
          <p>Accuracy: {location.accuracy} meters</p>
        </>
      ) : (
        <p>Fetching location...</p>
      )}
    </div>
  );
}