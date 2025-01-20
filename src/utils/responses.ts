
import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any = null, message: string = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  static created(res: Response, data: any = null, message: string = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static error(res: Response, message: string = 'Error occurred', statusCode: number = 500, errors: any = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static badRequest(res: Response, message: string = 'Bad request', errors: any = null) {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  static unauthorized(res: Response, message: string = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res: Response, message: string = 'Forbidden access') {
    return res.status(403).json({
      success: false,
      message
    });
  }
}