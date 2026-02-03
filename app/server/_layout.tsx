import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function ServerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.bgSecondary },
        headerTintColor: Colors.dark.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: "Server",
        }}
      />
    </Stack>
  );
}