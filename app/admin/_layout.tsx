import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.bgSecondary },
        headerTintColor: Colors.dark.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="servers" options={{ headerShown: false }} />
      <Stack.Screen name="nodes" options={{ headerShown: false }} />
      <Stack.Screen name="spells" options={{ headerShown: false }} />
      <Stack.Screen name="databases" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="mail" options={{ headerShown: false }} />
      <Stack.Screen name="tickets" options={{ headerShown: false }} />
      <Stack.Screen name="security" options={{ headerShown: false }} />
    </Stack>
  );
}