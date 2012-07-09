define(["sbvr-compiler/LFValidator"], (function(LFValidator) {
    var LFOptimiser = undefined;
    LFOptimiser = objectThatDelegatesTo(LFValidator, {
        "Helped": function() {
            var $elf = this,
                _fromIdx = this.input.idx;
            this._pred((this["helped"] === true));
            return (this["helped"] = false)
        },
        "SetHelped": function() {
            var $elf = this,
                _fromIdx = this.input.idx;
            return (this["helped"] = true)
        },
        "Process": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                x;
            x = this._apply("anything");
            x = this._applyWithArgs("trans", x);
            this._many((function() {
                this._applyWithArgs("Helped", "disableMemoisation");
                return x = this._applyWithArgs("trans", x)
            }));
            return x
        },
        "AtLeastNQ": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                i, v, xs;
            return this._or((function() {
                i = this._applyWithArgs("token", "MinimumCardinality");
                this._pred((i[(1)][(1)] == (1)));
                v = this._applyWithArgs("token", "Variable");
                xs = this._many((function() {
                    return this._apply("trans")
                }));
                this._apply("SetHelped");
                return ["ExistentialQ", v].concat(xs)
            }), (function() {
                return LFValidator._superApplyWithArgs(this, 'AtLeastNQ')
            }))
        },
        "NumericalRangeQ": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                i, j, v, xs;
            return this._or((function() {
                i = this._applyWithArgs("token", "MinimumCardinality");
                j = this._applyWithArgs("token", "MaximumCardinality");
                this._pred((i[(1)][(1)] == j[(1)][(1)]));
                v = this._applyWithArgs("token", "Variable");
                xs = this._many((function() {
                    return this._apply("trans")
                }));
                this._apply("SetHelped");
                return ["ExactQ", ["Cardinality", i[(1)]], v].concat(xs)
            }), (function() {
                return LFValidator._superApplyWithArgs(this, 'NumericalRangeQ')
            }))
        },
        "LogicalNegation": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                xs;
            return this._or((function() {
                this._form((function() {
                    this._applyWithArgs("exactly", "LogicalNegation");
                    return xs = this._apply("trans")
                }));
                this._apply("SetHelped");
                return xs
            }), (function() {
                return LFValidator._superApplyWithArgs(this, 'LogicalNegation')
            }))
        }
    });
    (LFOptimiser["initialize"] = (function() {
        LFValidator["initialize"].call(this);
        (this["_didSomething"] = false)
    }));
    return LFOptimiser
}))