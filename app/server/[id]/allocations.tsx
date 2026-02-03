import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Network, Trash2, Star, RefreshCw } from 'lucide-react-native';

interface Allocation {
  id: number;
  ip: string;
  port: number;
  is_primary: boolean;
}

export default function ServerAllocationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const queryClient = useQueryClient();

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['server-allocations', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}/allocations`);
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (allocationId: number) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.delete(`/api/user/servers/${id}/allocations/${allocationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-allocations', id] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (allocationId: number) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.post(`/api/user/servers/${id}/allocations/${allocationId}/primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-allocations', id] });
    },
  });

  const handleDelete = (allocation: Allocation) => {
    if (allocation.is_primary) {
      Alert.alert('Cannot Delete', 'You cannot delete the primary allocation.');
      return;
    }

    Alert.alert(
      'Delete Allocation',
      `Remove ${allocation.ip}:${allocation.port}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteMutation.mutate(allocation.id), 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleSetPrimary = (allocation: Allocation) => {
    Alert.alert(
      'Set Primary',
      `Set ${allocation.ip}:${allocation.port} as primary allocation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => setPrimaryMutation.mutate(allocation.id) },
      ]
    );
  };

  const allocations: Allocation[] = response?.allocations || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerCount}>{allocations.length} Allocation{allocations.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.headerLimit}>Limit: {response?.server?.allocation_limit || 'Unlimited'}</Text>
        </View>
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
          <Text style={styles.errorText}>Failed to load allocations</Text>
        </View>
      ) : (
        <FlatList
          data={allocations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.allocationCard}>
              <View style={styles.allocationHeader}>
                <Network size={24} color={Colors.dark.primary} />
                <View style={styles.allocationInfo}>
                  <Text style={styles.allocationAddress}>{item.ip}:{item.port}</Text>
                  {item.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Star size={12} color={Colors.dark.warning} fill={Colors.dark.warning} />
                      <Text style={styles.primaryText}>Primary</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.allocationActions}>
                {!item.is_primary && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleSetPrimary(item)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Set Primary</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton, item.is_primary && styles.disabledButton]}
                  onPress={() => handleDelete(item)}
                  disabled={deleteMutation.isPending || item.is_primary}
                >
                  <Trash2 size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Network size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No allocations</Text>
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
  headerInfo: {
    flex: 1,
  },
  headerCount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  headerLimit: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
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
  allocationCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  allocationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  allocationInfo: {
    flex: 1,
  },
  allocationAddress: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  primaryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.dark.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.warning,
  },
  allocationActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: Colors.dark.warning,
  },
  deleteButton: {
    backgroundColor: Colors.dark.danger,
  },
  disabledButton: {
    opacity: 0.4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
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
});