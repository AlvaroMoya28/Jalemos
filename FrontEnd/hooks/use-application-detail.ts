// Admin review actions for a single driver application: under-review, request
// correction, approve, reject and cooldown lift — each with its confirmation
// and navigation. Extracted from the application-detail screen.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useApplications } from '@/contexts/applications';

export function useApplicationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { applications, setUnderReview, requestCorrection, approveApplication, rejectApplication, liftCooldown } = useApplications();

  const app = useMemo(
    () => applications.find((a) => a.id === (Array.isArray(id) ? id[0] : id)),
    [applications, id],
  );

  const [selectedIssues, setSelectedIssues] = useState<string[]>(app?.adminFeedback?.issueIds ?? []);
  const [notes, setNotes] = useState(app?.adminFeedback?.notes ?? '');
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; label: string } | null>(null);

  const isEditable  = app?.status === 'pending' || app?.status === 'under_review' || app?.status === 'needs_correction';
  const hasCooldown = app?.status === 'rejected' && !!app.cooldownUntil;

  const toggleIssue = (issueId: string) =>
    setSelectedIssues((prev) => prev.includes(issueId) ? prev.filter((i) => i !== issueId) : [...prev, issueId]);

  const handleSetUnderReview = async () => {
    if (!app) return;
    try { await setUnderReview(app.id); } catch {}
  };

  const handleRequestCorrection = async () => {
    if (!app) return;
    if (selectedIssues.length === 0) {
      Alert.alert('Sin problemas seleccionados', 'Marcá al menos un problema para solicitar corrección.');
      return;
    }
    try {
      await requestCorrection(app.id, selectedIssues, notes);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo actualizar la solicitud.');
    }
  };

  const handleApprove = () => {
    if (!app) return;
    Alert.alert(
      'Aprobar solicitud',
      app.applicationType === 'vehicle'
        ? `¿Aprobar el vehículo ${app.vehicle.brand} ${app.vehicle.model} de ${app.applicantName}? Se agregará a su perfil de conductor.`
        : `¿Aprobar la solicitud de ${app.applicantName}? Se le habilitará el modo conductor.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar', style: 'default',
          onPress: async () => {
            try { await approveApplication(app.id); router.back(); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo aprobar.'); }
          },
        },
      ],
    );
  };

  const handleLiftCooldown = () => {
    if (!app) return;
    Alert.alert(
      'Levantar cooldown',
      `¿Permitir que ${app.applicantName} envíe una nueva solicitud de conductor sin esperar los 3 días?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Levantar', style: 'default',
          onPress: async () => {
            try { await liftCooldown(app.id); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo levantar el cooldown.'); }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    if (!app) return;
    Alert.alert(
      'Rechazar solicitud',
      '¿Rechazar permanentemente esta solicitud? El usuario no podrá activar el modo conductor.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar', style: 'destructive',
          onPress: async () => {
            try { await rejectApplication(app.id, selectedIssues, notes); router.back(); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo rechazar.'); }
          },
        },
      ],
    );
  };

  return {
    app, router,
    selectedIssues, toggleIssue, notes, setNotes,
    viewerPhoto, setViewerPhoto,
    isEditable, hasCooldown,
    handleSetUnderReview, handleRequestCorrection, handleApprove, handleLiftCooldown, handleReject,
  };
}
