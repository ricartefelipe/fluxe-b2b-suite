import { v4 as uuidv4 } from 'uuid';

export function generateUUID(): string {
  return uuidv4();
}

export function generateIdempotencyKey(prefix?: string): string {
  const key = uuidv4();
  return prefix ? `${prefix}-${key}` : key;
}
