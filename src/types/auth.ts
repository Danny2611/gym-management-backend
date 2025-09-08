import { Request, Response, NextFunction } from "express";

export interface JwtPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * AuthRequest extends từ Express.Request
 * -> Giữ nguyên query, params, body, headers
 * -> Thêm userId và userRole do middleware gắn vào
 */
export interface AuthRequest<
  P = Record<string, any>,   // Params
  ResBody = any,             // Response body
  ReqBody = any,             // Request body
  ReqQuery = any             // Query
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
  userRole?: string;
}

/**
 * Kiểu dữ liệu chuẩn cho API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Type cho async handler function
 */
export type AsyncHandlerFunction = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Custom asyncHandler với type safety cho AuthRequest
 */
export const asyncHandler = (fn: AsyncHandlerFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
};