import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
  userId?: string;
  userRole?: string;
}