// // # Xử lý lỗi
// import { Request, Response, NextFunction } from 'express';

// export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Internal Server Error';
  
//   console.error(err.stack);
  
//   res.status(statusCode).json({
//     success: false,
//     message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
//   });
// };