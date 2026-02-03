const validator = require('validator');
const DatabaseManager = require('../Infrastructure/Database/database.manager');

class Validation {
  constructor(rules, { logger = null, connection = 'default' } = {}) {
    this.rules = rules || {};
    this.logger = logger;
    this.connectionName = connection;
    this.manager = DatabaseManager.getInstance();
    this.knex = this.manager.connection(this.connectionName);
  }

  async validate(data) {
    const errors = [];
    if (!this.rules) {
      throw new Error('Validation rules are not defined');
    }

    const keys = Object.keys(this.rules);
    for (const key of keys) {
      const rule = this.rules[key];
      const value = data[key];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rule.in && !rule.in.includes(value)) {
        errors.push(`Invalid value for ${key}, the allowed values are ${rule.in}`);
      } else if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${key} must be at least ${rule.minLength} characters long`);
      } else if (rule.is_email && !validator.isEmail(String(value))) {
        errors.push(`${key} must be a valid email address`);
      } else if (rule.alpha_numeric && !validator.isAlphanumeric(String(value))) {
        errors.push(`${key} must contain only letters and numbers`);
      } else if (rule.alpha_numeric_space && !validator.isAlphanumeric(String(value).replace(/\s/g, ''))) {
        errors.push(`${key} must contain only letters, numbers, and spaces`);
      } else if (rule.valid_json && !validator.isJSON(String(value))) {
        errors.push(`${key} must be a valid JSON string`);
      } else if (rule.valid_url && !validator.isURL(String(value))) {
        errors.push(`${key} must be a valid URL`);
      } else if (rule.valid_ip && !validator.isIP(String(value))) {
        errors.push(`${key} must be a valid IP address`);
      } else if (rule.alpha_dash && !validator.isAlphanumeric(String(value).replace(/-/g, ''))) {
        errors.push(`${key} must contain only letters, numbers, and dashes`);
      } else if (rule.alpha_space && !validator.isAlpha(String(value).replace(/\s/g, ''))) {
        errors.push(`${key} must contain only letters and spaces`);
      } else if (rule.alpha_numeric_punct && !validator.isAlphanumeric(String(value).replace(/[^\w\s,.?!]/g, ''))) {
        errors.push(`${key} must contain only letters, numbers, and punctuation marks`);
      } else if (rule.regex_match && !validator.matches(String(value), rule.regex_match)) {
        errors.push(`${key} is not in the correct format`);
      } else if (rule.valid_date && !validator.isDate(String(value))) {
        errors.push(`${key} must be a valid date`);
      } else if (rule.valid_cc_number && !validator.isCreditCard(String(value))) {
        errors.push(`${key} must be a valid credit card number`);
      }

      if (rule.is_unique && value) {
        const [table, column] = rule.is_unique.split('.');
        try {
          const result = await this.knex(table).where(column, value).count({ count: '*' });
          const countResult = Array.isArray(result) ? result[0] : result;
          const count = countResult.count || countResult['count(*)'] || 0;
          if (Number(count) > 0) {
            errors.push(`column ${key}, value: ${value} already exists`);
          }
        } catch (error) {
          this.logger?.error('validation.unique_check_failed', {
            table,
            column,
            value,
            message: error.message,
          });
          errors.push(`Unable to validate uniqueness for ${key}`);
        }
      }
    }

    return errors;
  }

  async validateRequest(req) {
    const data = { ...req.body, ...req.query, ...req.params };
    return this.validate(data);
  }

  middleware() {
    return async (req, res, next) => {
      try {
        const errors = await this.validateRequest(req);
        if (errors.length > 0) {
          res.status(400).json({ errors });
        } else {
          next();
        }
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = Validation;
