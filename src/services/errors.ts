export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`
    );
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message);
  }
}

export class DuplicityError extends BusinessError {
  constructor(resource: string, field: string) {
    super(`${resource} with ${field} already exists`);
  }
}

export class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
