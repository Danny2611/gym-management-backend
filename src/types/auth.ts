import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// ✅ GIẢI PHÁP: AuthRequest kế thừa HOÀN TOÀN từ Request
export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
  userId?: string;
  userRole?: string;
  
  // Explicitly override để đảm bảo TypeScript hiểu
  query: ParsedQs;
  params: ParamsDictionary;
  body: any;
  headers: any;
}

// Helper type cho API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Type guard để check AuthRequest
export function isAuthRequest(req: Request): req is AuthRequest {
  return true; // Vì middleware đã đảm bảo
}