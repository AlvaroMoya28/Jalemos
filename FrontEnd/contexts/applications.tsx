// Driver application pipeline context — connected to the real API.
// Reports section is still mock until the reports backend is built.

import { SEED_REPORTS, UserReport } from '@/constants/mock-reports';
import { useAuth } from '@/contexts/auth';
import { applicationsApi, DriverApplicationDTO } from '@/services/api';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

// Canonical type used throughout the frontend

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'needs_correction'
  | 'approved'
  | 'rejected';

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
  cedula: string;
  address: string;
  vehicle: { brand: string; model: string; year: string; plate: string; color: string };
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
  adminFeedback?: { issueIds: string[]; notes: string; reviewedAt: string };
}

export interface SubmitData {
  cedula: string;
  address: string;
  vehicle: DriverApplication['vehicle'];
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
}

// DTO → local model

function fromDTO(dto: DriverApplicationDTO): DriverApplication {
  return {
    id:               dto.applicationId,
    userId:           dto.userId,
    applicantName:    dto.applicantName ?? '',
    applicantEmail:   dto.applicantEmail ?? '',
    applicantAvatar:  dto.applicantAvatar ?? '?',
    submittedAt:      dto.submittedAt,
    updatedAt:        dto.updatedAt,
    status:           dto.status as ApplicationStatus,
    attempts:         dto.attempts,
    cedula:           dto.cedula,
    address:          dto.address,
    vehicle: {
      brand: dto.vehicleBrand,
      model: dto.vehicleModel,
      year:  String(dto.vehicleYear),
      plate: dto.vehiclePlate,
      color: dto.vehicleColor,
    },
    licensePhotoFront: dto.licensePhotoFront,
    licensePhotoBack:  dto.licensePhotoBack,
    dekraPhoto:        dto.dekraPhoto,
    adminFeedback: dto.adminIssueIds
      ? { issueIds: dto.adminIssueIds, notes: dto.adminNotes ?? '', reviewedAt: dto.reviewedAt ?? '' }
      : undefined,
  };
}

// Context type

interface ApplicationsContextType {
  // User-facing
  myApplication: DriverApplication | null;
  myApplicationLoading: boolean;
  loadMyApplication: () => Promise<DriverApplication | null>;
  submitApplication: (data: SubmitData) => Promise<DriverApplication>;
  resubmitApplication: (applicationId: string, data: SubmitData) => Promise<void>;

  // Admin-facing — applications
  applications: DriverApplication[];
  applicationsLoading: boolean;
  loadApplications: (statusFilter?: string) => Promise<void>;
  setUnderReview: (id: string) => Promise<void>;
  requestCorrection: (id: string, issueIds: string[], notes: string) => Promise<void>;
  approveApplication: (id: string) => Promise<void>;
  rejectApplication: (id: string, issueIds: string[], notes: string) => Promise<void>;

  // Admin-facing — reports (mock until backend is built)
  reports: UserReport[];
  suspendUserFromReport: (reportId: string, days: number) => void;
  deactivateUserFromReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType>({
  myApplication:           null,
  myApplicationLoading:    false,
  loadMyApplication:       async () => null,
  submitApplication:       async () => ({} as DriverApplication),
  resubmitApplication:     async () => {},
  applications:            [],
  applicationsLoading:     false,
  loadApplications:        async () => {},
  setUnderReview:          async () => {},
  requestCorrection:       async () => {},
  approveApplication:      async () => {},
  rejectApplication:       async () => {},
  reports:                 [],
  suspendUserFromReport:   () => {},
  deactivateUserFromReport: () => {},
  dismissReport:           () => {},
});

// Provider

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  const [myApplication,        setMyApplication]        = useState<DriverApplication | null>(null);
  const [myApplicationLoading, setMyApplicationLoading] = useState(false);
  const [applications,         setApplications]         = useState<DriverApplication[]>([]);
  const [applicationsLoading,  setApplicationsLoading]  = useState(false);
  const [reports,              setReports]              = useState<UserReport[]>([...SEED_REPORTS]);

  const requireToken = (): string => {
    if (!token) throw new Error('Sesión expirada. Por favor iniciá sesión de nuevo.');
    return token;
  };

  // User-facing

  const loadMyApplication = useCallback(async (): Promise<DriverApplication | null> => {
    setMyApplicationLoading(true);
    try {
      const dto = await applicationsApi.getMy(requireToken());
      const app = dto ? fromDTO(dto) : null;
      setMyApplication(app);
      return app;
    } finally {
      setMyApplicationLoading(false);
    }
  }, [token]);

  const submitApplication = async (data: SubmitData): Promise<DriverApplication> => {
    const dto = await applicationsApi.submit(
      {
        cedula:           data.cedula,
        address:          data.address,
        vehicleBrand:     data.vehicle.brand,
        vehicleModel:     data.vehicle.model,
        vehicleYear:      Number(data.vehicle.year),
        vehiclePlate:     data.vehicle.plate,
        vehicleColor:     data.vehicle.color,
        licensePhotoFront: data.licensePhotoFront,
        licensePhotoBack:  data.licensePhotoBack,
        dekraPhoto:        data.dekraPhoto,
      },
      requireToken()
    );
    const app = fromDTO(dto);
    setMyApplication(app);
    return app;
  };

  const resubmitApplication = async (applicationId: string, data: SubmitData): Promise<void> => {
    const dto = await applicationsApi.resubmit(
      applicationId,
      {
        cedula:           data.cedula,
        address:          data.address,
        vehicleBrand:     data.vehicle.brand,
        vehicleModel:     data.vehicle.model,
        vehicleYear:      Number(data.vehicle.year),
        vehiclePlate:     data.vehicle.plate,
        vehicleColor:     data.vehicle.color,
        licensePhotoFront: data.licensePhotoFront,
        licensePhotoBack:  data.licensePhotoBack,
        dekraPhoto:        data.dekraPhoto,
      },
      requireToken()
    );
    setMyApplication(fromDTO(dto));
  };

  // Admin-facing

  const loadApplications = useCallback(async (statusFilter?: string) => {
    setApplicationsLoading(true);
    try {
      const list = await applicationsApi.getAll(requireToken(), statusFilter);
      setApplications(list.map(fromDTO));
    } finally {
      setApplicationsLoading(false);
    }
  }, [token]);

  const optimisticUpdate = (id: string, patch: Partial<DriverApplication>) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const setUnderReview = async (id: string) => {
    await applicationsApi.setUnderReview(id, requireToken());
    optimisticUpdate(id, { status: 'under_review' });
  };

  const requestCorrection = async (id: string, issueIds: string[], notes: string) => {
    await applicationsApi.requestCorrection(id, { issueIds, notes }, requireToken());
    optimisticUpdate(id, {
      status: 'needs_correction',
      adminFeedback: { issueIds, notes, reviewedAt: new Date().toISOString() },
    });
  };

  const approveApplication = async (id: string) => {
    await applicationsApi.approve(id, requireToken());
    optimisticUpdate(id, { status: 'approved' });
  };

  const rejectApplication = async (id: string, issueIds: string[], notes: string) => {
    await applicationsApi.reject(id, { issueIds, notes }, requireToken());
    optimisticUpdate(id, {
      status: 'rejected',
      adminFeedback: { issueIds, notes, reviewedAt: new Date().toISOString() },
    });
  };

  const resolveReport = (reportId: string, action: UserReport['adminAction']) => {
    setReports((prev) => prev.map((r) =>
      r.id !== reportId ? r :
      { ...r, status: action?.type === 'dismissed' ? 'dismissed' : 'resolved', adminAction: action }
    ));
  };

  const suspendUserFromReport   = (id: string, days: number) =>
    resolveReport(id, { type: 'suspended', suspensionDays: days, resolvedAt: new Date().toISOString() });
  const deactivateUserFromReport = (id: string) =>
    resolveReport(id, { type: 'deactivated', resolvedAt: new Date().toISOString() });
  const dismissReport            = (id: string) =>
    resolveReport(id, { type: 'dismissed',   resolvedAt: new Date().toISOString() });

  return (
    <ApplicationsContext.Provider value={{
      myApplication,
      myApplicationLoading,
      loadMyApplication,
      submitApplication,
      resubmitApplication,
      applications,
      applicationsLoading,
      loadApplications,
      setUnderReview,
      requestCorrection,
      approveApplication,
      rejectApplication,
      reports,
      suspendUserFromReport,
      deactivateUserFromReport,
      dismissReport,
    }}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export const useApplications = () => useContext(ApplicationsContext);
