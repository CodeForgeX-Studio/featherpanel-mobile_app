import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Database, Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react-native';

interface ServerDatabase {
  id: number;
  database: string;
  username: string;
  password: string;
  database_host: string;
  database_port: number;
  remote: string;
  max_connections: number;
}

export default function ServerDatabasesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const queryClient = useQueryClient();
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['server-databases', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}/databases`);
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (databaseId: number) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.delete(`/api/user/servers/${id}/databases/${databaseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-databases', id] });
    },
  });

  const handleDelete = (database: ServerDatabase) => {
    Alert.alert(
      'Delete Database',
      `Are you sure you want to delete ${database.database}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteMutation.mutate(database.id), 
          style: 'destructive' 
        },
      ]
    );
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const databases: ServerDatabase[] = response?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerCount}>{databases.length} Database{databases.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.headerLimit}>Limit: {response?.server?.database_limit || 0}</Text>
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
          <Text style={styles.errorText}>Failed to load databases</Text>
        </View>
      ) : (
        <FlatList
          data={databases}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.databaseCard}>
              <View style={styles.databaseHeader}>
                <Database size={24} color={Colors.dark.primary} />
                <Text style={styles.databaseName} numberOfLines={1}>{item.database}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={18} color={Colors.dark.danger} />
                </TouchableOpacity>
              </View>

              <View style={styles.databaseInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Host:</Text>
                  <Text style={styles.infoValue}>{item.database_host}:{item.database_port}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Username:</Text>
                  <Text style={styles.infoValue}>{item.username}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Password:</Text>
                  <View style={styles.passwordRow}>
                    <Text style={styles.infoValue}>
                      {showPasswords[item.id] ? item.password : '••••••••'}
                    </Text>
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => togglePasswordVisibility(item.id)}
                    >
                      {showPasswords[item.id] ? (
                        <EyeOff size={16} color={Colors.dark.textMuted} />
                      ) : (
                        <Eye size={16} color={Colors.dark.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Remote:</Text>
                  <Text style={styles.infoValue}>{item.remote}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Max Connections:</Text>
                  <Text style={styles.infoValue}>{item.max_connections}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Database size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No databases yet</Text>
              <Text style={styles.emptySubtext}>Create your first database to get started</Text>
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
  databaseCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  databaseHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 12,
  },
  databaseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  deleteButton: {
    padding: 8,
  },
  databaseInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.dark.text,
    fontFamily: 'monospace',
  },
  passwordRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  eyeButton: {
    padding: 4,
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