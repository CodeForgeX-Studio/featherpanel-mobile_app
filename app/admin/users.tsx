import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Users, Shield, Ban, Search } from 'lucide-react-native';

interface AdminUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  banned: boolean;
  role: {
    name: string;
    display_name: string;
    color: string;
  };
  created_at: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { apiClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, searchQuery, apiClient],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get('/api/admin/users', {
        params: { page, limit: 20, search: searchQuery || undefined },
      });
      return res.data;
    },
    enabled: !!apiClient,
  });

  const users: AdminUser[] = response?.users || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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
          <Text style={styles.errorText}>Failed to load users</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => router.push(`/admin/users/${item.uuid}` as any)}
            >
              <View style={styles.userHeader}>
                <View style={styles.userIconContainer}>
                  <Users size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userTitleRow}>
                    <Text style={styles.userName}>{item.username}</Text>
                    {item.banned && (
                      <View style={styles.bannedBadge}>
                        <Ban size={12} color={Colors.dark.danger} />
                        <Text style={styles.bannedText}>Banned</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: (item.role?.color || '#666') + '20' }]}>
                    <Shield size={12} color={item.role?.color || '#666'} />
                    <Text style={[styles.roleText, { color: item.role?.color || '#666' }]}>
                      {item.role?.display_name || item.role?.name}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
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
  userCard: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  userHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userInfo: {
    flex: 1,
  },
  userTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  bannedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.dark.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.danger,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
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