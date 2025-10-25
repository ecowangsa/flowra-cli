function splitWords(value) {
  if (!value) {
    return [];
  }

  const cleaned = String(value)
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .trim();

  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .filter(Boolean);
}

function toKebabCase(value) {
  return splitWords(value).join('-');
}

function toSnakeCase(value) {
  return splitWords(value).join('_');
}

function toPascalCase(value) {
  const words = splitWords(value);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function toCamelCase(value) {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toConstantCase(value) {
  return splitWords(value)
    .join('_')
    .toUpperCase();
}

module.exports = {
  splitWords,
  toKebabCase,
  toSnakeCase,
  toPascalCase,
  toCamelCase,
  toConstantCase,
};
