import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { WifiOff, RefreshCw, LogOut } from 'lucide-react-native';

export default function Offline() {
  const router = useRouter();
  const { instanceUrl, authToken, user, clearAll } = useApp();
  const [isManualChecking, setIsManualChecking] = useState(false);
  const backgroundIntervalRef = useRef(null);

  const checkServerStatus = useCallback(async (manual = false) => {
    if (!instanceUrl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      const response = await fetch(instanceUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok && authToken && user) {
        router.replace('/(tabs)/servers');
        return;
      }
    } catch (error) {
    }
  }, [instanceUrl, authToken, user, router]);

  useEffect(() => {
    backgroundIntervalRef.current = setInterval(() => {
      checkServerStatus(false);
    }, 10000);

    checkServerStatus(false);

    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
      }
    };
  }, [checkServerStatus]);

  const handleChangeInstance = useCallback(async () => {
    await clearAll();
    router.replace('/instance-setup');
  }, [clearAll, router]);

  const handleRetry = useCallback(() => {
    setIsManualChecking(true);
    checkServerStatus(true).finally(() => {
      setIsManualChecking(false);
    });
  }, [checkServerStatus]);

  return (
    <View style={styles.offlineContainer}>
      <View style={styles.offlineIcon}>
        <WifiOff size={48} color={Colors.dark.danger} />
      </View>
      <Text style={styles.offlineTitle}>Connection Lost</Text>
      <Text style={styles.offlineMessage}>
        Connected instance is not available at this moment.
      </Text>
      {instanceUrl && (
        <Text style={styles.instanceUrl} numberOfLines={1}>
          {instanceUrl}
        </Text>
      )}
      <TouchableOpacity 
        style={[
          styles.retryButton, 
          isManualChecking && styles.disabledButton
        ]}
        onPress={handleRetry}
        disabled={isManualChecking}
      >
        <RefreshCw 
          size={20} 
          color={isManualChecking ? "grey" : "white"} 
          style={styles.retryIcon} 
        />
        <Text style={styles.retryButtonText}>
          {isManualChecking ? "Checking..." : "Retry Connection"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.changeButton}
        onPress={handleChangeInstance}
        activeOpacity={0.7}
      >
        <LogOut size={20} color="white" style={styles.logoutIcon} />
        <Text style={styles.changeButtonText}>Change Instance & Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.dark.bg,
  },
  offlineIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.danger + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    maxWidth: 300,
  },
  instanceUrl: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 6,
    paddingVertical: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 240,
  },
  disabledButton: {
    backgroundColor: Colors.dark.textMuted,
  },
  retryIcon: {
    marginRight: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.dark.danger,
    borderRadius: 12,
    minWidth: 240,
  },
  logoutIcon: {
    marginRight: 12,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});