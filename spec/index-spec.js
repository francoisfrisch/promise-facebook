var facebook = require("../index");

require("./lib/jasmine-promise");

describe("promise-facebook", function (){

    describe("module", function () {
        it("should return a function", function () {
            expect(typeof facebook).toBe("function");
        });
    });

    // the rest needs the browser...

});
