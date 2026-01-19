/**
 * Unit tests for validation utilities
 */

const {
  validateNonEmptyString,
  validateDateString,
  validateFilePath,
  validatePositiveInteger,
  validateOneOf,
  validateArray,
  validateURL,
} = require('../validation');

describe('validation utilities', () => {
  describe('validateNonEmptyString', () => {
    it('should pass for valid non-empty string', () => {
      expect(() => {
        validateNonEmptyString('test', 'field');
      }).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => {
        validateNonEmptyString('', 'field');
      }).toThrow(/must be a non-empty string/);
    });

    it('should throw for whitespace-only string', () => {
      expect(() => {
        validateNonEmptyString('   ', 'field');
      }).toThrow(/must be a non-empty string/);
    });

    it('should throw for non-string values', () => {
      expect(() => {
        validateNonEmptyString(123, 'field');
      }).toThrow(/must be a string/);

      expect(() => {
        validateNonEmptyString(null, 'field');
      }).toThrow(/must be a string/);

      expect(() => {
        validateNonEmptyString(undefined, 'field');
      }).toThrow(/must be a string/);
    });
  });

  describe('validateDateString', () => {
    it('should pass for valid ISO 8601 date', () => {
      expect(() => {
        validateDateString('2025-01-15', 'date');
      }).not.toThrow();
    });

    it('should return null for empty value when not required', () => {
      const result = validateDateString(null, 'date', false);
      expect(result).toBeNull();
    });

    it('should throw for invalid date string', () => {
      expect(() => {
        validateDateString('invalid-date', 'date');
      }).toThrow(/must be a valid ISO 8601 date string/);
    });

    it('should throw for required empty value', () => {
      expect(() => {
        validateDateString(null, 'date', true);
      }).toThrow(/is required/);
    });

    it('should throw for non-string values', () => {
      expect(() => {
        validateDateString(123, 'date');
      }).toThrow(/must be a string/);
    });
  });

  describe('validateFilePath', () => {
    it('should pass for valid file path', () => {
      expect(() => {
        validateFilePath('./test.md', '.md');
      }).not.toThrow();
    });

    it('should throw for wrong extension', () => {
      expect(() => {
        validateFilePath('./test.txt', '.md');
      }).toThrow(/must end with/);
    });

    it('should throw for empty path when required', () => {
      expect(() => {
        validateFilePath(null, '.md', true);
      }).toThrow(/is required/);
    });

    it('should not throw for empty path when not required', () => {
      expect(() => {
        validateFilePath(null, '.md', false);
      }).not.toThrow();
    });
  });

  describe('validatePositiveInteger', () => {
    it('should pass for valid positive integer', () => {
      expect(() => {
        validatePositiveInteger(5, 'number');
      }).not.toThrow();
    });

    it('should pass for minimum value', () => {
      expect(() => {
        validatePositiveInteger(1, 'number', 1);
      }).not.toThrow();
    });

    it('should throw for negative number', () => {
      expect(() => {
        validatePositiveInteger(-1, 'number');
      }).toThrow(/must be at least/);
    });

    it('should throw for non-integer', () => {
      expect(() => {
        validatePositiveInteger(5.5, 'number');
      }).toThrow(/must be an integer/);
    });

    it('should throw for value below minimum', () => {
      expect(() => {
        validatePositiveInteger(0, 'number', 1);
      }).toThrow(/must be at least/);
    });

    it('should throw for non-number', () => {
      expect(() => {
        validatePositiveInteger('5', 'number');
      }).toThrow(/must be a number/);
    });
  });

  describe('validateOneOf', () => {
    it('should pass for valid value', () => {
      expect(() => {
        validateOneOf('json', ['json', 'markdown'], 'format');
      }).not.toThrow();
    });

    it('should throw for invalid value', () => {
      expect(() => {
        validateOneOf('xml', ['json', 'markdown'], 'format');
      }).toThrow(/must be one of/);
    });
  });

  describe('validateArray', () => {
    it('should pass for valid array', () => {
      expect(() => {
        validateArray([1, 2, 3], 'items');
      }).not.toThrow();
    });

    it('should throw for non-array', () => {
      expect(() => {
        validateArray('not-array', 'items');
      }).toThrow(/must be an array/);
    });

    it('should validate array items with validator', () => {
      const stringValidator = (item, name) => {
        if (typeof item !== 'string') {
          throw new Error(`${name} must be a string`);
        }
      };

      expect(() => {
        validateArray(['a', 'b', 'c'], 'items', stringValidator);
      }).not.toThrow();

      expect(() => {
        validateArray(['a', 123, 'c'], 'items', stringValidator);
      }).toThrow(/Invalid item in items/);
    });
  });

  describe('validateURL', () => {
    it('should pass for valid URL', () => {
      expect(() => {
        validateURL('https://example.com', 'url');
      }).not.toThrow();
    });

    it('should return null for empty value when not required', () => {
      const result = validateURL(null, 'url', false);
      expect(result).toBeNull();
    });

    it('should throw for invalid URL', () => {
      expect(() => {
        validateURL('not-a-url', 'url');
      }).toThrow(/must be a valid URL/);
    });

    it('should throw for required empty value', () => {
      expect(() => {
        validateURL(null, 'url', true);
      }).toThrow(/is required/);
    });
  });
});
