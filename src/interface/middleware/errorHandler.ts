import { Request, Response, NextFunction } from 'express';
import {
  NotFoundError,
  ValidationError,
  DuplicityError,
  BusinessError,
} from '../../services/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorName = 'SystemError';
  const message = err.message;

  if (err instanceof NotFoundError) {
    statusCode = 404;
    errorName = err.name;
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    errorName = err.name;
  } else if (err instanceof DuplicityError) {
    statusCode = 409;
    errorName = err.name;
  } else if (err instanceof BusinessError) {
    statusCode = 400;
    errorName = err.name;
  }

  res.status(statusCode).json({
    error: errorName,
    message,
  });
}
