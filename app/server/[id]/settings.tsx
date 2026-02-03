import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Settings as SettingsIcon, Save, Trash2 } from 'lucide-react-native';

interface ServerVariable {
  variable_id: number;
  variable_value: string;
  name: string;
  description: string;
  env_variable: string;
  user_editable: boolean;
  user_viewable: boolean;
}

export default function ServerSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variables, setVariables] = useState<{ [key: number]: string }>({});

  const { data: server, isLoading } = useQuery({
    queryKey: ['server-settings', id],
    queryFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      const res = await apiClient.get(`/api/user/servers/${id}`);
      setName(res.data.name || '');
      setDescription(res.data.description || '');
      
      const vars: { [key: number]: string } = {};
      res.data.variables?.forEach((v: ServerVariable) => {
        vars[v.variable_id] = v.variable_value;
      });
      setVariables(vars);
      
      return res.data;
    },
    enabled: !!apiClient && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      
      const variablesArray = Object.entries(variables).map(([varId, value]) => ({
        variable_id: parseInt(varId),
        variable_value: value,
      }));

      await apiClient.put(`/api/user/servers/${id}`, {
        name,
        description,
        variables: variablesArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-settings', id] });
      queryClient.invalidateQueries({ queryKey: ['server', id] });
      Alert.alert('Success', 'Server settings updated');
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: async () => {
      if (!apiClient) throw new Error('API client not initialized');
      await apiClient.delete(`/api/user/servers/${id}`);
    },
    onSuccess: () => {
      Alert.alert('Deleted', 'Server has been deleted', [
        { text: 'OK', onPress: () => queryClient.invalidateQueries({ queryKey: ['user-servers'] }) }
      ]);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Server',
      'Are you sure? This will permanently delete all server data, files, and databases. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Forever', 
          onPress: () => deleteServerMutation.mutate(), 
          style: 'destructive' 
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  const editableVariables = server?.variables?.filter((v: ServerVariable) => v.user_editable) || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Server Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Server Name"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Server description (optional)"
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {editableVariables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment Variables</Text>
            {editableVariables.map((variable: ServerVariable) => (
              <View key={variable.variable_id} style={styles.inputContainer}>
                <Text style={styles.label}>{variable.name}</Text>
                {variable.description && (
                  <Text style={styles.description}>{variable.description}</Text>
                )}
                <TextInput
                  style={styles.input}
                  value={variables[variable.variable_id] || ''}
                  onChangeText={(value) => setVariables(prev => ({ ...prev, [variable.variable_id]: value }))}
                  placeholder={variable.env_variable}
                  placeholderTextColor={Colors.dark.textMuted}
                />
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, updateMutation.isPending && styles.buttonDisabled]}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.deleteButton, deleteServerMutation.isPending && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={deleteServerMutation.isPending}
          >
            {deleteServerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Trash2 size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Server</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 8,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dangerZone: {
    backgroundColor: Colors.dark.danger + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.danger + '30',
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.danger,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: Colors.dark.danger,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});