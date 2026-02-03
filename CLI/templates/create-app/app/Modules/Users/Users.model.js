const Model = require('../../Config/Model');

class UsersModel extends Model {
  constructor(connection = 'default') {
    super(connection);
    this.setTable('users');
    this.setPrimaryKey('id');
    this.setAllowedFields(['id', 'username', 'email', 'password']);
    this.setTimestamps(true);
    this.setSoftDelete(false);
  }

  async findAll() {
    return this.read().select('*').whereNull('deletedAt');
  }
}

module.exports = UsersModel;
