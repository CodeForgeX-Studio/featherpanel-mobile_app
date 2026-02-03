import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { Server, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

export default function InstanceSetupScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { setInstanceUrl } = useApp();
  const router = useRouter();

  const validateUrl = (input: string): boolean => {
    try {
      const urlObj = new URL(input);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleContinue = async () => {
    setError('');
    
    if (!url.trim()) {
      setError('Please enter an instance URL');
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    if (!validateUrl(cleanUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    await setInstanceUrl(cleanUrl);
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/featherpanel-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>Welcome to FeatherPanel</Text>
            <Text style={styles.subtitle}>
              Enter your FeatherPanel instance URL to get started
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Instance URL</Text>
              <View style={styles.inputWrapper}>
                <Server size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="panel.example.com"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={url}
                  onChangeText={(text) => {
                    setUrl(text);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleContinue}
                  testID="instance-url-input"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Examples:</Text>
              <TouchableOpacity onPress={() => setUrl('https://panel.example.com')}>
                <Text style={styles.exampleText}>• https://panel.example.com</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setUrl('http://panel.example.com')}>
                <Text style={styles.exampleText}>• http://panel.example.com</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              testID="continue-button"
            >
              <Text style={styles.buttonText}>Continue</Text>
              <ArrowRight size={20} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an instance? Contact your hosting provider or visit
            </Text>
            <Text style={styles.footerLink}>featherpanel.com</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginTop: 40,
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.dark.text,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 14,
    marginTop: 8,
  },
  exampleContainer: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginVertical: 4,
    fontFamily: 'monospace' as const,
  },
  button: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  footer: {
    alignItems: 'center' as const,
    paddingTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
});