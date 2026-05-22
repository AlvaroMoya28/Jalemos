// Driver application pipeline context.
// Manages the full lifecycle: submit → review → approve/reject/needs_correction → resubmit.

import { createContext, ReactNode, useContext, useState } from 'react';
import {
  DriverApplication,
  ApplicationStatus,
  SEED_APPLICATIONS,
} from '@/constants/mock-applications';
import {
  UserReport,
  SEED_REPORTS,
} from '@/constants/mock-reports';

const appStore: DriverApplication[] = [...SEED_APPLICATIONS];
const reportStore: UserReport[] = [...SEED_REPORTS];

interface SubmitData {
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar: string;
  vehicle: DriverApplication['vehicle'];
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
}

interface ApplicationsContextType {
  // User-facing
  getMyApplication: (userId: string) => DriverApplication | undefined;
  submitApplication: (data: SubmitData) => DriverApplication;
  resubmitApplication: (applicationId: string, updates: Partial<Pick<DriverApplication, 'vehicle' | 'licensePhotoFront' | 'licensePhotoBack' | 'dekraPhoto'>>) => void;

  // Admin-facing — applications
  applications: DriverApplication[];
  setUnderReview: (id: string) => void;
  requestCorrection: (id: string, issueIds: string[], notes: string) => void;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string, issueIds: string[], notes: string) => void;

  // Admin-facing — reports
  reports: UserReport[];
  suspendUserFromReport: (reportId: string, days: number) => void;
  deactivateUserFromReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType>({
  getMyApplication: () => undefined,
  submitApplication: () => ({} as DriverApplication),
  resubmitApplication: () => {},
  applications: [],
  setUnderReview: () => {},
  requestCorrection: () => {},
  approveApplication: () => {},
  rejectApplication: () => {},
  reports: [],
  suspendUserFromReport: () => {},
  deactivateUserFromReport: () => {},
  dismissReport: () => {},
});

function now() {
  return new Date().toISOString();
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<DriverApplication[]>([...appStore]);
  const [reports, setReports] = useState<UserReport[]>([...reportStore]);

  const sync = (updated: DriverApplication[]) => {
    // Keep module store in sync so lookups outside React also see updates
    updated.forEach((a) => {
      const i = appStore.findIndex((x) => x.id === a.id);
      if (i !== -1) appStore[i] = a; else appStore.push(a);
    });
    setApplications([...appStore]);
  };

  const syncReports = (updated: UserReport[]) => {
    updated.forEach((r) => {
      const i = reportStore.findIndex((x) => x.id === r.id);
      if (i !== -1) reportStore[i] = r; else reportStore.push(r);
    });
    setReports([...reportStore]);
  };

  const getMyApplication = (userId: string) =>
    appStore.filter((a) => a.userId === userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  const submitApplication = (data: SubmitData): DriverApplication => {
    const app: DriverApplication = {
      id: `app-${Date.now()}`,
      userId: data.userId,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantAvatar: data.applicantAvatar,
      submittedAt: now(),
      updatedAt: now(),
      status: 'pending',
      attempts: 1,
      vehicle: data.vehicle,
      licensePhotoFront: data.licensePhotoFront,
      licensePhotoBack: data.licensePhotoBack,
      dekraPhoto: data.dekraPhoto,
    };
    sync([app]);
    return app;
  };

  const resubmitApplication = (id: string, updates: Partial<Pick<DriverApplication, 'vehicle' | 'licensePhotoFront' | 'licensePhotoBack' | 'dekraPhoto'>>) => {
    const app = appStore.find((a) => a.id === id);
    if (!app) return;
    const updated: DriverApplication = {
      ...app,
      ...updates,
      status: 'pending',
      adminFeedback: undefined,
      attempts: app.attempts + 1,
      updatedAt: now(),
    };
    sync([updated]);
  };

  const updateStatus = (id: string, status: ApplicationStatus, extra?: Partial<DriverApplication>) => {
    const app = appStore.find((a) => a.id === id);
    if (!app) return;
    sync([{ ...app, status, updatedAt: now(), ...extra }]);
  };

  const setUnderReview = (id: string) => updateStatus(id, 'under_review');

  const requestCorrection = (id: string, issueIds: string[], notes: string) =>
    updateStatus(id, 'needs_correction', {
      adminFeedback: { issueIds, notes, reviewedAt: now() },
    });

  const approveApplication = (id: string) => updateStatus(id, 'approved');

  const rejectApplication = (id: string, issueIds: string[], notes: string) =>
    updateStatus(id, 'rejected', {
      adminFeedback: { issueIds, notes, reviewedAt: now() },
    });

  const resolveReport = (reportId: string, action: UserReport['adminAction']) => {
    const report = reportStore.find((r) => r.id === reportId);
    if (!report) return;
    syncReports([{ ...report, status: action?.type === 'dismissed' ? 'dismissed' : 'resolved', adminAction: action }]);
  };

  const suspendUserFromReport = (reportId: string, days: number) =>
    resolveReport(reportId, { type: 'suspended', suspensionDays: days, resolvedAt: now() });

  const deactivateUserFromReport = (reportId: string) =>
    resolveReport(reportId, { type: 'deactivated', resolvedAt: now() });

  const dismissReport = (reportId: string) =>
    resolveReport(reportId, { type: 'dismissed', resolvedAt: now() });

  return (
    <ApplicationsContext.Provider value={{
      getMyApplication,
      submitApplication,
      resubmitApplication,
      applications,
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
