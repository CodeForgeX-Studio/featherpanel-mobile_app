import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function ServerConsoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.lockedText}>🔒 Console Locked</Text>
      </View>

      <View style={styles.consoleContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.logsScroll}
          contentContainerStyle={styles.comingSoonContent}
        >
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonDescription}>
              The server console has been postponed to ensure we deliver the best possible console experience in our next version.
            </Text>
            <Text style={styles.comingSoonDescription}>
              We're working hard to create a robust, feature-complete terminal interface with full command history, syntax highlighting, and real-time streaming.
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.inputLocked]}
          value="Console Locked"
          editable={false}
          pointerEvents="none"
          placeholderTextColor={Colors.dark.textMuted}
        />
        <TouchableOpacity
          style={[styles.sendButton, styles.sendButtonDisabled]}
          disabled={true}
        >
          <Text style={styles.lockedButtonText}>LOCKED</Text>
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
    justifyContent: 'center' as const,
    padding: 16,
    paddingBottom: 8,
  },
  lockedText: {
    fontSize: 16,
    color: Colors.dark.danger,
    fontWeight: '700' as const,
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
  comingSoonContent: {
    flexGrow: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    color: '#0F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700' as const,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#0F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
    lineHeight: 20,
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
  inputLocked: {
    color: Colors.dark.textMuted,
    backgroundColor: Colors.dark.bgSecondary,
    borderColor: Colors.dark.danger,
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
    backgroundColor: Colors.dark.danger,
    opacity: 0.6,
  },
  lockedButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
});