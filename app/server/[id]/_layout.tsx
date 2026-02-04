import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function ServerDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.bgSecondary },
        headerTintColor: Colors.dark.text,
        headerShadowVisible: false,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="files/edit"
        options={{
          title: "Edit File",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="files/create"
        options={{
          title: "Create File",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: "Overview",
        }}
      />
      <Stack.Screen
        name="console"
        options={{
          title: "Console",
        }}
      />
      <Stack.Screen
        name="files"
        options={{
          title: "Files",
        }}
      />
      <Stack.Screen
        name="databases"
        options={{
          title: "Databases",
        }}
      />
      <Stack.Screen
        name="backups"
        options={{
          title: "Backups",
        }}
      />
      <Stack.Screen
        name="allocations"
        options={{
          title: "Network",
        }}
      />
      <Stack.Screen
        name="schedules"
        options={{
          title: "Schedules",
        }}
      />
      <Stack.Screen
        name="subusers"
        options={{
          title: "Subusers",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Stack>
  );
}