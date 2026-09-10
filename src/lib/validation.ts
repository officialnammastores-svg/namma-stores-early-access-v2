/**
 * Indian mobile number validation and formatting utility.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanDigits: string;
  formattedForDisplay: string;
  formattedForDb: string;
  errorMessage?: string;
}

export function validateIndianMobile(raw: string): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      cleanDigits: '',
      formattedForDisplay: '',
      formattedForDb: '',
      errorMessage: 'Please enter your 10-digit mobile number.',
    };
  }

  // Strip all whitespace, hyphens, brackets, and leading +91 or 0
  let cleaned = raw.replace(/[\s\-()]/g, '');

  // If user entered "+91" or "91" at beginning followed by 10 digits
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Remove any remaining non-digit characters
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      cleanDigits: '',
      formattedForDisplay: '',
      formattedForDb: '',
      errorMessage: 'Please enter a valid mobile number.',
    };
  }

  if (cleaned.length < 10) {
    return {
      isValid: false,
      cleanDigits: cleaned,
      formattedForDisplay: cleaned,
      formattedForDb: cleaned,
      errorMessage: `Please enter all 10 digits (${cleaned.length}/10 entered).`,
    };
  }

  if (cleaned.length > 10) {
    return {
      isValid: false,
      cleanDigits: cleaned,
      formattedForDisplay: cleaned,
      formattedForDb: cleaned,
      errorMessage: 'Please enter exactly 10 digits.',
    };
  }

  // Check valid Indian mobile starting digit: 6, 7, 8, 9
  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      cleanDigits: cleaned,
      formattedForDisplay: cleaned,
      formattedForDb: cleaned,
      errorMessage: 'Indian mobile numbers start with 6, 7, 8, or 9.',
    };
  }

  // Reject obvious dummy repeating sequences like 0000000000, 1111111111, 9999999999
  const isAllSame = cleaned.split('').every((char) => char === cleaned[0]);
  if (isAllSame) {
    return {
      isValid: false,
      cleanDigits: cleaned,
      formattedForDisplay: cleaned,
      formattedForDb: cleaned,
      errorMessage: 'Please enter a genuine mobile number.',
    };
  }

  // Formatted for display: 98765 43210
  const formattedForDisplay = `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  // For DB we store standard 10 digits
  const formattedForDb = cleaned;

  return {
    isValid: true,
    cleanDigits: cleaned,
    formattedForDisplay,
    formattedForDb,
  };
}

export function validateName(raw: string): { isValid: boolean; cleaned: string; errorMessage?: string } {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { isValid: false, cleaned: '', errorMessage: 'Please enter your name.' };
  }
  if (cleaned.length < 2) {
    return { isValid: false, cleaned, errorMessage: 'Name must be at least 2 characters.' };
  }
  return { isValid: true, cleaned };
}

export function validateArea(raw: string): { isValid: boolean; cleaned: string; errorMessage?: string } {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { isValid: false, cleaned: '', errorMessage: 'Please enter your locality in Whitefield.' };
  }
  if (cleaned.length < 2) {
    return { isValid: false, cleaned, errorMessage: 'Please provide a valid area name.' };
  }
  return { isValid: true, cleaned };
}

export function validateEmailOptional(raw?: string): { isValid: boolean; cleaned?: string; errorMessage?: string } {
  if (!raw || !raw.trim()) {
    return { isValid: true, cleaned: undefined };
  }
  const cleaned = raw.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return { isValid: false, cleaned, errorMessage: 'Please enter a valid email address.' };
  }
  return { isValid: true, cleaned };
}
