// Vehicles API.
import { get, request } from "./client";

export interface VehicleDTO {
  vehicleId: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  numPlate: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export const vehiclesApi = {
  getMy: (token: string) =>
    get<VehicleDTO[]>('/api/vehicles/my', token),

  getByUserId: (userId: string, token: string) =>
    get<VehicleDTO[]>(`/api/vehicles/user/${userId}`, token),

  delete: (vehicleId: string, token: string) =>
    request<void>(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
