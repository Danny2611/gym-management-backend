// # Chuẩn hóa response
export const createError = (message: string, statusCode: number) => {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    return error;
  };
  
  export const createResponse = (data: any, message = 'Success') => {
    return {
      success: true,
      message,
      data,
    };
  };

  // # Chuẩn hóa response
export const responseHelper = {
  success: (data: any, message = "Success") => ({
    success: true,
    message,
    data,
  }),

  error: (message: string, statusCode = 500) => ({
    success: false,
    message,
    statusCode,
  }),
};
