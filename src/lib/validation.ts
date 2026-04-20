import { z } from 'zod';

// Password validation schema with enhanced strength requirements
// Requires: 12+ chars, uppercase, lowercase, number, AND special character
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character (!@#$%^&*...)');

// Email validation schema with additional security checks
export const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .refine(
    (email) => !email.includes('+'), 
    'Email aliases with + are not allowed for security'
  );

// Auth form schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Stellar address validation
export const stellarAddressSchema = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address format. Must start with G and be 56 characters.');

// Amount validation for financial transactions with stricter limits
export const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .finite('Amount must be a valid number')
  .max(100000, 'Amount exceeds maximum limit of $100,000')
  .refine(
    (amount) => Number.isFinite(amount) && amount > 0.001,
    'Amount must be at least $0.001'
  );

// Helper function to validate Stellar address
export const isValidStellarAddress = (address: string): boolean => {
  return /^G[A-Z2-7]{55}$/.test(address);
};

// Enhanced password strength checker with security rating
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
  isSecure: boolean;
} => {
  let score = 0;
  
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 2;
  
  // Check for common patterns (reduce score)
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/^[a-zA-Z]+$/.test(password)) score--; // Only letters
  if (/^[0-9]+$/.test(password)) score--; // Only numbers
  if (/password|123456|qwerty/i.test(password)) score -= 3; // Common passwords
  
  const isSecure = score >= 6 && password.length >= 12 && 
    /[A-Z]/.test(password) && /[a-z]/.test(password) && 
    /[0-9]/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500', isSecure: false };
  if (score <= 4) return { score, label: 'Medium', color: 'text-yellow-500', isSecure: false };
  if (score <= 6) return { score, label: 'Strong', color: 'text-green-500', isSecure };
  return { score, label: 'Very Strong', color: 'text-emerald-500', isSecure: true };
};

// Rate limiting helper for client-side (basic implementation)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return true;
  }
  
  if (entry.count >= maxAttempts) {
    return false;
  }
  
  entry.count++;
  return true;
};

// Input sanitization helper
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
};
