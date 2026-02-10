import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

export default function Index() {
  const { instanceUrl, authToken, user, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bg }}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!instanceUrl) {
    return <Redirect href="/instance-setup" />;
  }

  if (!authToken || !user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/servers" />;
}