import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function Index() {
  const { instanceUrl, authToken, user } = useApp();

  if (!instanceUrl) {
    return <Redirect href="/instance-setup" />;
  }

  if (!authToken || !user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/servers" />;
}