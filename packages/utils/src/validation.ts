import { ValidationError } from '@tempeh/types';

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw createValidationError(fieldName, value, 'Field is required');
  }
}

export function validateString(value: unknown, fieldName: string): void {
  validateRequired(value, fieldName);
  if (typeof value !== 'string') {
    throw createValidationError(fieldName, value, 'Must be a string');
  }
}

export function validateNumber(value: unknown, fieldName: string): void {
  validateRequired(value, fieldName);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw createValidationError(fieldName, value, 'Must be a valid number');
  }
}

export function validateBoolean(value: unknown, fieldName: string): void {
  validateRequired(value, fieldName);
  if (typeof value !== 'boolean') {
    throw createValidationError(fieldName, value, 'Must be a boolean');
  }
}

export function validateObject(value: unknown, fieldName: string): void {
  validateRequired(value, fieldName);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw createValidationError(fieldName, value, 'Must be an object');
  }
}

export function validateArray(value: unknown, fieldName: string): void {
  validateRequired(value, fieldName);
  if (!Array.isArray(value)) {
    throw createValidationError(fieldName, value, 'Must be an array');
  }
}

export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  validateString(value, fieldName);
  if (!allowedValues.includes(value as T)) {
    throw createValidationError(
      fieldName,
      value,
      `Must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value as T;
}

export function validatePath(value: unknown, fieldName: string): void {
  validateString(value, fieldName);
  const path = value as string;
  
  // Basic path validation
  if (path.includes('..') || path.includes('//')) {
    throw createValidationError(fieldName, value, 'Invalid path format');
  }
}

function createValidationError(
  field: string,
  value: unknown,
  message: string
): ValidationError {
  return new ValidationError({
    field,
    value,
    message,
  });
}
