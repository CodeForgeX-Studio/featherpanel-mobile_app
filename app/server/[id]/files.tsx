import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Folder, File, Download, Trash2, Edit, Plus, Upload, RefreshCw } from 'lucide-react-native';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number | null;
  modified_at: string;
  path: string;
}

export default function ServerFilesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: files, isLoading, error, refetch } = useQuery<FileItem[]>({
    queryKey: ['server-files', id, currentPath],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const response = await apiClient.get(`/api/user/servers/${id}/files`, {
        params: { path: currentPath },
      });
      return response.data.contents || [];
    },
    enabled: !!apiClient && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: FileItem) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.delete(`/api/user/servers/${id}/delete-files`, {
        data: {
          files: [file.path],
          root: currentPath,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-files', id, currentPath] });
    },
  });

  const handleFilePress = (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      Alert.alert(
        file.name,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => downloadFile(file) },
          { text: 'Delete', onPress: () => confirmDelete(file), style: 'destructive' },
        ]
      );
    }
  };

  const downloadFile = (file: FileItem) => {
    Alert.alert('Download', `Download URL: ${apiClient?.defaults.baseURL}/api/user/servers/${id}/download-file?path=${encodeURIComponent(file.path)}`);
  };

  const confirmDelete = (file: FileItem) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${file.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteMutation.mutate(file), style: 'destructive' },
      ]
    );
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'));
  };

  const filteredFiles = files?.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatFileSize = (bytes: number | null): string => {
    if (bytes === null) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.pathContainer}>
          {currentPath !== '/' && (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.currentPath}>{currentPath}</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor={Colors.dark.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.refreshIconButton} onPress={() => refetch()}>
            <RefreshCw size={20} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load files</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item, index) => `${item.path}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => handleFilePress(item)}
              testID={`file-${item.name}`}
            >
              <View style={styles.fileIcon}>
                {item.type === 'directory' ? (
                  <Folder size={24} color={Colors.dark.primary} />
                ) : (
                  <File size={24} color={Colors.dark.textSecondary} />
                )}
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No files found</Text>
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
  pathContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.dark.bg,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  currentPath: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  refreshIconButton: {
    width: 44,
    height: 44,
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
  fileItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 16,
  },
});