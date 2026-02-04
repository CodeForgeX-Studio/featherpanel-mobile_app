import React, { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { WifiOff, RefreshCw, LogOut } from 'lucide-react-native';

export default function Index() {
  const router = useRouter();
  const { instanceUrl, authToken, user, clearAll } = useApp();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    let isMounted = true;

    const checkServerStatus = async () => {
      if (!instanceUrl) {
        if (isMounted) setServerStatus('offline');
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(instanceUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isMounted) {
          setServerStatus(response.ok ? 'online' : 'offline');
        }
      } catch (error) {
        if (isMounted) {
          setServerStatus('offline');
        }
      }
    };

    const interval = setInterval(checkServerStatus, 5000);
    checkServerStatus();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [instanceUrl]);

  const handleChangeInstance = async () => {
    await clearAll();
    router.replace('/instance-setup');
  };

  const handleRetry = async () => {
    if (!instanceUrl) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(instanceUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  };

  if (!instanceUrl || serverStatus === 'offline') {
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
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <RefreshCw size={20} color="white" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.changeButton}
          onPress={handleChangeInstance}
        >
          <LogOut size={20} color="white" style={styles.logoutIcon} />
          <Text style={styles.changeButtonText}>Change Instance & Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!authToken || !user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/servers" />;
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