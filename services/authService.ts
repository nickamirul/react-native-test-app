import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SignInRequest, 
  SignUpRequest, 
  AuthResponse, 
  ApiResponse,
  UpdateProfileRequest,
  ChangePasswordRequest
} from '@/types/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10000;

class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data.errors
        );
      }

      if (data.status === 'error') {
        throw new ApiError(
          data.message,
          response.status,
          data.errors
        );
      }

      return data.data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }

      throw new ApiError('An unexpected error occurred', 500);
    }
  }

  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens securely
    await this.storeTokens(response.tokens);
    
    return response;
  }

  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store tokens securely
    await this.storeTokens(response.tokens);
    
    return response;
  }

  async signOut(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Call API to invalidate token on server
        await this.makeRequest('/auth/signout', {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Error during server signout:', error);
    } finally {
      // Always clear local storage
      await this.clearTokens();
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return null;
      }

      const response = await this.makeRequest<{ accessToken: string }>('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      await AsyncStorage.setItem('accessToken', response.accessToken);
      return response.accessToken;
    } catch (error) {
      // If refresh fails, clear tokens
      await this.clearTokens();
      return null;
    }
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me', {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
  }

  async updateProfile(profileData: UpdateProfileRequest) {
    const authHeaders = await this.getAuthHeaders();
    
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(profileData),
    };
    
    return this.makeRequest('/auth/profile', requestOptions);
  }

  async changePassword(passwordData: ChangePasswordRequest) {
    const authHeaders = await this.getAuthHeaders();
    
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(passwordData),
    };
    
    return this.makeRequest('/auth/change-password', requestOptions);
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    return !!(accessToken && refreshToken);
  }

  private async storeTokens(tokens: any): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem('accessToken', tokens.accessToken),
      AsyncStorage.setItem('refreshToken', tokens.refreshToken),
    ]);
  }

  private async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem('accessToken'),
      AsyncStorage.removeItem('refreshToken'),
    ]);
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new ApiError('No access token found', 401);
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
    };
  }
}

export const authService = new AuthService();
export { ApiError }; 