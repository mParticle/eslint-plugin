function lint(context, node, message, loc) {
    const reporter = {
        node,
        message,
    };
    if (loc) {
        reporter.loc = loc;
    }
    context.report(reporter);
}

// Atom has an issue loading because when we mock a window, Axios thinks Atom is a Standard Browser Environment
// So we need to mock a function to properly return
function tryMockForAtom() {
    try {
        global.document.createElement = function() {
            return {
                href: 'mpHref',
                setAttribute: function() {},
                protocol: 'mp://',
                host: 'mpHost',
                search: 'mpSearch',
                hash: 'mpHash',
                hostname: 'mpHostname',
                port: 'mpPort',
                pathname: 'mpPathnam',
            };
        };
    } catch (e) {
        console.log(
            'mParticle eslint-plugin loaded in a non-Atom environment. Proceeding...'
        );
    }
}

let i = 0;
function findRef(references, arg) {
    // this is to account for stack overflowing
    i++;
    if (i > 50) {
        i = 0;
        return;
    }
    const firstLvlRefs = references.filter(ref => {
        return (
            ref.identifier.name === arg.name &&
            ref.writeExpr &&
            ref.writeExpr.start < arg.start
        );
    });

    // Grab the last reference since the ones before that don't matter
    if (firstLvlRefs.length) {
        const lastRef = firstLvlRefs[firstLvlRefs.length - 1];
        return lastRef;
    } else {
        const returnedRefs = [];
        // Check to see if these references are resolved, if they are, return the resolved references
        // to then search through again recursively
        const nextLvlRefs = references.filter(ref => {
            if (ref.resolved && ref.resolved.name === arg.name) {
                return ref.resolved.references;
            }
        });
        if (nextLvlRefs.length) {
            nextLvlRefs.forEach(nextLvlRef => {
                const foundRef = findRef(nextLvlRef.resolved.references, arg);
                if (foundRef) {
                    returnedRefs.push(foundRef);
                }
            });
        }
        i = 0;
        if (returnedRefs) {
            return returnedRefs[0];
        } else {
            return null;
        }
    }
}

var ViolationSchemaKeywordType = {
    Const: 'Const',
    Enum: 'enum',
    ExclusiveMaximum: 'exclusiveMaximum',
    ExclusiveMinimum: 'exclusiveMinimum',
    Maximum: 'maximum',
    Minimum: 'minimum',
    Format: 'format',
    MaxLength: 'maxLength',
    MinLength: 'minLength',
    Pattern: 'pattern',
    AdditionalProperties: 'additionalProperties',
    Required: 'required',
    Type: 'type',
};

function getErrorMessageBySchemaKeyword(schemaKeyword, expectedValueMessage) {
    switch (schemaKeyword) {
        case ViolationSchemaKeywordType.Const:
            return 'Value did not match the constant specified. Schema keyword: const.';
        case ViolationSchemaKeywordType.Enum:
            return 'Value did not match the set of values specified. Schema keyword: enum.';
        case ViolationSchemaKeywordType.ExclusiveMaximum:
            return 'Value was greater than or equal to the maximum specified. Schema keyword: exclusiveMaximum.';
        case ViolationSchemaKeywordType.ExclusiveMinimum:
            return 'Value was less than or equal to the minimum specified. Schema keyword: exclusiveMinimum';
        case ViolationSchemaKeywordType.Maximum:
            return 'Value was greater than the maximum specified. Schema keyword: maximum.';
        case ViolationSchemaKeywordType.Minimum:
            return 'Value was less than the minimum specified. Schema keyword: minimum.';
        case ViolationSchemaKeywordType.Format:
            return `Value did not match the format. ${expectedValueMessage}. Schema keyword: format.`;
        case ViolationSchemaKeywordType.MaxLength:
            return 'Value exceeded maximum length specified. Schema keyword: maxLength.';
        case ViolationSchemaKeywordType.MinLength:
            return 'Value shorter than the minimum length specified. Schema keyword: minLength.';
        case ViolationSchemaKeywordType.Pattern:
        case ViolationSchemaKeywordType.AdditionalProperties:
            return 'Key was not present in the planned data point. Schema keyword: additionalProperties.';
        case ViolationSchemaKeywordType.Required:
            return 'Required key missing from the data point. Schema keyword: required.';
        case ViolationSchemaKeywordType.Type:
            return `Value did not match the data type. ${expectedValueMessage}. Schema keyword: type.`;
        default:
            return `Unknown schema violation. Schema keyword: ${schemaKeyword}`;
    }
}

module.exports = {
    lint: lint,
    findRef: findRef,
    tryMockForAtom: tryMockForAtom,
    getErrorMessageBySchemaKeyword: getErrorMessageBySchemaKeyword,
};
