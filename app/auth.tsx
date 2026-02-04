import React, { useState, useRef } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { User as UserIcon, Lock, Mail, ArrowRight, Globe, Edit2, Shield } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { handleApiError, extractApiMessage, createApiClient } from '@/lib/api';
import { LoginResponse, ApiEnvelope } from '@/types/api';

interface SystemSettings {
  turnstile_enabled: string;
  turnstile_key_pub: string;
  app_name: string;
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [tempLoginData, setTempLoginData] = useState<LoginResponse | null>(null);
  const [error, setError] = useState('');
  const [resetTurnstile, setResetTurnstile] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const { login, register, twoFactor, isLoginLoading, isRegisterLoading, isTwoFactorLoading, instanceUrl, clearAuth } = useApp();
  const router = useRouter();

  const {
    data: settings,
    isLoading: isSettingsLoading,
  } = useQuery<SystemSettings>({
    queryKey: ['systemSettings', instanceUrl],
    queryFn: async () => {
      if (!instanceUrl) throw new Error('No instance URL');
      const api = createApiClient(instanceUrl, '');
      const response = await api.get<any>('/api/system/settings');
      if (!response.data.success) {
        throw new Error('Failed to load settings');
      }
      return response.data.data.settings;
    },
    enabled: !!instanceUrl,
    refetchInterval: 2000,
  });

  const turnstileEnabled = settings?.turnstile_enabled === 'true';
  const turnstileKey = settings?.turnstile_key_pub;

  const turnstileHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      <style>
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        html, body { 
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #turnstile-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cf-turnstile {
          transform: scale(1.15);
          transform-origin: center center;
        }
      </style>
    </head>
    <body>
      <div id="turnstile-container">
        <div class="cf-turnstile" 
             data-sitekey="${turnstileKey}" 
             data-theme="dark" 
             data-size="large"
             data-callback="onTurnstileSuccess"
             data-expired-callback="onTurnstileExpired"
             data-error-callback="onTurnstileError"
             data-refresh-expired="30">
        </div>
      </div>
      
      <script>
        function onTurnstileSuccess(token) {
          window.ReactNativeWebView.postMessage('turnstile:success:' + token);
        }
        
        function onTurnstileExpired() {
          window.ReactNativeWebView.postMessage('turnstile:expired');
        }
        
        function onTurnstileError() {
          window.ReactNativeWebView.postMessage('turnstile:error');
        }
        
        window.addEventListener('message', function(event) {
          if (event.data === 'reset') {
            if (window.turnstile) {
              window.turnstile.reset('.cf-turnstile');
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  const resetTurnstileWidget = () => {
    setTurnstileToken('');
    setResetTurnstile(!resetTurnstile);
    if (webViewRef.current) {
      webViewRef.current.postMessage('reset');
    }
  };

  const handleSubmit = async () => {
    setError('');

    try {
      if (turnstileEnabled && !turnstileToken) {
        setError('Please complete Cloudflare Turnstile verification');
        return;
      }

      if (isLogin) {
        if (!username || !password) {
          setError('Please fill in all fields');
          resetTurnstileWidget();
          return;
        }

        try {
          const res = await login({
            username_or_email: username,
            password,
            turnstile_token: turnstileEnabled ? turnstileToken : undefined,
          }) as LoginResponse;

          if (res.error_code === 'TWO_FACTOR_REQUIRED') {
            const emailFromResponse = res.data?.email || (username.includes('@') ? username : '');
            setTempLoginData({
              ...res,
              data: {
                ...res.data,
                email: emailFromResponse,
              }
            } as LoginResponse);
            setShow2FA(true);
            resetTurnstileWidget();
            return;
          }

          if (!res.success || res.error) {
            const message = extractApiMessage(res) || 'Authentication failed';
            setError(message);
            resetTurnstileWidget();
            return;
          }

          if (!res.data?.user) {
            setError('Authentication failed: no user data returned');
            resetTurnstileWidget();
            return;
          }

          const user = res.data.user;
          if (user.banned === 'true') {
            setError('This account has been banned');
            clearAuth();
            resetTurnstileWidget();
            return;
          }

          router.replace('/(tabs)/servers');
        } catch (loginErr: any) {
          const apiEnvelope = (loginErr?.response?.data || loginErr?.data || null) as Partial<ApiEnvelope<unknown>> | null;
          
          if (apiEnvelope?.error_code === 'TWO_FACTOR_REQUIRED') {
            const emailFromResponse = apiEnvelope.data?.email || (username.includes('@') ? username : '');
            setTempLoginData({
              success: false,
              error: true,
              message: apiEnvelope.message || '2FA required',
              error_code: 'TWO_FACTOR_REQUIRED',
              data: {
                email: emailFromResponse,
              }
            } as LoginResponse);
            setShow2FA(true);
            resetTurnstileWidget();
            return;
          }

          throw loginErr;
        }
      } else {
        if (!username || !email || !password || !firstName || !lastName) {
          setError('Please fill in all fields');
          resetTurnstileWidget();
          return;
        }

        const res = await register({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          turnstile_token: turnstileEnabled ? turnstileToken : undefined,
        }) as ApiEnvelope<unknown>;

        if (!res.success || res.error) {
          const message = extractApiMessage(res) || 'Registration failed';
          setError(message);
          resetTurnstileWidget();
          return;
        }

        router.replace('/auth');
      }
    } catch (err: any) {
      const apiEnvelope = (err?.response?.data || err?.data || null) as Partial<ApiEnvelope<unknown>> | null;
      if (apiEnvelope) {
        const message = extractApiMessage(apiEnvelope) || 'Authentication failed';
        setError(message);
        resetTurnstileWidget();
        return;
      }
      const msg = handleApiError(err);
      setError(msg);
      resetTurnstileWidget();
    }
  };

  const handle2FASubmit = async () => {
    const emailToUse = tempLoginData?.data?.email || (username.includes('@') ? username : '');
    
    if (!emailToUse || !twoFACode || twoFACode.length !== 6) {
      setError('Please enter a valid 6-digit 2FA code');
      return;
    }

    try {
      setError('');
      const res = await twoFactor({
        email: emailToUse,
        code: twoFACode,
      }) as LoginResponse;

      if (res.success && !res.error) {
        router.replace('/(tabs)/servers');
      } else {
        setError('Invalid 2FA code');
        setTwoFACode('');
      }
    } catch (err: any) {
      const msg = handleApiError(err);
      setError(msg);
      setTwoFACode('');
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setShow2FA(false);
    setTempLoginData(null);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setTwoFACode('');
    setTurnstileToken('');
    setResetTurnstile(false);
    if (webViewRef.current) {
      webViewRef.current.postMessage('reset');
    }
  };

  const isLoading = isLoginLoading || isRegisterLoading || isTwoFactorLoading || isSettingsLoading;

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
            <View style={styles.titleContainer}>
              {show2FA ? <Shield size={32} color={Colors.dark.primary} /> : <></>}
              <Text style={styles.title}>
                {show2FA ? 'Two-Factor Authentication' : (isLogin ? 'Welcome Back' : 'Create Account')}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {show2FA 
                ? 'Enter the 6-digit code from your authenticator app' 
                : (isLogin ? 'Login to manage your servers' : 'Register to get started')
              }
            </Text>

            {!show2FA && (
              <TouchableOpacity
                style={styles.instanceUrlBadge}
                onPress={() => {
                  Alert.alert(
                    'Change Instance',
                    'Do you want to change your FeatherPanel instance?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Change', onPress: () => router.replace('/instance-setup') },
                    ]
                  );
                }}
              >
                <Globe size={16} color={Colors.dark.primary} />
                <Text style={styles.instanceUrlText} numberOfLines={1}>
                  {instanceUrl ? new URL(instanceUrl).hostname : 'No instance'}
                </Text>
                <Edit2 size={14} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            {!show2FA ? (
              <>
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
                    />
                  </View>
                </View>

                {turnstileEnabled && turnstileKey && !show2FA && (
                  <View style={styles.inputContainer}>
                    <View style={styles.turnstileContainer}>
                      <WebView
                        key={resetTurnstile ? 'reset' : 'normal'}
                        ref={webViewRef}
                        source={{ 
                          html: turnstileHtml,
                          baseUrl: instanceUrl 
                        }}
                        style={styles.turnstileWebView}
                        onMessage={(event) => {
                          const data = event.nativeEvent.data;
                          if (data.startsWith('turnstile:success:')) {
                            setTurnstileToken(data.replace('turnstile:success:', ''));
                          } else if (data.startsWith('turnstile:') && (data.includes('expired') || data.includes('error'))) {
                            setTurnstileToken('');
                          }
                        }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        startInLoadingState={false}
                        thirdPartyCookiesEnabled={true}
                        sharedCookiesEnabled={true}
                        originWhitelist={['*']}
                        scalesPageToFit={false}
                        scrollEnabled={false}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        incognito={false}
                        cacheEnabled={true}
                        userAgent={`Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1`}
                      />
                    </View>
                  </View>
                )}

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Text style={styles.switchTextBold}>
                      {isLogin ? 'Register' : 'Login'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>2FA Code</Text>
                  <View style={styles.inputWrapper}>
                    <Shield size={20} color={Colors.dark.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={twoFACode}
                      onChangeText={(text) => setTwoFACode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus={true}
                      returnKeyType="go"
                      onSubmitEditing={handle2FASubmit}
                    />
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, (isLoading || twoFACode.length !== 6) && styles.buttonDisabled]}
                  onPress={handle2FASubmit}
                  disabled={isLoading || twoFACode.length !== 6}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.dark.text} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Verify 2FA Code</Text>
                      <ArrowRight size={20} color={Colors.dark.text} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={handleToggleMode}
                >
                  <Text style={styles.switchText}>
                    Back to login
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
    alignItems: 'center',
    marginBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  turnstileContainer: {
    overflow: 'hidden',
    height: 100,
    backgroundColor: 'transparent',
  },
  turnstileWebView: {
    backgroundColor: 'transparent',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: Colors.dark.text,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  switchTextBold: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  instanceUrlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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