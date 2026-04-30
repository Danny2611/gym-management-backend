// src/types/index.ts
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

// Extend trực tiếp từ Request không dùng generic phức tạp
// body, params, query, headers đều được kế thừa đầy đủ


export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type AsyncHandlerFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (fn: AsyncHandlerFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as Request, res, next)).catch(next);
  };
};