import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authService, ApiError } from '@/services/authService';

export default function SignOutScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasInitiatedSignOut, setHasInitiatedSignOut] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  // Show confirmation dialog when this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isSigningOut && !hasInitiatedSignOut) {
        showSignOutConfirmation();
      }
    }, [isSigningOut, hasInitiatedSignOut])
  );

  const showSignOutConfirmation = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Navigate back to home tab when user cancels
            router.replace('/(tabs)');
          },
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: handleSignOut,
        },
      ],
      { cancelable: false }
    );
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setHasInitiatedSignOut(true);
    
    try {
      await authService.signOut();
      
      // Navigate directly to sign in after successful sign out
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      
      let errorMessage = 'An error occurred while signing out.';
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          errorMessage = 'Network error. You have been signed out locally.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert(
        'Sign Out',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Even if API call fails, redirect to signin since tokens are cleared
              router.replace('/(auth)/signin');
            },
          },
        ],
        { cancelable: false }
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  // Fallback UI in case the dialog doesn't show
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {isSigningOut ? (
          <>
            <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
            <ThemedText style={styles.loadingText}>
              Signing out...
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="title" style={styles.title}>
              Sign Out
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: iconColor }]}>
              You can sign out of your account here
            </ThemedText>
            <Button
              title="Sign Out"
              variant="outline"
              onPress={showSignOutConfirmation}
              style={styles.signOutButton}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  signOutButton: {
    minWidth: 160,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 