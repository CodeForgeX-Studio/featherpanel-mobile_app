import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { MapPin, Search, Globe } from 'lucide-react-native';

interface Node {
  id: number;
  uuid: string;
  name: string;
  fqdn: string;
  public_ip_v4: string | null;
  location: {
    name: string;
    flag_code: string | null;
  };
  created_at: string;
}

export default function AdminNodesScreen() {
  const router = useRouter();
  const { apiClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-nodes', page, searchQuery, apiClient],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get('/api/admin/nodes', {
        params: { page, limit: 20, search: searchQuery || undefined },
      });
      return res.data;
    },
    enabled: !!apiClient,
  });

  const nodes: Node[] = response?.nodes || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nodes</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nodes..."
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
          <Text style={styles.errorText}>Failed to load nodes</Text>
        </View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.nodeCard}
              onPress={() => router.push(`/admin/nodes/${item.id}` as any)}
            >
              <View style={styles.nodeHeader}>
                <View style={styles.nodeIconContainer}>
                  <MapPin size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.nodeInfo}>
                  <Text style={styles.nodeName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Globe size={14} color={Colors.dark.textMuted} />
                    <Text style={styles.metaText}>{item.fqdn}</Text>
                  </View>
                  {item.public_ip_v4 && (
                    <Text style={styles.ipText}>IP: {item.public_ip_v4}</Text>
                  )}
                  <View style={styles.locationBadge}>
                    <MapPin size={12} color={Colors.dark.textSecondary} />
                    <Text style={styles.locationText}>{item.location?.name || 'Unknown'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MapPin size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No nodes found</Text>
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
  nodeCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  nodeHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  nodeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  ipText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  locationBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.dark.bg,
  },
  locationText: {
    fontSize: 12,
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
});