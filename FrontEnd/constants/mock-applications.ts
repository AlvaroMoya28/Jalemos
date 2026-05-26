// Driver verification pipeline — application types and seed data.
// Each application tracks the full lifecycle from submission to approval/rejection.

export type ApplicationStatus =
  | 'pending'           // submitted, waiting for admin to pick it up
  | 'under_review'      // admin opened it and is reviewing
  | 'needs_correction'  // admin flagged issues, waiting for user to resubmit
  | 'approved'          // admin approved, user can activate driver mode
  | 'rejected';         // admin rejected the application permanently

export interface ReviewIssue {
  id: string;
  label: string;
}

export const REVIEW_ISSUES: ReviewIssue[] = [
  { id: 'license_unreadable',      label: 'La foto de la licencia no es legible' },
  { id: 'name_mismatch',           label: 'El nombre no coincide con la licencia' },
  { id: 'cedula_mismatch',         label: 'La cédula no coincide con la información de la licencia' },
  { id: 'license_expired',         label: 'La licencia está vencida' },
  { id: 'dekra_vehicle_mismatch',  label: 'El Dekra no coincide con el vehículo registrado' },
  { id: 'dekra_failed',            label: 'El vehículo no pasó la revisión técnica (Dekra)' },
  { id: 'dekra_expired',           label: 'El Dekra está vencido' },
  { id: 'vehicle_info_mismatch',   label: 'La información del vehículo no coincide' },
  { id: 'plate_mismatch',          label: 'La placa ingresada no coincide' },
];

export interface DriverApplication {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar: string;
  submittedAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  attempts: number;
  vehicle: {
    brand: string;
    model: string;
    year: string;
    plate: string;
    color: string;
  };
  // null = mock placeholder (real app would store URIs or S3 keys)
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
  adminFeedback?: {
    issueIds: string[];
    notes: string;
    reviewedAt: string;
  };
}

export const SEED_APPLICATIONS: DriverApplication[] = [
  {
    id: 'app-001',
    userId: 'user-pasajero',
    applicantName: 'Álvaro Moya',
    applicantEmail: 'pasajero@jalemos.cr',
    applicantAvatar: 'AM',
    submittedAt: '2026-05-22T09:14:00Z',
    updatedAt: '2026-05-22T09:14:00Z',
    status: 'pending',
    attempts: 1,
    vehicle: { brand: 'Toyota', model: 'Corolla', year: '2020', plate: 'CR-8821', color: 'Gris' },
    licensePhotoFront: null,
    licensePhotoBack: null,
    dekraPhoto: null,
  },
  {
    id: 'app-002',
    userId: 'user-luis',
    applicantName: 'Luis Gamboa',
    applicantEmail: 'luis.g@jalemos.cr',
    applicantAvatar: 'LG',
    submittedAt: '2026-05-21T14:30:00Z',
    updatedAt: '2026-05-22T08:00:00Z',
    status: 'under_review',
    attempts: 1,
    vehicle: { brand: 'Hyundai', model: 'Tucson', year: '2021', plate: 'CR-4456', color: 'Azul' },
    licensePhotoFront: null,
    licensePhotoBack: null,
    dekraPhoto: null,
  },
  {
    id: 'app-003',
    userId: 'user-fernanda',
    applicantName: 'Fernanda Castro',
    applicantEmail: 'fernanda.c@jalemos.cr',
    applicantAvatar: 'FC',
    submittedAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-21T16:45:00Z',
    status: 'needs_correction',
    attempts: 1,
    vehicle: { brand: 'Kia', model: 'Sportage', year: '2019', plate: 'CR-2290', color: 'Rojo' },
    licensePhotoFront: null,
    licensePhotoBack: null,
    dekraPhoto: null,
    adminFeedback: {
      issueIds: ['license_expired', 'dekra_expired'],
      notes: 'La licencia venció en enero 2026 y el Dekra adjunto es del año anterior. Por favor actualice ambos documentos.',
      reviewedAt: '2026-05-21T16:45:00Z',
    },
  },
  {
    id: 'app-004',
    userId: 'user-roberto',
    applicantName: 'Roberto Salazar',
    applicantEmail: 'roberto.s@jalemos.cr',
    applicantAvatar: 'RS',
    submittedAt: '2026-05-18T08:20:00Z',
    updatedAt: '2026-05-19T11:30:00Z',
    status: 'approved',
    attempts: 1,
    vehicle: { brand: 'Mazda', model: 'CX-5', year: '2022', plate: 'CR-6614', color: 'Blanco' },
    licensePhotoFront: null,
    licensePhotoBack: null,
    dekraPhoto: null,
  },
  {
    id: 'app-005',
    userId: 'user-patricia',
    applicantName: 'Patricia Mora',
    applicantEmail: 'patricia.m@jalemos.cr',
    applicantAvatar: 'PM',
    submittedAt: '2026-05-15T12:00:00Z',
    updatedAt: '2026-05-16T09:15:00Z',
    status: 'rejected',
    attempts: 2,
    vehicle: { brand: 'Suzuki', model: 'Swift', year: '2017', plate: 'CR-0033', color: 'Negro' },
    licensePhotoFront: null,
    licensePhotoBack: null,
    dekraPhoto: null,
    adminFeedback: {
      issueIds: ['dekra_failed', 'vehicle_info_mismatch'],
      notes: 'Tras dos intentos el vehículo continúa sin pasar la revisión técnica y la información registrada no corresponde al vehículo presentado.',
      reviewedAt: '2026-05-16T09:15:00Z',
    },
  },
];
