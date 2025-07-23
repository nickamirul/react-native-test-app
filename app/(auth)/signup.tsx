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
import { SignUpRequest } from '@/types/auth';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const tintColor = useThemeColor({}, 'tint');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation (backend expects 'name', min 2, max 50 chars)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 50) {
      newErrors.fullName = 'Name must be no more than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    // Password validation (backend expects min 6 chars with uppercase, lowercase, and number)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const userData: SignUpRequest = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await authService.signUp(userData);
      
      // Success - show welcome message and navigate to main app
      Alert.alert(
        'Welcome!', 
        `Hello ${response.user.name}! Your account has been created successfully.`,
        [
          { 
            text: 'Continue', 
            onPress: () => router.replace('/(tabs)') 
          }
        ]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      
      if (error instanceof ApiError) {
        // Handle validation errors
        if (error.errors && Array.isArray(error.errors)) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err: any) => {
            if (err.path === 'name') {
              newErrors.fullName = err.msg;
            } else if (err.path === 'email') {
              newErrors.email = err.msg;
            } else if (err.path === 'password') {
              newErrors.password = err.msg;
            }
          });
          setErrors(newErrors);
        } else {
          // Handle general API errors
          if (error.status === 400 && error.message.includes('already exists')) {
            setErrors({ email: 'An account with this email already exists' });
          } else if (error.status === 0) {
            setErrors({ general: 'Network error. Please check your connection and try again.' });
          } else if (error.status === 408) {
            setErrors({ general: 'Request timeout. Please try again.' });
          } else {
            setErrors({ general: error.message || 'Sign up failed. Please try again.' });
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
                Create Account
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: useThemeColor({}, 'icon') }]}>
                Sign up to get started
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
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                error={errors.fullName}
                icon="person-outline"
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />

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
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                icon="lock-closed-outline"
                rightIcon={showPassword ? "eye-outline" : "eye-off-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                editable={!loading}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                icon="lock-closed-outline"
                rightIcon={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                editable={!loading}
              />

              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={loading}
                fullWidth
                size="large"
                style={styles.signUpButton}
              />

              {/* Terms */}
              <View style={styles.termsContainer}>
                <View style={styles.termsTextRow}>
                  <ThemedText style={[styles.termsText, { color: useThemeColor({}, 'icon') }]}>
                    By creating an account, you agree to our{' '}
                  </ThemedText>
                  <TouchableOpacity disabled={loading}>
                    <ThemedText style={[styles.linkText, { color: tintColor }]}>
                      Terms of Service
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={[styles.termsText, { color: useThemeColor({}, 'icon') }]}>
                    {' '}and{' '}
                  </ThemedText>
                  <TouchableOpacity disabled={loading}>
                    <ThemedText style={[styles.linkText, { color: tintColor }]}>
                      Privacy Policy
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerTextContainer}>
                <ThemedText style={styles.footerText}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/signin')}
                  disabled={loading}
                >
                  <ThemedText style={[styles.linkText, { color: tintColor }]}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
    marginBottom: 40,
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
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontWeight: '600',
    fontSize: 16,
  },
}); 