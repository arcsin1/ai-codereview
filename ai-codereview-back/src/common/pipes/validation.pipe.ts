import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Validation Pipe Options
 */
export interface ValidationPipeOptions {
  whitelist?: boolean; // Automatically remove undefined properties
  forbidNonWhitelisted?: boolean; // Reject undefined properties
  transform?: boolean; // Auto-convert types
  transformOptions?: { enableImplicitConversion?: boolean }; // Transform options
  disableErrorMessages?: boolean; // Disable error messages
  exceptionFactory?: (errors: ValidationError[]) => any; // Custom exception factory
  validationError?: {
    target?: boolean; // Include target object in error
    value?: boolean; // Include property value in error
  };
}

/**
 * Default Validation Pipe Options
 */
const DEFAULT_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  validationError: {
    target: false,
    value: false,
  },
};

/**
 * Custom Validation Pipe
 * Provides enhanced validation functionality and more friendly error messages
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  constructor(private readonly options: ValidationPipeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Return directly if no DTO metatype
    if (!metadata || !metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    // Convert to class instance
    const object = plainToClass(metadata.metatype, value, {
      enableImplicitConversion: this.options.transformOptions?.enableImplicitConversion,
    });

    // Perform validation
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      ...this.options.validationError,
    });

    // If there are errors, throw exception
    if (errors.length > 0) {
      if (this.options.exceptionFactory) {
        throw this.options.exceptionFactory(errors);
      }

      throw new BadRequestException(this.formatErrors(errors));
    }

    return object;
  }

  /**
   * Check if validation is needed
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Format validation errors
   */
  private formatErrors(errors: ValidationError[]): any {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: this.flattenErrors(errors),
    };
  }

  /**
   * Flatten nested error array
   */
  private flattenErrors(errors: ValidationError[]): any[] {
    const result: any[] = [];

    for (const error of errors) {
      // Handle current error
      if (error.constraints) {
        result.push({
          field: error.property,
          messages: Object.values(error.constraints),
        });
      }

      // Handle child errors
      if (error.children && error.children.length > 0) {
        const childrenErrors = this.flattenErrors(error.children);

        // Add parent property prefix to child error fields
        for (const childError of childrenErrors) {
          result.push({
            field: `${error.property}.${childError.field}`,
            messages: childError.messages,
          });
        }
      }
    }

    return result;
  }
}

/**
 * Simplified Validation Pipe
 * Returns only simple error messages
 */
@Injectable()
export class SimpleValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata || !metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors
        .map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        })
        .join('; ');

      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

/**
 * Detailed Validation Pipe
 * Returns complete validation error information including field path and constraints
 */
@Injectable()
export class DetailedValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata || !metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const detailedErrors = this.buildDetailedErrors(errors);
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: detailedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Build detailed error messages
   */
  private buildDetailedErrors(
    errors: ValidationError[],
    prefix = '',
  ): Array<{ field: string; constraints: Record<string, string> }> {
    const result: Array<{ field: string; constraints: Record<string, string> }> =
      [];

    for (const error of errors) {
      const field = prefix + error.property;

      if (error.constraints) {
        result.push({
          field,
          constraints: error.constraints,
        });
      }

      if (error.children && error.children.length > 0) {
        const childErrors = this.buildDetailedErrors(error.children, `${field}.`);
        result.push(...childErrors);
      }
    }

    return result;
  }
}

/**
 * Query Parameter Validation Pipe
 * Specifically for validating query parameters
 */
@Injectable()
export class QueryValidationPipe implements PipeTransform<any> {
  constructor(private readonly dto?: any) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    // If no DTO provided, only do basic type conversion
    if (!this.dto) {
      return this.transformQueryParams(value);
    }

    // If DTO provided, use full validation
    const object = plainToClass(this.dto, value, {
      enableImplicitConversion: true,
    });

    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Query parameters validation failed',
        errors: this.formatErrors(errors),
      });
    }

    return object;
  }

  /**
   * Transform query parameter types
   */
  private transformQueryParams(params: any): any {
    const transformed = { ...params };

    // Transform numeric parameters
    for (const key in transformed) {
      const value = transformed[key];
      if (typeof value === 'string' && !isNaN(Number(value))) {
        transformed[key] = Number(value);
      }

      // Transform boolean values
      if (value === 'true') {
        transformed[key] = true;
      } else if (value === 'false') {
        transformed[key] = false;
      }
    }

    return transformed;
  }

  private formatErrors(errors: ValidationError[]): any[] {
    return errors.map((error) => ({
      field: error.property,
      messages: Object.values(error.constraints || {}),
    }));
  }
}

/**
 * Decorator Factory Function
 */
export function ValidationPipe(options?: ValidationPipeOptions) {
  return new CustomValidationPipe(options);
}

/**
 * Predefined Validation Pipe Instances
 */
export const ValidationPipes = {
  /**
   * Standard validation pipe
   */
  Standard: new CustomValidationPipe(),

  /**
   * Strict validation pipe (rejects extra fields)
   */
  Strict: new CustomValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),

  /**
   * Lenient validation pipe (ignores extra fields)
   */
  Lenient: new CustomValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
  }),

  /**
   * Simple validation pipe
   */
  Simple: new SimpleValidationPipe(),

  /**
   * Detailed validation pipe
   */
  Detailed: new DetailedValidationPipe(),
};
