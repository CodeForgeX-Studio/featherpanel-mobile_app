import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { User as UserIcon, Lock, Mail, ArrowRight, Globe, Edit2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { handleApiError, extractApiMessage } from '@/lib/api';
import { LoginResponse, ApiEnvelope } from '@/types/api';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const { login, register, isLoginLoading, isRegisterLoading, instanceUrl, canChangeInstanceUrl } = useApp();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    try {
      if (isLogin) {
        if (!username || !password) {
          setError('Please fill in all fields');
          return;
        }

        const res = (await login({
          username_or_email: username,
          password,
        })) as LoginResponse;

        if (!res.success || res.error) {
          const message =
            extractApiMessage<LoginResponse['data']>(res) ||
            'Authentication failed';
          setError(message);
          return;
        }

        if (!res.data || !res.data.user) {
          setError('Authentication failed: no user data returned');
          return;
        }

        router.replace('/(tabs)/servers');
      } else {
        if (!username || !email || !password || !firstName || !lastName) {
          setError('Please fill in all fields');
          return;
        }

        const res = (await register({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        })) as ApiEnvelope<unknown>;

        if (!res.success || res.error) {
          const message =
            extractApiMessage(res) ||
            'Registration failed';
          setError(message);
          return;
        }

        router.replace('/(tabs)/servers');
      }
    } catch (err: any) {

      const apiEnvelope = (err?.response?.data || err?.data || null) as Partial<ApiEnvelope<unknown>> | null;

      if (apiEnvelope) {
        const message = extractApiMessage(apiEnvelope) || 'Authentication failed';
        setError(message);
        return;
      }

      const msg = handleApiError(err);
      setError(msg);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  const isLoading = isLoginLoading || isRegisterLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/featherpanel-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Login to manage your servers' : 'Register to get started'}
            </Text>

            <TouchableOpacity
              style={styles.instanceUrlBadge}
              onPress={() => {
                if (canChangeInstanceUrl) {
                  Alert.alert(
                    'Change Instance',
                    'Do you want to change your FeatherPanel instance?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Change', onPress: () => router.replace('/instance-setup') },
                    ]
                  );
                } else {
                  Alert.alert('Instance Locked', 'You must logout first to change the instance URL');
                }
              }}
              testID="instance-url-badge"
            >
              <Globe size={16} color={Colors.dark.primary} />
              <Text style={styles.instanceUrlText} numberOfLines={1}>
                {instanceUrl ? new URL(instanceUrl).hostname : 'No instance'}
              </Text>
              {canChangeInstanceUrl && <Edit2 size={14} color={Colors.dark.textMuted} />}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{isLogin ? 'Username or Email' : 'Username'}</Text>
              <View style={styles.inputWrapper}>
                <UserIcon size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isLogin ? 'username or email' : 'username'}
                  placeholderTextColor={Colors.dark.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="username-input"
                />
              </View>
            </View>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="email@example.com"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      testID="email-input"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>First Name</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="John"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        testID="first-name-input"
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Last Name</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Doe"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        testID="last-name-input"
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  testID="password-input"
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.dark.text} />
              ) : (
                <>
                  <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
                  <ArrowRight size={20} color={Colors.dark.text} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleToggleMode}
              testID="switch-auth-mode"
              disabled={isLoading}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchTextBold}>
                  {isLogin ? 'Register' : 'Login'}
                </Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  errorContainer: {
    backgroundColor: Colors.dark.danger + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.danger + '40',
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  switchButton: {
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  switchTextBold: {
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
  instanceUrlBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxWidth: '100%',
  },
  instanceUrlText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
});