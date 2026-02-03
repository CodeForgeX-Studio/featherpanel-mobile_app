import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Users, Server, MapPin, Layout, Database, Settings, BarChart3, Mail, FileText, Shield } from 'lucide-react-native';

interface AdminCard {
  title: string;
  description: string;
  icon: any;
  route: string;
}

const adminCards: AdminCard[] = [
  {
    title: 'Users',
    description: 'Manage users, roles and permissions',
    icon: Users,
    route: '/admin/users',
  },
  {
    title: 'Servers',
    description: 'View and manage all servers',
    icon: Server,
    route: '/admin/servers',
  },
  {
    title: 'Nodes',
    description: 'Manage nodes and locations',
    icon: MapPin,
    route: '/admin/nodes',
  },
  {
    title: 'Spells & Realms',
    description: 'Manage server types and categories',
    icon: Layout,
    route: '/admin/spells',
  },
  {
    title: 'Databases',
    description: 'Manage database hosts',
    icon: Database,
    route: '/admin/databases',
  },
  {
    title: 'Analytics',
    description: 'View system analytics',
    icon: BarChart3,
    route: '/admin/analytics',
  },
  {
    title: 'Settings',
    description: 'Configure system settings',
    icon: Settings,
    route: '/admin/settings',
  },
  {
    title: 'Mail Templates',
    description: 'Manage email templates',
    icon: Mail,
    route: '/admin/mail',
  },
  {
    title: 'Tickets',
    description: 'Manage support tickets',
    icon: FileText,
    route: '/admin/tickets',
  },
  {
    title: 'Security',
    description: 'Rate limits and security settings',
    icon: Shield,
    route: '/admin/security',
  },
];

export default function AdminScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Manage your FeatherPanel instance</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {adminCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => router.push(card.route as any)}
                testID={`admin-card-${index}`}
              >
                <View style={styles.iconContainer}>
                  <Icon size={28} color={Colors.dark.primary} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </TouchableOpacity>
            );
          })}
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});