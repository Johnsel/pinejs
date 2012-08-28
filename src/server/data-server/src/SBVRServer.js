// Generated by CoffeeScript 1.3.3
(function() {
  var __hasProp = {}.hasOwnProperty;

  define(['sbvr-parser/SBVRParser', 'sbvr-compiler/LF2AbstractSQLPrep', 'sbvr-compiler/LF2AbstractSQL', 'sbvr-compiler/AbstractSQL2SQL', 'sbvr-compiler/AbstractSQLRules2SQL', 'sbvr-compiler/AbstractSQL2CLF', 'data-server/ServerURIParser', 'underscore', 'utils/createAsyncQueueCallback'], function(SBVRParser, LF2AbstractSQLPrep, LF2AbstractSQL, AbstractSQL2SQL, AbstractSQLRules2SQL, AbstractSQL2CLF, ServerURIParser, _, createAsyncQueueCallback) {
    var clientModels, db, endLock, executeSqlModel, exports, getAndCheckBindValues, getID, op, parseURITree, rebuildFactType, runDelete, runGet, runPost, runPut, runURI, serverIsOnAir, serverModelCache, serverURIParser, sqlModels, transactionModel, uiModel, userModel, validateDB;
    exports = {};
    db = null;
    transactionModel = 'Term:      Integer\nTerm:      Long Text\nTerm:      resource id\n	Concept type: Integer\nTerm:      resource type\n	Concept type: Long Text\nTerm:      field name\n	Concept type: Long Text\nTerm:      field value\n	Concept type: Long Text\nTerm:      field type\n	Concept type: Long Text\nTerm:      resource\n	Database Value Field: resource_id\nFact type: resource has resource id\nFact type: resource has resource type\nRule:      It is obligatory that each resource has exactly 1 resource type\nRule:      It is obligatory that each resource has exactly 1 resource id\nTerm:      transaction\nTerm:      lock\nTerm:      conditional representation\n	Database Value Field: lock\nFact type: lock is exclusive\nFact type: lock is shared\nFact type: resource is under lock\nFact type: lock belongs to transaction\nFact type: conditional representation has field name\nFact type: conditional representation has field value\nFact type: conditional representation has field type\nFact type: conditional representation has lock\nRule:      It is obligatory that each conditional representation has exactly 1 field name\nRule:      It is obligatory that each conditional representation has at most 1 field value\nRule:      It is obligatory that each conditional representation has at most 1 field type\nRule:      It is obligatory that each conditional representation has exactly 1 lock\nRule:      It is obligatory that each resource is under at most 1 lock that is exclusive';
    userModel = 'Term:      Hashed\nTerm:      Short Text\n\nTerm:      user\n	Database Value Field: username\nTerm:      username\n	Concept Type: Short Text\nTerm:      password\n	Concept Type: Hashed\nFact type: user has username\nRule:      It is obligatory that each user has exactly one username.\nRule:      It is obligatory that each username is of exactly one user.\nFact type: user has password\nRule:      It is obligatory that each user has exactly one password.';
    uiModel = 'Term:      Short Text\nTerm:      Long Text\nTerm:      text\n	Concept type: Long Text\nTerm:      name\n	Concept type: Short Text\nTerm:      textarea\n	Database id Field: name\n	Database Value Field: text\nFact type: textarea is disabled\nFact type: textarea has name\nFact type: textarea has text\nRule:      It is obligatory that each textarea has exactly 1 name\nRule:      It is obligatory that each name is of exactly 1 textarea\nRule:      It is obligatory that each textarea has exactly 1 text';
    transactionModel = SBVRParser.matchAll(transactionModel, 'Process');
    transactionModel = LF2AbstractSQLPrep.match(transactionModel, 'Process');
    transactionModel = LF2AbstractSQL.match(transactionModel, 'Process');
    userModel = SBVRParser.matchAll(userModel, 'Process');
    userModel = LF2AbstractSQLPrep.match(userModel, 'Process');
    userModel = LF2AbstractSQL.match(userModel, 'Process');
    uiModel = SBVRParser.matchAll(uiModel, 'Process');
    uiModel = LF2AbstractSQLPrep.match(uiModel, 'Process');
    uiModel = LF2AbstractSQL.match(uiModel, 'Process');
    serverURIParser = ServerURIParser.createInstance();
    serverURIParser.setSQLModel('transaction', transactionModel);
    serverURIParser.setSQLModel('user', userModel);
    serverURIParser.setSQLModel('ui', uiModel);
    sqlModels = {};
    clientModels = {};
    op = {
      eq: "=",
      ne: "!=",
      lk: "~"
    };
    rebuildFactType = function(factType) {
      var factTypePart, key, _i, _len;
      factType = factType.split('-');
      for (key = _i = 0, _len = factType.length; _i < _len; key = ++_i) {
        factTypePart = factType[key];
        factTypePart = factTypePart.replace(/_/g, ' ');
        if (key % 2 === 0) {
          factType[key] = ['Term', factTypePart];
        } else {
          factType[key] = ['Verb', factTypePart];
        }
      }
      if (factType.length === 1) {
        return factType[0][1];
      }
      return factType;
    };
    serverModelCache = function() {
      var pendingCallbacks, setValue, values;
      values = {
        serverOnAir: false,
        lastSE: "",
        lf: [],
        prepLF: [],
        sql: [],
        clf: [],
        trans: []
      };
      pendingCallbacks = [];
      setValue = function(key, value) {
        values[key] = value;
        return db.transaction(function(tx) {
          value = JSON.stringify(value);
          return tx.executeSql('SELECT 1 FROM "_server_model_cache" WHERE "key" = ?;', [key], function(tx, result) {
            if (result.rows.length === 0) {
              return tx.executeSql('INSERT INTO "_server_model_cache" VALUES (?, ?);', [key, value], null, null, false);
            } else {
              return tx.executeSql('UPDATE "_server_model_cache" SET value = ? WHERE "key" = ?;', [value, key]);
            }
          });
        });
      };
      serverModelCache = {
        whenLoaded: function(func) {
          return pendingCallbacks.push(func);
        },
        isServerOnAir: function() {
          return values.serverOnAir;
        },
        setServerOnAir: function(bool) {
          return setValue('serverOnAir', bool);
        },
        getLastSE: function() {
          return values.lastSE;
        },
        setLastSE: function(txtmod) {
          return setValue('lastSE', txtmod);
        },
        getLF: function() {
          return values.lf;
        },
        setLF: function(lfmod) {
          return setValue('lf', lfmod);
        },
        getPrepLF: function() {
          return values.prepLF;
        },
        setPrepLF: function(prepmod) {
          return setValue('prepLF', prepmod);
        },
        getSQL: function() {
          return values.sql;
        },
        setSQL: function(sqlmod) {
          serverURIParser.setSQLModel('data', sqlmod);
          sqlModels['data'] = sqlmod;
          return setValue('sql', sqlmod);
        }
      };
      return db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE ' + '"_server_model_cache" (' + '"key"		VARCHAR(40) PRIMARY KEY,' + '"value"	VARCHAR(32768) );');
        return tx.executeSql('SELECT * FROM "_server_model_cache";', [], function(tx, result) {
          var callback, i, row, _i, _j, _len, _ref, _results;
          for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            row = result.rows.item(i);
            values[row.key] = JSON.parse(row.value);
            if (row.key === 'sql') {
              serverURIParser.setSQLModel('data', values[row.key]);
              sqlModels['data'] = values[row.key];
              clientModels['data'] = AbstractSQL2CLF(values[row.key]);
              serverURIParser.setClientModel('data', clientModels['data']);
            }
          }
          serverModelCache.whenLoaded = function(func) {
            return func();
          };
          _results = [];
          for (_j = 0, _len = pendingCallbacks.length; _j < _len; _j++) {
            callback = pendingCallbacks[_j];
            _results.push(callback());
          }
          return _results;
        });
      });
    };
    endLock = function(tx, locks, trans_id, successCallback, failureCallback) {
      var i, lock_id, locksCallback, _i, _ref;
      locksCallback = createAsyncQueueCallback(function() {
        return tx.executeSql('DELETE FROM "transaction" WHERE "id" = ?;', [trans_id], function(tx, result) {
          return validateDB(tx, serverModelCache.getSQL(), successCallback, failureCallback);
        }, function(tx, error) {
          return failureCallback(tx, [error]);
        });
      }, function(errors) {
        return failureCallback(tx, errors);
      });
      for (i = _i = 0, _ref = locks.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        lock_id = locks.rows.item(i).lock;
        locksCallback.addWork(3);
        tx.executeSql('SELECT * FROM "conditional_representation" WHERE "lock" = ?;', [lock_id], function(tx, crs) {
          return tx.executeSql('SELECT r."resource_type", r."resource_id" FROM "resource-is_under-lock" rl JOIN "resource" r ON rl."resource" = r."id" WHERE "lock" = ?;', [lock_id], function(tx, locked) {
            var asyncCallback, clientModel, item, j, lockedRow, method, requestBody, uri, _j, _ref1;
            lockedRow = locked.rows.item(0);
            asyncCallback = createAsyncQueueCallback(locksCallback.successCallback, locksCallback.failureCallback);
            asyncCallback.addWork(3);
            tx.executeSql('DELETE FROM "conditional_representation" WHERE "lock" = ?;', [lock_id], asyncCallback.successCallback, asyncCallback.errorCallback);
            tx.executeSql('DELETE FROM "resource-is_under-lock" WHERE "lock" = ?;', [lock_id], asyncCallback.successCallback, asyncCallback.errorCallback);
            requestBody = [{}];
            if (crs.rows.item(0).field_name === "__DELETE") {
              method = 'DELETE';
            } else {
              method = 'PUT';
              for (j = _j = 0, _ref1 = crs.rows.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
                item = crs.rows.item(j);
                requestBody[0][item.field_name] = item.field_value;
              }
            }
            clientModel = clientModels['data'].resources[lockedRow.resource_type];
            uri = '/data/' + lockedRow.resource_type + '?filter=' + clientModel.idField + ':' + lockedRow.resource_id;
            runURI(method, uri, requestBody, tx, asyncCallback.successCallback, asyncCallback.errorCallback);
            return asyncCallback.endAdding();
          });
        });
        tx.executeSql('DELETE FROM "lock-belongs_to-transaction" WHERE "lock" = ?;', [lock_id], locksCallback.successCallback, locksCallback.errorCallback);
        tx.executeSql('DELETE FROM "lock" WHERE "id" = ?;', [lock_id], locksCallback.successCallback, locksCallback.errorCallback);
      }
      return locksCallback.endAdding();
    };
    validateDB = function(tx, sqlmod, successCallback, failureCallback) {
      var asyncCallback, rule, _i, _len, _ref;
      asyncCallback = createAsyncQueueCallback(function() {
        tx.end();
        return successCallback(tx);
      }, function(errors) {
        tx.rollback();
        return failureCallback(tx, errors);
      });
      asyncCallback.addWork(sqlmod.rules.length);
      _ref = sqlmod.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        tx.executeSql(rule.sql, [], (function(rule) {
          return function(tx, result) {
            var _ref1;
            if ((_ref1 = result.rows.item(0).result) === false || _ref1 === 0) {
              return asyncCallback.errorCallback(rule.structuredEnglish);
            } else {
              return asyncCallback.successCallback();
            }
          };
        })(rule));
      }
      return asyncCallback.endAdding();
    };
    executeSqlModel = function(tx, sqlModel, successCallback, failureCallback) {
      var createStatement, _i, _len, _ref;
      _ref = sqlModel.createSchema;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        createStatement = _ref[_i];
        tx.executeSql(createStatement);
      }
      return validateDB(tx, sqlModel, successCallback, failureCallback);
    };
    getID = function(tree) {
      var comparison, id, query, whereClause, _i, _j, _len, _len1, _ref, _ref1;
      id = 0;
      if (id === 0) {
        query = tree[2].query;
        for (_i = 0, _len = query.length; _i < _len; _i++) {
          whereClause = query[_i];
          if (whereClause[0] === 'Where') {
            _ref = whereClause.slice(1);
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              comparison = _ref[_j];
              if (comparison[0] === "Equals" && ((_ref1 = comparison[1][2]) === 'id' || _ref1 === 'name')) {
                return comparison[2][1];
              }
            }
          }
        }
      }
      return id;
    };
    runURI = function(method, uri, body, tx, successCallback, failureCallback) {
      var req, res;
      if (body == null) {
        body = {};
      }
      console.log('Running URI', method, uri, body);
      req = {
        tree: serverURIParser.match([method, body, uri], 'Process'),
        body: body
      };
      res = {
        send: function(statusCode) {
          if (statusCode === 404) {
            return typeof failureCallback === "function" ? failureCallback() : void 0;
          } else {
            return typeof successCallback === "function" ? successCallback() : void 0;
          }
        },
        json: function(data) {
          return typeof successCallback === "function" ? successCallback(data) : void 0;
        }
      };
      switch (method) {
        case 'GET':
          return runGet(req, res, tx);
        case 'POST':
          return runPost(req, res, tx);
        case 'PUT':
          return runPut(req, res, tx);
        case 'DELETE':
          return runDelete(req, res, tx);
      }
    };
    getAndCheckBindValues = function(bindings, values) {
      var bindValues, binding, field, fieldName, referencedName, validated, value, _i, _len, _ref;
      bindValues = [];
      for (_i = 0, _len = bindings.length; _i < _len; _i++) {
        binding = bindings[_i];
        field = binding[1];
        fieldName = field[1];
        referencedName = binding[0] + '.' + fieldName;
        value = values[referencedName] === void 0 ? values[fieldName] : values[referencedName];
        _ref = AbstractSQL2SQL.dataTypeValidate(value, field), validated = _ref.validated, value = _ref.value;
        if (validated !== true) {
          return '"' + fieldName + '" ' + validated;
        }
        bindValues.push(value);
      }
      return bindValues;
    };
    runGet = function(req, res, tx) {
      var bindings, clientModel, data, query, runQuery, tree, values, _ref;
      tree = req.tree;
      if (tree[2] === void 0) {
        return res.send(404);
      } else if (tree[2].query != null) {
        _ref = AbstractSQLRules2SQL.match(tree[2].query, 'ProcessQuery'), query = _ref.query, bindings = _ref.bindings;
        values = getAndCheckBindValues(bindings, tree[2].values);
        console.log(query, values);
        if (!_.isArray(values)) {
          return res.json(values, 404);
        } else {
          runQuery = function(tx) {
            return tx.executeSql(query, values, function(tx, result) {
              var clientModel, data, i;
              if (values.length > 0 && result.rows.length === 0) {
                return res.send(404);
              } else {
                clientModel = clientModels[tree[1][1]];
                data = {
                  instances: (function() {
                    var _i, _ref1, _results;
                    _results = [];
                    for (i = _i = 0, _ref1 = result.rows.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
                      _results.push(result.rows.item(i));
                    }
                    return _results;
                  })(),
                  model: clientModel.resources[tree[2].resourceName]
                };
                return res.json(data);
              }
            }, function() {
              return res.send(404);
            });
          };
          if (tx != null) {
            return runQuery(tx);
          } else {
            return db.transaction(runQuery);
          }
        }
      } else {
        clientModel = clientModels[tree[1][1]];
        data = {
          model: clientModel.resources[tree[2].resourceName]
        };
        return res.json(data);
      }
    };
    runPost = function(req, res, tx) {
      var bindings, query, runQuery, tree, values, vocab, _ref;
      tree = req.tree;
      if (tree[2] === void 0) {
        return res.send(404);
      } else {
        _ref = AbstractSQLRules2SQL.match(tree[2].query, 'ProcessQuery'), query = _ref.query, bindings = _ref.bindings;
        values = getAndCheckBindValues(bindings, tree[2].values);
        console.log(query, values);
        if (!_.isArray(values)) {
          return res.json(values, 404);
        } else {
          vocab = tree[1][1];
          runQuery = function(tx) {
            tx.begin();
            return tx.executeSql(query, values, function(tx, sqlResult) {
              return validateDB(tx, sqlModels[vocab], function(tx) {
                var insertID;
                tx.end();
                insertID = tree[2].query[0] === 'UpdateQuery' ? values[0] : sqlResult.insertId;
                console.log('Insert ID: ', insertID);
                return res.send(201, {
                  location: '/' + vocab + '/' + tree[2].resourceName + "?filter=" + tree[2].resourceName + ".id:" + insertID
                });
              }, function(tx, errors) {
                return res.json(errors, 404);
              });
            }, function() {
              return res.send(404);
            });
          };
          if (tx != null) {
            return runQuery(tx);
          } else {
            return db.transaction(runQuery);
          }
        }
      }
    };
    runPut = function(req, res, tx) {
      var doValidate, id, insertQuery, queries, runQuery, tree, updateQuery, values, vocab;
      tree = req.tree;
      if (tree[2] === void 0) {
        return res.send(404);
      } else {
        queries = AbstractSQLRules2SQL.match(tree[2].query, 'ProcessQuery');
        if (_.isArray(queries)) {
          insertQuery = queries[0];
          updateQuery = queries[1];
        } else {
          insertQuery = queries;
        }
        values = getAndCheckBindValues(insertQuery.bindings, tree[2].values);
        console.log(insertQuery.query, values);
        if (!_.isArray(values)) {
          return res.json(values, 404);
        } else {
          vocab = tree[1][1];
          doValidate = function(tx) {
            return validateDB(tx, sqlModels[vocab], function(tx) {
              tx.end();
              return res.send(200);
            }, function(tx, errors) {
              return res.json(errors, 404);
            });
          };
          id = getID(tree);
          runQuery = function(tx) {
            tx.begin();
            return db.transaction(function(tx) {
              return tx.executeSql('SELECT NOT EXISTS(SELECT 1 FROM "resource" r JOIN "resource-is_under-lock" AS rl ON rl."resource" = r."id" WHERE r."resource_type" = ? AND r."id" = ?) AS result;', [tree[2].resourceName, id], function(tx, result) {
                var _ref;
                if ((_ref = result.rows.item(0).result) === 0 || _ref === false) {
                  return res.json(["The resource is locked and cannot be edited"], 404);
                } else {
                  return tx.executeSql(insertQuery.query, values, function(tx, result) {
                    return doValidate(tx);
                  }, function(tx) {
                    if (updateQuery != null) {
                      values = getAndCheckBindValues(updateQuery.bindings, tree[2].values);
                      console.log(updateQuery.query, values);
                      if (!_.isArray(values)) {
                        return res.json(values, 404);
                      } else {
                        return tx.executeSql(updateQuery.query, values, function(tx, result) {
                          return doValidate(tx);
                        }, function() {
                          return res.send(404);
                        });
                      }
                    } else {
                      return res.send(404);
                    }
                  });
                }
              });
            });
          };
          if (tx != null) {
            return runQuery(tx);
          } else {
            return db.transaction(runQuery);
          }
        }
      }
    };
    runDelete = function(req, res, tx) {
      var bindings, query, runQuery, tree, values, vocab, _ref;
      tree = req.tree;
      if (tree[2] === void 0) {
        return res.send(404);
      } else {
        _ref = AbstractSQLRules2SQL.match(tree[2].query, 'ProcessQuery'), query = _ref.query, bindings = _ref.bindings;
        values = getAndCheckBindValues(bindings, tree[2].values);
        console.log(query, values);
        if (!_.isArray(values)) {
          return res.json(values, 404);
        } else {
          vocab = tree[1][1];
          runQuery = function(tx) {
            tx.begin();
            return tx.executeSql(query, values, function(tx, result) {
              return validateDB(tx, sqlModels[vocab], function(tx) {
                tx.end();
                return res.send(200);
              }, function(tx, errors) {
                return res.json(errors, 404);
              });
            }, function() {
              return res.send(404);
            });
          };
          if (tx != null) {
            return runQuery(tx);
          } else {
            return db.transaction(runQuery);
          }
        }
      }
    };
    serverIsOnAir = function(req, res, next) {
      return serverModelCache.whenLoaded(function() {
        if (serverModelCache.isServerOnAir()) {
          return next();
        } else {
          return next('route');
        }
      });
    };
    parseURITree = function(req, res, next) {
      if (!(req.tree != null)) {
        try {
          req.tree = serverURIParser.match([req.method, req.body, req.url], 'Process');
          console.log(req.url, req.tree, req.body);
        } catch (e) {
          req.tree = false;
        }
      }
      if (req.tree === false) {
        return next('route');
      } else {
        return next();
      }
    };
    exports.setup = function(app, requirejs) {
      requirejs(['database-layer/db'], function(dbModule) {
        if (typeof process !== "undefined" && process !== null) {
          db = dbModule.postgres(process.env.DATABASE_URL || "postgres://postgres:.@localhost:5432/postgres");
          AbstractSQL2SQL = AbstractSQL2SQL.postgres;
        } else {
          db = dbModule.websql('rulemotion');
          AbstractSQL2SQL = AbstractSQL2SQL.websql;
        }
        serverModelCache();
        transactionModel = AbstractSQL2SQL.generate(transactionModel);
        userModel = AbstractSQL2SQL.generate(userModel);
        uiModel = AbstractSQL2SQL.generate(uiModel);
        sqlModels['transaction'] = transactionModel;
        sqlModels['user'] = userModel;
        sqlModels['ui'] = uiModel;
        clientModels['transaction'] = AbstractSQL2CLF(transactionModel);
        clientModels['user'] = AbstractSQL2CLF(userModel);
        clientModels['ui'] = AbstractSQL2CLF(uiModel);
        serverURIParser.setClientModel('transaction', clientModels['transaction']);
        serverURIParser.setClientModel('user', clientModels['user']);
        serverURIParser.setClientModel('ui', clientModels['ui']);
        return db.transaction(function(tx) {
          executeSqlModel(tx, transactionModel, function() {
            return console.log('Sucessfully executed transaction model.');
          }, function(tx, error) {
            return console.log('Failed to execute transaction model.', error);
          });
          executeSqlModel(tx, userModel, function() {
            return console.log('Sucessfully executed user model.');
          }, function(tx, error) {
            return console.log('Failed to execute user model.', error);
          });
          return executeSqlModel(tx, uiModel, function() {
            return console.log('Sucessfully executed ui model.');
          }, function(tx, error) {
            return console.log('Failed to execute ui model.', error);
          });
        });
      });
      app.get('/onair', function(req, res, next) {
        return serverModelCache.whenLoaded(function() {
          return res.json(serverModelCache.isServerOnAir());
        });
      });
      app.get('/model', serverIsOnAir, function(req, res, next) {
        return res.json(serverModelCache.getLastSE());
      });
      app.get('/lfmodel', serverIsOnAir, function(req, res, next) {
        return res.json(serverModelCache.getLF());
      });
      app.get('/prepmodel', serverIsOnAir, function(req, res, next) {
        return res.json(serverModelCache.getPrepLF());
      });
      app.get('/sqlmodel', serverIsOnAir, function(req, res, next) {
        return res.json(serverModelCache.getSQL());
      });
      app.post('/update', serverIsOnAir, function(req, res, next) {
        return res.send(404);
      });
      app.post('/execute', function(req, res, next) {
        return runURI('GET', '/ui/textarea?filter=name:model_area', null, null, function(result) {
          var clientModel, lfmod, prepmod, se, sqlModel;
          se = result.instances[0].text;
          try {
            lfmod = SBVRParser.matchAll(se, "Process");
          } catch (e) {
            console.log('Error parsing model', e);
            res.json('Error parsing model', 404);
            return null;
          }
          prepmod = LF2AbstractSQL.match(LF2AbstractSQLPrep.match(lfmod, "Process"), "Process");
          sqlModel = AbstractSQL2SQL.generate(prepmod);
          clientModel = AbstractSQL2CLF(sqlModel);
          return db.transaction(function(tx) {
            tx.begin();
            return executeSqlModel(tx, sqlModel, function(tx) {
              runURI('PUT', '/ui/textarea-is_disabled?filter=textarea.name:model_area/', [
                {
                  value: true
                }
              ], tx);
              serverModelCache.setServerOnAir(true);
              serverModelCache.setLastSE(se);
              serverModelCache.setLF(lfmod);
              serverModelCache.setPrepLF(prepmod);
              serverModelCache.setSQL(sqlModel);
              clientModels['data'] = clientModel;
              serverURIParser.setClientModel('data', clientModels['data']);
              return res.send(200);
            }, function(tx, errors) {
              return res.json(errors, 404);
            });
          });
        }, function() {
          return res.send(404);
        });
      });
      app.del('/cleardb', function(req, res, next) {
        return db.transaction(function(tx) {
          return tx.tableList(function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              tx.dropTable(result.rows.item(i).name);
            }
            executeSqlModel(tx, transactionModel, function() {
              return console.log('Sucessfully executed transaction model.');
            }, function(tx, error) {
              return console.log('Failed to execute transaction model.', error);
            });
            executeSqlModel(tx, userModel, function() {
              return console.log('Sucessfully executed user model.');
            }, function(tx, error) {
              return console.log('Failed to execute user model.', error);
            });
            executeSqlModel(tx, uiModel, function() {
              return console.log('Sucessfully executed ui model.');
            }, function(tx, error) {
              return console.log('Failed to execute ui model.', error);
            });
            return res.send(200);
          });
        });
      });
      app.put('/importdb', function(req, res, next) {
        var asyncCallback, queries;
        queries = req.body.split(";");
        asyncCallback = createAsyncQueueCallback(function() {
          return res.send(200);
        }, function() {
          return res.send(404);
        });
        return db.transaction(function(tx) {
          var query, _i, _len;
          for (_i = 0, _len = queries.length; _i < _len; _i++) {
            query = queries[_i];
            if (query.trim().length > 0) {
              (function(query) {
                asyncCallback.addWork();
                return tx.executeSql(query, [], asyncCallback.successCallback, function(tx, error) {
                  console.log(query);
                  console.log(error);
                  return asyncCallback.errorCallback;
                });
              })(query);
            }
          }
          return asyncCallback.endAdding();
        });
      });
      app.get('/exportdb', function(req, res, next) {
        var env;
        if (typeof process !== "undefined" && process !== null) {
          env = process.env;
          env['PGPASSWORD'] = '.';
          req = require;
          return req('child_process').exec('pg_dump --clean -U postgres -h localhost -p 5432', {
            env: env
          }, function(error, stdout, stderr) {
            console.log(stdout, stderr);
            return res.json(stdout);
          });
        } else {
          return db.transaction(function(tx) {
            return tx.tableList(function(tx, result) {
              var asyncCallback, exported, i, tbn, _fn, _i, _ref;
              exported = '';
              asyncCallback = createAsyncQueueCallback(function() {
                return res.json(exported);
              }, function() {
                return res.send(404);
              });
              asyncCallback.addWork(result.rows.length);
              _fn = function(tbn) {
                return db.transaction(function(tx) {
                  return tx.executeSql('SELECT * FROM "' + tbn + '";', [], function(tx, result) {
                    var currRow, insQuery, notFirst, propName, valQuery, _j, _ref1;
                    insQuery = "";
                    for (i = _j = 0, _ref1 = result.rows.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
                      currRow = result.rows.item(i);
                      notFirst = false;
                      insQuery += 'INSERT INTO "' + tbn + '" (';
                      valQuery = '';
                      for (propName in currRow) {
                        if (!__hasProp.call(currRow, propName)) continue;
                        if (notFirst) {
                          insQuery += ",";
                          valQuery += ",";
                        } else {
                          notFirst = true;
                        }
                        insQuery += '"' + propName + '"';
                        valQuery += "'" + currRow[propName] + "'";
                      }
                      insQuery += ") values (" + valQuery + ");\n";
                    }
                    exported += insQuery;
                    return asyncCallback.successCallback();
                  }, asyncCallback.errorCallback);
                });
              };
              for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                tbn = result.rows.item(i).name;
                exported += 'DROP TABLE IF EXISTS "' + tbn + '";\n';
                exported += result.rows.item(i).sql + ";\n";
                _fn(tbn);
              }
              return asyncCallback.endAdding();
            }, null, "name NOT LIKE '%_buk'");
          });
        }
      });
      app.post('/backupdb', serverIsOnAir, function(req, res, next) {
        return db.transaction(function(tx) {
          return tx.tableList(function(tx, result) {
            var asyncCallback, i, tbn, _i, _ref, _results;
            asyncCallback = createAsyncQueueCallback(function() {
              return res.send(200);
            }, function() {
              return res.send(404);
            });
            asyncCallback.addWork(result.rows.length * 2);
            _results = [];
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              tbn = result.rows.item(i).name;
              tx.dropTable(tbn + '_buk', true, asyncCallback.successCallback, asyncCallback.errorCallback);
              _results.push(tx.executeSql('ALTER TABLE "' + tbn + '" RENAME TO "' + tbn + '_buk";', asyncCallback.successCallback, asyncCallback.errorCallback));
            }
            return _results;
          }, function() {
            return res.send(404);
          }, "name NOT LIKE '%_buk'");
        });
      });
      app.post('/restoredb', serverIsOnAir, function(req, res, next) {
        return db.transaction(function(tx) {
          return tx.tableList(function(tx, result) {
            var asyncCallback, i, tbn, _i, _ref, _results;
            asyncCallback = createAsyncQueueCallback(function() {
              return res.send(200);
            }, function() {
              return res.send(404);
            });
            asyncCallback.addWork(result.rows.length * 2);
            _results = [];
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              tbn = result.rows.item(i).name;
              tx.dropTable(tbn.slice(0, -4), true, asyncCallback.successCallback, asyncCallback.errorCallback);
              _results.push(tx.executeSql('ALTER TABLE "' + tbn + '" RENAME TO "' + tbn.slice(0, -4) + '";', asyncCallback.successCallback, asyncCallback.errorCallback));
            }
            return _results;
          }, function() {
            return res.send(404);
          }, "name LIKE '%_buk'");
        });
      });
      app.post('/transaction/execute/*', serverIsOnAir, function(req, res, next) {
        var id;
        id = req.url.split('/');
        id = id[id.length - 1];
        return db.transaction((function(tx) {
          return tx.executeSql('SELECT * FROM "lock-belongs_to-transaction" WHERE "transaction" = ?;', [id], function(tx, locks) {
            return endLock(tx, locks, id, function(tx) {
              return res.send(200);
            }, function(tx, errors) {
              return res.json(errors, 404);
            });
          });
        }));
      });
      app.get('/ui/*', parseURITree, function(req, res, next) {
        return runGet(req, res);
      });
      app.get('/transaction/*', serverIsOnAir, parseURITree, function(req, res, next) {
        var bindings, query, tree, values, _ref;
        tree = req.tree;
        if (tree[2] === void 0) {
          return __TODO__.die();
        } else {
          if (tree[2].resourceName === 'transaction') {
            _ref = AbstractSQLRules2SQL.match(tree[2].query, 'ProcessQuery'), query = _ref.query, bindings = _ref.bindings;
            values = getAndCheckBindValues(bindings, tree[2].values);
            console.log(query, values);
            if (!_.isArray(values)) {
              return res.json(values, 404);
            } else {
              return db.transaction(function(tx) {
                return tx.executeSql(query, values, function(tx, result) {
                  if (result.rows.length > 1) {
                    __TODO__.die();
                  }
                  return res.json({
                    id: result.rows.item(0).id,
                    tcURI: "/transaction",
                    lcURI: "/transaction/lock",
                    tlcURI: "/transaction/lock-belongs_to-transaction",
                    rcURI: "/transaction/resource",
                    lrcURI: "/transaction/resource-is_under-lock",
                    slcURI: "/transaction/lock-is_shared",
                    xlcURI: "/transaction/lock-is_exclusive",
                    ctURI: "/transaction/execute/" + result.rows.item(0).id
                  });
                }, function() {
                  return res.send(404);
                });
              });
            }
          } else {
            return runGet(req, res);
          }
        }
      });
      app.get('/data/*', serverIsOnAir, parseURITree, function(req, res, next) {
        var tree;
        tree = req.tree;
        if (tree[2] === void 0) {
          return res.json(clientModels[tree[1][1]].resources);
        } else {
          return runGet(req, res);
        }
      });
      app.post('/transaction/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runPost(req, res);
      });
      app.post('/data/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runPost(req, res);
      });
      app.put('/ui/*', parseURITree, function(req, res, next) {
        return runPut(req, res);
      });
      app.put('/transaction/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runPut(req, res);
      });
      app.put('/data/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runPut(req, res);
      });
      app.del('/transaction/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runDelete(req, res);
      });
      app.del('/data/*', serverIsOnAir, parseURITree, function(req, res, next) {
        return runDelete(req, res);
      });
      return app.del('/', serverIsOnAir, function(req, res, next) {
        db.transaction((function(sqlmod) {
          return function(tx) {
            var dropStatement, _i, _len, _ref, _results;
            _ref = sqlmod.dropSchema;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              dropStatement = _ref[_i];
              _results.push(tx.executeSql(dropStatement));
            }
            return _results;
          };
        })(serverModelCache.getSQL()));
        runURI('DELETE', '/ui/textarea-is_disabled?filter=textarea.name:model_area/');
        runURI('PUT', '/ui/textarea?filter=name:model_area/', [
          {
            text: ''
          }
        ]);
        serverModelCache.setLastSE('');
        serverModelCache.setPrepLF([]);
        serverModelCache.setLF([]);
        serverModelCache.setSQL([]);
        serverModelCache.setServerOnAir(false);
        return res.send(200);
      });
    };
    return exports;
  });

}).call(this);
