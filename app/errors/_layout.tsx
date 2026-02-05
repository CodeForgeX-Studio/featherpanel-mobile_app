import { Stack } from 'expo-router';

export default function ErrorsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="offline" options={{ headerShown: false }} />
    </Stack>
  );
}