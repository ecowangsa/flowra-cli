const Container = require('./Container');
const compose = require('./compose');

function buildContainer() {
  const container = new Container();
  return compose(container);
}

module.exports = {
  Container,
  buildContainer,
  compose,
};
