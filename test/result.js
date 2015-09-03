var A;
(function (A) {
    var B;
    (function (B) {
        var C;
        (function (C) {
            var Foo = function () {
                function Foo() {
                }
                return Foo;
            }();
            C.Foo = Foo;
        }(C = B.C || (B.C = {})));
    }(B = A.B || (A.B = {})));
}(A || (A = {})));
var B;
(function (B) {
    var BClass = function () {
        function BClass() {
        }
        return BClass;
    }();
    B.BClass = BClass;
}(B || (B = {})));
var A;
(function (A) {
    var B;
    (function (B) {
        var C;
        (function (C) {
            var Bar = function () {
                function Bar() {
                }
                return Bar;
            }();
            C.Bar = Bar;
            var Baz = function () {
                function Baz() {
                }
                return Baz;
            }();
            C.Baz = Baz;
        }(C = B.C || (B.C = {})));
    }(B = A.B || (A.B = {})));
}(A || (A = {})));
var BazCtor = A.B.C.Baz;
var A;
(function (A) {
    var B;
    (function (B) {
        var C;
        (function (C) {
            var Quux = function () {
                function Quux() {
                }
                Quux.prototype.getBaz = function () {
                    return new BazCtor();
                };
                return Quux;
            }();
            C.Quux = Quux;
        }(C = B.C || (B.C = {})));
    }(B = A.B || (A.B = {})));
}(A || (A = {})));
var baz = new A.B.C.Quux().getBaz();
assert(baz instanceof BazCtor);