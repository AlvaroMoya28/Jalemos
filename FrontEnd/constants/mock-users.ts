// Seed users for mock authentication.
// Passwords are plain-text — replace with hashed credentials when the real backend is ready.

export interface MockUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  /** 'passenger' = solo pasajero. 'passenger+driver' = pasajero habilitado como conductor. */
  role: 'admin' | 'passenger' | 'passenger+driver';
  avatar: string;
  rating: number;
  tripsCount: number;
  memberSince: string;
}

export const SEED_USERS: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@jalemos.cr',
    firstName: 'Admin',
    lastName: 'Jalemos',
    password: 'admin123',
    role: 'admin',
    avatar: 'AJ',
    rating: 5.0,
    tripsCount: 120,
    memberSince: 'Enero 2024',
  },
  {
    id: 'user-pasajero',
    username: 'pasajero',
    email: 'pasajero@jalemos.cr',
    firstName: 'Álvaro',
    lastName: 'Moya',
    password: 'pass123',
    role: 'passenger',
    avatar: 'AM',
    rating: 4.8,
    tripsCount: 38,
    memberSince: 'Febrero 2024',
  },
  {
    id: 'driver-0',
    username: 'carlos.m',
    email: 'carlos@jalemos.cr',
    firstName: 'Carlos',
    lastName: 'Monestel',
    password: 'carlos123',
    role: 'passenger+driver',
    avatar: 'CM',
    rating: 4.8,
    tripsCount: 52,
    memberSince: 'Enero 2024',
  },
  {
    id: 'driver-1',
    username: 'maria.r',
    email: 'maria@jalemos.cr',
    firstName: 'María',
    lastName: 'Rodríguez',
    password: 'maria123',
    role: 'passenger+driver',
    avatar: 'MR',
    rating: 4.9,
    tripsCount: 91,
    memberSince: 'Agosto 2023',
  },
  {
    id: 'driver-2',
    username: 'jose.l',
    email: 'jose@jalemos.cr',
    firstName: 'José',
    lastName: 'Ledezma',
    password: 'jose123',
    role: 'passenger+driver',
    avatar: 'JL',
    rating: 4.7,
    tripsCount: 38,
    memberSince: 'Marzo 2024',
  },
  {
    id: 'driver-3',
    username: 'ana.p',
    email: 'ana@jalemos.cr',
    firstName: 'Ana',
    lastName: 'Picado',
    password: 'ana123',
    role: 'passenger+driver',
    avatar: 'AP',
    rating: 5.0,
    tripsCount: 30,
    memberSince: 'Octubre 2024',
  },
];
