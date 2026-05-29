const production = process.env.NODE_ENV === "production";

export function requiredSecret(name: string, devFallback: string, minLength = 32) {
  const value = process.env[name];

  if (value && value.length >= minLength) {
    return value;
  }

  if (production) {
    throw new Error(`${name} must be configured with at least ${minLength} characters in production.`);
  }

  return value || devFallback;
}
