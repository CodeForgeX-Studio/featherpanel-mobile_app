import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function Index() {
  const { instanceUrl, authToken, user, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loading}>
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.bg,
  },
});