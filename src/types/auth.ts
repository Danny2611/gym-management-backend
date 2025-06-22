import { Request } from 'express';
export interface JwtPayload {
  userId: string;       // ID của người dùng
  role: string,
  type: 'access' | 'refresh';  // Loại token: Access Token hoặc Refresh Token
  iat?: number;         // Thời điểm token được tạo (Issued At - UNIX timestamp)
  exp?: number;         // Thời điểm token hết hạn (Expires At - UNIX timestamp)
  iss?: string;         // Người cấp phát token (Issuer)
  aud?: string;         // Người nhận token (Audience)
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}