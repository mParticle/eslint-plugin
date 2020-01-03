const path = require('path');
let { ENVIRONMENT } = process.env;
let config, mpConfig, pathFromRoot;

if (ENVIRONMENT === 'testing') {
    mpConfig = require('../tests/mp.config.json');
} else {
    mpConfig = require('../../../../mp.config.json');
}

pathFromRoot = path.join(
    mpConfig.planningConfig.baseDir,
    mpConfig.planningConfig.dataPlanVersionFile
);

if (ENVIRONMENT === 'testing') {
    dataPlanPath = path.join('../..', 'tests', pathFromRoot);
} else {
    dataPlanPath = path.join('../../../../../', pathFromRoot);
}

module.exports = { dataPlanPath };
