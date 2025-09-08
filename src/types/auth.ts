import { Request } from "express";

export interface JwtPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthRequest<
  P = Record<string, any>,   // Params
  ResBody = any,             // Response body
  ReqBody = any,             // Request body
  ReqQuery = any             // Query
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
  userRole?: string;
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