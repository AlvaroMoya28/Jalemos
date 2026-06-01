// Detailed mock ride data used by the ride detail screen.
// When the backend is ready, replace DETAILED_RIDES with a real API call.

export interface Review {
  id: string;
  reviewer: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DetailedDriver {
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
  reviews: Review[];
}

export interface DetailedRide {
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
  driver: DetailedDriver;
  notes?: string;
}

export const DETAILED_RIDES: DetailedRide[] = [
  {
    id: 'ride-0',
    from: 'San José',
    to: 'Heredia',
    fromCoords: { lat: 9.9281, lng: -84.0907 },
    toCoords: { lat: 9.9987, lng: -84.1223 },
    date: 'Hoy',
    time: '5:30 PM',
    price: 1500,
    totalSeats: 4,
    availableSeats: 3,
    driver: {
      id: 'driver-0',
      fullName: 'Carlos Monestel',
      avatar: 'CM',
      rating: 4.8,
      ratingsCount: 47,
      tripsCompleted: 52,
      memberSince: 'Enero 2024',
      vehicle: 'Toyota Yaris',
      plate: 'CR-1234',
      verified: true,
      reviews: [
        {
          id: 'r0-1',
          reviewer: 'Sofía V.',
          avatar: 'SV',
          rating: 5,
          comment: 'Excelente conductor, muy puntual y amable. El carro está muy limpio.',
          date: 'Hace 3 días',
        },
        {
          id: 'r0-2',
          reviewer: 'Diego P.',
          avatar: 'DP',
          rating: 5,
          comment: 'Todo perfecto, llegué a tiempo a mi trabajo. Lo recomiendo.',
          date: 'Hace 1 semana',
        },
        {
          id: 'r0-3',
          reviewer: 'Valeria M.',
          avatar: 'VM',
          rating: 4,
          comment: 'Muy buen trato, el viaje fue cómodo. Solo un poco de tráfico.',
          date: 'Hace 2 semanas',
        },
      ],
    },
  },
  {
    id: 'ride-1',
    from: 'Cartago',
    to: 'San José',
    fromCoords: { lat: 9.8641, lng: -83.9196 },
    toCoords: { lat: 9.9281, lng: -84.0907 },
    date: 'Mañana',
    time: '7:00 AM',
    price: 2000,
    totalSeats: 3,
    availableSeats: 2,
    driver: {
      id: 'driver-1',
      fullName: 'María Rodríguez',
      avatar: 'MR',
      rating: 4.9,
      ratingsCount: 83,
      tripsCompleted: 91,
      memberSince: 'Agosto 2023',
      vehicle: 'Honda Fit',
      plate: 'CR-5678',
      verified: true,
      reviews: [
        {
          id: 'r1-1',
          reviewer: 'Andrés C.',
          avatar: 'AC',
          rating: 5,
          comment: 'La mejor conductora de la plataforma. Siempre puntual y muy buena onda.',
          date: 'Hace 1 día',
        },
        {
          id: 'r1-2',
          reviewer: 'Laura S.',
          avatar: 'LS',
          rating: 5,
          comment: 'Viaje muy cómodo, música agradable y conversación amena. 100% recomendada.',
          date: 'Hace 5 días',
        },
        {
          id: 'r1-3',
          reviewer: 'Rodrigo M.',
          avatar: 'RM',
          rating: 5,
          comment: 'Perfecta, llegué antes de lo esperado. Definitivamente la escojo de nuevo.',
          date: 'Hace 1 semana',
        },
      ],
    },
  },
  {
    id: 'ride-2',
    from: 'Alajuela',
    to: 'Escazú',
    fromCoords: { lat: 10.0168, lng: -84.2144 },
    toCoords: { lat: 9.9178, lng: -84.1422 },
    date: 'Mañana',
    time: '8:15 AM',
    price: 1800,
    totalSeats: 5,
    availableSeats: 4,
    driver: {
      id: 'driver-2',
      fullName: 'José Ledezma',
      avatar: 'JL',
      rating: 4.7,
      ratingsCount: 35,
      tripsCompleted: 38,
      memberSince: 'Marzo 2024',
      vehicle: 'Nissan Kicks',
      plate: 'CR-9012',
      verified: true,
      reviews: [
        {
          id: 'r2-1',
          reviewer: 'Camila T.',
          avatar: 'CT',
          rating: 5,
          comment: 'Muy amable y con buen conocimiento de las rutas. Llegamos rápido.',
          date: 'Hace 4 días',
        },
        {
          id: 'r2-2',
          reviewer: 'Fabio R.',
          avatar: 'FR',
          rating: 4,
          comment: 'Buen viaje en general, el conductor es simpático y la ruta fue directa.',
          date: 'Hace 2 semanas',
        },
        {
          id: 'r2-3',
          reviewer: 'Isabel G.',
          avatar: 'IG',
          rating: 5,
          comment: 'Todo excelente, carro limpio y música chill. Muy recomendado.',
          date: 'Hace 3 semanas',
        },
      ],
    },
  },
  {
    id: 'ride-3',
    from: 'Liberia',
    to: 'Tamarindo',
    fromCoords: { lat: 10.6339, lng: -85.4401 },
    toCoords: { lat: 10.2989, lng: -85.8459 },
    date: 'Vie 18',
    time: '10:00 AM',
    price: 3500,
    totalSeats: 2,
    availableSeats: 1,
    notes: 'Parada en gasolinera La Cruz. Llevar equipaje pequeño.',
    driver: {
      id: 'driver-3',
      fullName: 'Ana Picado',
      avatar: 'AP',
      rating: 5,
      ratingsCount: 29,
      tripsCompleted: 30,
      memberSince: 'Octubre 2024',
      vehicle: 'Suzuki Vitara',
      plate: 'CR-3456',
      verified: true,
      reviews: [
        {
          id: 'r3-1',
          reviewer: 'Marco A.',
          avatar: 'MA',
          rating: 5,
          comment: '¡Excelente! Conoce perfectamente la ruta a Tamarindo. 10/10.',
          date: 'Hace 2 días',
        },
        {
          id: 'r3-2',
          reviewer: 'Priscilla N.',
          avatar: 'PN',
          rating: 5,
          comment: 'Puntual, amable y el carro espacioso. Fue un viaje genial a la playa.',
          date: 'Hace 1 semana',
        },
        {
          id: 'r3-3',
          reviewer: 'Daniel F.',
          avatar: 'DF',
          rating: 5,
          comment: 'Perfecta conductora. La recomiendo para el trayecto de la costa.',
          date: 'Hace 10 días',
        },
      ],
    },
  },
];
