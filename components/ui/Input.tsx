import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: any;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({
    label,
    error,
    icon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    ...props
  }, ref) => {
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const tintColor = useThemeColor({}, 'tint');
    const inputBackgroundColor = useThemeColor({ light: '#F8F9FA', dark: '#1E2126' }, 'background');
    const defaultBorderColor = useThemeColor({ light: '#E1E5E9', dark: '#2A2D32' }, 'background');
    const placeholderColor = useThemeColor({ light: '#9BA1A6', dark: '#687076' }, 'icon');
    
    const borderColor = error 
      ? '#ff4444' 
      : props.value 
        ? tintColor 
        : defaultBorderColor;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: textColor }]}>
            {label}
          </Text>
        )}
        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: inputBackgroundColor,
            borderColor,
          }
        ]}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={iconColor} 
              style={styles.leftIcon}
            />
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { 
                color: textColor,
                paddingLeft: icon ? 12 : 16,
                paddingRight: rightIcon ? 12 : 16,
              },
              style
            ]}
            placeholderTextColor={placeholderColor}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons 
                name={rightIcon} 
                size={20} 
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  leftIcon: {
    marginLeft: 16,
  },
  rightIcon: {
    marginRight: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
    marginLeft: 4,
  },
}); 