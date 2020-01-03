/**
 * @fileoverview short description
 * @author robert ing
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require('../../../lib/rules/data-planning'),
    RuleTester = require('eslint').RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run('data-planning', rule, {
    valid: [
        ` // Argument 0 - Testing Event Name Logic - simplest logging event
        mParticle.logEvent("test-nav", mParticle.EventType.Navigation)
        mParticle.logEvent("testEvent1", mParticle.EventType.Other, {
            requiredKey1: 'foo'
        })
        mParticle.logEvent("search", mParticle.EventType.Search, {
            'search-attr': 'hi'
        });
        // `,
        ` // Argument 0 - Testing Event Name Logic - reference a variable name
        var eventName = "test-nav"
        mParticle.logEvent(eventName, mParticle.EventType.Navigation)
        `,
        ` // Argument 0 - Testing Event Name Logic - multiple references above and below
        var eventName = 'thistestwillpass';
        function hi() {
            eventName = 'changed';
            eventName = 'test-nav';
            mParticle.logEvent(
                eventName,
                mParticle.EventType.Navigation,
                { foo: '0' }
            );
            eventName = 'thistestwillpass';
        }
        `,
        ` // Argument 0 - Testing Event Name Logic - simple object references
        var object123 = {
            key1: 'testEvent1',
            key2: 'test-nav',
            key3: 'fail'
        }
        mParticle.logEvent(object123.key1, mParticle.EventType.Other, {
             requiredKey1: 'foo'
        })
        mParticle.logEvent(object123.key2, mParticle.EventType.Navigation);
        `,
        ` // Argument 0 - Testing Event Name Logic - simple object references
        var object123 = {
            key1: 'testEvent1',
            key2: 'test-nav',
            key3: 'fail'
        }
        mParticle.logEvent(object123.key1, mParticle.EventType.Other, {
            requiredKey1: 'foo'
        })
        mParticle.logEvent(object123.key2, mParticle.EventType.Navigation);
        `,
        ` // Argument 1 - Testing Event Type Logic - reference a variable name
        var eventType = 8;
        var eventName = 'testEvent1';
        mParticle.logEvent(eventName, eventType, {
             requiredKey1: 'foo'
        });
        // `,
        ` // Work with expressions (undeclared variables)
        var foo = {
            key1: 'pass',
            key2: 'pass',
            key3: 'pass'
        }
        object123 = {
            key1: 'testEvent1',
            key2: 'test-nav',
            key3: 'pass'
        }
        mParticle.logEvent(object123.key1, mParticle.EventType.Other, {
            requiredKey1: 'foo'
        })
        mParticle.logEvent(object123.key2, mParticle.EventType.Navigation);
        `,
        `
        var mParticle = require("mparticle");
        var eventName = "pass";
            eventName = "test-nav";
            function sure() {
                function ok() {
                    mParticle.logEvent(eventName, mParticle.EventType.Navigation);
                }
                ok();
            }
            sure();`,
        `
        var abc = mParticle.logEvent;
        var bcd = mParticle.logEvent;
        abc("test-nav", mParticle.EventType.Navigation);
        abc("testEvent1", mParticle.EventType.Other, {
            requiredKey1: "hi"
        });
        bcd("test-nav", mParticle.EventType.Navigation);
        bcd("testEvent1", mParticle.EventType.Other, {
            requiredKey1: "hi"
        });
        bcd("testEvent1", mParticle.EventType.Other, {
            requiredKey1: "hi"
        });
        `,
        ` // Argument 1 - passed as a number
        mParticle.logEvent("test-nav", 1)
        `,
        ` // Argument 1 - passed as a reference to variable
        var navigation = 1
        mParticle.logEvent("test-nav", navigation)
        `,
        ` // Argument 2 - passed as a reference to variable
        var hi = 'hi'
        mParticle.logEvent("testEvent1", mParticle.EventType.Other, {
            requiredKey1: hi
        });
        `,
        `var hi = {
            hello: 'hi'
        }
        mParticle.logEvent("testEvent1", mParticle.EventType.Other, {
            requiredKey1: hi.hello
        });
        `,
        `
        var customAttributes = {
            foo: 'string'
        };
        mParticle.logEvent('test purchase', mParticle.EventType.Transaction, customAttributes)
        `
        // `, // TODO: Argument 1 - passed as a value from object - THIS IS FAILING
        // var types = {
        //     unknown: mParticle.EventType.Unknown,
        //     navigation: mParticle.EventType.Navigation
        // }
        // mParticle.logEvent("test-nav", types.navigation)
        // `,
    ],

    invalid: [
        {
            // Argument 0 - Testing Event Name Logic - unplanned event (should be `test-nav`)
            code:
                "mParticle.logEvent('test-nav-fail', mParticle.EventType.Navigation)",
            errors: [
                {
                    message: 'Unplanned.',
                },
            ],
        },
        {
            // Argument 0 - Testing Event Name Logic - updating the variable to an unplanned event before logging
            code: `var eventName = 'test-nav';
                function hi() {
                    eventName = 'changed';
                    mParticle.logEvent(
                        eventName,
                        mParticle.EventType.Navigation,
                        { foo: '0' }
                    );
                }`,
            errors: [
                {
                    message: 'Unplanned.',
                },
            ],
        },
        {
            // Argument 0 - Testing Event Name Logic - no arguments
            code: `mParticle.logEvent()`,
            errors: [
                {
                    message:
                        'mParticle.logEvent needs at least an eventName passed to it',
                },
            ],
        },
        {
            // Argument 0 - Testing Event Name Logic - wrong key referenced for event name
            code: `
                var object123 = {
                    key1: 'testEvent1',
                    key2: 'test-nav',
                    key3: 'fail'
                }
                mParticle.logEvent(object123.key3, mParticle.EventType.Other)
        `,
            errors: [
                {
                    message: 'Unplanned.',
                },
            ],
        },
        {
            code: 'mParticle.logEvent("testEvent1", mParticle.EventType.Other)',
            errors: [
                {
                    message:
                        'Required key missing from the data point. Schema keyword: required.',
                },
            ],
        },
        {
            code: `
                var name = "testEvent1";
                mParticle.logEvent(name, mParticle.EventType.Other, {
                    requiredKey1: 3
                });
                `,
            errors: [
                {
                    message:
                        'Value did not match the data type. should be string. Schema keyword: type.',
                },
            ],
        },
        {
            code: `
                var mParticle = require("mparticle");
                var abc = mParticle.logEvent;
                var bcd = mParticle.logEvent;
                abc("testabc-nav", mParticle.EventType.Navigation);
                bcd("testabcEvent1", mParticle.EventType.Other, {
                    requiredKey1: "hi"
                });
                `,
            errors: [
                {
                    message: 'Unplanned.',
                },
                {
                    message: 'Unplanned.',
                },
            ],
        },
        {
            code: `
                var attributes;
                mParticle.logEvent("testEvent1", mParticle.EventType.Other, attributes);
                `,
            errors: [
                {
                    message:
                        'Required key missing from the data point. Schema keyword: required.',
                },
            ],
        },
        {
            code: `
                    // Argument 2 - passed as a reference to variable
                    var hi = 3
                    mParticle.logEvent("testEvent1", mParticle.EventType.Other, {
                        requiredKey1: hi
                    });
                `,
            errors: [
                {
                    message:
                        'Value did not match the data type. should be string. Schema keyword: type.',
                },
            ],
        },
        {
            code: `var hi = {
                        hello: 3
                    }
                    mParticle.logEvent("testEvent1", mParticle.EventType.Other, {
                        requiredKey1: hi.hello
                    });`,
            errors: [
                {
                    message:
                        'Value did not match the data type. should be string. Schema keyword: type.',
                },
            ],
        },
        {
            code: `var customAttributes = {
                foo: 123
            };
            mParticle.logEvent('test purchase', mParticle.EventType.Transaction, customAttributes)`,
            errors: [
                {
                    message:
                        'Value did not match the data type. should be string. Schema keyword: type.',
                },
            ],
        },
    ],
});
