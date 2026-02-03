import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Users, Mail, RefreshCw } from 'lucide-react-native';

interface Subuser {
  id: number;
  username: string;
  email: string;
  permissions: string[];
}

export default function ServerSubusersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['server-subusers', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}/subusers`);
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const subusers: Subuser[] = response?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>{subusers.length} Subuser{subusers.length !== 1 ? 's' : ''}</Text>
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
          <Text style={styles.errorText}>Failed to load subusers</Text>
        </View>
      ) : (
        <FlatList
          data={subusers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.subuserCard}>
              <View style={styles.subuserHeader}>
                <Users size={24} color={Colors.dark.primary} />
                <View style={styles.subuserInfo}>
                  <Text style={styles.subuserName}>{item.username}</Text>
                  <View style={styles.emailRow}>
                    <Mail size={14} color={Colors.dark.textMuted} />
                    <Text style={styles.subuserEmail}>{item.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsLabel}>Permissions: {item.permissions.length}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No subusers yet</Text>
              <Text style={styles.emptySubtext}>Grant others access to this server</Text>
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
  subuserCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  subuserHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  subuserInfo: {
    flex: 1,
  },
  subuserName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  subuserEmail: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  permissionsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  permissionsLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
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