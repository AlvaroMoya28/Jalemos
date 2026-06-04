import { Trip as TripModel, useTripsData } from "@/hooks/use-trips-data";
import { createContext, ReactNode, useContext, useEffect } from "react";

export interface Trip extends TripModel {
  id: string;
  driverName: string;
  driverId: string;
  vehicleId: string;
  rate: number;
  origin: string;
  destination: string;
  departureAt: string;
  totalSeats: number;
  availableSeats: number;
  state: number;
  createdAt: string;
  notes: string;
  driverRating: number;
}

interface TripsContextType {
  trips: Trip[] | null;
  isLoading: boolean;
  error: string | null;
  refreshTrips: () => Promise<void>;
  updateTripAvailableSeats?: (tripId: string, delta: number) => void;
}

const TripsContext = createContext<TripsContextType>({
  trips: null,
  isLoading: true,
  error: null,
  refreshTrips: async () => {},
});

export const TripsProvider = ({ children }: { children: ReactNode }) => {
  const { trips, isLoading, error, refreshTrips, updateTripAvailableSeats } = useTripsData();

  useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  return (
    <TripsContext.Provider value={{ trips, isLoading, error, refreshTrips, updateTripAvailableSeats }}>
      {children}
    </TripsContext.Provider>
  );
};

export const useTrips = () => useContext(TripsContext);

export default TripsContext;
