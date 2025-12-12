import { Request, Response, NextFunction } from 'express';
import {
  NotFoundError,
  ValidationError,
  DuplicityError,
  DomainError,
} from '../errors/DomainErrors';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

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
  } else if (err instanceof DomainError) {
    statusCode = 400;
    errorName = err.name;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorName = 'AppError';
  }

  res.status(statusCode).json({
    error: errorName,
    message,
  });
}
