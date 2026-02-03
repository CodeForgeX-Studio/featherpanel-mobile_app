import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Send, RefreshCw } from 'lucide-react-native';

export default function ServerConsoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['server-logs', id, apiClient],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const response = await apiClient.get(`/api/user/servers/${id}/logs`);
      return response.data;
    },
    enabled: !!apiClient && !!id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (logsData?.response) {
      setLogs(logsData.response);
    }
  }, [logsData]);

  const sendCommandMutation = useMutation({
    mutationFn: async (cmd: string) => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.post(`/api/user/servers/${id}/command`, { command: cmd });
    },
    onSuccess: () => {
      setCommand('');
      setTimeout(() => refetch(), 500);
    },
  });

  const handleSendCommand = () => {
    if (command.trim()) {
      sendCommandMutation.mutate(command.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={20} color={Colors.dark.primary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.consoleContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.logsScroll}
          contentContainerStyle={styles.logsContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading && logs.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Loading logs...</Text>
            </View>
          ) : logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs available</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logLine}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder="Enter command..."
          placeholderTextColor={Colors.dark.textMuted}
          onSubmitEditing={handleSendCommand}
          autoCapitalize="none"
          autoCorrect={false}
          testID="console-input"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!command.trim() || sendCommandMutation.isPending) && styles.sendButtonDisabled]}
          onPress={handleSendCommand}
          disabled={!command.trim() || sendCommandMutation.isPending}
        >
          {sendCommandMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
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
    justifyContent: 'flex-end' as const,
    padding: 16,
    paddingBottom: 8,
  },
  refreshButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  refreshText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
  consoleContainer: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  logsScroll: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    textAlign: 'center' as const,
    padding: 20,
  },
  logLine: {
    fontSize: 12,
    color: '#0F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    backgroundColor: Colors.dark.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendButton: {
    backgroundColor: Colors.dark.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.bg,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 16,
  },
});