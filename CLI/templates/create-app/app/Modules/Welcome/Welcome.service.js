class WelcomeService {
  constructor({ systemInfoQuery, logger }) {
    this.systemInfoQuery = systemInfoQuery;
    this.logger = logger;
  }

  async getLandingPageContext() {
    const systemInfo = await this.systemInfoQuery.execute();

    const context = {
      metadata: {
        environment: systemInfo.environment,
        nodeVersion: systemInfo.nodeVersion,
        uptime: this.formatUptime(systemInfo.uptime),
      },
      githubLink: 'https://github.com/ecowangsa/flowra',
      currentYear: new Date().getFullYear(),
    };

    this.logger?.debug('welcome.service.context_resolved', context.metadata);

    return context;
  }

  formatUptime(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return 'Unknown';
    }

    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours = Math.floor((totalSeconds / 3600) % 24);
    const days = Math.floor(totalSeconds / 86400);

    const parts = [];

    if (days) {
      parts.push(`${days} day${days === 1 ? '' : 's'}`);
    }
    if (hours) {
      parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    }
    if (minutes) {
      parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    }
    if (!parts.length || seconds) {
      parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
    }

    return parts.join(', ');
  }
}

module.exports = WelcomeService;
