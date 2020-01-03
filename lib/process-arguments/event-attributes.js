const findRef = require('../helpers').findRef;

function processCustomAttributes(context, event, lintingInfo, arg) {
    const attrs = {};
    switch (arg.type) {
        case 'ObjectExpression':
            arg.properties.forEach(keyVal => {
                switch (keyVal.value.type) {
                    case 'Literal':
                        // depending on the format of the literal, there will either be a key.name or key.value
                        // { foobar: 'foo' } has a key.name of 'foobar'
                        // {'foo-bar': 'foo' } has a key.value of 'foo-bar'
                        var keyName = keyVal.key.name || keyVal.key.value;
                        attrs[keyName] = keyVal.value.value;
                    case 'Identifier':
                        const ref = findRef(
                            context.getScope().references,
                            keyVal.value
                        );
                        if (ref) {
                            attrs[keyVal.key.name] = ref.writeExpr.value;
                            return true;
                        } else {
                            return false;
                        }
                    case 'MemberExpression':
                        const refs = context
                            .getScope()
                            // Reach into the scope, filter all references to the event name that are located *before* the current argument's start
                            .references.filter(ref => {
                                return (
                                    ref.identifier.name ===
                                        keyVal.value.object.name &&
                                    ref.writeExpr &&
                                    ref.writeExpr.start < keyVal.value.start
                                );
                            });
                        // If there are no references, return
                        if (!refs.length) {
                            return false;
                        }
                        // Grab the last reference; the ones before that don't matter
                        const lastRef = refs[refs.length - 1];
                        lastRef.writeExpr.properties.forEach(prop => {
                            // find the property that matches the keyVal.value property name
                            if (prop.key.name === keyVal.value.property.name) {
                                attrs[keyVal.key.name] = prop.value.value;
                                lintingInfo.event_name = {
                                    name: prop.value.value,
                                    loc: keyVal.value.loc,
                                };
                            }
                        });
                        return true;
                    default:
                        return false;
                }
            });
            event.data = attrs;
            lintingInfo.custom_attributes = {
                custom_attributes: attrs,
                loc: arg.loc,
            };
            return true;
        case 'Identifier':
            const ref = findRef(
                context.getScope().references,
                arg
            );
            if (ref && ref.writeExpr && ref.writeExpr.properties) {
                ref.writeExpr.properties.forEach(function(property) {
                    attrs[property.key.name] = property.value.value;
                });
            }

            event.data = attrs;
            lintingInfo.custom_attributes = {
                custom_attributes: attrs,
                loc: arg.loc,
            };
            return true;
        default:
            console.log(
                `Linting for custom attribute type of ${arg} not yet supported`
            );
            return true;
    }
}

module.exports = {
    processCustomAttributes: processCustomAttributes,
};
