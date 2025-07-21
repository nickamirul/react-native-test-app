import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authService, ApiError } from '@/services/authService';
import { SignInRequest } from '@/types/auth';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function SignIn() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const tintColor = useThemeColor({}, 'tint');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const credentials: SignInRequest = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await authService.signIn(credentials);
      
      // Success - navigate to main app
      Alert.alert(
        'Welcome Back!', 
        `Hello ${response.user.name}, you've signed in successfully!`,
        [
          { 
            text: 'Continue', 
            onPress: () => router.replace('/(tabs)') 
          }
        ]
      );
    } catch (error) {
      console.error('Sign in error:', error);
      
      if (error instanceof ApiError) {
        // Handle validation errors
        if (error.errors && Array.isArray(error.errors)) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err: any) => {
            if (err.path === 'email') {
              newErrors.email = err.msg;
            } else if (err.path === 'password') {
              newErrors.password = err.msg;
            }
          });
          setErrors(newErrors);
        } else {
          // Handle general API errors
          if (error.status === 401) {
            setErrors({ general: 'Invalid email or password' });
          } else if (error.status === 0) {
            setErrors({ general: 'Network error. Please check your connection and try again.' });
          } else if (error.status === 408) {
            setErrors({ general: 'Request timeout. Please try again.' });
          } else {
            setErrors({ general: error.message || 'Sign in failed. Please try again.' });
          }
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Welcome Back
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: useThemeColor({}, 'icon') }]}>
                Sign in to your account
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* General Error Message */}
              {errors.general && (
                <View style={styles.generalErrorContainer}>
                  <ThemedText style={styles.generalErrorText}>
                    {errors.general}
                  </ThemedText>
                </View>
              )}

              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                icon="lock-closed-outline"
                rightIcon={showPassword ? "eye-outline" : "eye-off-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                editable={!loading}
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                disabled={loading}
              >
                <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                fullWidth
                size="large"
                style={styles.signInButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                Don&apos;t have an account?{' '}
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/signup')}
                  disabled={loading}
                >
                  <ThemedText style={[styles.linkText, { color: tintColor }]}>
                    Sign Up
                  </ThemedText>
                </TouchableOpacity>
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  generalErrorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontWeight: '600',
    fontSize: 16,
  },
}); 