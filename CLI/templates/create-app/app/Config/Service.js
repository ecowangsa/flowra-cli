const DatabaseManager = require('../Infrastructure/Database/database.manager');
let sharedManager;

class Service {
  constructor(connectionName = 'default') {
    sharedManager = sharedManager || DatabaseManager.getInstance();
    this.knex = sharedManager.connection(connectionName);
    this.tableName = '';
    this.primaryKey = 'id';
    this.allowedFields = [];
    this.timestamps = false;
    this.softDelete = false;
    this.queryBuilder = this.knex.queryBuilder();
  }

  static setDatabaseManager(manager) {
    sharedManager = manager;
  }

  setTable(name) {
    this.tableName = name;
    return this;
  }

  setPrimaryKey(key) {
    this.primaryKey = key;
    return this;
  }

  setAllowedFields(fields) {
    this.allowedFields = fields;
    return this;
  }

  setTimestamps(enabled) {
    this.timestamps = enabled;
    return this;
  }

  setSoftDelete(enabled) {
    this.softDelete = enabled;
    return this;
  }

  flowra() {
    return this.knex(this.tableName);
  }

  raw(column) {
    return this.knex.raw(column);
  }

  _pkFields() {
    return Array.isArray(this.primaryKey) ? this.primaryKey : [this.primaryKey];
  }

  _isCompositePK() {
    return Array.isArray(this.primaryKey);
  }

  _extractPkFromData(data) {
    const fields = this._pkFields();
    const pkObj = {};
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(data, f)) pkObj[f] = data[f];
      else return null;
    }
    return pkObj;
  }

  _applyPkWhere(qb, idOrObj) {
    if (!this._isCompositePK()) {
      if (idOrObj && typeof idOrObj === 'object') {
        return qb.where(this.primaryKey, idOrObj[this.primaryKey]);
      }
      return qb.where(this.primaryKey, idOrObj);
    }
    const fields = this._pkFields();
    for (const f of fields) {
      if (!idOrObj || typeof idOrObj[f] === 'undefined') {
        throw new Error(`Composite primary key requires object with keys: ${fields.join(', ')}`);
      }
      qb.where(f, idOrObj[f]);
    }
    return qb;
  }

  filterFields(data) {
    if (!this.allowedFields.length) {
      return data;
    }
    return Object.keys(data)
      .filter((field) => this.allowedFields.includes(field))
      .reduce((obj, key) => ({ ...obj, [key]: data[key] }), {});
  }

  async save(data) {
    const now = new Date().toISOString();
    const originalAllowedFields = [...this.allowedFields];
    if (this.timestamps) {
      this.allowedFields.push('createdAt', 'updatedAt');
      data.createdAt = now;
      data.updatedAt = now;
    }

    const filteredData = this.filterFields(data);

    const trx = this.knex(this.tableName);
    const inserted = await trx.insert(filteredData);
    const qb = this.knex(this.tableName);
    if (this._isCompositePK()) {
      const pkObj = this._extractPkFromData(filteredData);
      if (!pkObj) {
        this.allowedFields = originalAllowedFields;
        return [{ ...filteredData }];
      }
      this._applyPkWhere(qb, pkObj);
    } else {
      if (Object.prototype.hasOwnProperty.call(filteredData, this.primaryKey)) {
        qb.where(this.primaryKey, filteredData[this.primaryKey]);
      } else {
        qb.where(this.primaryKey, inserted[0]);
      }
    }
    const record = await qb;
    this.allowedFields = originalAllowedFields;
    return record;
  }

  async saveBulk(dataArray) {
    const now = new Date().toISOString();
    const originalAllowedFields = [...this.allowedFields];

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('saveBulk expects a non-empty array of data objects.');
    }

    const recordsToInsert = dataArray.map((data) => {
      const record = this.filterFields(data);
      if (this.timestamps) {
        record.createdAt = now;
        record.updatedAt = now;
      }
      return record;
    });

    await this.knex(this.tableName).insert(recordsToInsert);
    this.allowedFields = originalAllowedFields;
    return recordsToInsert;
  }

  async update(idOrObj, data) {
    const now = new Date().toISOString();
    const originalAllowedFields = [...this.allowedFields];
    if (this.timestamps) {
      if (!this.allowedFields.includes('updatedAt')) this.allowedFields.push('updatedAt');
      data.updatedAt = now;
    }

    const filteredData = this.filterFields(data);

    const qb = this.knex(this.tableName);
    this._applyPkWhere(qb, idOrObj);
    const result = await qb.update(filteredData);
    if (result === 0) {
      this.allowedFields = originalAllowedFields;
      throw new Error('Record not found for given primary key');
    }
    const fetchQ = this.knex(this.tableName);
    this._applyPkWhere(fetchQ, idOrObj);
    const record = await fetchQ;
    this.allowedFields = originalAllowedFields;
    return record;
  }

  async delete(idOrObj) {
    const recordQ = this.knex(this.tableName);
    this._applyPkWhere(recordQ, idOrObj);
    const recordToDelete = await recordQ;

    const now = new Date().toISOString();

    if (this.softDelete) {
      const originalAllowedFields = [...this.allowedFields];
      if (!this.allowedFields.includes('deletedAt')) {
        this.allowedFields.push('deletedAt');
      }
      const deletedData = { deletedAt: now };
      const res = await this.update(idOrObj, deletedData);
      this.allowedFields = originalAllowedFields;
      return res || recordToDelete;
    }

    const delQ = this.knex(this.tableName);
    this._applyPkWhere(delQ, idOrObj);
    await delQ.del();
    return recordToDelete;
  }
}

module.exports = Service;
