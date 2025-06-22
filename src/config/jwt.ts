import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '~/types/auth';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '1h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const generateAccessToken = (userId: string, roleName: string = 'Member'): string => {
  return jwt.sign({ userId, type: 'access',  role: roleName }, JWT_SECRET, { 
    expiresIn: "1h",
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
  });
};

export const generateRefreshToken = (userId: string, roleName: string = 'Member'): string => {
  return jwt.sign({ userId, type: 'refresh', role: roleName  }, JWT_SECRET, { 
    expiresIn: "7d",
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};