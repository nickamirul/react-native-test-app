export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
} 