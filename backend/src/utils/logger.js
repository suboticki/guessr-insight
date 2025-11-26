/**
 * Logger utility for consistent logging
 */

export function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

export function logSuccess(message) {
  console.log(`✅ ${message}`);
}

export function logError(message, error) {
  console.error(`❌ ${message}`, error?.message || error);
}

export function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}
