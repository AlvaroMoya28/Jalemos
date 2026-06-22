// Data + actions for the reports moderation panel: API-backed trip reports,
// low ratings, and the driver action sheet (suspend / revoke role / deactivate).
// Extracted from the admin-reports screen so the moderation flow is isolated
// and testable; the in-memory user reports stay on the screen via useApplications.

import { useCallback, useEffect, useMemo, useState } from 'react';

import { RatingDTO, TripReportDto, ratingsApi, reportsApi, usersApi } from '@/services/api';

import { TripView } from '@/components/admin/report-config';

export type ViewMode = 'trip' | 'ratings';

export interface DriverActionTarget {
  driverId: string;
  driverName: string;
  reportId?: string;
}

export type DriverAction = 'suspend' | 'revoke_role' | 'deactivate';

export function useAdminReports(token: string | null) {
  const [viewMode, setViewMode] = useState<ViewMode>('trip');

  // Trip reports
  const [tripReports, setTripReports] = useState<TripReportDto[]>([]);
  const [tripFilter, setTripFilter] = useState<TripView>('all');
  const [tripLoading, setTripLoading] = useState(false);
  const [selectedTripReport, setSelectedTripReport] = useState<TripReportDto | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Low ratings
  const [lowRatings, setLowRatings] = useState<RatingDTO[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState<RatingDTO | null>(null);

  // Driver action sheet (shared between trip report + low rating)
  const [driverActionTarget, setDriverActionTarget] = useState<DriverActionTarget | null>(null);
  const [driverActing, setDriverActing] = useState(false);

  const fetchTripReports = useCallback(async () => {
    if (!token) return;
    setTripLoading(true);
    try {
      const data = await reportsApi.getAll(token, undefined, 1, 100);
      setTripReports(data);
    } catch { /* silent */ }
    finally { setTripLoading(false); }
  }, [token]);

  const fetchLowRatings = useCallback(async () => {
    if (!token) return;
    setRatingsLoading(true);
    try {
      const data = await ratingsApi.getLow(token, 2);
      setLowRatings(data);
    } catch { /* silent */ }
    finally { setRatingsLoading(false); }
  }, [token]);

  useEffect(() => {
    if (viewMode === 'trip')    fetchTripReports();
    if (viewMode === 'ratings') fetchLowRatings();
  }, [viewMode, fetchTripReports, fetchLowRatings]);

  const handleUpdateTripStatus = useCallback(async (status: string, adminNotes?: string) => {
    if (!selectedTripReport || !token) return;
    setUpdatingStatus(true);
    try {
      const updated = await reportsApi.updateStatus(selectedTripReport.id, status, adminNotes ?? null, token);
      setTripReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedTripReport(null);
    } catch { /* keep sheet open so admin can retry */ }
    finally { setUpdatingStatus(false); }
  }, [selectedTripReport, token]);

  // Execute a real driver action then mark the related report as action_taken
  const handleDriverAction = useCallback(async (action: DriverAction, suspendDays?: number) => {
    if (!driverActionTarget || !token) return;
    setDriverActing(true);
    try {
      if (action === 'suspend' && suspendDays !== undefined) {
        await usersApi.ban(driverActionTarget.driverId, suspendDays, token);
      } else if (action === 'revoke_role') {
        await usersApi.changeRole(driverActionTarget.driverId, 'passenger', token);
      } else if (action === 'deactivate') {
        await usersApi.deactivate(driverActionTarget.driverId, token);
      }
      // Update the linked trip report to action_taken
      if (driverActionTarget.reportId) {
        const notes =
          action === 'suspend'     ? `Conductor suspendido ${suspendDays} días` :
          action === 'revoke_role' ? 'Rol de conductor revocado' :
                                     'Cuenta desactivada';
        try {
          const updated = await reportsApi.updateStatus(driverActionTarget.reportId, 'action_taken', notes, token);
          setTripReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        } catch { /* best-effort */ }
      }
      setDriverActionTarget(null);
      setSelectedTripReport(null);
      setSelectedRating(null);
    } catch { /* keep sheet open */ }
    finally { setDriverActing(false); }
  }, [driverActionTarget, token]);

  const filteredTripReports = useMemo(
    () => tripFilter === 'all' ? tripReports : tripReports.filter(r => r.status === tripFilter),
    [tripFilter, tripReports],
  );

  return {
    viewMode, setViewMode,
    tripReports, tripFilter, setTripFilter, tripLoading, filteredTripReports,
    selectedTripReport, setSelectedTripReport, updatingStatus, handleUpdateTripStatus,
    lowRatings, ratingsLoading, selectedRating, setSelectedRating,
    driverActionTarget, setDriverActionTarget, driverActing, handleDriverAction,
  };
}
