const registerCore = require('./registerCore');
const registerInfrastructure = require('./registerInfrastructure');
const registerModules = require('./registerModules');

function compose(container) {
  [registerCore, registerInfrastructure, registerModules].forEach((register) => {
    register(container);
  });

  return container;
}

module.exports = compose;
