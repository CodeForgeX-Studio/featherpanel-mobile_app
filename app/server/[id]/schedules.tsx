import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Calendar, Clock, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react-native';

interface Schedule {
  id: number;
  name: string;
  is_active: boolean;
  next_run_at: string;
  cron_minute: string;
  cron_hour: string;
  cron_day_of_month: string;
  cron_month: string;
  cron_day_of_week: string;
}

export default function ServerSchedulesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['server-schedules', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}/schedules`);
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const schedules: Schedule[] = response?.data || [];

  const formatCron = (schedule: Schedule) => {
    return `${schedule.cron_minute} ${schedule.cron_hour} ${schedule.cron_day_of_month} ${schedule.cron_month} ${schedule.cron_day_of_week}`;
  };

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>{schedules.length} Schedule{schedules.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={20} color={Colors.dark.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load schedules</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Calendar size={24} color={Colors.dark.primary} />
                <View style={styles.scheduleTitleContainer}>
                  <Text style={styles.scheduleName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cronExpression}>{formatCron(item)}</Text>
                </View>
                {item.is_active ? (
                  <ToggleRight size={28} color={Colors.dark.success} />
                ) : (
                  <ToggleLeft size={28} color={Colors.dark.textMuted} />
                )}
              </View>

              <View style={styles.scheduleInfo}>
                <View style={styles.infoRow}>
                  <Clock size={16} color={Colors.dark.textMuted} />
                  <Text style={styles.infoText}>Next run: {formatNextRun(item.next_run_at)}</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: item.is_active ? Colors.dark.success + '20' : Colors.dark.textMuted + '20' }]}>
                <Text style={[styles.statusText, { color: item.is_active ? Colors.dark.success : Colors.dark.textMuted }]}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No schedules yet</Text>
              <Text style={styles.emptySubtext}>Create automated tasks for your server</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: Colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerCount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.dark.bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scheduleHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  scheduleTitleContainer: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  cronExpression: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontFamily: 'monospace',
  },
  scheduleInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center' as const,
  },
});