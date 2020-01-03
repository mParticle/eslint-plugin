module.exports = {
    configs: {
        'data-planning': {
            rules: {
                '@mparticle/data-planning': 'error',
            },
        },
    },
    rules: {
        'data-planning': require('./rules/data-planning'),
    },
};
