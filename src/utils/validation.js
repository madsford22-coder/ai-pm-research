/**
 * Validation utilities
 * 
 * Provides type checking and input validation functions for common patterns.
 * All validation functions throw descriptive errors to help catch bugs early.
 * 
 * @module utils/validation
 */

/**
 * Validate that a value is a non-empty string
 * @param {any} value - Value to validate
 * @param {string} name - Name of the field (for error messages)
 * @throws {Error} If validation fails
 */
function validateNonEmptyString(value, name) {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string, got ${typeof value}`);
  }
  
  if (value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Validate that a value is a valid date string (ISO 8601)
 * @param {any} value - Value to validate
 * @param {string} name - Name of the field
 * @param {boolean} required - Whether the value is required (default: false)
 * @returns {string|null} Validated date string, or null if not required and not provided
 * @throws {Error} If validation fails
 */
function validateDateString(value, name, required = false) {
  if (!value) {
    if (required) {
      throw new Error(`${name} is required`);
    }
    return null;
  }
  
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string, got ${typeof value}`);
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${name} must be a valid ISO 8601 date string, got: ${value}`);
  }
  
  return value;
}

/**
 * Validate file path
 * @param {string} filePath - Path to validate
 * @param {string} extension - Expected extension (e.g., '.md')
 * @param {boolean} required - Whether the value is required (default: true)
 * @throws {Error} If validation fails
 */
function validateFilePath(filePath, extension = null, required = true) {
  if (!filePath) {
    if (required) {
      throw new Error('filePath is required');
    }
    return;
  }
  
  validateNonEmptyString(filePath, 'filePath');
  
  if (extension && !filePath.endsWith(extension)) {
    throw new Error(`filePath must end with ${extension}, got: ${filePath}`);
  }
}

/**
 * Validate that a value is a positive integer
 * @param {any} value - Value to validate
 * @param {string} name - Name of the field
 * @param {number} min - Minimum value (default: 1)
 * @throws {Error} If validation fails
 */
function validatePositiveInteger(value, name, min = 1) {
  if (typeof value !== 'number') {
    throw new Error(`${name} must be a number, got ${typeof value}`);
  }
  
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, got ${value}`);
  }
  
  if (value < min) {
    throw new Error(`${name} must be at least ${min}, got ${value}`);
  }
}

/**
 * Validate that a value is one of the allowed values
 * @param {any} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} name - Name of the field
 * @throws {Error} If validation fails
 */
function validateOneOf(value, allowedValues, name) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${name} must be one of [${allowedValues.join(', ')}], got: ${value}`);
  }
}

/**
 * Validate that a value is an array
 * @param {any} value - Value to validate
 * @param {string} name - Name of the field
 * @param {Function} itemValidator - Optional validator for each item
 * @throws {Error} If validation fails
 */
function validateArray(value, name, itemValidator = null) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array, got ${typeof value}`);
  }
  
  if (itemValidator) {
    value.forEach((item, index) => {
      try {
        itemValidator(item, `${name}[${index}]`);
      } catch (error) {
        throw new Error(`Invalid item in ${name}: ${error.message}`);
      }
    });
  }
}

/**
 * Validate URL string
 * @param {any} value - Value to validate
 * @param {string} name - Name of the field
 * @param {boolean} required - Whether the value is required (default: false)
 * @returns {string|null} Validated URL string, or null if not required and not provided
 * @throws {Error} If validation fails
 */
function validateURL(value, name, required = false) {
  if (!value) {
    if (required) {
      throw new Error(`${name} is required`);
    }
    return null;
  }
  
  validateNonEmptyString(value, name);
  
  try {
    new URL(value);
    return value;
  } catch (error) {
    throw new Error(`${name} must be a valid URL, got: ${value}`);
  }
}

module.exports = {
  validateNonEmptyString,
  validateDateString,
  validateFilePath,
  validatePositiveInteger,
  validateOneOf,
  validateArray,
  validateURL,
};
