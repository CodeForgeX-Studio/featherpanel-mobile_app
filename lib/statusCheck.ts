import { router } from 'expo-router';

export const checkServerStatus = async (instanceUrl: string): Promise<boolean> => {
  if (!instanceUrl) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(instanceUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
};

export const redirectIfOffline = async (instanceUrl: string) => {
  const isOnline = await checkServerStatus(instanceUrl);
  if (!isOnline) {
    router.replace('/errors/offline');
  }
  return isOnline;
};