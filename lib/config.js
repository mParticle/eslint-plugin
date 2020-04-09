const path = require('path');
let { ENVIRONMENT } = process.env;
let config, mpConfig, pathFromRoot;

if (ENVIRONMENT === 'testing') {
    mpConfig = require('../tests/mp.config.json');
} else {
    mpConfig = require('../../../../mp.config.json');
}

pathFromRoot = mpConfig.planningConfig.dataPlanVersionFile;

if (ENVIRONMENT === 'testing') {
    dataPlanPath = path.resolve('tests', pathFromRoot);
} else {
    dataPlanPath = path.resolve(pathFromRoot);
}

module.exports = { dataPlanPath };
