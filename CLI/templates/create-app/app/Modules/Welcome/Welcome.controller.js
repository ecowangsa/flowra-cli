const BaseController = require('../Shared/controllers/BaseController');

class WelcomeController extends BaseController {
  constructor({ logger, welcomeService } = {}) {
    super({ logger });
    this.logger = logger;
    this.welcomeService = welcomeService;
  }

  index = async (req, res, next) => {
    try {
      const log = req.logger || this.logger;
      log?.info('http.modules.welcome.index');

      const context = await this.welcomeService.getLandingPageContext();
      return res.render('welcome', context);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = WelcomeController;
