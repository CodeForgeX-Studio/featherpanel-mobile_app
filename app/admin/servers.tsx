import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Server, MapPin, Search } from 'lucide-react-native';

interface AdminServer {
  id: number;
  uuid: string;
  uuidShort: string;
  name: string;
  description: string;
  status: string;
  node: {
    name: string;
  };
  owner: {
    username: string;
  };
}

export default function AdminServersScreen() {
  const router = useRouter();
  const { apiClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-servers', page, searchQuery],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get('/api/admin/servers', {
        params: { page, limit: 20, search: searchQuery || undefined },
      });
      return res.data;
    },
    enabled: !!apiClient,
  });

  const servers: AdminServer[] = response?.servers || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return Colors.dark.success;
      case 'offline': case 'stopped': return Colors.dark.textMuted;
      case 'starting': case 'stopping': return Colors.dark.warning;
      default: return Colors.dark.danger;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Servers</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search servers..."
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
          <Text style={styles.errorText}>Failed to load servers</Text>
        </View>
      ) : (
        <FlatList
          data={servers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.serverCard}
              onPress={() => router.push(`/admin/servers/${item.id}` as any)}
            >
              <View style={styles.serverHeader}>
                <View style={styles.serverIconContainer}>
                  <Server size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.serverInfo}>
                  <View style={styles.serverTitleRow}>
                    <Text style={styles.serverName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  </View>
                  {item.description && (
                    <Text style={styles.serverDescription} numberOfLines={1}>{item.description}</Text>
                  )}
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={Colors.dark.textMuted} />
                    <Text style={styles.metaText}>{item.node?.name || 'Unknown'}</Text>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.metaText}>Owner: {item.owner?.username || 'Unknown'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Server size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No servers found</Text>
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
    gap: 12,
  },
  serverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  serverInfo: {
    flex: 1,
  },
  serverTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  serverName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  metaSeparator: {
    fontSize: 12,
    color: Colors.dark.textMuted,
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