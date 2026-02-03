import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Wand2, Search, Layers } from 'lucide-react-native';

interface Spell {
  id: number;
  uuid: string;
  name: string;
  author: string;
  description: string | null;
  realm_id: number;
  realm: {
    name: string;
  };
}

export default function AdminSpellsScreen() {
  const router = useRouter();
  const { apiClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-spells', page, searchQuery, apiClient],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get('/api/admin/spells', {
        params: { page, limit: 20, search: searchQuery || undefined },
      });
      return res.data;
    },
    enabled: !!apiClient,
  });

  const spells: Spell[] = response?.spells || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Spells & Realms</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spells..."
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
          <Text style={styles.errorText}>Failed to load spells</Text>
        </View>
      ) : (
        <FlatList
          data={spells}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.spellCard}
              onPress={() => router.push(`/admin/spells/${item.id}` as any)}
            >
              <View style={styles.spellHeader}>
                <View style={styles.spellIconContainer}>
                  <Wand2 size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.spellInfo}>
                  <Text style={styles.spellName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.spellDescription} numberOfLines={2}>{item.description}</Text>
                  )}
                  <View style={styles.metaRow}>
                    <Layers size={14} color={Colors.dark.textMuted} />
                    <Text style={styles.metaText}>Realm: {item.realm?.name || 'Unknown'}</Text>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.metaText}>By {item.author}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Wand2 size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No spells found</Text>
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
  spellCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  spellHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  spellIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spellInfo: {
    flex: 1,
  },
  spellName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  spellDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
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