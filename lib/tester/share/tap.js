process.env.TAP_COLORS = 1;
process.env.TAP_USE_TTY = 1;

let tap = require('tap');
let tapMochaReporter = require('tap-mocha-reporter');

tap.unpipe(process.stdout);
tap.pipe(tapMochaReporter('classic'));

tap.Test.prototype.addAssert('approx', 3, function (found, wanted, maxDifferent, message, extra ) {
  let diff = Math.abs(found - wanted);

  maxDifferent = maxDifferent || 0.0001;
  message = message || `should be approximate (${maxDifferent})`;

  if ( diff <= maxDifferent ) {
    return this.pass(message, extra);
  }

  extra.found = found;
  extra.wanted = wanted;
  extra.compare = '~=';

  return this.fail(message, extra);
});

tap.Test.prototype.addAssert('notApprox', 3, function (found, wanted, maxDifferent, message, extra ) {
  let diff = Math.abs(found - wanted);

  maxDifferent = maxDifferent || 0.0001;
  message = message || `should be not approximate (${maxDifferent})`;

  if ( diff > maxDifferent ) {
    return this.pass(message, extra);
  }

  extra.found = found;
  extra.wanted = wanted;
  extra.compare = '!~=';

  return this.fail(message, extra);
});

module.exports = tap;
