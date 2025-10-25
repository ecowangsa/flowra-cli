class SystemInfoQuery {
  async execute() {
    const environment = process.env.NODE_ENV || 'development';
    const nodeVersion = process.version;
    const uptime = process.uptime();

    return {
      environment,
      nodeVersion,
      uptime,
    };
  }
}

module.exports = SystemInfoQuery;
