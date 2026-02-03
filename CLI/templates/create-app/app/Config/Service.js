const moment = require("moment-timezone");
const createLogger = require("../../core/Services/LoggerService");
const loggerConfig = require("./Logger");
const logger = createLogger(loggerConfig);

class Service {
  static databaseManager = null;

  static setDatabaseManager(manager) {
    Service.databaseManager = manager;
  }

  static getDatabaseManager() {
    return Service.databaseManager;
  }

  constructor(connectionOrKnex, configName = "default", options = {}) {
    const connectionName =
      typeof connectionOrKnex === "string" || connectionOrKnex == null
        ? connectionOrKnex || configName || "default"
        : configName;
    const manager = Service.databaseManager;
    const knexInstance =
      typeof connectionOrKnex === "string" || connectionOrKnex == null
        ? manager?.connection?.(connectionName)
        : connectionOrKnex;

    if (!knexInstance) {
      throw new Error(
        "Database connection is not configured. Ensure DatabaseManager is initialised."
      );
    }

    this.knex = knexInstance;
    this.configName = connectionName;

    this.readKnexInstance = null;

    this.tableName = "";
    this.primaryKey = "id";
    this.allowedFields = [];

    this.timestamps = false;
    this.softDelete = false;

    this.outputTimezone = options.outputTimezone || "UTC";
    this.dateFormat = options.dateFormat || "YYYY-MM-DD HH:mm:ss";
    this.dateFields = options.dateFields || [
      "createdAt",
      "updatedAt",
      "deletedAt",
    ];
  }

  readKnex() {
    if (this.readKnexInstance) return this.readKnexInstance;
    const readName = `${this.configName}Read`;

    try {
      const manager = Service.databaseManager;
      if (!manager || typeof manager.connection !== "function") {
        throw new Error("DatabaseManager is not initialised.");
      }
      this.readKnexInstance = manager.connection(readName);
    } catch (err) {
      logger.warn(
        `Read DB [${readName}] unavailable. Falling back to primary [${this.configName}]`
      );
      logger.warn(err.message);
      this.readKnexInstance = this.knex;
    }

    return this.readKnexInstance;
  }

  write() {
    return this.knex(this.tableName);
  }

  read() {
    return this.readKnex()(this.tableName);
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

  raw(expr) {
    return this.knex.raw(expr);
  }

  _pkFields() {
    return Array.isArray(this.primaryKey)
      ? this.primaryKey
      : [this.primaryKey];
  }

  _isCompositePK() {
    return Array.isArray(this.primaryKey);
  }

  async _fetchByPk(idOrObj, useRead = true) {
    const qb = useRead ? this.read() : this.write();

    if (!this._isCompositePK()) {
      qb.where(this.primaryKey, typeof idOrObj === "object"
        ? idOrObj[this.primaryKey]
        : idOrObj);
    } else {
      for (const f of this._pkFields()) {
        qb.where(f, idOrObj[f]);
      }
    }

    return qb.first();
  }

  filterFields(data) {
    if (!this.allowedFields.length) return data;
    const out = {};
    for (const f of this.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, f)) {
        out[f] = data[f];
      }
    }
    return out;
  }

  _nowDb() {
    return this.knex.raw("UTC_TIMESTAMP()");
  }

  _formatDate(value) {
    if (!value) return value;
    const m = moment(value);
    if (!m.isValid()) return value;
    return m.tz(this.outputTimezone).format(this.dateFormat);
  }

  _serializeResult(result) {
    if (Array.isArray(result)) return result.map(r => this._serializeRow(r));
    return this._serializeRow(result);
  }

  _serializeRow(row) {
    if (!row) return row;
    const out = { ...row };
    for (const f of this.dateFields) {
      if (out[f]) out[f] = this._formatDate(out[f]);
    }
    return out;
  }

  async save(data) {
    const extra = this.timestamps ? ["createdAt", "updatedAt"] : [];

    const now = this._nowDb();
    const payload = { ...data };

    return this._withTempAllowed(extra, async () => {
      if (this.timestamps) {
        payload.createdAt = now;
        payload.updatedAt = now;
      }

      const filtered = this.filterFields(payload);

      const inserted = await this.write().insert(filtered);
      const pk = filtered[this.primaryKey] ?? inserted?.[0];

      const record = pk ? await this._fetchByPk(pk, false) : filtered;
      return this._serializeRow(record);
    });
  }

  async saveBulk(dataArray, options = {}) {
    const { chunkSize = 500, trx = null } = options;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error("saveBulk expects a non-empty array of data objects.");
    }

    const extra = this.timestamps ? ["createdAt", "updatedAt"] : [];
    const now = this._nowDb();

    const writer = trx ? trx(this.tableName) : this.write();

    return this._withTempAllowed(extra, async () => {
      const recordsToInsert = dataArray.map((data) => {
        const payload = { ...(data || {}) };

        if (this.timestamps) {
          payload.createdAt = now;
          payload.updatedAt = now;
        }

        return this.filterFields(payload);
      });

      try {
        for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
          const chunk = recordsToInsert.slice(i, i + chunkSize);
          await writer.insert(chunk);
        }

        return recordsToInsert;
      } catch (error) {
        logger.error(`Save bulk error: ${error.message}`, { stack: error.stack });
        throw error;
      }
    });
  }


  async update(idOrObj, data) {
    return this._withTempAllowed(
      this.timestamps ? ["updatedAt"] : [],
      async () => {
        const now = this._nowDb();
        const payload = { ...data };

        if (this.timestamps) payload.updatedAt = now;

        const filtered = this.filterFields(payload);

        const qb = this.write();
        if (this._isCompositePK()) {
          this._pkFields().forEach(f => qb.where(f, idOrObj[f]));
        } else {
          qb.where(this.primaryKey, idOrObj);
        }

        await qb.update(filtered);
        return this._serializeRow(await this._fetchByPk(idOrObj, false));
      }
    );
  }

  async delete(idOrObj) {
    const existing = await this._fetchByPk(idOrObj, false);
    if (!existing) throw new Error("Record not found");

    if (!this.softDelete) {
      const qb = this.write();
      if (this._isCompositePK()) {
        this._pkFields().forEach(f => qb.where(f, idOrObj[f]));
      } else qb.where(this.primaryKey, idOrObj);

      await qb.del();
      return this._serializeRow(existing);
    }

    const patch = { deletedAt: this._nowDb() };
    if (this.timestamps) patch.updatedAt = this._nowDb();

    const qb = this.write();
    if (this._isCompositePK()) {
      this._pkFields().forEach(f => qb.where(f, idOrObj[f]));
    } else qb.where(this.primaryKey, idOrObj);

    await qb.update(patch);
    return this._serializeRow(await this._fetchByPk(idOrObj, false));
  }

  _withTempAllowed(extra, fn) {
    const orig = [...this.allowedFields];
    try {
      extra.forEach(f => {
        if (!this.allowedFields.includes(f)) this.allowedFields.push(f);
      });
      return fn();
    } finally {
      this.allowedFields = orig;
    }
  }
}

module.exports = Service;
