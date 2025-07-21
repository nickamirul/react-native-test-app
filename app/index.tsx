import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authService } from '@/services/authService';

export default function Index() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Try to get current user to verify token validity
        try {
          await authService.getCurrentUser();
          router.replace('/(tabs)');
        } catch (error) {
          // Token might be expired, try to refresh
          const newToken = await authService.refreshToken();
          if (newToken) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/signin');
          }
        }
      } else {
        router.replace('/(auth)/signin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(auth)/signin');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
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

  return null;
} 