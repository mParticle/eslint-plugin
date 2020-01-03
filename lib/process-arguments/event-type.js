const mParticle = require('@mparticle/web-sdk');

function processEventType(context, event, lintingInfo, arg) {
    switch (arg.type) {
        case 'MemberExpression':
            // TBU - this is only the case when it's mParticle.
            try {
                event.eventType = eval(
                    arg.object.object.name +
                        '.' +
                        arg.object.property.name +
                        '.' +
                        arg.property.name
                );
                return true;
            } catch (error) {
                console.log(error, 'error evaluating EventTyp');
            }

        case 'Literal':
            event.eventType = arg.value;
            return;
        case 'Identifier':
            const refs = context.getScope().references.filter(ref => {
                return (
                    ref.identifier.name === arg.name &&
                    ref.writeExpr &&
                    ref.writeExpr.start < arg.start
                );
            });

            if (!refs.length) {
                return false;
            }

            const lastRef = refs[refs.length - 1];

            event.eventType = lastRef.writeExpr.value;
            lintingInfo.event_type = {
                eventType: lastRef.writeExpr.value,
                loc: arg.loc,
            };

            return true;
        default:
            console.log(`arg ${i} made it to default in switch statement`);
    }
}

module.exports = {
    processEventType: processEventType,
};
