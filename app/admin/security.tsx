import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Shield } from 'lucide-react-native';

export default function AdminSecurityScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Security</Text>
        <Text style={styles.subtitle}>Rate limits and security settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.placeholderContainer}>
          <Shield size={64} color={Colors.dark.textMuted} />
          <Text style={styles.placeholderText}>Security Settings</Text>
          <Text style={styles.placeholderSubtext}>Coming soon</Text>
        </View>
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 60,
    gap: 12,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
});