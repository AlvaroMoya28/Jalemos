// Admin screen — full driver application review.
// Applicant/vehicle/document cards, an issue checklist, and action buttons
// (request correction, approve, reject). Review logic lives in useApplicationDetail.

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import ApplicationActions from '@/components/admin/application-actions';
import ApplicationDocumentsCard from '@/components/admin/application-documents-card';
import ApplicationInfoCards from '@/components/admin/application-info-cards';
import ApplicationPhotoViewer from '@/components/admin/application-photo-viewer';
import ApplicationReviewForm from '@/components/admin/application-review-form';
import AnimatedPressable from '@/components/shared/animated-pressable';
import { Brand, Fonts } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { ApplicationStatus } from '@/contexts/applications';
import { useLoading } from '@/contexts/loading';
import { useApplicationDetail } from '@/hooks/use-application-detail';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../styles/app/application-detail.styles';

const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:          { label: 'Pendiente',          color: '#f7a900' },
  under_review:     { label: 'En revisión',         color: Brand.colors.blue.normal },
  needs_correction: { label: 'Requiere corrección', color: '#ff7c2a' },
  approved:         { label: 'Aprobada',            color: Brand.colors.green.normal },
  rejected:         { label: 'Rechazada',           color: Brand.colors.alerts.error },
};

export default function ApplicationDetailScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { showLoader, hideLoader } = useLoading();
  const {
    app, router, selectedIssues, toggleIssue, notes, setNotes, viewerPhoto, setViewerPhoto,
    isEditable, hasCooldown,
    handleSetUnderReview, handleRequestCorrection, handleApprove, handleLiftCooldown, handleReject,
  } = useApplicationDetail();

  const goBack = () => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); };

  if (!app) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontFamily: Fonts.heading, fontSize: 14 }}>Solicitud no encontrada</Text>
      </View>
    );
  }

  const statusCfg = STATUS_LABELS[app.status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{app.applicantName}</Text>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
            <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: statusCfg.color }}>{statusCfg.label}</Text>
          </View>
          {app.applicationType === 'vehicle' && (
            <View style={[styles.statusBadge, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
              <Text style={{ fontSize: 10, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>Nuevo vehículo</Text>
            </View>
          )}
          {app.isRenewal && (
            <View style={[styles.statusBadge, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
              <Text style={{ fontSize: 10, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>Renovación</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Set under review if still pending */}
        {app.status === 'pending' && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <AnimatedPressable pressedScale={0.99} onPress={handleSetUnderReview}>
              <View style={[styles.card, { backgroundColor: Brand.colors.blue.normal + '18', borderColor: Brand.colors.blue.normal + '44', borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="eye-outline" size={20} color={Brand.colors.blue.normal} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>
                      {'Marcar como "En revisión"'}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, marginTop: 2 }}>
                      Indicarle al solicitante que ya se está revisando su caso
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Brand.colors.blue.normal} />
                </View>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Previous admin feedback if resubmission */}
        {app.attempts > 1 && app.adminFeedback && (
          <Animated.View entering={FadeInDown.duration(200).delay(40)}>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Problemas del intento anterior (#{app.attempts - 1})</Text>
              {app.adminFeedback.issueIds.map((id) => {
                const issue = REVIEW_ISSUES.find((i) => i.id === id);
                return issue ? <Text key={id} style={styles.feedbackText}>• {issue.label}</Text> : null;
              })}
              {app.adminFeedback.notes ? (
                <Text style={[styles.feedbackText, { fontStyle: 'italic', marginTop: 4 }]}>
                  {'"'}{app.adminFeedback.notes}{'"'}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}

        <ApplicationInfoCards app={app} styles={styles} />

        {app.applicationType !== 'vehicle' && (
          <ApplicationDocumentsCard app={app} styles={styles} colors={colors} onView={setViewerPhoto} />
        )}

        {isEditable && (
          <ApplicationReviewForm
            selectedIssues={selectedIssues}
            onToggleIssue={toggleIssue}
            notes={notes}
            onChangeNotes={setNotes}
            styles={styles}
            colors={colors}
          />
        )}

        <ApplicationActions
          isEditable={isEditable}
          hasCooldown={hasCooldown}
          onApprove={handleApprove}
          onRequestCorrection={handleRequestCorrection}
          onReject={handleReject}
          onLiftCooldown={handleLiftCooldown}
          onBack={goBack}
          styles={styles}
        />
      </ScrollView>

      {viewerPhoto && (
        <ApplicationPhotoViewer url={viewerPhoto.url} label={viewerPhoto.label} onClose={() => setViewerPhoto(null)} />
      )}
    </View>
  );
}
