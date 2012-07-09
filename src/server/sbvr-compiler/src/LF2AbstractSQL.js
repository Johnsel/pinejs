define(["sbvr-parser/SBVRLibs", "underscore", "ometa/ometa-base"], (function(SBVRLibs, _) {
    var LF2AbstractSQL = undefined;
    LF2AbstractSQL = objectThatDelegatesTo(SBVRLibs, {
        "TermName": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                termName;
            termName = this._apply("anything");
            (this["terms"][termName] = termName);
            this._or((function() {
                return this._pred((!this["tables"].hasOwnProperty(termName)))
            }), (function() {
                console.error(("We already have a term with a name of: " + termName));
                return this._pred(false)
            }));
            (this["tables"][termName] = ({
                "fields": [],
                "primitive": false,
                "name": null,
                "idField": null
            }));
            return termName
        },
        "Attributes": function(tableID) {
            var $elf = this,
                _fromIdx = this.input.idx,
                attributeName, attributeValue;
            return this._form((function() {
                return this._many((function() {
                    return this._form((function() {
                        attributeName = this._apply("anything");
                        return attributeValue = this._applyWithArgs("ApplyFirstExisting", [("Attr" + attributeName), "DefaultAttr"], [tableID])
                    }))
                }))
            }))
        },
        "DefaultAttr": function(tableID) {
            var $elf = this,
                _fromIdx = this.input.idx,
                anything;
            anything = this._apply("anything");
            return console.log("Default", tableID, anything)
        },
        "AttrConceptType": function(termName) {
            var $elf = this,
                _fromIdx = this.input.idx,
                conceptType, primitive, field, fieldID;
            this._form((function() {
                this._applyWithArgs("exactly", "Term");
                return conceptType = this._apply("anything")
            }));
            (this["conceptTypes"][termName] = conceptType);
            primitive = this._applyWithArgs("IsPrimitive", conceptType);
            field = ["ConceptType", this["tables"][conceptType]["name"], "NOT NULL", this["tables"][conceptType]["idField"]];
            this._opt((function() {
                this._pred(((primitive !== false) && (conceptType === primitive)));
                (field[(0)] = primitive);
                return this._or((function() {
                    this._pred(this["tables"][termName].hasOwnProperty("valueField"));
                    fieldID = this._applyWithArgs("FindFieldID", termName, this["tables"][termName]["valueField"]);
                    this._pred((fieldID !== false));
                    (field[(1)] = this["tables"][termName]["fields"][fieldID][(1)]);
                    return this["tables"][termName]["fields"].splice(fieldID, (1))
                }), (function() {
                    return (this["tables"][termName]["valueField"] = this["tables"][conceptType]["name"])
                }))
            }));
            return this["tables"][termName]["fields"].push(field)
        },
        "AttrDatabaseIDField": function(tableID) {
            var $elf = this,
                _fromIdx = this.input.idx,
                idField;
            idField = this._apply("anything");
            return this._or((function() {
                return this._pred(_.isString(this["tables"][tableID]))
            }), (function() {
                this["tables"][tableID]["fields"].push(["PrimaryKey", idField]);
                return (this["tables"][tableID]["idField"] = idField)
            }))
        },
        "AttrDatabaseValueField": function(tableID) {
            var $elf = this,
                _fromIdx = this.input.idx,
                valueField, fieldID;
            valueField = this._apply("anything");
            return this._or((function() {
                return this._pred(_.isString(this["tables"][tableID]))
            }), (function() {
                this._or((function() {
                    this._pred(this["tables"][tableID].hasOwnProperty("valueField"));
                    fieldID = this._applyWithArgs("FindFieldID", tableID, this["tables"][tableID]["valueField"]);
                    this._pred((fieldID !== false));
                    return (this["tables"][tableID]["fields"][fieldID][(1)] = valueField)
                }), (function() {
                    return this["tables"][tableID]["fields"].push(["Value", valueField, "NOT NULL"])
                }));
                return (this["tables"][tableID]["valueField"] = valueField)
            }))
        },
        "AttrDatabaseTableName": function(tableID) {
            var $elf = this,
                _fromIdx = this.input.idx,
                tableName;
            tableName = this._apply("anything");
            return this._or((function() {
                return this._pred(_.isString(this["tables"][tableID]))
            }), (function() {
                return (this["tables"][tableID]["name"] = tableName)
            }))
        },
        "AttrDatabasePrimitive": function(termName) {
            var $elf = this,
                _fromIdx = this.input.idx,
                attrVal;
            attrVal = this._apply("anything");
            return (this["tables"][termName]["primitive"] = attrVal)
        },
        "AttrDatabaseAttribute": function(factType) {
            var $elf = this,
                _fromIdx = this.input.idx,
                attrVal, fieldID;
            attrVal = this._apply("anything");
            return this._opt((function() {
                this._pred(attrVal);
                (this["tables"][factType] = "Attribute");
                fieldID = this._applyWithArgs("FindFieldID", factType[(0)][(1)], this["tables"][factType[(2)][(1)]]["name"]);
                return (this["tables"][factType[(0)][(1)]]["fields"][fieldID][(0)] = this["tables"][factType[(2)][(1)]]["primitive"])
            }))
        },
        "AttrForeignKey": function(factType) {
            var $elf = this,
                _fromIdx = this.input.idx,
                type, fieldID;
            type = this._apply("anything");
            this._or((function() {
                this._pred((this["tables"][factType[(0)][(1)]]["valueField"] == this["tables"][factType[(2)][(1)]]["name"]));
                fieldID = this._applyWithArgs("FindFieldID", factType[(0)][(1)], this["tables"][factType[(2)][(1)]]["name"]);
                this._pred((fieldID !== false));
                return (this["tables"][factType[(0)][(1)]]["fields"][fieldID][(0)] = "ForeignKey")
            }), (function() {
                return this["tables"][factType[(0)][(1)]]["fields"].push(["ForeignKey", this["tables"][factType[(2)][(1)]]["name"], type, this["tables"][factType[(2)][(1)]]["idField"]])
            }));
            return (this["tables"][factType] = "ForeignKey")
        },
        "AttrSynonymousForm": function(factType) {
            var $elf = this,
                _fromIdx = this.input.idx,
                synForm;
            synForm = this._apply("anything");
            return this._applyWithArgs("AddFactType", synForm.slice((0), (-(1))), factType)
        },
        "AttrTermForm": function(factType) {
            var $elf = this,
                _fromIdx = this.input.idx,
                term;
            term = this._apply("anything");
            (this["terms"][term[(1)]] = factType);
            return (this["tables"][term[(1)]] = this["tables"][factType])
        },
        "FactType": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                factTypePart, attributes, factType, termName, verb;
            this._lookahead((function() {
                return factType = this._many1((function() {
                    factTypePart = this._apply("anything");
                    this._lookahead((function() {
                        return attributes = this._apply("anything")
                    }));
                    return factTypePart
                }))
            }));
            this._applyWithArgs("AddFactType", factType, factType);
            this._or((function() {
                this._pred((factType["length"] == (2)));
                this._many1((function() {
                    factTypePart = this._apply("anything");
                    return this._lookahead((function() {
                        return attributes = this._apply("anything")
                    }))
                }));
                this["tables"][factType[(0)][(1)]]["fields"].push(["Boolean", factType[(1)][(1)]]);
                return (this["tables"][factType] = "BooleanAttribute")
            }), (function() {
                (this["tables"][factType] = ({
                    "fields": [],
                    "primitive": false,
                    "name": null
                }));
                return this._many1((function() {
                    return this._or((function() {
                        this._form((function() {
                            this._applyWithArgs("exactly", "Term");
                            return termName = this._apply("anything")
                        }));
                        return this["tables"][factType]["fields"].push(["ForeignKey", this["tables"][termName]["name"], "NOT NULL", this["tables"][termName]["idField"]])
                    }), (function() {
                        return this._form((function() {
                            this._applyWithArgs("exactly", "Verb");
                            return verb = this._apply("anything")
                        }))
                    }))
                }))
            }));
            return factType
        },
        "Cardinality": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                cardinality;
            this._form((function() {
                (function() {
                    switch (this._apply('anything')) {
                    case "MinimumCardinality":
                        return "MinimumCardinality";
                    case "MaximumCardinality":
                        return "MaximumCardinality";
                    case "Cardinality":
                        return "Cardinality";
                    default:
                        throw fail
                    }
                }).call(this);
                return cardinality = this._apply("Number")
            }));
            return cardinality
        },
        "Number": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                num;
            this._form((function() {
                this._applyWithArgs("exactly", "Number");
                num = this._apply("anything");
                return this._pred((!isNaN(num)))
            }));
            return num
        },
        "Variable": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                bind, termName, varAlias, query, whereBody;
            this._form((function() {
                this._applyWithArgs("exactly", "Variable");
                bind = this._apply("Number");
                this._form((function() {
                    this._applyWithArgs("exactly", "Term");
                    return termName = this._apply("anything")
                }));
                varAlias = ("var" + bind);
                query = ["Query", ["Select", []],
                    ["From", this["tables"][termName]["name"], (varAlias + termName)]
                ];
                this._applyWithArgs("ResolveConceptTypes", query, termName, varAlias);
                return this._opt((function() {
                    whereBody = this._apply("RulePart");
                    return this._applyWithArgs("AddWhereClause", query, whereBody)
                }))
            }));
            whereBody = this._apply("RulePart");
            this._applyWithArgs("AddWhereClause", query, whereBody);
            return query
        },
        "RoleBinding": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                termName, bind;
            this._form((function() {
                this._applyWithArgs("exactly", "RoleBinding");
                this._form((function() {
                    this._applyWithArgs("exactly", "Term");
                    return termName = this._apply("anything")
                }));
                return bind = this._apply("anything")
            }));
            return bind
        },
        "LinkTable": function(actualFactType, rootTerms) {
            var $elf = this,
                _fromIdx = this.input.idx,
                tableAlias, query, i, bind, termName;
            tableAlias = ("link" + this["linkTableBind"]++);
            query = ["Query", ["Select", []],
                ["From", this["tables"][actualFactType]["name"], tableAlias]
            ];
            i = (0);
            this._many1((function() {
                this._pred((i < rootTerms["length"]));
                bind = this._apply("RoleBinding");
                termName = rootTerms[i];
                this._applyWithArgs("AddWhereClause", query, ["Equals", ["ReferencedField", tableAlias, this["tables"][termName]["name"]],
                    ["ReferencedField", (("var" + bind) + termName), this["tables"][termName]["idField"]]
                ]);
                return i++
            }));
            return ["Exists", query]
        },
        "ForeignKey": function(actualFactType, rootTerms) {
            var $elf = this,
                _fromIdx = this.input.idx,
                bindFrom, bindTo, termFrom, termTo;
            this._pred((this["tables"][actualFactType] == "ForeignKey"));
            this._or((function() {
                bindFrom = this._apply("RoleBinding");
                bindTo = this._apply("RoleBinding");
                this._apply("end");
                termFrom = rootTerms[(0)];
                return termTo = rootTerms[(1)]
            }), (function() {
                return this._applyWithArgs("foreign", ___ForeignKeyMatchingFailed___, 'die')
            }));
            return ["Equals", ["ReferencedField", (("var" + bindFrom) + termFrom), this["tables"][termTo]["name"]], ["ReferencedField", (("var" + bindTo) + termTo), this["tables"][termTo]["idField"]]]
        },
        "BooleanAttribute": function(actualFactType) {
            var $elf = this,
                _fromIdx = this.input.idx,
                bindFrom, termFrom, attributeName;
            this._pred((this["tables"][actualFactType] == "BooleanAttribute"));
            this._or((function() {
                bindFrom = this._apply("RoleBinding");
                this._apply("end");
                termFrom = actualFactType[(0)][(1)];
                return attributeName = actualFactType[(1)][(1)]
            }), (function() {
                console.error(this["input"]);
                return this._applyWithArgs("foreign", ___BooleanAttributeMatchingFailed___, 'die')
            }));
            return ["Equals", ["ReferencedField", (("var" + bindFrom) + termFrom), attributeName], ["Boolean", true]]
        },
        "Attribute": function(actualFactType, rootTerms) {
            var $elf = this,
                _fromIdx = this.input.idx,
                query, bindAttr, bindReal, termNameAttr, termNameReal;
            this._pred((this["tables"][actualFactType] == "Attribute"));
            query = ["Query", ["Select", []]];
            bindAttr = this._apply("RoleBinding");
            bindReal = this._apply("RoleBinding");
            this._apply("end");
            termNameAttr = rootTerms[(0)];
            termNameReal = rootTerms[(1)];
            this._applyWithArgs("AddWhereClause", query, ["Equals", ["ReferencedField", (("var" + bindAttr) + termNameReal), this["tables"][termNameAttr]["name"]],
                ["ReferencedField", (("var" + bindReal) + termNameReal), this["tables"][termNameAttr]["name"]]
            ]);
            return ["Exists", query]
        },
        "AtomicFormulation": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                factType, actualFactType, rootTerms, whereClause;
            this._form((function() {
                this._applyWithArgs("exactly", "AtomicFormulation");
                this._form((function() {
                    this._applyWithArgs("exactly", "FactType");
                    return factType = this._many1((function() {
                        return this._apply("anything")
                    }))
                }));
                actualFactType = this._applyWithArgs("ActualFactType", factType);
                rootTerms = this._applyWithArgs("FactTypeRootTerms", factType, actualFactType);
                return whereClause = this._or((function() {
                    return this._applyWithArgs("ForeignKey", actualFactType, rootTerms)
                }), (function() {
                    return this._applyWithArgs("BooleanAttribute", actualFactType)
                }), (function() {
                    return this._applyWithArgs("Attribute", actualFactType, rootTerms)
                }), (function() {
                    return this._applyWithArgs("LinkTable", actualFactType, rootTerms)
                }))
            }));
            return whereClause
        },
        "AtLeast": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                minCard, query;
            this._form((function() {
                this._applyWithArgs("exactly", "AtLeastNQ");
                minCard = this._apply("Cardinality");
                query = this._apply("Variable");
                return query[(1)][(1)].push(["Count", "*"])
            }));
            return ["EqualOrGreater", query, ["Number", minCard]]
        },
        "Exactly": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                card, query;
            this._form((function() {
                this._applyWithArgs("exactly", "ExactQ");
                card = this._apply("Cardinality");
                query = this._apply("Variable");
                return query[(1)][(1)].push(["Count", "*"])
            }));
            return ["Equals", query, ["Number", card]]
        },
        "Range": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                minCard, maxCard, query;
            this._form((function() {
                this._applyWithArgs("exactly", "NumericalRangeQ");
                minCard = this._apply("Cardinality");
                maxCard = this._apply("Cardinality");
                query = this._apply("Variable");
                return query[(1)][(1)].push(["Count", "*"])
            }));
            return ["Between", query, ["Number", minCard], ["Number", maxCard]]
        },
        "Exists": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                query;
            this._form((function() {
                this._applyWithArgs("exactly", "ExistentialQ");
                return query = this._apply("Variable")
            }));
            return ["Exists", query]
        },
        "Negation": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                whereBody;
            this._form((function() {
                this._applyWithArgs("exactly", "LogicalNegation");
                return whereBody = this._apply("RulePart")
            }));
            return ["Not", whereBody]
        },
        "RulePart": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                x, whereBody;
            whereBody = this._or((function() {
                return this._apply("AtomicFormulation")
            }), (function() {
                return this._apply("AtLeast")
            }), (function() {
                return this._apply("Exactly")
            }), (function() {
                return this._apply("Exists")
            }), (function() {
                return this._apply("Negation")
            }), (function() {
                return this._apply("Range")
            }), (function() {
                x = this._apply("anything");
                console.error("Hit unhandled operation:", x);
                return this._pred(false)
            }));
            return whereBody
        },
        "RuleBody": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                rule;
            this._form((function() {
                (function() {
                    switch (this._apply('anything')) {
                    case "ObligationF":
                        return "ObligationF";
                    case "NecessityF":
                        return "NecessityF";
                    case "PossibilityF":
                        return "PossibilityF";
                    case "PermissibilityF":
                        return "PermissibilityF";
                    default:
                        throw fail
                    }
                }).call(this);
                return rule = this._apply("RulePart")
            }));
            return rule
        },
        "Process": function() {
            var $elf = this,
                _fromIdx = this.input.idx,
                termName, factType, ruleBody, ruleText;
            this._form((function() {
                this._applyWithArgs("exactly", "Model");
                return this._many1((function() {
                    return this._form((function() {
                        return (function() {
                            switch (this._apply('anything')) {
                            case "Term":
                                return (function() {
                                    termName = this._apply("TermName");
                                    return this._applyWithArgs("Attributes", termName)
                                }).call(this);
                            case "FactType":
                                return (function() {
                                    factType = this._apply("FactType");
                                    return this._applyWithArgs("Attributes", factType)
                                }).call(this);
                            case "Rule":
                                return (function() {
                                    ruleBody = this._apply("RuleBody");
                                    this._form((function() {
                                        this._applyWithArgs("exactly", "StructuredEnglish");
                                        return ruleText = this._apply("anything")
                                    }));
                                    (this["linkTableBind"] = (0));
                                    return this["rules"].push(["Rule", ["StructuredEnglish", ruleText],
                                        ["Body", ruleBody]
                                    ])
                                }).call(this);
                            default:
                                throw fail
                            }
                        }).call(this)
                    }))
                }))
            }));
            return ({
                "tables": this["tables"],
                "rules": this["rules"]
            })
        }
    });
    (LF2AbstractSQL["FindFieldID"] = (function(tableID, fieldName) {
        var tableFields = this["tables"][tableID]["fields"];
        for (var i = (0);
        (i < tableFields["length"]); i++) {
            if ((tableFields[i][(1)] == fieldName)) {
                return i
            } else {
                undefined
            }
        };
        return false
    }));
    (LF2AbstractSQL["AddWhereClause"] = (function(query, whereBody) {
        if (((whereBody[(0)] == "Exists") && (whereBody[(1)][(0)] == "Query"))) {
            (whereBody = whereBody[(1)].slice((1)));
            for (var i = (0);
            (i < whereBody["length"]); i++) {
                if ((whereBody[i][(0)] == "From")) {
                    query.push(whereBody[i])
                } else {
                    undefined
                }
            };
            for (var i = (0);
            (i < whereBody["length"]); i++) {
                if ((whereBody[i][(0)] == "Where")) {
                    this.AddWhereClause(query, whereBody[i][(1)])
                } else {
                    undefined
                }
            }
        } else {
            for (var i = (0);
            (i < query["length"]); i++) {
                if ((query[i][(0)] == "Where")) {
                    (query[i][(1)] = ["And", query[i][(1)], whereBody]);
                    return undefined
                } else {
                    undefined
                }
            };
            query.push(["Where", whereBody])
        }
    }));
    (LF2AbstractSQL["ResolveConceptTypes"] = (function(query, termName, varAlias) {
        {
            var conceptAlias = undefined;
            var parentAlias = (varAlias + termName);
            var conceptName = termName
        };
        while (this["conceptTypes"].hasOwnProperty(conceptName)) {
            (conceptName = this["conceptTypes"][termName]);
            (conceptAlias = (varAlias + conceptName));
            query.push(["From", this["tables"][conceptName]["name"], conceptAlias]);
            this.AddWhereClause(query, ["Equals", ["ReferencedField", parentAlias, this["tables"][conceptName]["name"]],
                ["ReferencedField", conceptAlias, this["tables"][conceptName]["idField"]]
            ]);
            (parentAlias = conceptAlias)
        }
    }));
    (LF2AbstractSQL["initialize"] = (function() {
        SBVRLibs["initialize"].call(this);
        (this["tables"] = ({}));
        (this["terms"] = ({}));
        (this["rules"] = []);
        (this["linkTableBind"] = (0))
    }));
    return LF2AbstractSQL
}))