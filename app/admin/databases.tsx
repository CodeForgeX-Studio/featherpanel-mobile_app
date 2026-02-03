import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Database, Search } from 'lucide-react-native';

interface DatabaseHost {
  id: number;
  name: string;
  database_host: string;
  database_port: number;
  database_type: string;
  node_id: number | null;
}

export default function AdminDatabasesScreen() {
  const router = useRouter();
  const { apiClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-databases', page, searchQuery, apiClient],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get('/api/admin/databases', {
        params: { page, limit: 20, search: searchQuery || undefined },
      });
      return res.data;
    },
    enabled: !!apiClient,
  });

  const databases: DatabaseHost[] = response?.databases || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Hosts</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search databases..."
            placeholderTextColor={Colors.dark.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
            <View style={styles.dbCard}>
              <View style={styles.dbHeader}>
                <View style={styles.dbIconContainer}>
                  <Database size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.dbInfo}>
                  <Text style={styles.dbName}>{item.name}</Text>
                  <Text style={styles.dbAddress}>{item.database_host}:{item.database_port}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.database_type.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Database size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No database hosts found</Text>
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
    padding: 16,
    backgroundColor: Colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: Colors.dark.text,
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
  dbCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dbHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  dbIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dbInfo: {
    flex: 1,
  },
  dbName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  dbAddress: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.dark.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.primary,
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