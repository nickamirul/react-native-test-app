import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Index() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    // TODO: Check if user is authenticated
    // For now, always redirect to signin
    const timer = setTimeout(() => {
      router.replace('/(auth)/signin');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <ActivityIndicator size="large" color={tintColor} />
    </View>
  );
} 