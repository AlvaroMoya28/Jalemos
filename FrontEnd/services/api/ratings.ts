// Ratings API.
import { get, post, request } from "./client";

export interface SubmitRatingPayload {
  tripId: string;
  ratedId: string;
  score: number;
  comment?: string;
}

export interface RatingDTO {
  id: string;
  tripId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment: string | null;
  createdAt: string;
  raterFirstName: string;
  raterLastName: string;
  ratedFirstName: string;
  ratedLastName: string;
}

export const ratingsApi = {
  getByUser: (userId: string) =>
    get<RatingDTO[]>(`/api/ratings/user/${userId}`),

  getLow: (token: string, maxScore = 2) =>
    get<RatingDTO[]>(`/api/ratings/low?maxScore=${maxScore}`, token),

  submit: (payload: SubmitRatingPayload, token: string) =>
    post<RatingDTO>('/api/ratings', payload, token),

  delete: (id: string, token: string) =>
    request<void>(`/api/ratings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
};
