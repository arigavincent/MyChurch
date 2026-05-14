function camelizeKey(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function serializeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => [camelizeKey(key), serializeValue(innerValue)])
    );
  }

  return value;
}

function camelizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [camelizeKey(key), serializeValue(value)])
  );
}

function serializeRows(rows) {
  return rows.map(camelizeRow);
}

module.exports = {
  camelizeRow,
  serializeRows,
};
