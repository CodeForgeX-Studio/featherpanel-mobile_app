import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Terminal,
  FolderOpen,
  Database,
  Archive,
  Network,
  Calendar,
  Users,
  Settings,
  Play,
  Square,
  RotateCw,
  Power,
  Cpu,
  HardDrive,
  MemoryStick,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { createApiClient } from '@/lib/api';
import type { ApiEnvelope, Server } from '@/types/api';

interface NavigationItem {
  title: string;
  icon: any;
  route: string;
  description: string;
}

export default function ServerOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { instanceUrl, authToken } = useApp();

  const apiClient =
    instanceUrl && authToken ? createApiClient(instanceUrl, authToken) : null;

  const {
    data: serverEnvelope,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['server', id, instanceUrl, authToken],
    queryFn: async () => {
      if (!apiClient || !id) throw new Error('API client not initialized');
      const response = await apiClient.get<ApiEnvelope<Server>>(
        `/api/user/servers/${id}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error_message || 'Failed to fetch server');
      }
      return response.data;
    },
    enabled: !!apiClient && !!id,
  });

  const server = serverEnvelope?.data || null;

  const powerMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'restart' | 'kill') => {
      if (!apiClient || !id) throw new Error('API client not initialized');
      await apiClient.post(`/api/user/servers/${id}/power/${action}`);
    },
  });

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
    if (powerMutation.isPending || !refetch) return;
    
    powerMutation.mutate(action, {
      onSettled: async () => {
        await refetch();
      }
    });
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (refetch) {
        await refetch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  const navigationItems: NavigationItem[] = [
    {
      title: 'Console',
      icon: Terminal,
      route: `/server/${id}/console`,
      description: 'Server console and full logs',
    },
    {
      title: 'Files',
      icon: FolderOpen,
      route: `/server/${id}/files`,
      description: 'File manager',
    },
    {
      title: 'Databases',
      icon: Database,
      route: `/server/${id}/databases`,
      description: 'Database management',
    },
    {
      title: 'Backups',
      icon: Archive,
      route: `/server/${id}/backups`,
      description: 'Backup management',
    },
    {
      title: 'Network',
      icon: Network,
      route: `/server/${id}/allocations`,
      description: 'Ports and allocations',
    },
    {
      title: 'Subusers',
      icon: Users,
      route: `/server/${id}/subusers`,
      description: 'Access management',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return Colors.dark.success;
      case 'offline':
      case 'stopped':
        return Colors.dark.textMuted;
      case 'starting':
      case 'stopping':
      case 'installing':
        return Colors.dark.warning;
      default:
        return Colors.dark.danger;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (error || !server) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Failed to load server: {(error as any)?.message || 'Unknown error'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.serverHeader}>
          <View style={styles.serverTitleRow}>
            <Text style={styles.serverName}>{server.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(server.status) + '20' },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: getStatusColor(server.status) }]}
              />
              <Text
                style={[styles.statusText, { color: getStatusColor(server.status) }]}
              >
                {server.status}
              </Text>
            </View>
          </View>

          {server.description && (
            <Text style={styles.serverDescription}>{server.description}</Text>
          )}

          <View style={styles.serverInfo}>
            <Text style={styles.serverInfoText}>
              <Text style={styles.serverInfoLabel}>Node: </Text>
              {server.node?.name}
            </Text>
            <Text style={styles.serverInfoText}>
              <Text style={styles.serverInfoLabel}>Address: </Text>
              {server.allocation?.ip}:{server.allocation?.port}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Power Controls</Text>
          <View style={styles.powerControls}>
            <TouchableOpacity
              style={[styles.powerButton, styles.powerButtonStart]}
              onPress={() => handlePowerAction('start')}
              disabled={powerMutation.isPending}
            >
              <Play size={20} color="#fff" />
              <Text style={styles.powerButtonText}>Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerButton, styles.powerButtonStop]}
              onPress={() => handlePowerAction('stop')}
              disabled={powerMutation.isPending}
            >
              <Square size={20} color="#fff" />
              <Text style={styles.powerButtonText}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerButton, styles.powerButtonRestart]}
              onPress={() => handlePowerAction('restart')}
              disabled={powerMutation.isPending}
            >
              <RotateCw size={20} color="#fff" />
              <Text style={styles.powerButtonText}>Restart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerButton, styles.powerButtonKill]}
              onPress={() => handlePowerAction('kill')}
              disabled={powerMutation.isPending}
            >
              <Power size={20} color="#fff" />
              <Text style={styles.powerButtonText}>Kill</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourceGrid}>
            <View style={styles.resourceCard}>
              <Cpu size={24} color={Colors.dark.primary} />
              <Text style={styles.resourceValue}>{server.cpu}%</Text>
              <Text style={styles.resourceLabel}>CPU Limit</Text>
            </View>
            <View style={styles.resourceCard}>
              <MemoryStick size={24} color={Colors.dark.primary} />
              <Text style={styles.resourceValue}>
                {Math.round(server.memory / 1024)} GB
              </Text>
              <Text style={styles.resourceLabel}>Memory</Text>
            </View>
            <View style={styles.resourceCard}>
              <HardDrive size={24} color={Colors.dark.primary} />
              <Text style={styles.resourceValue}>
                {Math.round(server.disk / 1024)} GB
              </Text>
              <Text style={styles.resourceLabel}>Disk</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.navGrid}>
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.navCard}
                  onPress={() => router.push(item.route as any)}
                  testID={`nav-${item.title.toLowerCase()}`}
                >
                  <Icon size={24} color={Colors.dark.primary} />
                  <Text style={styles.navTitle}>{item.title}</Text>
                  <Text style={styles.navDescription}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.bg,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 16,
    textAlign: 'center' as const,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  serverHeader: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  serverTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  serverName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  serverDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  serverInfo: {
    gap: 6,
  },
  serverInfoText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  serverInfoLabel: {
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  powerControls: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  powerButton: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  powerButtonStart: {
    backgroundColor: Colors.dark.success,
  },
  powerButtonStop: {
    backgroundColor: Colors.dark.danger,
  },
  powerButtonRestart: {
    backgroundColor: Colors.dark.warning,
  },
  powerButtonKill: {
    backgroundColor: '#EF4444',
  },
  powerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  resourceGrid: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resourceValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 8,
  },
  resourceLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  navGrid: {
    gap: 12,
  },
  navCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 8,
    marginBottom: 4,
  },
  navDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
});