export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`
    );
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class DuplicityError extends DomainError {
  constructor(resource: string, field: string) {
    super(`${resource} with ${field} already exists`);
  }
}
