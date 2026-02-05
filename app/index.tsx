import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { checkServerStatus, redirectIfOffline } from '@/lib/statusCheck';

export default function Index() {
  const { instanceUrl, authToken, user } = useApp();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!instanceUrl) {
        setIsChecking(false);
        return;
      }

      const isOnline = await checkServerStatus(instanceUrl);
      if (!isOnline) {
        redirectIfOffline(instanceUrl);
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    };

    checkStatus();
  }, [instanceUrl]);

  if (isChecking) {
    return null;
  }

  if (!instanceUrl) {
    return <Redirect href="/errors/offline" />;
  }

  if (!authToken || !user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/servers" />;
}