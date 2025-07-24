import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authService, ApiError } from '@/services/authService';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '@/types/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Error states
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackgroundColor = useThemeColor({ light: '#F8F9FA', dark: '#1E2126' }, 'background');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser() as User;
      setUser(userData);
      setProfileData({
        name: userData.name,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      let errorMessage = 'Failed to load profile data.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      if (passwordData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters long';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
    }
    
    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;
    
    try {
      setUpdating(true);
      
      const updateData: UpdateProfileRequest = {};
      if (profileData.name !== user?.name) updateData.name = profileData.name;
      
      if (Object.keys(updateData).length === 0) {
        setIsEditingProfile(false);
        return;
      }
      
      console.log('Updating profile with data:', updateData);
      const updatedUser = await authService.updateProfile(updateData) as User;
      console.log('Profile update response:', updatedUser);
      
      setUser(updatedUser);
      setProfileData({
        name: updatedUser.name,
      });
      setIsEditingProfile(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    
    try {
      setUpdating(true);
      
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };
      
      await authService.changePassword(changePasswordRequest);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileData({
      name: user?.name || '',
    });
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Failed to load profile</ThemedText>
          <Button title="Retry" onPress={loadUserProfile} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={false}
        >
          {/* Profile Header */}
          <View style={[styles.header, { backgroundColor: cardBackgroundColor }]}>
            <View style={[styles.avatarContainer, { backgroundColor: tintColor }]}>
              <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>
                {user.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.userName}>
              {user.name}
            </ThemedText>
            <ThemedText style={[styles.userEmail, { color: iconColor }]}>
              {user.email}
            </ThemedText>
          </View>

          {/* Profile Information Card */}
          <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Profile Information
              </ThemedText>
              {!isEditingProfile && (
                <TouchableOpacity
                  onPress={() => setIsEditingProfile(true)}
                  style={[styles.editButton, { backgroundColor: tintColor }]}
                >
                  <ThemedText style={[styles.editButtonText, { color: '#FFFFFF' }]}>
                    Edit
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {isEditingProfile ? (
              <View style={styles.form}>
                <Input
                  label="Full Name"
                  value={profileData.name}
                  onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                  error={profileErrors.name}
                  placeholder="Enter your full name"
                />
                <View style={styles.formButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={handleCancelProfileEdit}
                    style={styles.formButton}
                  />
                  <Button
                    title="Save Changes"
                    onPress={handleUpdateProfile}
                    loading={updating}
                    style={styles.formButton}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                    Full Name
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>{user.name}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                    Email Address
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                    Account Status
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: user.isEmailVerified ? '#10B981' : '#F59E0B' }]}>
                    {user.isEmailVerified ? 'Verified' : 'Unverified'}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Change Password Card */}
          <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Change Password
              </ThemedText>
              {!isChangingPassword && (
                <TouchableOpacity
                  onPress={() => setIsChangingPassword(true)}
                  style={[styles.editButton, { backgroundColor: tintColor }]}
                >
                  <ThemedText style={[styles.editButtonText, { color: '#FFFFFF' }]}>
                    Change
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {isChangingPassword ? (
              <View style={styles.form}>
                <Input
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter your current password"
                  secureTextEntry
                />
                <Input
                  label="New Password"
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  error={passwordErrors.newPassword}
                  placeholder="Enter your new password"
                  secureTextEntry
                />
                <Input
                  label="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm your new password"
                  secureTextEntry
                />
                <View style={styles.formButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={handleCancelPasswordChange}
                    style={styles.formButton}
                  />
                  <Button
                    title="Change Password"
                    onPress={handleChangePassword}
                    loading={updating}
                    style={styles.formButton}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.passwordInfo}>
                <ThemedText style={[styles.passwordText, { color: iconColor }]}>
                  Password is hidden for security
                </ThemedText>
                <ThemedText style={[styles.passwordHint, { color: iconColor }]}>
                  Click &quot;Change&quot; to update your password
                </ThemedText>
              </View>
            )}
          </View>

          {/* Account Information */}
          <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Account Information
            </ThemedText>
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                  Member Since
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                  Last Login
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {new Date(user.lastLogin).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: iconColor }]}>
                  Account Role
                </ThemedText>
                <ThemedText style={styles.infoValue}>{user.role}</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for keyboard
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  passwordInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  passwordText: {
    fontSize: 14,
    marginBottom: 4,
  },
  passwordHint: {
    fontSize: 12,
  },
  form: {
    gap: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
}); 