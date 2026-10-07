export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const val = name.trim();
  if (!val) return { isValid: false, error: `${fieldName} is required.` };
  if (val.length < 2) return { isValid: false, error: `${fieldName} must be at least 2 characters.` };
  if (val.length > 50) return { isValid: false, error: `${fieldName} cannot exceed 50 characters.` };
  if (/^\d+$/.test(val)) return { isValid: false, error: `${fieldName} cannot be numeric only.` };
  if (/^([a-zA-Z])\1+$/.test(val) && val.length > 3) {
    return { isValid: false, error: `${fieldName} contains invalid repeated characters.` };
  }
  if (!/^[A-Za-z\s\-\'\.]+$/.test(val)) {
    return { isValid: false, error: `${fieldName} contains invalid special characters.` };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  const val = email.trim();
  if (!val) return { isValid: false, error: 'Email address is required.' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(val)) return { isValid: false, error: 'Enter a valid email address.' };
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  const val = phone.trim();
  if (!val) return { isValid: false, error: 'Phone number is required.' };
  const digits = val.replace(/[\s\-\+\(\)]/g, '');
  if (digits.length < 8 || digits.length > 15 || !/^\d+$/.test(digits)) {
    return { isValid: false, error: 'Enter a valid phone number (8-15 digits).' };
  }
  return { isValid: true };
};

export const validateLeaveDates = (startDate: string, endDate: string): ValidationResult => {
  if (!startDate) return { isValid: false, error: 'Start date is required.' };
  if (!endDate) return { isValid: false, error: 'End date is required.' };
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date selection.' };
  }
  if (start > end) {
    return { isValid: false, error: 'Start date cannot be after end date.' };
  }
  return { isValid: true };
};
