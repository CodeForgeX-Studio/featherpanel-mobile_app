import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/contexts/AppContext';
import { createApiClient, handleApiError } from '@/lib/api';
import type { Server, ServersEnvelope } from '@/types/api';
import Colors from '@/constants/colors';
import { Server as ServerIcon, AlertCircle, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServersScreen() {
  const { instanceUrl, authToken, clearAuth } = useApp();
  const router = useRouter();

  const {
    data: servers,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Server[], Error>({
    queryKey: ['servers', instanceUrl, authToken],
    queryFn: async () => {
      if (!instanceUrl || !authToken) {
        throw new Error('Not authenticated');
      }

      try {
        const api = createApiClient(instanceUrl, authToken);

        const response = await api.get<ServersEnvelope>(
          '/api/user/servers?view_all=true&page=1&per_page=10'
        );

        if (!response.data.success || response.data.error) {
          const code = response.data.error_code;
          const message =
            response.data.error_message || response.data.message || 'Failed to fetch servers';

          if (code === 'INVALID_ACCOUNT_TOKEN') {
            await clearAuth().catch(() => undefined);
            router.replace('/');
          }

          throw new Error(message);
        }

        if (!response.data.data) {
          return [];
        }

        return response.data.data.servers;
      } catch (err: any) {
        const msg = handleApiError(err);
        throw new Error(msg);
      }
    },
    enabled: !!instanceUrl && !!authToken,
  });

  const handleManualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return Colors.dark.success;
      case 'offline':
      case 'stopped':
        return Colors.dark.danger;
      case 'starting':
      case 'stopping':
      case 'installing':
        return Colors.dark.warning;
      default:
        return Colors.dark.textMuted;
    }
  };

  const renderServer = ({ item }: { item: Server }) => (
    <TouchableOpacity
      style={styles.serverCard}
      onPress={() => {
        router.push(`/server/${item.uuidShort}`);
      }}
      testID={`server-${item.uuidShort}`}
    >
      <View style={styles.serverHeader}>
        <View style={styles.serverIcon}>
          <ServerIcon size={24} color={Colors.dark.primary} />
        </View>
        <View style={styles.serverInfo}>
          <Text style={styles.serverName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.serverDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.serverDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>RAM</Text>
          <Text style={styles.detailValue}>{item.memory} MB</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Disk</Text>
          <Text style={styles.detailValue}>{item.disk} MB</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CPU</Text>
          <Text style={styles.detailValue}>{item.cpu}%</Text>
        </View>
      </View>

      {item.allocation && (
        <View style={styles.allocationInfo}>
          <Text style={styles.allocationText}>
            {item.allocation.ip}:{item.allocation.port}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color={Colors.dark.danger} />
        <Text style={styles.errorText}>{error.message || 'Failed to load servers'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servers</Text>
        <TouchableOpacity
          style={[styles.refreshButton, isRefetching && styles.refreshButtonLoading]}
          onPress={handleManualRefresh}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={Colors.dark.text} />
          ) : (
            <RefreshCw size={20} color={Colors.dark.text} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={servers || []}
        renderItem={renderServer}
        keyExtractor={(item) => item.uuid}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ServerIcon size={64} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>No servers found</Text>
            <Text style={styles.emptySubtext}>
              Servers you own or have access to will appear here
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.primary}
          />
        }
      />
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
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.bgSecondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  refreshButtonLoading: {
    opacity: 0.7,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bg,
    padding: 24,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  serverCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  serverHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.dark.bgTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  serverDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  serverDetails: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  allocationInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  allocationText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontFamily: 'monospace' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 8,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: Colors.dark.danger,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});