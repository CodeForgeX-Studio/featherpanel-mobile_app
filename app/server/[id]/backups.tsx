import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Archive, Download, Trash2, Lock, Unlock, RotateCw, RefreshCw } from 'lucide-react-native';

interface Backup {
  id: number;
  uuid: string;
  name: string;
  is_successful: number;
  is_locked: number;
  created_at: string;
  disk: string;
}

export default function ServerBackupsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const queryClient = useQueryClient();

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['server-backups', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}/backups`);
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (backupUuid: string) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.delete(`/api/user/servers/${id}/backups/${backupUuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', id] });
    },
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ backupUuid, isLocked }: { backupUuid: string; isLocked: boolean }) => {
      if (!apiClient) throw new Error('API client not initialized');
      const endpoint = isLocked ? 'unlock' : 'lock';
      await apiClient.post(`/api/user/servers/${id}/backups/${backupUuid}/${endpoint}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', id] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (backupUuid: string) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.post(`/api/user/servers/${id}/backups/${backupUuid}/restore`, {
        truncate_directory: false,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Backup restoration started');
    },
  });

  const handleDelete = (backup: Backup) => {
    if (backup.is_locked) {
      Alert.alert('Locked', 'This backup is locked. Unlock it first to delete.');
      return;
    }

    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete ${backup.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteMutation.mutate(backup.uuid), 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleRestore = (backup: Backup) => {
    Alert.alert(
      'Restore Backup',
      `Restore ${backup.name}? Your server will be stopped during restoration.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: () => restoreMutation.mutate(backup.uuid),
        },
      ]
    );
  };

  const backups: Backup[] = response?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerCount}>{backups.length} Backup{backups.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.headerLimit}>Limit: {response?.pagination?.total || 0}</Text>
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
          <Text style={styles.errorText}>Failed to load backups</Text>
        </View>
      ) : (
        <FlatList
          data={backups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.backupCard}>
              <View style={styles.backupHeader}>
                <Archive size={24} color={item.is_successful ? Colors.dark.primary : Colors.dark.danger} />
                <View style={styles.backupTitleContainer}>
                  <Text style={styles.backupName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.backupDate}>{formatDate(item.created_at)}</Text>
                </View>
                {item.is_locked === 1 && (
                  <Lock size={18} color={Colors.dark.warning} />
                )}
              </View>

              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.restoreButton]}
                  onPress={() => handleRestore(item)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCw size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Restore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.lockButton]}
                  onPress={() => toggleLockMutation.mutate({ backupUuid: item.uuid, isLocked: item.is_locked === 1 })}
                  disabled={toggleLockMutation.isPending}
                >
                  {item.is_locked === 1 ? (
                    <><Unlock size={16} color="#fff" /><Text style={styles.actionButtonText}>Unlock</Text></>
                  ) : (
                    <><Lock size={16} color="#fff" /><Text style={styles.actionButtonText}>Lock</Text></>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item)}
                  disabled={deleteMutation.isPending || item.is_locked === 1}
                >
                  <Trash2 size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Archive size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No backups yet</Text>
              <Text style={styles.emptySubtext}>Create your first backup to protect your data</Text>
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
  backupCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 12,
  },
  backupTitleContainer: {
    flex: 1,
  },
  backupName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  backupDate: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  backupActions: {
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
  restoreButton: {
    backgroundColor: Colors.dark.primary,
  },
  lockButton: {
    backgroundColor: Colors.dark.warning,
  },
  deleteButton: {
    backgroundColor: Colors.dark.danger,
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
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center' as const,
  },
});