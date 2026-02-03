import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApp } from '@/contexts/AppContext';
import { createApiClient } from '@/lib/api';
import Colors from '@/constants/colors';
import { Play, Square, RotateCw, Power, Terminal, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Server } from '@/types/api';

export default function ServerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { instanceUrl, authToken } = useApp();
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: server, isLoading, error, refetch } = useQuery({
    queryKey: ['server', id, instanceUrl, authToken],
    queryFn: async () => {
      if (!instanceUrl || !authToken || !id) throw new Error('Missing data');
      
      const api = createApiClient(instanceUrl, authToken);
      const response = await api.get<Server>(`/api/user/servers/${id}`);
      return response.data;
    },
    enabled: !!instanceUrl && !!authToken && !!id,
    refetchInterval: 5000,
  });

  const { data: serverLogs } = useQuery({
    queryKey: ['serverLogs', id, instanceUrl, authToken],
    queryFn: async () => {
      if (!instanceUrl || !authToken || !id) throw new Error('Missing data');
      
      const api = createApiClient(instanceUrl, authToken);
      const response = await api.get<{ response: string[] }>(`/api/user/servers/${id}/logs`);
      return response.data.response;
    },
    enabled: !!instanceUrl && !!authToken && !!id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (serverLogs) {
      setLogs(serverLogs);
    }
  }, [serverLogs]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const powerMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'restart' | 'kill') => {
      if (!instanceUrl || !authToken || !id) throw new Error('Missing data');
      
      const api = createApiClient(instanceUrl, authToken);
      await api.post(`/api/user/servers/${id}/power/${action}`);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Power action failed');
    },
  });

  const commandMutation = useMutation({
    mutationFn: async (cmd: string) => {
      if (!instanceUrl || !authToken || !id) throw new Error('Missing data');
      
      const api = createApiClient(instanceUrl, authToken);
      await api.post(`/api/user/servers/${id}/command`, { command: cmd });
    },
    onSuccess: () => {
      setCommand('');
      setLogs(prev => [...prev, `> ${command}`]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Command failed');
    },
  });

  const handleSendCommand = () => {
    if (!command.trim()) return;
    commandMutation.mutate(command);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (error || !server) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load server</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return Colors.dark.success;
      case 'offline':
      case 'stopped':
        return Colors.dark.danger;
      case 'starting':
      case 'stopping':
        return Colors.dark.warning;
      default:
        return Colors.dark.textMuted;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: server.name }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.serverInfo}>
            <View style={styles.statusRow}>
              <Text style={styles.serverName}>{server.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(server.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(server.status) }]}>
                  {server.status}
                </Text>
              </View>
            </View>

            <View style={styles.resourcesRow}>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceLabel}>RAM</Text>
                <Text style={styles.resourceValue}>{server.memory} MB</Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceLabel}>Disk</Text>
                <Text style={styles.resourceValue}>{server.disk} MB</Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceLabel}>CPU</Text>
                <Text style={styles.resourceValue}>{server.cpu}%</Text>
              </View>
            </View>

            <View style={styles.powerControls}>
              <TouchableOpacity
                style={[styles.powerButton, styles.startButton]}
                onPress={() => powerMutation.mutate('start')}
                disabled={powerMutation.isPending}
              >
                <Play size={20} color={Colors.dark.text} fill={Colors.dark.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.powerButton, styles.stopButton]}
                onPress={() => powerMutation.mutate('stop')}
                disabled={powerMutation.isPending}
              >
                <Square size={20} color={Colors.dark.text} fill={Colors.dark.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.powerButton, styles.restartButton]}
                onPress={() => powerMutation.mutate('restart')}
                disabled={powerMutation.isPending}
              >
                <RotateCw size={20} color={Colors.dark.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.powerButton, styles.killButton]}
                onPress={() => powerMutation.mutate('kill')}
                disabled={powerMutation.isPending}
              >
                <Power size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.consoleSection}>
            <View style={styles.consoleHeader}>
              <Terminal size={20} color={Colors.dark.primary} />
              <Text style={styles.consoleTitle}>Console</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.consoleOutput}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {logs.length === 0 ? (
                <Text style={styles.consoleEmptyText}>No logs available</Text>
              ) : (
                logs.map((log, index) => (
                  <Text key={index} style={styles.logLine}>
                    {log}
                  </Text>
                ))
              )}
            </ScrollView>

            <View style={styles.consoleInput}>
              <TextInput
                style={styles.commandInput}
                placeholder="Enter command..."
                placeholderTextColor={Colors.dark.textMuted}
                value={command}
                onChangeText={setCommand}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleSendCommand}
                editable={server.status === 'running'}
                testID="console-input"
              />
              <TouchableOpacity
                style={[styles.sendButton, (!command.trim() || server.status !== 'running') && styles.sendButtonDisabled]}
                onPress={handleSendCommand}
                disabled={!command.trim() || server.status !== 'running'}
                testID="send-command"
              >
                <Send size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bg,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  serverInfo: {
    backgroundColor: Colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  serverName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  resourcesRow: {
    flexDirection: 'row' as const,
    marginBottom: 16,
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  resourceLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  powerControls: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  powerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  startButton: {
    backgroundColor: Colors.dark.success,
  },
  stopButton: {
    backgroundColor: Colors.dark.danger,
  },
  restartButton: {
    backgroundColor: Colors.dark.warning,
  },
  killButton: {
    backgroundColor: Colors.dark.bgTertiary,
  },
  consoleSection: {
    flex: 1,
    padding: 16,
  },
  consoleHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  consoleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  consoleOutput: {
    flex: 1,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
    marginBottom: 12,
  },
  consoleEmptyText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  logLine: {
    fontFamily: 'monospace' as const,
    fontSize: 13,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  consoleInput: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  commandInput: {
    flex: 1,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'monospace' as const,
  },
  sendButton: {
    backgroundColor: Colors.dark.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  errorText: {
    fontSize: 18,
    color: Colors.dark.danger,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});