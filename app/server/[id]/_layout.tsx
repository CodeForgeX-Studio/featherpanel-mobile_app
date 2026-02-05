import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";
import { HeaderBackButton } from '@react-navigation/elements';

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
        name="index"
        options={{
          title: "Overview",
          headerBackVisible: true,
          headerLeft: ({ navigation }) => (
            <HeaderBackButton 
              tintColor="white"
              onPress={() => navigation.navigate('(tabs)/servers')}
            />
          ),
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
        name="file-manager"
        options={{
          title: "File Manager",
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