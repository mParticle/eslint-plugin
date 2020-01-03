const findRef = require('../helpers').findRef;

function processEventName(context, event, lintingInfo, arg) {
    lintingInfo.loc = arg.loc;
    switch (arg.type) {
        // Scenario 1: Argument 0 is a Literal, meaning it is a string/number. Simply assign it to event.name
        case 'Literal':
            event.name = arg.value;
            lintingInfo.event_name = {
                name: arg.value,
                loc: arg.loc,
            };

            return true;

        // Scenario 2: MemberExpression:
        // This means it is referenced from within an object elsewhere
        case 'MemberExpression':
            const refs = context
                .getScope()
                // Reach into the scope, filter all references to the event name that are located *before* the current argument's start
                .references.filter(ref => {
                    return (
                        ref.identifier.name === arg.object.name &&
                        ref.writeExpr &&
                        ref.writeExpr.start < arg.start
                    );
                });
            // If there are no references, return
            if (!refs.length) {
                return false;
            }
            // Grab the last reference; the ones before that don't matter
            const lastRef = refs[refs.length - 1];
            lastRef.writeExpr.properties.forEach(prop => {
                // find the property that matches the arg property name
                if (prop.key.name === arg.property.name) {
                    event.name = prop.value.value;
                    lintingInfo.event_name = {
                        name: prop.value.value,
                        loc: arg.loc,
                    };
                }
            });

            return true;

        // An Identifier means the arg is a variable, so we need to find the last reference
        case 'Identifier':
            const ref = findRef(context.getScope().references, arg);
            if (ref) {
                event.name = ref.writeExpr.value;
                lintingInfo.event_name = {
                    name: ref.writeExpr.value,
                    loc: arg.loc,
                };
                return true;
            } else {
                return false;
            }
        default:
            console.log(`arg ${arg} made it to default in switch statement`);
    }
}

module.exports = {
    processEventName: processEventName,
};
