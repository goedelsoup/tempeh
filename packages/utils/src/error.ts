import { TempehError } from '@tempeh/types';

export function createTempehError(
  message: string,
  code: string,
  suggestions?: string[],
  context?: Record<string, unknown>
): TempehError {
  return new TempehError({
    code,
    message,
    suggestions: suggestions || [],
    context: context || {},
  });
}

export function isTempehError(error: unknown): error is TempehError {
  return error instanceof TempehError;
}

export function formatError(error: unknown): string {
  if (isTempehError(error)) {
    let message = `${error.message}\n`;
    
    if (error.suggestions && error.suggestions.length > 0) {
      message += '\nSuggestions:\n';
      for (const suggestion of error.suggestions) {
        message += `  • ${suggestion}\n`;
      }
    }
    
    if (error.context && Object.keys(error.context).length > 0) {
      message += '\nContext:\n';
      for (const [key, value] of Object.entries(error.context)) {
        message += `  ${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    return message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

export function handleError(error: unknown, verbose = false): never {
  const formattedError = formatError(error);
  
  if (verbose && error instanceof Error && error.stack) {
    console.error(formattedError);
    console.error('\nStack trace:');
    console.error(error.stack);
  } else {
    console.error(formattedError);
  }
  
  process.exit(1);
}
