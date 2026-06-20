// Card for an in-memory user report, with the resolution label shown once
// the report has been actioned.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { REPORT_REASON_LABELS, UserReport } from '@/constants/mock-reports';
import { useAppTheme } from '@/hooks/use-app-theme';
import { resolvedLabelInline, metaDotInline, makeStyles } from '@/styles/tabs/admin-reports.styles';
import { formatShortDate } from '@/utils/format';

import { REASON_COLORS } from './report-config';

function ResolvedLabel({ report }: { report: UserReport }) {
  if (!report.adminAction) return null;
  const config = {
    suspended:   { label: `Suspendido ${report.adminAction.suspensionDays}d`, color: '#ff7c2a' },
    deactivated: { label: 'Cuenta desactivada', color: Brand.colors.alerts.error },
    dismissed:   { label: 'Desestimado', color: Brand.colors.black.b6 },
  }[report.adminAction.type];
  return (
    <View style={[resolvedLabelInline.container, {
      backgroundColor: config.color + '22',
      borderColor: config.color + '55',
    }]}>
      <Text style={[resolvedLabelInline.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function UserReportCard({ report, onPress, styles, colors }: {
  report: UserReport;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const reasonColor = REASON_COLORS[report.reason] ?? colors.textMuted;
  const isPending = report.status === 'pending';

  return (
    <AnimatedPressable pressedScale={0.99} onPress={() => isPending ? onPress() : undefined}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{report.reportedUserAvatar}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.reportedName}>{report.reportedUserName}</Text>
            <Text style={styles.reportedRole}>
              {report.reportedUserRole === 'passenger+driver' ? 'Conductor / Pasajero' : 'Pasajero'}
            </Text>
          </View>
          <View style={[styles.reasonBadge, { backgroundColor: reasonColor + '22', borderColor: reasonColor + '55' }]}>
            <Text style={[styles.reasonText, { color: reasonColor }]}>
              {REPORT_REASON_LABELS[report.reason]}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.detailsText} numberOfLines={2}>{report.details}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>Reportado por {report.reportedByName}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
          <Text style={styles.metaText}>{formatShortDate(report.createdAt)}</Text>
          {!isPending && <ResolvedLabel report={report} />}
          {isPending && (
            <View style={metaDotInline.pendingActionsContainer}>
              <View style={metaDotInline.pendingActionsRow}>
                <Text style={[styles.metaText, { color: Brand.colors.green.normal }]}>Ver acciones</Text>
                <Ionicons name="chevron-forward" size={12} color={Brand.colors.green.normal} />
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
