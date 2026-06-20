// Shared types for the ride-detail screen and its sub-components.

export type RideReview = {
  id: string;
  reviewer: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
};

export type RideDetail = {
  id: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  date: string;
  time: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  notes?: string;
  driver: {
    id: string;
    fullName: string;
    avatar: string;
    rating: number;
    ratingsCount: number;
    tripsCompleted: number;
    memberSince: string;
    vehicle: string;
    plate: string;
    verified: boolean;
    reviews: RideReview[];
  };
};
