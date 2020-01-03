/* mParticle is set on the window, which doesn't exist in node
JSDom mocks the window to prevent errors
*/
const Helpers = require('../helpers');
const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const window = new JSDOM().window;
global.window = window;
Helpers.tryMockForAtom();
const dataPlanning = require('@mparticle/data-planning-node');
const mParticle = require('@mparticle/web-sdk');
const lint = Helpers.lint;
const getErrorMessageBySchemaKeyword = Helpers.getErrorMessageBySchemaKeyword;
const DPS = new dataPlanning.DataPlanService();
const path = require('path');
const { processEventName } = require('../process-arguments/event-name');
const { processEventType } = require('../process-arguments/event-type');
const {
    processCustomAttributes,
} = require('../process-arguments/event-attributes');

let dataplan;

try {
    let { dataPlanPath } = require('../config');
    dataplan = require(dataPlanPath);
} catch (error) {
    console.error('Data Plan Error', error);
}

const MessageType = {
    SessionStart: 1,
    SessionEnd: 2,
    PageView: 3,
    PageEvent: 4,
    CrashReport: 5,
    OptOut: 6,
    AppStateTransition: 10,
    Profile: 14,
    Commerce: 16,
    UserAttributeChange: 17,
    UserIdentityChange: 18,
    Media: 20,
};
// ==========================================================================================
module.exports = {
    create: function(context) {
        const logEventReferences = [];
        return {
            MemberExpression(node) {
                debugger;
                // Lint if data plan is not found to alert developer
                if (!dataplan) {
                    lint(
                        context,
                        node,
                        'Your mParticle data plan was not found. Please be sure to reference your data plan properly in mp.config.json and try again.'
                    );
                    return;
                }

                if (node.object && node.object.name === 'mParticle') {
                    if (node.parent.callee) {
                        /* Scenario 1. Check Direct Calls to Log Event
                            For example:
                                mParticle.logEvent('test');
                        */
                        checkDirectCallsToMP(context, node);
                    } else {
                        /*  Scenario 2. Find indirect calls to log event, then on Program:exit, complete validation
                            This must happen in Program:exit because only once the entire page is read will
                            the required references be available
                                For example:
                                    const mpLogEvent = mParticle.logEvent
                                    mpLogEvent('test') // will still be linted
                        */
                        findIndirectCallsToMPLogEvent(node, logEventReferences);
                    }
                }
            },

            /* --------------------Program:exit fires-------------------- */
            'Program:exit'(node) {
                // Validates and concludes indirect calls to log event from Scenario 2 above
                checkIndirectCallsToMP(context, logEventReferences);
            },
        };
    },
};

function checkDirectCallsToMP(context, node) {
    switch (node.property.name) {
        case 'logEvent':
            validateAndLintLogEvent(context, node.parent.callee);
    }
}

function findIndirectCallsToMPLogEvent(node, logEventReferences) {
    // if parent is not a variable declarator, it does not reference logEvent
    if (node.parent.type === 'VariableDeclarator') {
        logEventReferences.push(node);
    }
}

function checkIndirectCallsToMP(context, logEventReferences) {
    logEventReferences.forEach(mpLogEventRef => {
        context
            // Passing in a VariableDeclarator to getDeclaredVariables will always return an array
            // with the original declarator on it, we want to grab each reference and lint them
            .getDeclaredVariables(mpLogEventRef.parent)[0]
            .references.forEach(ref => {
                if (
                    ref.identifier &&
                    ref.identifier.parent &&
                    ref.identifier.parent.type === 'CallExpression'
                ) {
                    validateAndLintLogEvent(
                        context,
                        ref.identifier.parent.callee
                    );
                }
            });
    });
}

function validateAndLintLogEvent(context, node) {
    try {
        if (node.parent && node.parent.arguments.length === 0) {
            lint(
                context,
                node,
                'mParticle.logEvent needs at least an eventName passed to it'
            );
            return null;
        }
        // create an event which is required to make a batch
        const result = createEventAndLintingInfo(
            context,
            node.parent.arguments
        );

        // If the event is broken, or linting is not yet supported, there is no event and we do not try to lint anymore
        if (!result) {
            return;
        }
        // create a batch to validate
        const batch = mParticle._BatchValidator.returnBatch(result.event);
        const validations = DPS.validateEvent(
            batch.events[0],
            dataplan.version_document
        );
        // should there ever be more than 1 validation error? right now always returning just one
        // console.log(JSON.stringify(validations));
        lintValidations(context, node, result.lintingInfo, validations);
    } catch (error) {
        console.log('caught in try/catch:', error);
    }
}

// This function loops through the arguments (4 max) to create an MP event
function createEventAndLintingInfo(context, args) {
    var lintingInfo = {};
    // `logEvent` generates an event with messageType of PageEvent
    const event = { messageType: MessageType.PageEvent };
    const LintTypeEnum = {
        EventName: 0,
        EventType: 1,
        CustomAttributes: 2,
    };

    for (var i = 0; i < args.length; i++) {
        let processFunction;
        if (i === LintTypeEnum.EventName) {
            processFunction = processEventName;
        }
        if (i === LintTypeEnum.EventType) {
            processFunction = processEventType;
        }
        if (i === LintTypeEnum.CustomAttributes) {
            processFunction = processCustomAttributes;
        }
        result = processFunction(context, event, lintingInfo, args[i]);
        if (!result) {
            return null;
        }
    }

    return {
        event,
        lintingInfo,
    };
}

function lintValidations(context, MPCaller, lintingInfo, validations) {
    var errorMessage;
    validations.results.forEach(result => {
        if (result.data && result.data.validation_errors) {
            result.data.validation_errors.forEach(function(error) {
                if (result.data.match.type === 'custom_event') {
                    result.data.validation_errors.forEach(error => {
                        if (error.schema_keyword) {
                            errorMessage = getErrorMessageBySchemaKeyword(
                                error.schema_keyword,
                                error.expected
                            );
                        } else {
                            errorMessage = 'Unplanned.';
                        }
                        // lint custom events
                        var errorLength = error.error_pointer.split('/').length;
                        // full error can be: '#/data/custom_attributes/attributeName'
                        switch (errorLength) {
                            case 1:
                                lint(
                                    context,
                                    MPCaller,
                                    errorMessage,
                                    lintingInfo.event_name.loc
                                );
                                return;
                            case 2:
                            case 3:
                            case 4:
                                lint(
                                    context,
                                    MPCaller,
                                    errorMessage,
                                    lintingInfo.custom_attributes
                                        ? lintingInfo.custom_attributes.loc
                                        : lintingInfo.event_name.loc
                                );
                                return;
                            default:
                                lint(
                                    context,
                                    MPCaller,
                                    errorMessage,
                                    lintingInfo.loc
                                );
                                return;
                        }
                    });
                } else if (
                    error.error_pointer.match.type === 'user_attributes'
                ) {
                    console.log(
                        'lint user attribute error',
                        error.error_pointer
                    );
                }
            });
        }
    });
}
