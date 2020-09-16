(function () {
    enyo = window.enyo || {};
    enyo.locateScript = function (b) {
        for (var d = document.getElementsByTagName("script"), e = d.length - 1, j, k, l = b.length; e >= 0 && (j = d[e]); e--)
            if (!j.located && (k = j.getAttribute("src") || "",
                k.slice(-l) == b))
                return j.located = !0,
                {
                    path: k.slice(0, Math.max(0, k.lastIndexOf("/"))),
                    node: j
                }
    }
        ;
    enyo.args = enyo.args || {};
    var b = enyo.locateScript("enyo.js");
    if (b) {
        enyo.args.root = (enyo.args.root || b.path).replace("/source", "");
        for (var d = 0, e; e = b.node.attributes.item(d); d++)
            enyo.args[e.nodeName] = e.value
    }
}
)();
(function () {
    enyo = window.enyo || {};
    enyo.path = {
        paths: {},
        addPath: function (b, d) {
            return this.paths[b] = d
        },
        addPaths: function (b) {
            if (b)
                for (var d in b)
                    this.addPath(d, b[d])
        },
        includeTrailingSlash: function (b) {
            return b && b.slice(-1) !== "/" ? b + "/" : b
        },
        rewritePattern: /\$([^\/\\]*)(\/)?/g,
        rewrite: function (b) {
            var d, e = this.includeTrailingSlash, f = this.paths, g = function (b, g) {
                return d = !0,
                    e(f[g]) || ""
            };
            do
                d = !1,
                    b = b.replace(this.rewritePattern, g);
            while (d); return b
        }
    };
    enyo.loaderFactory = function (b) {
        this.machine = b;
        this.packages = [];
        this.modules = [];
        this.sheets = [];
        this.stack = []
    }
        ;
    enyo.loaderFactory.prototype = {
        packageName: "",
        packageFolder: "",
        verbose: !1,
        finishCallbacks: {},
        loadScript: function (b) {
            this.machine.script(b)
        },
        loadSheet: function (b) {
            this.machine.sheet(b)
        },
        loadPackage: function (b) {
            this.machine.script(b)
        },
        report: function () { },
        load: function () {
            this.more({
                index: 0,
                depends: arguments || []
            })
        },
        more: function (b) {
            if (!b || !this.continueBlock(b))
                (b = this.stack.pop()) ? (this.verbose && console.groupEnd("* finish package (" + (b.packageName || "anon") + ")"),
                    this.packageFolder = b.folder,
                    this.packageName = "",
                    this.more(b)) : this.finish()
        },
        finish: function () {
            this.packageFolder = "";
            this.verbose && console.log("-------------- fini");
            for (var b in this.finishCallbacks)
                this.finishCallbacks[b] && (this.finishCallbacks[b](),
                    this.finishCallbacks[b] = null)
        },
        continueBlock: function (b) {
            for (; b.index < b.depends.length;) {
                var d = b.depends[b.index++];
                if (d)
                    if (typeof d == "string") {
                        if (this.require(d, b))
                            return !0
                    } else
                        enyo.path.addPaths(d)
            }
        },
        require: function (b, d) {
            var e = enyo.path.rewrite(b)
                , f = this.getPathPrefix(b)
                , e = f + e;
            if (e.slice(-4) == ".css" || e.slice(-5) == ".less")
                this.verbose && console.log("+ stylesheet: [" + f + "][" + b + "]"),
                    this.requireStylesheet(e);
            else {
                if (e.slice(-3) != ".js" || e.slice(-10) == "package.js")
                    return this.requirePackage(e, d),
                        !0;
                this.verbose && console.log("+ module: [" + f + "][" + b + "]");
                this.requireScript(b, e)
            }
        },
        getPathPrefix: function (b) {
            var d = b.slice(0, 1);
            return d != "/" && d != "\\" && d != "$" && b.slice(0, 5) != "https:" ? this.packageFolder : ""
        },
        requireStylesheet: function (b) {
            this.sheets.push(b);
            this.loadSheet(b)
        },
        requireScript: function (b, d) {
            this.modules.push({
                packageName: this.packageName,
                rawPath: b,
                path: d
            });
            this.loadScript(d)
        },
        decodePackagePath: function (b) {
            var d = ""
                , e = ""
                , f = ""
                , g = "package.js"
                , b = b.replace(/\\/g, "/").replace(/\/\//g, "/").replace(/:\//, "://").split("/");
            if (b.length) {
                e = b.pop() || b.pop() || "";
                e.slice(-g.length) !== g ? b.push(e) : g = e;
                f = b.join("/");
                f = f ? f + "/" : "";
                g = f + g;
                for (d = b.length - 1; d >= 0; d--)
                    if (b[d] == "source") {
                        b.splice(d, 1);
                        break
                    }
                for (var e = b.join("/"), d = b.length - 1, i; i = b[d]; d--)
                    if (i == "lib" || i == "enyo") {
                        b = b.slice(d + 1);
                        break
                    }
                for (d = b.length - 1; i = b[d]; d--)
                    (i == ".." || i == ".") && b.splice(d, 1);
                d = b.join("-")
            }
            return {
                alias: d,
                target: e,
                folder: f,
                manifest: g
            }
        },
        aliasPackage: function (b) {
            b = this.decodePackagePath(b);
            this.manifest = b.manifest;
            b.alias && (enyo.path.addPath(b.alias, b.target),
                this.packageName = b.alias,
                this.packages.push({
                    name: b.alias,
                    folder: b.folder
                }));
            this.packageFolder = b.folder
        },
        requirePackage: function (b, d) {
            d.folder = this.packageFolder;
            this.aliasPackage(b);
            d.packageName = this.packageName;
            this.stack.push(d);
            this.report("loading package", this.packageName);
            this.verbose && console.group("* start package [" + this.packageName + "]");
            this.loadPackage(this.manifest)
        }
    }
}
)();
enyo.machine = {
    sheet: function (b) {
        var d = "text/css"
            , e = "stylesheet"
            , f = b.slice(-5) == ".less";
        f && (window.less ? (d = "text/less",
            e = "stylesheet/less") : b = b.slice(0, b.length - 4) + "css");
        var g;
        enyo.runtimeLoading || f ? (g = document.createElement("link"),
            g.href = b,
            g.media = "screen",
            g.rel = e,
            g.type = d,
            document.getElementsByTagName("head")[0].appendChild(g)) : document.write('<link href="' + b + '" media="screen" rel="' + e + '" type="' + d + '" />');
        f && window.less && (less.sheets.push(g),
            enyo.loader.finishCallbacks.lessRefresh || (enyo.loader.finishCallbacks.lessRefresh = function () {
                less.refresh(!0)
            }
            ))
    },
    script: function (b, d, e) {
        if (enyo.runtimeLoading) {
            var f = document.createElement("script");
            f.src = b;
            f.onLoad = d;
            f.onError = e;
            document.getElementsByTagName("head")[0].appendChild(f)
        } else
            document.write('<script src="' + b + '"' + (d ? ' onload="' + d + '"' : "") + (e ? ' onerror="' + e + '"' : "") + "><\/script>")
    },
    inject: function (b) {
        document.write('<script type="text/javascript">' + b + "<\/script>")
    }
};
enyo.loader = new enyo.loaderFactory(enyo.machine);
enyo.depends = function () {
    var b = enyo.loader;
    if (!b.packageFolder) {
        var d = enyo.locateScript("package.js");
        d && d.path && (b.aliasPackage(d.path),
            b.packageFolder = d.path + "/")
    }
    b.load.apply(b, arguments)
}
    ;
(function () {
    function b(f) {
        f && f();
        if (e.length) {
            var f = e.shift()
                , g = f[0]
                , i = d.isArray(g) ? g : [g]
                , j = f[1];
            d.loader.finishCallbacks.runtimeLoader = function () {
                b(function () {
                    j && j(g)
                })
            }
                ;
            d.loader.packageFolder = "./";
            d.depends.apply(this, i)
        } else
            d.runtimeLoading = !1,
                d.loader.packageFolder = ""
    }
    var d = window.enyo
        , e = [];
    d.load = function (f, g) {
        e.push(arguments);
        d.runtimeLoading || (d.runtimeLoading = !0,
            b())
    }
}
)();
enyo.path.addPaths({
    enyo: enyo.args.root,
    lib: "$enyo/../lib"
});
enyo.logging = {
    level: 99,
    levels: {
        log: 20,
        warn: 10,
        error: 0
    },
    shouldLog: function (b) {
        return parseInt(this.levels[b], 0) <= this.level
    },
    _log: function (b, d) {
        var e = enyo.isArray(d) ? d : enyo.cloneArray(d);
        enyo.dumbConsole && (e = [e.join(" ")]);
        var f = console[b];
        f && f.apply ? f.apply(console, e) : console.log.apply ? console.log.apply(console, e) : console.log(e.join(" "))
    },
    log: function (b, d) {
        window.console && this.shouldLog(b) && this._log(b, d)
    }
};
enyo.setLogLevel = function (b) {
    b = parseInt(b, 0);
    isFinite(b) && (enyo.logging.level = b)
}
    ;
enyo.log = function () {
    enyo.logging.log("log", arguments)
}
    ;
enyo.warn = function () {
    enyo.logging.log("warn", arguments)
}
    ;
enyo.error = function () {
    enyo.logging.log("error", arguments)
}
    ;
(function () {
    enyo.global = this;
    enyo._getProp = function (b, d, g) {
        for (var g = g || enyo.global, i = 0, j; g && (j = b[i]); i++)
            g = j in g ? g[j] : d ? g[j] = {} : void 0;
        return g
    }
        ;
    enyo.bindSafely = function (b, d) {
        if (enyo.isString(d)) {
            if (!b[d])
                throw 'enyo.bindSafely: scope["' + d + '"] is null (this="' + this + '")';
            d = b[d]
        }
        if (enyo.isFunction(d)) {
            var g = enyo.cloneArray(arguments, 2);
            return function () {
                if (!b.destroyed) {
                    var i = enyo.cloneArray(arguments);
                    return d.apply(b, g.concat(i))
                }
            }
        }
        throw 'enyo.bindSafely: scope["' + d + '"] is not a function (this="' + this + '")';
    }
        ;
    enyo.setObject = function (b, d, g) {
        var i = b.split(".")
            , b = i.pop();
        return (g = enyo._getProp(i, !0, g)) && b ? g[b] = d : void 0
    }
        ;
    enyo.getObject = function (b, d, g) {
        return enyo._getProp(b.split("."), d, g)
    }
        ;
    enyo.irand = function (b) {
        return Math.floor(Math.random() * b)
    }
        ;
    enyo.cap = function (b) {
        return b.slice(0, 1).toUpperCase() + b.slice(1)
    }
        ;
    enyo.uncap = function (b) {
        return b.slice(0, 1).toLowerCase() + b.slice(1)
    }
        ;
    enyo.format = function (b) {
        var d = 0
            , g = arguments;
        return b.replace(/\%./g, function () {
            return g[++d]
        })
    }
        ;
    var b = Object.prototype.toString;
    enyo.isString = function (d) {
        return b.call(d) === "[object String]"
    }
        ;
    enyo.isFunction = function (d) {
        return b.call(d) === "[object Function]"
    }
        ;
    enyo.isArray = Array.isArray || function (d) {
        return b.call(d) === "[object Array]"
    }
        ;
    enyo.indexOf = function (b, d, g) {
        if (d.indexOf)
            return d.indexOf(b, g);
        if (g && (g < 0 && (g = 0),
            g > d.length))
            return -1;
        for (var g = g || 0, i = d.length, j; (j = d[g]) || g < i; g++)
            if (j == b)
                return g;
        return -1
    }
        ;
    enyo.remove = function (b, d) {
        var g = enyo.indexOf(b, d);
        g >= 0 && d.splice(g, 1)
    }
        ;
    enyo.forEach = function (b, d, g) {
        if (b)
            if (g = g || this,
                enyo.isArray(b) && b.forEach)
                b.forEach(d, g);
            else
                for (var b = Object(b), i = b.length >>> 0, j = 0; j < i; j++)
                    j in b && d.call(g, b[j], j, b)
    }
        ;
    enyo.map = function (b, d, g) {
        var i = g || this;
        if (enyo.isArray(b) && b.map)
            return b.map(d, i);
        var j = [];
        return enyo.forEach(b, function (b, e, g) {
            j.push(d.call(i, b, e, g))
        }, i),
            j
    }
        ;
    enyo.filter = function (b, d, g) {
        var i = g || this;
        if (enyo.isArray(b) && b.filter)
            return b.filter(d, i);
        var j = [];
        return enyo.forEach(b, function (b, e, g) {
            d.call(i, b, e, g) && j.push(b)
        }, i),
            j
    }
        ;
    enyo.keys = Object.keys || function (b) {
        var d = [], g = Object.prototype.hasOwnProperty, i;
        for (i in b)
            g.call(b, i) && d.push(i);
        if (!{
            toString: null
        }.propertyIsEnumerable("toString")) {
            i = "toString,toLocaleString,valueOf,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,constructor".split(",");
            for (var j = 0, k; k = i[j]; j++)
                g.call(b, k) && d.push(k)
        }
        return d
    }
        ;
    enyo.cloneArray = function (b, d, g) {
        for (var g = g || [], d = d || 0, i = b.length; d < i; d++)
            g.push(b[d]);
        return g
    }
        ;
    enyo.toArray = enyo.cloneArray;
    enyo.clone = function (b) {
        return enyo.isArray(b) ? enyo.cloneArray(b) : enyo.mixin({}, b)
    }
        ;
    var d = {};
    enyo.mixin = function (b, f) {
        b = b || {};
        if (f) {
            var g, i;
            for (g in f)
                i = f[g],
                    d[g] !== i && (b[g] = i)
        }
        return b
    }
        ;
    enyo.bind = function (b, d) {
        d || (d = b,
            b = null);
        b = b || enyo.global;
        if (enyo.isString(d)) {
            if (!b[d])
                throw ['enyo.bind: scope["', d, '"] is null (scope="', b, '")'].join("");
            d = b[d]
        }
        if (enyo.isFunction(d)) {
            var g = enyo.cloneArray(arguments, 2);
            return d.bind ? d.bind.apply(d, [b].concat(g)) : function () {
                var i = enyo.cloneArray(arguments);
                return d.apply(b, g.concat(i))
            }
        }
        throw ['enyo.bind: scope["', d, '"] is not a function (scope="', b, '")'].join("");
    }
        ;
    enyo.asyncMethod = function (b, d) {
        return setTimeout(enyo.bind.apply(enyo, arguments), 1)
    }
        ;
    enyo.call = function (b, d, g) {
        b = b || this;
        if (d && (d = b[d] || d) && d.apply)
            return d.apply(b, g || [])
    }
        ;
    enyo.now = Date.now || function () {
        return (new Date).getTime()
    }
        ;
    enyo.nop = function () { }
        ;
    enyo.nob = {};
    enyo.nar = [];
    enyo.instance = function () { }
        ;
    enyo.setPrototype || (enyo.setPrototype = function (b, d) {
        b.prototype = d
    }
    );
    enyo.delegate = function (b) {
        return enyo.setPrototype(enyo.instance, b),
            new enyo.instance
    }
        ;
    $L = function (b) {
        return b
    }
}
)();
enyo.job = function (b, d, e) {
    enyo.job.stop(b);
    enyo.job._jobs[b] = setTimeout(function () {
        enyo.job.stop(b);
        d()
    }, e)
}
    ;
enyo.job.stop = function (b) {
    enyo.job._jobs[b] && (clearTimeout(enyo.job._jobs[b]),
        delete enyo.job._jobs[b])
}
    ;
enyo.job.throttle = function (b, d, e) {
    enyo.job._jobs[b] || (d(),
        enyo.job._jobs[b] = setTimeout(function () {
            enyo.job.stop(b)
        }, e))
}
    ;
enyo.job._jobs = {};
enyo.macroize = function (b, d, e) {
    var f, g, e = e || enyo.macroize.pattern, i = function (b, e) {
        return f = enyo.getObject(e, !1, d),
            f === void 0 || f === null ? "{$" + e + "}" : (g = !0,
                f)
    }, j = 0;
    do
        if (g = !1,
            b = b.replace(e, i),
            ++j >= 20)
            throw "enyo.macroize: recursion too deep";
    while (g); return b
}
    ;
enyo.quickMacroize = function (b, d, e) {
    var f;
    return b = b.replace(e || enyo.macroize.pattern, function (b, e) {
        return e in d ? f = d[e] : f = enyo.getObject(e, !1, d),
            f === void 0 || f === null ? "{$" + e + "}" : f
    }),
        b
}
    ;
enyo.macroize.pattern = /\{\$([^{}]*)\}/g;
enyo.kind = function (b) {
    enyo._kindCtors = {};
    var d = b.name || "";
    delete b.name;
    var e = "kind" in b
        , f = b.kind;
    delete b.kind;
    var g = enyo.constructorForKind(f)
        , i = g && g.prototype || null;
    if (e && f === void 0 || g === void 0)
        throw "enyo.kind: Attempt to subclass an undefined kind. Check dependencies for [" + (d || "<unnamed>") + "].";
    var j = enyo.kind.makeCtor();
    return b.hasOwnProperty("constructor") && (b._constructor = b.constructor,
        delete b.constructor),
        enyo.setPrototype(j, i ? enyo.delegate(i) : {}),
        enyo.mixin(j.prototype, b),
        j.prototype.kindName = d,
        j.prototype.base = g,
        j.prototype.ctor = j,
        enyo.forEach(enyo.kind.features, function (d) {
            d(j, b)
        }),
        enyo.setObject(d, j),
        j
}
    ;
enyo.singleton = function (b, d) {
    var e = b.name;
    delete b.name;
    var f = enyo.kind(b);
    enyo.setObject(e, new f, d)
}
    ;
enyo.kind.makeCtor = function () {
    return function () {
        if (!(this instanceof arguments.callee))
            throw "enyo.kind: constructor called directly, not using 'new'";
        var b;
        this._constructor && (b = this._constructor.apply(this, arguments));
        this.constructed && this.constructed.apply(this, arguments);
        if (b)
            return b
    }
}
    ;
enyo.kind.defaultNamespace = "enyo";
enyo.kind.features = [];
enyo.kind.features.push(function (b, d) {
    var e = b.prototype;
    e.inherited || (e.inherited = enyo.kind.inherited);
    if (e.base)
        for (var f in d) {
            var g = d[f];
            enyo.isFunction(g) && (g._inherited = e.base.prototype[f] || enyo.nop,
                g.nom = e.kindName + "." + f + "()")
        }
});
enyo.kind.inherited = function (b, d) {
    return b.callee._inherited.apply(this, d || b)
}
    ;
enyo.kind.features.push(function (b, d) {
    enyo.mixin(b, enyo.kind.statics);
    d.statics && (enyo.mixin(b, d.statics),
        delete b.prototype.statics);
    for (var e = b.prototype.base; e;)
        e.subclass(b, d),
            e = e.prototype.base
});
enyo.kind.statics = {
    subclass: function () { },
    extend: function (b) {
        enyo.mixin(this.prototype, b);
        var d = this;
        enyo.forEach(enyo.kind.features, function (e) {
            e(d, b)
        })
    }
};
enyo._kindCtors = {};
enyo.constructorForKind = function (b) {
    if (b === null || enyo.isFunction(b))
        return b;
    if (b) {
        var d = enyo._kindCtors[b];
        return d ? d : enyo._kindCtors[b] = enyo.Theme[b] || enyo[b] || enyo.getObject(b, !1, enyo) || window[b] || enyo.getObject(b)
    }
    return enyo.defaultCtor
}
    ;
enyo.Theme = {};
enyo.registerTheme = function (b) {
    enyo.mixin(enyo.Theme, b)
}
    ;
enyo.kind({
    name: "enyo.Object",
    kind: null,
    constructor: function () {
        enyo._objectCount++
    },
    setPropertyValue: function (b, d, e) {
        if (this[e]) {
            var f = this[b];
            this[b] = d;
            this[e](f)
        } else
            this[b] = d
    },
    _setProperty: function (b, d, e) {
        this.setPropertyValue(b, d, this.getProperty(b) !== d && e)
    },
    bindSafely: function (b) {
        var d = Array.prototype.concat.apply([this], arguments);
        return enyo.bindSafely.apply(enyo, d)
    },
    destroyObject: function (b) {
        this[b] && this[b].destroy && this[b].destroy();
        this[b] = null
    },
    getProperty: function (b) {
        var d = "get" + enyo.cap(b);
        return this[d] ? this[d]() : this[b]
    },
    setProperty: function (b, d) {
        var e = "set" + enyo.cap(b);
        this[e] ? this[e](d) : this._setProperty(b, d, b + "Changed")
    },
    log: function () {
        var b = arguments.callee.caller;
        enyo.logging.log("log", [((b ? b.nom : "") || "(instance method)") + ":"].concat(enyo.cloneArray(arguments)))
    },
    warn: function () {
        this._log("warn", arguments)
    },
    error: function () {
        this._log("error", arguments)
    },
    _log: function (b, d) {
        if (enyo.logging.shouldLog(b))
            try {
                throw Error();
            } catch (e) {
                enyo.logging._log(b, [d.callee.caller.nom + ": "].concat(enyo.cloneArray(d))),
                    console.log(e.stack)
            }
    }
});
enyo._objectCount = 0;
enyo.Object.subclass = function (b, d) {
    this.publish(b, d)
}
    ;
enyo.Object.publish = function (b, d) {
    var e = d.published;
    if (e) {
        var f = b.prototype, g;
        for (g in e)
            enyo.Object.addGetterSetter(g, e[g], f)
    }
}
    ;
enyo.Object.addGetterSetter = function (b, d, e) {
    e[b] = d;
    var d = enyo.cap(b)
        , f = "get" + d;
    e[f] || (e[f] = function () {
        return this[b]
    }
    );
    var d = "set" + d
        , g = b + "Changed";
    e[d] || (e[d] = function (d) {
        this._setProperty(b, d, g)
    }
    )
}
    ;
enyo.kind({
    name: "enyo.Component",
    kind: enyo.Object,
    published: {
        name: "",
        id: "",
        owner: null
    },
    statics: {
        _kindPrefixi: {},
        _unnamedKindNumber: 0
    },
    defaultKind: "Component",
    handlers: {},
    toString: function () {
        return this.kindName
    },
    constructor: function () {
        this._componentNameMap = {};
        this.$ = {};
        this.inherited(arguments)
    },
    constructed: function (b) {
        this.importProps(b);
        this.create()
    },
    importProps: function (b) {
        if (b)
            for (var d in b)
                this[d] = b[d];
        this.handlers = enyo.mixin(enyo.clone(this.kindHandlers), this.handlers)
    },
    create: function () {
        this.ownerChanged();
        this.initComponents()
    },
    initComponents: function () {
        this.createChrome(this.kindComponents);
        this.createClientComponents(this.components)
    },
    createChrome: function (b) {
        this.createComponents(b, {
            isChrome: !0
        })
    },
    createClientComponents: function (b) {
        this.createComponents(b, {
            owner: this.getInstanceOwner()
        })
    },
    getInstanceOwner: function () {
        return !this.owner || this.owner.notInstanceOwner ? this : this.owner
    },
    destroy: function () {
        this.destroyComponents();
        this.setOwner(null);
        this.destroyed = !0;
        this.stopAllJobs()
    },
    destroyComponents: function () {
        enyo.forEach(this.getComponents(), function (b) {
            b.destroyed || b.destroy()
        })
    },
    makeId: function () {
        var b = this.owner && this.owner.getId()
            , d = this.name || "@@" + ++enyo.Component._unnamedKindNumber;
        return (b ? b + "_" : "") + d
    },
    ownerChanged: function (b) {
        b && b.removeComponent(this);
        this.owner && this.owner.addComponent(this);
        this.id || (this.id = this.makeId())
    },
    nameComponent: function (b) {
        var d = enyo.Component.prefixFromKindName(b.kindName), e, f = this._componentNameMap[d] || 0;
        do
            e = d + (++f > 1 ? String(f) : "");
        while (this.$[e]); return this._componentNameMap[d] = Number(f),
            b.name = e
    },
    addComponent: function (b) {
        var d = b.getName();
        d || (d = this.nameComponent(b));
        this.$[d] && this.warn('Duplicate component name "' + d + '" in owner "' + this.id + '" violates unique-name-under-owner rule, replacing existing component in the hash and continuing, but this is an error condition and should be fixed.');
        this.$[d] = b
    },
    removeComponent: function (b) {
        delete this.$[b.getName()]
    },
    getComponents: function () {
        var b = [], d;
        for (d in this.$)
            b.push(this.$[d]);
        return b
    },
    adjustComponentProps: function (b) {
        this.defaultProps && enyo.mixin(b, this.defaultProps);
        b.kind = b.kind || b.isa || this.defaultKind;
        b.owner = b.owner || this
    },
    _createComponent: function (b, d) {
        if (!b.kind && "kind" in b)
            throw "enyo.create: Attempt to create a null kind. Check dependencies for [" + b.name + "].";
        var e = enyo.mixin(enyo.clone(d), b);
        return this.adjustComponentProps(e),
            enyo.Component.create(e)
    },
    createComponent: function (b, d) {
        return this._createComponent(b, d)
    },
    createComponents: function (b, d) {
        if (b) {
            for (var e = [], f = 0, g; g = b[f]; f++)
                e.push(this._createComponent(g, d));
            return e
        }
    },
    getBubbleTarget: function () {
        return this.owner
    },
    bubble: function (b, d, e) {
        d = d || {};
        return "originator" in d || (d.originator = e || this),
            this.dispatchBubble(b, d, e)
    },
    bubbleUp: function (b, d) {
        var e = this.getBubbleTarget();
        return e ? e.dispatchBubble(b, d, this) : !1
    },
    dispatchEvent: function (b, d, e) {
        this.decorateEvent(b, d, e);
        if (this.handlers[b] && this.dispatch(this.handlers[b], d, e))
            return !0;
        if (this[b])
            return this.bubbleDelegation(this.owner, this[b], b, d, this)
    },
    dispatchBubble: function (b, d, e) {
        return this.dispatchEvent(b, d, e) ? !0 : this.bubbleUp(b, d, e)
    },
    decorateEvent: function () { },
    bubbleDelegation: function (b, d, e, f, g) {
        var i = this.getBubbleTarget();
        if (i)
            return i.delegateEvent(b, d, e, f, g)
    },
    delegateEvent: function (b, d, e, f, g) {
        return this.decorateEvent(e, f, g),
            b == this ? this.dispatch(d, f, g) : this.bubbleDelegation(b, d, e, f, g)
    },
    stopAllJobs: function () {
        if (this.__jobs)
            for (var b in this.__jobs)
                this.stopJob(b)
    },
    dispatch: function (b, d, e) {
        if (b = b && this[b])
            return b.call(this, e || this, d)
    },
    waterfall: function (b, d, e) {
        if (this.dispatchEvent(b, d, e))
            return !0;
        this.waterfallDown(b, d, e || this)
    },
    waterfallDown: function (b, d, e) {
        for (var f in this.$)
            this.$[f].waterfall(b, d, e)
    },
    startJob: function (b, d, e, f) {
        var f = f || 5
            , g = this.__jobs = this.__jobs || {};
        enyo.isString(d) && (d = this[d]);
        this.stopJob(b);
        g[b] = setTimeout(this.bindSafely(function () {
            enyo.jobs.add(this.bindSafely(d), f, b)
        }), e)
    },
    stopJob: function (b) {
        var d = this.__jobs = this.__jobs || {};
        d[b] && (clearTimeout(d[b]),
            delete d[b]);
        enyo.jobs.remove(b)
    },
    throttleJob: function (b, d, e) {
        var f = this.__jobs = this.__jobs || {};
        f[b] || (enyo.isString(d) && (d = this[d]),
            d.call(this),
            f[b] = setTimeout(this.bindSafely(function () {
                this.stopJob(b)
            }), e))
    }
});
enyo.defaultCtor = enyo.Component;
enyo.create = enyo.Component.create = function (b) {
    if (!b.kind && "kind" in b)
        throw "enyo.create: Attempt to create a null kind. Check dependencies for [" + (b.name || "") + "].";
    var d = b.kind || b.isa || enyo.defaultCtor
        , e = enyo.constructorForKind(d);
    return e || (console.error('no constructor found for kind "' + d + '"'),
        e = enyo.Component),
        new e(b)
}
    ;
enyo.Component.subclass = function (b, d) {
    var e = b.prototype;
    d.components && (e.kindComponents = d.components,
        delete e.components);
    if (d.handlers)
        e.kindHandlers = enyo.mixin(enyo.clone(e.kindHandlers), e.handlers),
            e.handlers = null;
    d.events && this.publishEvents(b, d)
}
    ;
enyo.Component.publishEvents = function (b, d) {
    var e = d.events;
    if (e) {
        var f = b.prototype, g;
        for (g in e)
            this.addEvent(g, e[g], f)
    }
}
    ;
enyo.Component.addEvent = function (b, d, e) {
    var f, g;
    enyo.isString(d) ? (b.slice(0, 2) != "on" && (console.warn("enyo.Component.addEvent: event names must start with 'on'. " + e.kindName + " event '" + b + "' was auto-corrected to 'on" + b + "'."),
        b = "on" + b),
        f = d,
        g = "do" + enyo.cap(b.slice(2))) : (f = d.value,
            g = d.caller);
    e[b] = f;
    e[g] || (e[g] = function (d) {
        return this.bubble(b, d)
    }
    )
}
    ;
enyo.Component.prefixFromKindName = function (b) {
    var d = enyo.Component._kindPrefixi[b];
    if (!d) {
        var e = b.lastIndexOf(".");
        d = e >= 0 ? b.slice(e + 1) : b;
        d = d.charAt(0).toLowerCase() + d.slice(1);
        enyo.Component._kindPrefixi[b] = d
    }
    return d
}
    ;
enyo.kind({
    name: "enyo.UiComponent",
    kind: enyo.Component,
    published: {
        container: null,
        parent: null,
        controlParentName: "client",
        layoutKind: ""
    },
    handlers: {
        onresize: "resizeHandler"
    },
    addBefore: void 0,
    statics: {
        _resizeFlags: {
            showingOnly: !0
        }
    },
    create: function () {
        this.controls = [];
        this.children = [];
        this.containerChanged();
        this.inherited(arguments);
        this.layoutKindChanged()
    },
    destroy: function () {
        this.destroyClientControls();
        this.setContainer(null);
        this.inherited(arguments)
    },
    importProps: function (b) {
        this.inherited(arguments);
        this.owner || (this.owner = enyo.master)
    },
    createComponents: function () {
        var b = this.inherited(arguments);
        return this.discoverControlParent(),
            b
    },
    discoverControlParent: function () {
        this.controlParent = this.$[this.controlParentName] || this.controlParent
    },
    adjustComponentProps: function (b) {
        b.container = b.container || this;
        this.inherited(arguments)
    },
    containerChanged: function (b) {
        b && b.removeControl(this);
        this.container && this.container.addControl(this, this.addBefore)
    },
    parentChanged: function (b) {
        b && b != this.parent && b.removeChild(this)
    },
    isDescendantOf: function (b) {
        for (var d = this; d && d != b;)
            d = d.parent;
        return b && d == b
    },
    getControls: function () {
        return this.controls
    },
    getClientControls: function () {
        for (var b = [], d = 0, e = this.controls, f; f = e[d]; d++)
            f.isChrome || b.push(f);
        return b
    },
    destroyClientControls: function () {
        for (var b = this.getClientControls(), d = 0, e; e = b[d]; d++)
            e.destroy()
    },
    addControl: function (b, d) {
        this.controls.push(b);
        this.addChild(b, d)
    },
    removeControl: function (b) {
        return b.setParent(null),
            enyo.remove(b, this.controls)
    },
    indexOfControl: function (b) {
        return enyo.indexOf(b, this.controls)
    },
    indexOfClientControl: function (b) {
        return enyo.indexOf(b, this.getClientControls())
    },
    indexInContainer: function () {
        return this.container.indexOfControl(this)
    },
    clientIndexInContainer: function () {
        return this.container.indexOfClientControl(this)
    },
    controlAtIndex: function (b) {
        return this.controls[b]
    },
    addChild: function (b, d) {
        this.controlParent ? this.controlParent.addChild(b) : (b.setParent(this),
            d !== void 0 ? this.children.splice(d === null ? 0 : this.indexOfChild(d), 0, b) : this.children.push(b))
    },
    removeChild: function (b) {
        return enyo.remove(b, this.children)
    },
    indexOfChild: function (b) {
        return enyo.indexOf(b, this.children)
    },
    layoutKindChanged: function () {
        this.layout && this.layout.destroy();
        this.layout = enyo.createFromKind(this.layoutKind, this);
        this.generated && this.render()
    },
    flow: function () {
        this.layout && this.layout.flow()
    },
    reflow: function () {
        this.layout && this.layout.reflow()
    },
    resized: function () {
        this.waterfall("onresize", enyo.UiComponent._resizeFlags);
        this.waterfall("onpostresize", enyo.UiComponent._resizeFlags)
    },
    resizeHandler: function () {
        this.reflow()
    },
    waterfallDown: function (b, d, e) {
        for (var f in this.$)
            this.$[f] instanceof enyo.UiComponent || this.$[f].waterfall(b, d, e);
        f = 0;
        for (var g = this.children, i; i = g[f]; f++)
            (i.showing || !d || !d.showingOnly) && i.waterfall(b, d, e)
    },
    getBubbleTarget: function () {
        return this.parent
    }
});
enyo.createFromKind = function (b, d) {
    var e = b && enyo.constructorForKind(b);
    if (e)
        return new e(d)
}
    ;
enyo.master = new enyo.Component({
    name: "master",
    notInstanceOwner: !0,
    eventFlags: {
        showingOnly: !0
    },
    getId: function () {
        return ""
    },
    isDescendantOf: enyo.nop,
    bubble: function (b, d) {
        b == "onresize" ? (enyo.master.waterfallDown("onresize", this.eventFlags),
            enyo.master.waterfallDown("onpostresize", this.eventFlags)) : enyo.Signals.send(b, d)
    }
});
enyo.kind({
    name: "enyo.Layout",
    kind: null,
    layoutClass: "",
    constructor: function (b) {
        this.container = b;
        b && b.addClass(this.layoutClass)
    },
    destroy: function () {
        this.container && this.container.removeClass(this.layoutClass)
    },
    flow: function () { },
    reflow: function () { }
});
enyo.kind({
    name: "enyo.Signals",
    kind: enyo.Component,
    create: function () {
        this.inherited(arguments);
        enyo.Signals.addListener(this)
    },
    destroy: function () {
        enyo.Signals.removeListener(this);
        this.inherited(arguments)
    },
    notify: function (b, d) {
        this.dispatchEvent(b, d)
    },
    statics: {
        listeners: [],
        addListener: function (b) {
            this.listeners.push(b)
        },
        removeListener: function (b) {
            enyo.remove(b, this.listeners)
        },
        send: function (b, d) {
            enyo.forEach(this.listeners, function (e) {
                e.notify(b, d)
            })
        }
    }
});
enyo.singleton({
    name: "enyo.jobs",
    published: {
        priorityLevel: 0
    },
    _jobs: [[], [], [], [], [], [], [], [], [], []],
    _priorities: {},
    _namedJobs: {},
    _magicWords: {
        low: 3,
        normal: 5,
        high: 7
    },
    add: function (b, d, e) {
        d = d || 5;
        d = enyo.isString(d) ? this._magicWords[d] : d;
        e && (this.remove(e),
            this._namedJobs[e] = d);
        d >= this.priorityLevel ? b() : this._jobs[d - 1].push({
            fkt: b,
            name: e
        })
    },
    remove: function (b) {
        var d = this._jobs[this._namedJobs[b] - 1];
        if (d)
            for (var e = d.length - 1; e >= 0; e--)
                if (d[e].name === b)
                    return d.splice(e, 1)
    },
    registerPriority: function (b, d) {
        this._priorities[d] = b;
        this.setPriorityLevel(Math.max(b, this.priorityLevel))
    },
    unregisterPriority: function (b) {
        var d = 0;
        delete this._priorities[b];
        for (var e in this._priorities)
            d = Math.max(d, this._priorities[e]);
        this.setPriorityLevel(d)
    },
    priorityLevelChanged: function (b) {
        b > this.priorityLevel && this._doJob()
    },
    _doJob: function () {
        for (var b, d = 9; d >= this.priorityLevel; d--)
            if (this._jobs[d].length) {
                b = this._jobs[d].shift();
                break
            }
        b && (b.fkt(),
            delete this._namedJobs[b.name],
            setTimeout(enyo.bind(this, "_doJob"), 10))
    }
});
enyo.kind({
    name: "enyo.Async",
    kind: enyo.Object,
    published: {
        timeout: 0
    },
    failed: !1,
    context: null,
    constructor: function () {
        this.responders = [];
        this.errorHandlers = []
    },
    accumulate: function (b, d) {
        var e = d.length < 2 ? d[0] : enyo.bind(d[0], d[1]);
        b.push(e)
    },
    response: function () {
        return this.accumulate(this.responders, arguments),
            this
    },
    error: function () {
        return this.accumulate(this.errorHandlers, arguments),
            this
    },
    route: function (b, d) {
        var e = enyo.bind(this, "respond");
        b.response(function (b, d) {
            e(d)
        });
        var f = enyo.bind(this, "fail");
        b.error(function (b, d) {
            f(d)
        });
        b.go(d)
    },
    handle: function (b, d) {
        var e = d.shift();
        e && (e instanceof enyo.Async ? this.route(e, b) : (e = enyo.call(this.context || this, e, [this, b]),
            e = e !== void 0 ? e : b,
            (this.failed ? this.fail : this.respond).call(this, e)))
    },
    startTimer: function () {
        this.startTime = enyo.now();
        this.timeout && (this.timeoutJob = setTimeout(enyo.bind(this, "timeoutComplete"), this.timeout))
    },
    endTimer: function () {
        this.timeoutJob && (this.endTime = enyo.now(),
            clearTimeout(this.timeoutJob),
            this.timeoutJob = null,
            this.latency = this.endTime - this.startTime)
    },
    timeoutComplete: function () {
        this.timedout = !0;
        this.fail("timeout")
    },
    respond: function (b) {
        this.failed = !1;
        this.endTimer();
        this.handle(b, this.responders)
    },
    fail: function (b) {
        this.failed = !0;
        this.endTimer();
        this.handle(b, this.errorHandlers)
    },
    recover: function () {
        this.failed = !1
    },
    go: function (b) {
        return enyo.asyncMethod(this, function () {
            this.respond(b)
        }),
            this
    }
});
enyo.json = {
    stringify: function (b, d, e) {
        return JSON.stringify(b, d, e)
    },
    parse: function (b, d) {
        return b ? JSON.parse(b, d) : null
    }
};
enyo.getCookie = function (b) {
    return (b = document.cookie.match(RegExp("(?:^|; )" + b + "=([^;]*)"))) ? decodeURIComponent(b[1]) : void 0
}
    ;
enyo.setCookie = function (b, d, e) {
    b = b + "=" + encodeURIComponent(d);
    e = e || {};
    d = e.expires;
    if (typeof d == "number") {
        var f = new Date;
        f.setTime(f.getTime() + d * 864E5);
        d = f
    }
    d && d.toUTCString && (e.expires = d.toUTCString());
    var g, i;
    for (g in e)
        b += "; " + g,
            i = e[g],
            i !== !0 && (b += "=" + i);
    document.cookie = b
}
    ;
enyo.xhr = {
    request: function (b) {
        var d = this.getXMLHttpRequest(b.url)
            , e = b.method || "GET"
            , f = !b.sync;
        b.username ? d.open(e, enyo.path.rewrite(b.url), f, b.username, b.password) : d.open(e, enyo.path.rewrite(b.url), f);
        enyo.mixin(d, b.xhrFields);
        b.callback && this.makeReadyStateHandler(d, b.callback);
        if (b.headers)
            for (var g in b.headers)
                d.setRequestHeader(g, b.headers[g]);
        return typeof d.overrideMimeType == "function" && b.mimeType && d.overrideMimeType(b.mimeType),
            d.send(b.body || null),
            !f && b.callback && d.onreadystatechange(d),
            d
    },
    cancel: function (b) {
        b.onload && (b.onload = null);
        b.onreadystatechange && (b.onreadystatechange = null);
        b.abort && b.abort()
    },
    makeReadyStateHandler: function (b, d) {
        window.XDomainRequest && b instanceof XDomainRequest && (b.onload = function () {
            d.apply(null, [b.responseText, b])
        }
        );
        b.onreadystatechange = function () {
            b.readyState == 4 && d.apply(null, [b.responseText, b])
        }
    },
    inOrigin: function (b) {
        var d = document.createElement("a")
            , e = !1;
        d.href = b;
        if (d.protocol === ":" || d.protocol === window.location.protocol && d.hostname === window.location.hostname && d.port === (window.location.port || (window.location.protocol === "https:" ? "443" : "80")))
            e = !0;
        return e
    },
    getXMLHttpRequest: function (b) {
        try {
            if (window.XDomainRequest && !this.inOrigin(b) && !/^file:\/\//.test(window.location.href))
                return new XDomainRequest
        } catch (d) { }
        try {
            return new XMLHttpRequest
        } catch (e) { }
        return null
    }
};
enyo.AjaxProperties = {
    cacheBust: !0,
    url: "",
    method: "GET",
    handleAs: "json",
    contentType: "application/x-www-form-urlencoded",
    sync: !1,
    headers: null,
    postBody: "",
    username: "",
    password: "",
    xhrFields: null,
    mimeType: null
};
enyo.kind({
    name: "enyo.Ajax",
    kind: enyo.Async,
    published: enyo.AjaxProperties,
    constructor: function (b) {
        enyo.mixin(this, b);
        this.inherited(arguments)
    },
    go: function (b) {
        return this.startTimer(),
            this.request(b),
            this
    },
    request: function (b) {
        var d = this.url.split("?")
            , e = d.shift() || ""
            , d = d.length ? d.join("?").split("&") : []
            , b = enyo.isString(b) ? b : enyo.Ajax.objectToQuery(b);
        this.method == "GET" && (b && (d.push(b),
            b = null),
            this.cacheBust && !/^file:/i.test(e) && d.push(Math.random()));
        e = d.length ? [e, d.join("&")].join("?") : e;
        d = {};
        this.method != "GET" && (d["Content-Type"] = this.contentType);
        enyo.mixin(d, this.headers);
        try {
            this.xhr = enyo.xhr.request({
                url: e,
                method: this.method,
                callback: enyo.bind(this, "receive"),
                body: this.postBody || b,
                headers: d,
                sync: window.PalmSystem ? !1 : this.sync,
                username: this.username,
                password: this.password,
                xhrFields: this.xhrFields,
                mimeType: this.mimeType
            })
        } catch (f) {
            this.fail(f)
        }
    },
    receive: function (b, d) {
        !this.failed && !this.destroyed && (this.isFailure(d) ? this.fail(d.status) : this.respond(this.xhrToResponse(d)))
    },
    fail: function (b) {
        this.xhr && (enyo.xhr.cancel(this.xhr),
            this.xhr = null);
        this.inherited(arguments)
    },
    xhrToResponse: function (b) {
        if (b)
            return this[(this.handleAs || "text") + "Handler"](b)
    },
    isFailure: function (b) {
        try {
            var d;
            return typeof b.responseText == "string" && (d = b.responseText),
                b.status === 0 ? !0 : b.status !== 0 && (b.status < 200 || b.status >= 300)
        } catch (e) {
            return !0
        }
    },
    xmlHandler: function (b) {
        return b.responseXML
    },
    textHandler: function (b) {
        return b.responseText
    },
    jsonHandler: function (b) {
        b = b.responseText;
        try {
            return b && enyo.json.parse(b)
        } catch (d) {
            return enyo.warn("Ajax request set to handleAs JSON but data was not in JSON format"),
                b
        }
    },
    statics: {
        objectToQuery: function (b) {
            var d = encodeURIComponent, e = [], f = {}, g;
            for (g in b) {
                var i = b[g];
                if (i != f[g]) {
                    var j = d(g) + "=";
                    if (enyo.isArray(i))
                        for (var k = 0; k < i.length; k++)
                            e.push(j + d(i[k]));
                    else
                        e.push(j + d(i))
                }
            }
            return e.join("&")
        }
    }
});
enyo.kind({
    name: "enyo.JsonpRequest",
    kind: enyo.Async,
    published: {
        url: "",
        charset: null,
        callbackName: "callback",
        cacheBust: !0
    },
    statics: {
        nextCallbackID: 0
    },
    addScriptElement: function () {
        var b = document.createElement("script");
        b.src = this.src;
        b.async = "async";
        this.charset && (b.charset = this.charset);
        b.onerror = enyo.bind(this, function () {
            this.fail(400)
        });
        var d = document.getElementsByTagName("script")[0];
        d.parentNode.insertBefore(b, d);
        this.scriptTag = b
    },
    removeScriptElement: function () {
        var b = this.scriptTag;
        this.scriptTag = null;
        b.onerror = null;
        b.parentNode && b.parentNode.removeChild(b)
    },
    constructor: function (b) {
        enyo.mixin(this, b);
        this.inherited(arguments)
    },
    go: function (b) {
        return this.startTimer(),
            this.jsonp(b),
            this
    },
    jsonp: function (b) {
        var d = "enyo_jsonp_callback_" + enyo.JsonpRequest.nextCallbackID++;
        this.src = this.buildUrl(b, d);
        this.addScriptElement();
        window[d] = enyo.bind(this, this.respond);
        b = enyo.bind(this, function () {
            this.removeScriptElement();
            window[d] = null
        });
        this.response(b);
        this.error(b)
    },
    buildUrl: function (b, d) {
        var e = this.url.split("?")
            , f = e.shift() || ""
            , e = e.join("?").split("&")
            , g = this.bodyArgsFromParams(b, d);
        return e.push(g),
            this.cacheBust && e.push(Math.random()),
            [f, e.join("&")].join("?")
    },
    bodyArgsFromParams: function (b, d) {
        if (enyo.isString(b))
            return b.replace("=?", "=" + d);
        var e = enyo.mixin({}, b);
        return e[this.callbackName] = d,
            enyo.Ajax.objectToQuery(e)
    }
});
enyo.kind({
    name: "enyo._AjaxComponent",
    kind: enyo.Component,
    published: enyo.AjaxProperties
});
enyo.kind({
    name: "enyo.WebService",
    kind: enyo._AjaxComponent,
    published: {
        jsonp: !1,
        callbackName: "callback",
        charset: null
    },
    events: {
        onResponse: "",
        onError: ""
    },
    constructor: function (b) {
        this.inherited(arguments)
    },
    send: function (b) {
        return this.jsonp ? this.sendJsonp(b) : this.sendAjax(b)
    },
    sendJsonp: function (b) {
        var d = new enyo.JsonpRequest, e;
        for (e in {
            url: 1,
            callbackName: 1,
            charset: 1
        })
            d[e] = this[e];
        return this.sendAsync(d, b)
    },
    sendAjax: function (b) {
        var d = new enyo.Ajax, e;
        for (e in enyo.AjaxProperties)
            d[e] = this[e];
        return this.sendAsync(d, b)
    },
    sendAsync: function (b, d) {
        return b.go(d).response(this, "response").error(this, "error")
    },
    response: function (b, d) {
        this.doResponse({
            ajax: b,
            data: d
        })
    },
    error: function (b, d) {
        this.doError({
            ajax: b,
            data: d
        })
    }
});
enyo.requiresWindow = function (b) {
    b()
}
    ;
enyo.dom = {
    byId: function (b, d) {
        return typeof b == "string" ? (d || document).getElementById(b) : b
    },
    escape: function (b) {
        return b !== null ? String(b).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""
    },
    getComputedStyle: function (b) {
        return window.getComputedStyle && b && window.getComputedStyle(b, null)
    },
    getComputedStyleValue: function (b, d, e) {
        return (b = e || this.getComputedStyle(b)) ? b.getPropertyValue(d) : null
    },
    getFirstElementByTagName: function (b) {
        return (b = document.getElementsByTagName(b)) && b[0]
    },
    applyBodyFit: function () {
        var b = this.getFirstElementByTagName("html");
        b && (b.className += " enyo-document-fit");
        b = this.getFirstElementByTagName("body");
        b && (b.className += " enyo-body-fit");
        enyo.bodyIsFitting = !0
    },
    getWindowWidth: function () {
        return window.innerWidth ? window.innerWidth : document.body && document.body.offsetWidth ? document.body.offsetWidth : document.compatMode == "CSS1Compat" && document.documentElement && document.documentElement.offsetWidth ? document.documentElement.offsetWidth : 320
    },
    _ieCssToPixelValue: function (b, d) {
        var e = d
            , f = b.style
            , g = f.left
            , i = b.runtimeStyle && b.runtimeStyle.left;
        return i && (b.runtimeStyle.left = b.currentStyle.left),
            f.left = e,
            e = f.pixelLeft,
            f.left = g,
            i && (f.runtimeStyle.left = i),
            e
    },
    _pxMatch: /px/i,
    getComputedBoxValue: function (b, d, e, f) {
        if (f = f || this.getComputedStyle(b))
            return parseInt(f.getPropertyValue(d + "-" + e), 0);
        return b && b.currentStyle ? (d = b.currentStyle[d + enyo.cap(e)],
            d.match(this._pxMatch) || (d = this._ieCssToPixelValue(b, d)),
            parseInt(d, 0)) : 0
    },
    calcBoxExtents: function (b, d) {
        var e = this.getComputedStyle(b);
        return {
            top: this.getComputedBoxValue(b, d, "top", e),
            right: this.getComputedBoxValue(b, d, "right", e),
            bottom: this.getComputedBoxValue(b, d, "bottom", e),
            left: this.getComputedBoxValue(b, d, "left", e)
        }
    },
    calcPaddingExtents: function (b) {
        return this.calcBoxExtents(b, "padding")
    },
    calcMarginExtents: function (b) {
        return this.calcBoxExtents(b, "margin")
    }
};
(function () {
    enyo.dom.calcCanAccelerate = function () {
        if (enyo.platform.android <= 2)
            return !1;
        for (var b = ["perspective", "WebkitPerspective", "MozPerspective", "msPerspective", "OPerspective"], d = 0, g; g = b[d]; d++)
            if (typeof document.body.style[g] != "undefined")
                return !0;
        return !1
    }
        ;
    var b = ["transform", "-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform"]
        , d = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
    enyo.dom.getCssTransformProp = function () {
        if (this._cssTransformProp)
            return this._cssTransformProp;
        var e = enyo.indexOf(this.getStyleTransformProp(), d);
        return this._cssTransformProp = b[e]
    }
        ;
    enyo.dom.getStyleTransformProp = function () {
        if (this._styleTransformProp || !document.body)
            return this._styleTransformProp;
        for (var b = 0, f; f = d[b]; b++)
            if (typeof document.body.style[f] != "undefined")
                return this._styleTransformProp = f
    }
        ;
    enyo.dom.domTransformsToCss = function (b) {
        var d, g, i = "";
        for (d in b)
            g = b[d],
                g !== null && g !== void 0 && g !== "" && (i += d + "(" + g + ") ");
        return i
    }
        ;
    enyo.dom.transformsToDom = function (b) {
        var d = this.domTransformsToCss(b.domTransforms)
            , g = b.hasNode() ? b.node.style : null
            , i = b.domStyles
            , j = this.getStyleTransformProp()
            , k = this.getCssTransformProp();
        j && k && (i[k] = d,
            g ? g[j] = d : b.domStylesChanged())
    }
        ;
    enyo.dom.canTransform = function () {
        return Boolean(this.getStyleTransformProp())
    }
        ;
    enyo.dom.canAccelerate = function () {
        return this.accelerando !== void 0 ? this.accelerando : document.body && (this.accelerando = this.calcCanAccelerate())
    }
        ;
    enyo.dom.transform = function (b, d) {
        var g = b.domTransforms = b.domTransforms || {};
        enyo.mixin(g, d);
        this.transformsToDom(b)
    }
        ;
    enyo.dom.transformValue = function (b, d, g) {
        (b.domTransforms = b.domTransforms || {})[d] = g;
        this.transformsToDom(b)
    }
        ;
    enyo.dom.accelerate = function (b, d) {
        var g = d == "auto" ? this.canAccelerate() : d;
        this.transformValue(b, "translateZ", g ? 0 : null)
    }
}
)();
enyo.kind({
    name: "enyo.Control",
    kind: enyo.UiComponent,
    published: {
        tag: "div",
        attributes: null,
        classes: "",
        style: "",
        content: "",
        showing: !0,
        allowHtml: !1,
        src: "",
        canGenerate: !0,
        fit: !1,
        isContainer: !1
    },
    handlers: {
        ontap: "tap"
    },
    defaultKind: "Control",
    controlClasses: "",
    node: null,
    generated: !1,
    create: function () {
        this.initStyles();
        this.inherited(arguments);
        this.showingChanged();
        this.addClass(this.kindClasses);
        this.addClass(this.classes);
        this.initProps(["id", "content", "src"])
    },
    destroy: function () {
        this.removeNodeFromDom();
        enyo.Control.unregisterDomEvents(this.id);
        this.inherited(arguments)
    },
    importProps: function (b) {
        this.inherited(arguments);
        this.attributes = enyo.mixin(enyo.clone(this.kindAttributes), this.attributes)
    },
    initProps: function (b) {
        for (var d = 0, e, f; e = b[d]; d++)
            this[e] && (f = e + "Changed",
                this[f] && this[f]())
    },
    classesChanged: function (b) {
        this.removeClass(b);
        this.addClass(this.classes)
    },
    addChild: function (b) {
        b.addClass(this.controlClasses);
        this.inherited(arguments)
    },
    removeChild: function (b) {
        this.inherited(arguments);
        b.removeClass(this.controlClasses)
    },
    strictlyInternalEvents: {
        onenter: 1,
        onleave: 1
    },
    dispatchEvent: function (b, d, e) {
        return this.strictlyInternalEvents[b] && this.isInternalEvent(d) ? !0 : this.inherited(arguments)
    },
    isInternalEvent: function (b) {
        return (b = enyo.dispatcher.findDispatchTarget(b.relatedTarget)) && b.isDescendantOf(this)
    },
    hasNode: function () {
        return this.generated && (this.node || this.findNodeById())
    },
    addContent: function (b) {
        this.setContent(this.content + b)
    },
    getAttribute: function (b) {
        return this.hasNode() ? this.node.getAttribute(b) : this.attributes[b]
    },
    setAttribute: function (b, d) {
        this.attributes[b] = d;
        this.hasNode() && this.attributeToNode(b, d);
        this.invalidateTags()
    },
    getNodeProperty: function (b, d) {
        return this.hasNode() ? this.node[b] : d
    },
    setNodeProperty: function (b, d) {
        this.hasNode() && (this.node[b] = d)
    },
    setClassAttribute: function (b) {
        this.setAttribute("class", b)
    },
    getClassAttribute: function () {
        return this.attributes["class"] || ""
    },
    hasClass: function (b) {
        return b && (" " + this.getClassAttribute() + " ").indexOf(" " + b + " ") >= 0
    },
    addClass: function (b) {
        if (b && !this.hasClass(b)) {
            var d = this.getClassAttribute();
            this.setClassAttribute(d + (d ? " " : "") + b)
        }
    },
    removeClass: function (b) {
        if (b && this.hasClass(b)) {
            var d = this.getClassAttribute();
            d = (" " + d + " ").replace(" " + b + " ", " ").slice(1, -1);
            this.setClassAttribute(d)
        }
    },
    addRemoveClass: function (b, d) {
        this[d ? "addClass" : "removeClass"](b)
    },
    initStyles: function () {
        this.domStyles = this.domStyles || {};
        enyo.Control.cssTextToDomStyles(this.kindStyle, this.domStyles);
        this.domCssText = enyo.Control.domStylesToCssText(this.domStyles)
    },
    styleChanged: function () {
        this.invalidateTags();
        this.renderStyles()
    },
    applyStyle: function (b, d) {
        this.domStyles[b] = d;
        this.domStylesChanged()
    },
    addStyles: function (b) {
        enyo.Control.cssTextToDomStyles(b, this.domStyles);
        this.domStylesChanged()
    },
    getComputedStyleValue: function (b, d) {
        return this.hasNode() ? enyo.dom.getComputedStyleValue(this.node, b) : d
    },
    domStylesChanged: function () {
        this.domCssText = enyo.Control.domStylesToCssText(this.domStyles);
        this.invalidateTags();
        this.renderStyles()
    },
    stylesToNode: function () {
        this.node.style.cssText = this.style + (this.style[this.style.length - 1] == ";" ? " " : "; ") + this.domCssText
    },
    setupBodyFitting: function () {
        enyo.dom.applyBodyFit();
        this.addClass("enyo-fit enyo-clip")
    },
    setupOverflowScrolling: function () {
        !enyo.platform.android && !enyo.platform.androidChrome && (document.getElementsByTagName("body")[0].className += " webkitOverflowScrolling")
    },
    render: function () {
        return this.parent && (this.parent.beforeChildRender(this),
            !this.parent.generated) ? this : (this.hasNode() || this.renderNode(),
                this.hasNode() && (this.renderDom(),
                    this.rendered()),
                this)
    },
    renderInto: function (b) {
        this.teardownRender();
        b = enyo.dom.byId(b);
        return b == document.body ? this.setupBodyFitting() : this.fit && this.addClass("enyo-fit enyo-clip"),
            this.setupOverflowScrolling(),
            b.innerHTML = this.generateHtml(),
            this.rendered(),
            this
    },
    write: function () {
        return this.fit && this.setupBodyFitting(),
            this.setupOverflowScrolling(),
            document.write(this.generateHtml()),
            this.rendered(),
            this
    },
    rendered: function () {
        this.reflow();
        for (var b = 0, d; d = this.children[b]; b++)
            d.rendered()
    },
    show: function () {
        this.setShowing(!0)
    },
    hide: function () {
        this.setShowing(!1)
    },
    getBounds: function () {
        var b = this.node || this.hasNode() || 0;
        return {
            left: b.offsetLeft,
            top: b.offsetTop,
            width: b.offsetWidth,
            height: b.offsetHeight
        }
    },
    setBounds: function (b, d) {
        for (var e = this.domStyles, f = d || "px", g = "width,height,left,top,right,bottom".split(","), i = 0, j, k; k = g[i]; i++)
            if ((j = b[k]) || j === 0)
                e[k] = j + (enyo.isString(j) ? "" : f);
        this.domStylesChanged()
    },
    findNodeById: function () {
        return this.id && (this.node = enyo.dom.byId(this.id))
    },
    idChanged: function (b) {
        b && enyo.Control.unregisterDomEvents(b);
        this.setAttribute("id", this.id);
        this.id && enyo.Control.registerDomEvents(this.id, this)
    },
    contentChanged: function () {
        this.hasNode() && this.renderContent()
    },
    getSrc: function () {
        return this.getAttribute("src")
    },
    srcChanged: function () {
        this.setAttribute("src", enyo.path.rewrite(this.src))
    },
    attributesChanged: function () {
        this.invalidateTags();
        this.renderAttributes()
    },
    generateHtml: function () {
        if (this.canGenerate === !1)
            return "";
        var b = this.generateOuterHtml(this.generateInnerHtml());
        return this.generated = !0,
            b
    },
    generateInnerHtml: function () {
        return this.flow(),
            this.children.length ? this.generateChildHtml() : this.allowHtml ? this.content : enyo.Control.escapeHtml(this.content)
    },
    generateChildHtml: function () {
        for (var b = "", d = 0, e; e = this.children[d]; d++)
            e = e.generateHtml(),
                b += e;
        return b
    },
    generateOuterHtml: function (b) {
        return this.tag ? (this.tagsValid || this.prepareTags(),
            this._openTag + b + this._closeTag) : b
    },
    invalidateTags: function () {
        this.tagsValid = !1
    },
    prepareTags: function () {
        var b = this.domCssText + this.style;
        this._openTag = "<" + this.tag + (b ? ' style="' + b + '"' : "") + enyo.Control.attributesToHtml(this.attributes);
        enyo.Control.selfClosing[this.tag] ? (this._openTag += "/>",
            this._closeTag = "") : (this._openTag += ">",
                this._closeTag = "</" + this.tag + ">");
        this.tagsValid = !0
    },
    attributeToNode: function (b, d) {
        d === null || d === !1 || d === "" ? this.node.removeAttribute(b) : this.node.setAttribute(b, d)
    },
    attributesToNode: function () {
        for (var b in this.attributes)
            this.attributeToNode(b, this.attributes[b])
    },
    getParentNode: function () {
        return this.parentNode || this.parent && (this.parent.hasNode() || this.parent.getParentNode())
    },
    addNodeToParent: function () {
        if (this.node) {
            var b = this.getParentNode();
            b && (this.addBefore !== void 0 ? this.insertNodeInParent(b, this.addBefore && this.addBefore.hasNode()) : this.appendNodeToParent(b))
        }
    },
    appendNodeToParent: function (b) {
        b.appendChild(this.node)
    },
    insertNodeInParent: function (b, d) {
        b.insertBefore(this.node, d || b.firstChild)
    },
    removeNodeFromDom: function () {
        this.hasNode() && this.node.parentNode && this.node.parentNode.removeChild(this.node)
    },
    teardownRender: function () {
        this.generated && this.teardownChildren();
        this.node = null;
        this.generated = !1
    },
    teardownChildren: function () {
        for (var b = 0, d; d = this.children[b]; b++)
            d.teardownRender()
    },
    renderNode: function () {
        this.teardownRender();
        this.node = document.createElement(this.tag);
        this.addNodeToParent();
        this.generated = !0
    },
    renderDom: function () {
        this.renderAttributes();
        this.renderStyles();
        this.renderContent()
    },
    renderContent: function () {
        this.generated && this.teardownChildren();
        this.node.innerHTML = this.generateInnerHtml()
    },
    renderStyles: function () {
        this.hasNode() && this.stylesToNode()
    },
    renderAttributes: function () {
        this.hasNode() && this.attributesToNode()
    },
    beforeChildRender: function () {
        this.generated && this.flow()
    },
    syncDisplayToShowing: function () {
        var b = this.domStyles;
        this.showing ? b.display == "none" && this.applyStyle("display", this._displayStyle || "") : (this._displayStyle = b.display == "none" ? "" : b.display,
            this.applyStyle("display", "none"))
    },
    showingChanged: function () {
        this.syncDisplayToShowing()
    },
    getShowing: function () {
        return this.showing = this.domStyles.display != "none"
    },
    fitChanged: function () {
        this.parent.reflow()
    },
    statics: {
        escapeHtml: function (b) {
            return b != null ? String(b).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""
        },
        registerDomEvents: function (b, d) {
            enyo.$[b] = d
        },
        unregisterDomEvents: function (b) {
            enyo.$[b] = null
        },
        selfClosing: {
            img: 1,
            hr: 1,
            br: 1,
            area: 1,
            base: 1,
            basefont: 1,
            input: 1,
            link: 1,
            meta: 1,
            command: 1,
            embed: 1,
            keygen: 1,
            wbr: 1,
            param: 1,
            source: 1,
            track: 1,
            col: 1
        },
        cssTextToDomStyles: function (b, d) {
            if (b)
                for (var e = b.replace(/; /g, ";").split(";"), f = 0, g, i, j, k; k = e[f]; f++)
                    g = k.split(":"),
                        i = g.shift(),
                        j = g.join(":"),
                        d[i] = j
        },
        domStylesToCssText: function (b) {
            var d, e, f = "";
            for (d in b)
                e = b[d],
                    e !== null && e !== void 0 && e !== "" && (f += d + ":" + e + ";");
            return f
        },
        stylesToHtml: function (b) {
            return (b = enyo.Control.domStylesToCssText(b)) ? ' style="' + b + '"' : ""
        },
        escapeAttribute: function (b) {
            return enyo.isString(b) ? String(b).replace(/&/g, "&amp;").replace(/\"/g, "&quot;") : b
        },
        attributesToHtml: function (b) {
            var d, e, f = "";
            for (d in b)
                e = b[d],
                    e !== null && e !== !1 && e !== "" && (f += " " + d + '="' + enyo.Control.escapeAttribute(e) + '"');
            return f
        }
    }
});
enyo.defaultCtor = enyo.Control;
enyo.Control.subclass = function (b, d) {
    var e = b.prototype;
    if (e.classes) {
        var f = e.kindClasses;
        e.kindClasses = (f ? f + " " : "") + e.classes;
        e.classes = ""
    }
    if (e.style)
        f = e.kindStyle,
            e.kindStyle = (f ? f + ";" : "") + e.style,
            e.style = "";
    if (d.attributes)
        e.kindAttributes = enyo.mixin(enyo.clone(e.kindAttributes), e.attributes),
            e.attributes = null
}
    ;
enyo.platform = {
    touch: Boolean("ontouchstart" in window || window.navigator.msPointerEnabled),
    gesture: Boolean("ongesturestart" in window || window.navigator.msPointerEnabled)
};
(function () {
    for (var b = navigator.userAgent, d = enyo.platform, e = [{
        platform: "androidChrome",
        regex: /Android .* Chrome\/(\d+)[.\d]+/
    }, {
        platform: "android",
        regex: /Android (\d+)/
    }, {
        platform: "android",
        regex: /Silk\/1./,
        forceVersion: 2
    }, {
        platform: "android",
        regex: /Silk\/2./,
        forceVersion: 4
    }, {
        platform: "ie",
        regex: /MSIE (\d+)/
    }, {
        platform: "ios",
        regex: /iP(?:hone|ad;(?: U;)? CPU) OS (\d+)/
    }, {
        platform: "webos",
        regex: /(?:web|hpw)OS\/(\d+)/
    }, {
        platform: "safari",
        regex: /Version\/(\d+)[.\d]+\s+Safari/
    }, {
        platform: "chrome",
        regex: /Chrome\/(\d+)[.\d]+/
    }, {
        platform: "androidFirefox",
        regex: /Android;.*Firefox\/(\d+)/
    }, {
        platform: "firefox",
        regex: /Firefox\/(\d+)/
    }], f = 0, g, i, j; g = e[f]; f++)
        if (i = g.regex.exec(b)) {
            g.forceVersion ? j = g.forceVersion : j = Number(i[1]);
            d[g.platform] = j;
            break
        }
    enyo.dumbConsole = Boolean(d.android || d.ios || d.webos)
}
)();
(function () {
    for (var b = Math.round(1E3 / 60), d = ["webkit", "moz", "ms", "o", ""], e = "cancel" + enyo.cap("requestAnimationFrame"), f = function (d) {
        return window.setTimeout(d, b)
    }, g = function (b) {
        return window.clearTimeout(b)
    }, i = 0, j = d.length, k, l, m; (k = d[i]) || i < j; i++) {
        if (enyo.platform.ios >= 6)
            break;
        l = k ? k + enyo.cap(e) : e;
        m = k ? k + enyo.cap("requestAnimationFrame") : "requestAnimationFrame";
        if (window[l]) {
            g = window[l];
            f = window[m];
            k == "webkit" && g(f(enyo.nop));
            break
        }
    }
    enyo.requestAnimationFrame = function (b, d) {
        return f(b, d)
    }
        ;
    enyo.cancelRequestAnimationFrame = function (b) {
        return g(b)
    }
}
)();
enyo.easing = {
    cubicIn: function (b) {
        return Math.pow(b, 3)
    },
    cubicOut: function (b) {
        return Math.pow(b - 1, 3) + 1
    },
    expoOut: function (b) {
        return b == 1 ? 1 : -1 * Math.pow(2, -10 * b) + 1
    },
    quadInOut: function (b) {
        return b *= 2,
            b < 1 ? Math.pow(b, 2) / 2 : -1 * (--b * (b - 2) - 1) / 2
    },
    linear: function (b) {
        return b
    }
};
enyo.easedLerp = function (b, d, e, f) {
    b = (enyo.now() - b) / d;
    return f ? b >= 1 ? 0 : 1 - e(1 - b) : b >= 1 ? 1 : e(b)
}
    ;
(function () {
    if (window.cordova || window.PhoneGap)
        for (var b = "deviceready,pause,resume,online,offline,backbutton,batterycritical,batterylow,batterystatus,menubutton,searchbutton,startcallbutton,endcallbutton,volumedownbutton,volumeupbutton".split(","), d = 0, e; e = b[d]; d++)
            document.addEventListener(e, enyo.bind(enyo.Signals, "send", "on" + e), !1)
}
)();
enyo.$ = {};
enyo.dispatcher = {
    events: "mousedown,mouseup,mouseover,mouseout,mousemove,mousewheel,click,dblclick,change,keydown,keyup,keypress,input".split(","),
    windowEvents: ["resize", "load", "unload", "message"],
    features: [],
    connect: function () {
        var b = enyo.dispatcher, d, e;
        for (d = 0; e = b.events[d]; d++)
            b.listen(document, e);
        for (d = 0; e = b.windowEvents[d]; d++)
            e === "unload" && typeof window.chrome == "object" && window.chrome.app || b.listen(window, e)
    },
    listen: function (b, d, e) {
        var f = enyo.dispatch;
        b.addEventListener ? this.listen = function (b, d, e) {
            b.addEventListener(d, e || f, !1)
        }
            : this.listen = function (b, d, e) {
                b.attachEvent("on" + d, function (b) {
                    return b.target = b.srcElement,
                        b.preventDefault || (b.preventDefault = enyo.iePreventDefault),
                        (e || f)(b)
                })
            }
            ;
        this.listen(b, d, e)
    },
    dispatch: function (b) {
        var d = this.findDispatchTarget(b.target) || this.findDefaultTarget(b);
        b.dispatchTarget = d;
        for (var e = 0, f; f = this.features[e]; e++)
            if (f.call(this, b) === !0)
                return;
        d && !b.preventDispatch && this.dispatchBubble(b, d)
    },
    findDispatchTarget: function (b) {
        var d;
        try {
            for (; b;) {
                if (d = enyo.$[b.id]) {
                    d.eventNode = b;
                    break
                }
                b = b.parentNode
            }
        } catch (e) {
            console.log(e, b)
        }
        return d
    },
    findDefaultTarget: function () {
        return enyo.master
    },
    dispatchBubble: function (b, d) {
        return d.bubble("on" + b.type, b, d)
    }
};
enyo.iePreventDefault = function () {
    this.returnValue = !1
}
    ;
enyo.dispatch = function (b) {
    return enyo.dispatcher.dispatch(b)
}
    ;
enyo.bubble = function (b) {
    (b = b || window.event) && (b.target || (b.target = b.srcElement),
        enyo.dispatch(b))
}
    ;
enyo.bubbler = "enyo.bubble(arguments[0])";
(function () {
    var b = function (b) {
        enyo.bubble(b)
    };
    enyo.makeBubble = function () {
        var d = Array.prototype.slice.call(arguments, 0)
            , e = d.shift();
        typeof e == "object" && typeof e.hasNode == "function" && enyo.forEach(d, function (d) {
            this.hasNode() && enyo.dispatcher.listen(this.node, d, b)
        }, e)
    }
}
)();
enyo.requiresWindow(enyo.dispatcher.connect);
(function () {
    var b = {
        feature: function (d) {
            b.dispatch(d, d.dispatchTarget)
        },
        dispatch: function (b, e) {
            for (var f = this.buildLineage(e), g = 0, i; i = f[g]; g++)
                if (i.previewDomEvent && i.previewDomEvent(b) === !0) {
                    b.preventDispatch = !0;
                    break
                }
        },
        buildLineage: function (b) {
            for (var e = []; b;)
                e.unshift(b),
                    b = b.parent;
            return e
        }
    };
    enyo.dispatcher.features.push(b.feature)
}
)();
enyo.dispatcher.features.push(function (b) {
    var d = b.dispatchTarget;
    if (this.captureTarget && !this.noCaptureEvents[b.type] && (!d || !d.isDescendantOf || !d.isDescendantOf(this.captureTarget))) {
        var d = b.captureTarget = this.captureTarget
            , e = this.autoForwardEvents[b.type] || this.forwardEvents;
        this.dispatchBubble(b, d);
        e || (b.preventDispatch = !0)
    }
});
enyo.mixin(enyo.dispatcher, {
    noCaptureEvents: {
        load: 1,
        unload: 1,
        error: 1
    },
    autoForwardEvents: {
        leave: 1,
        resize: 1
    },
    captures: [],
    capture: function (b, d) {
        var e = {
            target: b,
            forward: d
        };
        this.captures.push(e);
        this.setCaptureInfo(e)
    },
    release: function () {
        this.captures.pop();
        this.setCaptureInfo(this.captures[this.captures.length - 1])
    },
    setCaptureInfo: function (b) {
        this.captureTarget = b && b.target;
        this.forwardEvents = b && b.forward
    }
});
enyo.gesture = {
    eventProps: "target,relatedTarget,clientX,clientY,pageX,pageY,screenX,screenY,altKey,ctrlKey,metaKey,shiftKey,detail,identifier,dispatchTarget,which,srcEvent".split(","),
    makeEvent: function (b, d) {
        for (var e = {
            type: b
        }, f = 0, g; g = this.eventProps[f]; f++)
            e[g] = d[g];
        e.srcEvent = e.srcEvent || d;
        e.preventDefault = this.preventDefault;
        e.disablePrevention = this.disablePrevention;
        enyo.platform.ie ? (enyo.platform.ie == 8 && e.target && (e.pageX = e.clientX + e.target.scrollLeft,
            e.pageY = e.clientY + e.target.scrollTop),
            f = window.event && window.event.button,
            e.which = f & 1 ? 1 : f & 2 ? 2 : f & 4 ? 3 : 0) : (enyo.platform.webos || window.PalmSystem) && e.which === 0 && (e.which = 1);
        return e
    },
    down: function (b) {
        b = this.makeEvent("down", b);
        enyo.dispatch(b);
        this.downEvent = b
    },
    move: function (b) {
        var d = this.makeEvent("move", b);
        d.dx = d.dy = d.horizontal = d.vertical = 0;
        d.which && this.downEvent && (d.dx = b.clientX - this.downEvent.clientX,
            d.dy = b.clientY - this.downEvent.clientY,
            d.horizontal = Math.abs(d.dx) > Math.abs(d.dy),
            d.vertical = !d.horizontal);
        enyo.dispatch(d)
    },
    up: function (b) {
        var b = this.makeEvent("up", b)
            , d = !1;
        b.preventTap = function () {
            d = !0
        }
            ;
        enyo.dispatch(b);
        !d && this.downEvent && this.downEvent.which == 1 && this.sendTap(b);
        this.downEvent = null
    },
    over: function (b) {
        enyo.dispatch(this.makeEvent("enter", b))
    },
    out: function (b) {
        enyo.dispatch(this.makeEvent("leave", b))
    },
    sendTap: function (b) {
        var d = this.findCommonAncestor(this.downEvent.target, b.target);
        if (d)
            b = this.makeEvent("tap", b),
                b.target = d,
                enyo.dispatch(b)
    },
    findCommonAncestor: function (b, d) {
        for (var e = d; e;) {
            if (this.isTargetDescendantOf(b, e))
                return e;
            e = e.parentNode
        }
    },
    isTargetDescendantOf: function (b, d) {
        for (var e = b; e;) {
            if (e == d)
                return !0;
            e = e.parentNode
        }
    }
};
enyo.gesture.preventDefault = function () {
    this.srcEvent && this.srcEvent.preventDefault()
}
    ;
enyo.gesture.disablePrevention = function () {
    this.preventDefault = enyo.nop;
    this.srcEvent && (this.srcEvent.preventDefault = enyo.nop)
}
    ;
enyo.dispatcher.features.push(function (b) {
    if (enyo.gesture.events[b.type])
        return enyo.gesture.events[b.type](b)
});
enyo.gesture.events = {
    mousedown: function (b) {
        enyo.gesture.down(b)
    },
    mouseup: function (b) {
        enyo.gesture.up(b)
    },
    mousemove: function (b) {
        enyo.gesture.move(b)
    },
    mouseover: function (b) {
        enyo.gesture.over(b)
    },
    mouseout: function (b) {
        enyo.gesture.out(b)
    }
};
enyo.requiresWindow(function () {
    document.addEventListener && document.addEventListener("DOMMouseScroll", function (b) {
        var d = enyo.clone(b);
        d.preventDefault = function () {
            b.preventDefault()
        }
            ;
        d.type = "mousewheel";
        d[d.VERTICAL_AXIS == d.axis ? "wheelDeltaY" : "wheelDeltaX"] = d.detail * -12;
        enyo.dispatch(d)
    }, !1)
});
enyo.dispatcher.features.push(function (b) {
    if (enyo.gesture.drag[b.type])
        return enyo.gesture.drag[b.type](b)
});
enyo.gesture.drag = {
    hysteresisSquared: 16,
    holdPulseDelay: 200,
    trackCount: 5,
    minFlick: 0.1,
    minTrack: 8,
    down: function (b) {
        this.stopDragging(b);
        this.cancelHold();
        this.target = b.target;
        this.startTracking(b);
        this.beginHold(b)
    },
    move: function (b) {
        if (this.tracking)
            this.track(b),
                b.which ? this.dragEvent ? this.sendDrag(b) : this.dy * this.dy + this.dx * this.dx >= this.hysteresisSquared && (this.sendDragStart(b),
                    this.cancelHold()) : (this.stopDragging(b),
                        this.cancelHold(),
                        this.tracking = !1)
    },
    up: function (b) {
        this.endTracking(b);
        this.stopDragging(b);
        this.cancelHold()
    },
    leave: function (b) {
        this.dragEvent && this.sendDragOut(b)
    },
    stopDragging: function (b) {
        if (this.dragEvent)
            return this.sendDrop(b),
                b = this.sendDragFinish(b),
                this.dragEvent = null,
                b
    },
    makeDragEvent: function (b, d, e, f) {
        var g = Math.abs(this.dx)
            , i = Math.abs(this.dy)
            , j = g > i
            , b = {
                type: b,
                dx: this.dx,
                dy: this.dy,
                ddx: this.dx - this.lastDx,
                ddy: this.dy - this.lastDy,
                xDirection: this.xDirection,
                yDirection: this.yDirection,
                pageX: e.pageX,
                pageY: e.pageY,
                clientX: e.clientX,
                clientY: e.clientY,
                horizontal: j,
                vertical: !j,
                lockable: (j ? i / g : g / i) < 0.414,
                target: d,
                dragInfo: f,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                srcEvent: e.srcEvent
            };
        return enyo.platform.ie == 8 && b.target && (b.pageX = b.clientX + b.target.scrollLeft,
            b.pageY = b.clientY + b.target.scrollTop),
            b.preventDefault = enyo.gesture.preventDefault,
            b.disablePrevention = enyo.gesture.disablePrevention,
            b
    },
    sendDragStart: function (b) {
        this.dragEvent = this.makeDragEvent("dragstart", this.target, b);
        enyo.dispatch(this.dragEvent)
    },
    sendDrag: function (b) {
        b = this.makeDragEvent("dragover", b.target, b, this.dragEvent.dragInfo);
        enyo.dispatch(b);
        b.type = "drag";
        b.target = this.dragEvent.target;
        enyo.dispatch(b)
    },
    sendDragFinish: function (b) {
        var d = this.makeDragEvent("dragfinish", this.dragEvent.target, b, this.dragEvent.dragInfo);
        d.preventTap = function () {
            b.preventTap && b.preventTap()
        }
            ;
        enyo.dispatch(d)
    },
    sendDragOut: function (b) {
        b = this.makeDragEvent("dragout", b.target, b, this.dragEvent.dragInfo);
        enyo.dispatch(b)
    },
    sendDrop: function (b) {
        var d = this.makeDragEvent("drop", b.target, b, this.dragEvent.dragInfo);
        d.preventTap = function () {
            b.preventTap && b.preventTap()
        }
            ;
        enyo.dispatch(d)
    },
    startTracking: function (b) {
        this.tracking = !0;
        this.px0 = b.clientX;
        this.py0 = b.clientY;
        this.flickInfo = {
            startEvent: b,
            moves: []
        };
        this.track(b)
    },
    track: function (b) {
        this.lastDx = this.dx;
        this.lastDy = this.dy;
        this.dx = b.clientX - this.px0;
        this.dy = b.clientY - this.py0;
        this.xDirection = this.calcDirection(this.dx - this.lastDx, 0);
        this.yDirection = this.calcDirection(this.dy - this.lastDy, 0);
        var d = this.flickInfo;
        d.moves.push({
            x: b.clientX,
            y: b.clientY,
            t: enyo.now()
        });
        d.moves.length > this.trackCount && d.moves.shift()
    },
    endTracking: function () {
        this.tracking = !1;
        var b = this.flickInfo
            , d = b && b.moves;
        if (d && d.length > 1) {
            for (var e = d[d.length - 1], f = enyo.now(), g = d.length - 2, i = 0, j = 0, k = 0, l = 0, m = 0, w = 0, y = 0, x; x = d[g]; g--)
                if (i = f - x.t,
                    j = (e.x - x.x) / i,
                    k = (e.y - x.y) / i,
                    w = w || (j < 0 ? -1 : j > 0 ? 1 : 0),
                    y = y || (k < 0 ? -1 : k > 0 ? 1 : 0),
                    j * w > l * w || k * y > m * y)
                    l = j,
                        m = k;
            d = Math.sqrt(l * l + m * m);
            d > this.minFlick && this.sendFlick(b.startEvent, l, m, d)
        }
        this.flickInfo = null
    },
    calcDirection: function (b, d) {
        return b > 0 ? 1 : b < 0 ? -1 : d
    },
    beginHold: function (b) {
        this.holdStart = enyo.now();
        this.holdJob = setInterval(enyo.bind(this, "sendHoldPulse", b), this.holdPulseDelay)
    },
    cancelHold: function () {
        clearInterval(this.holdJob);
        this.holdJob = null;
        this.sentHold && (this.sentHold = !1,
            this.sendRelease(this.holdEvent))
    },
    sendHoldPulse: function (b) {
        this.sentHold || (this.sentHold = !0,
            this.sendHold(b));
        b = enyo.gesture.makeEvent("holdpulse", b);
        b.holdTime = enyo.now() - this.holdStart;
        enyo.dispatch(b)
    },
    sendHold: function (b) {
        this.holdEvent = b;
        b = enyo.gesture.makeEvent("hold", b);
        enyo.dispatch(b)
    },
    sendRelease: function (b) {
        b = enyo.gesture.makeEvent("release", b);
        enyo.dispatch(b)
    },
    sendFlick: function (b, d, e, f) {
        b = enyo.gesture.makeEvent("flick", b);
        b.xVelocity = d;
        b.yVelocity = e;
        b.velocity = f;
        enyo.dispatch(b)
    }
};
enyo.requiresWindow(function () {
    var b = enyo.gesture
        , d = b.events;
    b.events.touchstart = function (d) {
        b.events = e;
        b.events.touchstart(d)
    }
        ;
    var e = {
        _touchCount: 0,
        touchstart: function (d) {
            enyo.job.stop("resetGestureEvents");
            this._touchCount += d.changedTouches.length;
            this.excludedTarget = null;
            var e = this.makeEvent(d);
            b.down(e);
            e = this.makeEvent(d);
            this.overEvent = e;
            b.over(e)
        },
        touchmove: function (d) {
            enyo.job.stop("resetGestureEvents");
            var e = b.drag.dragEvent;
            this.excludedTarget = e && e.dragInfo && e.dragInfo.node;
            e = this.makeEvent(d);
            b.move(e);
            enyo.bodyIsFitting && d.preventDefault();
            this.overEvent && this.overEvent.target != e.target && (this.overEvent.relatedTarget = e.target,
                e.relatedTarget = this.overEvent.target,
                b.out(this.overEvent),
                b.over(e));
            this.overEvent = e
        },
        touchend: function (e) {
            b.up(this.makeEvent(e));
            b.out(this.overEvent);
            this._touchCount -= e.changedTouches.length;
            enyo.platform.chrome && this._touchCount === 0 && enyo.job("resetGestureEvents", function () {
                b.events = d
            }, 10)
        },
        makeEvent: function (b) {
            var d = enyo.clone(b.changedTouches[0]);
            return d.srcEvent = b,
                d.target = this.findTarget(d),
                d.which = 1,
                d
        },
        calcNodeOffset: function (b) {
            if (b.getBoundingClientRect)
                return b = b.getBoundingClientRect(),
                {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height
                }
        },
        findTarget: function (b) {
            return document.elementFromPoint(b.clientX, b.clientY)
        },
        findTargetTraverse: function (b, d, e) {
            var b = b || document.body
                , j = this.calcNodeOffset(b);
            if (j && b != this.excludedTarget) {
                var k = d - j.left
                    , l = e - j.top;
                if (k > 0 && l > 0 && k <= j.width && l <= j.height) {
                    j = b.childNodes;
                    for (k = j.length - 1; l = j[k]; k--)
                        if (l = this.findTargetTraverse(l, d, e))
                            return l;
                    return b
                }
            }
        },
        connect: function () {
            enyo.forEach("ontouchstart,ontouchmove,ontouchend,ongesturestart,ongesturechange,ongestureend".split(","), function (b) {
                document[b] = enyo.dispatch
            });
            enyo.platform.androidChrome <= 18 ? this.findTarget = function (b) {
                return document.elementFromPoint(b.screenX, b.screenY)
            }
                : document.elementFromPoint || (this.findTarget = function (b) {
                    return this.findTargetTraverse(null, b.clientX, b.clientY)
                }
                )
        }
    };
    e.connect()
});
(function () {
    window.navigator.msPointerEnabled && (enyo.forEach("MSPointerDown,MSPointerUp,MSPointerMove,MSPointerOver,MSPointerOut,MSPointerCancel,MSGestureTap,MSGestureDoubleTap,MSGestureHold,MSGestureStart,MSGestureChange,MSGestureEnd".split(","), function (b) {
        enyo.dispatcher.listen(document, b)
    }),
        enyo.dispatcher.features.push(function (b) {
            d[b.type] && d[b.type](b)
        }));
    var b = function (b, d) {
        var g = enyo.clone(d);
        return enyo.mixin(g, {
            pageX: d.translationX || 0,
            pageY: d.translationY || 0,
            rotation: d.rotation * (180 / Math.PI) || 0,
            type: b,
            srcEvent: d,
            preventDefault: enyo.gesture.preventDefault,
            disablePrevention: enyo.gesture.disablePrevention
        })
    }
        , d = {
            MSGestureStart: function (d) {
                enyo.dispatch(b("gesturestart", d))
            },
            MSGestureChange: function (d) {
                enyo.dispatch(b("gesturechange", d))
            },
            MSGestureEnd: function (d) {
                enyo.dispatch(b("gestureend", d))
            }
        }
}
)();
(function () {
    !enyo.platform.gesture && enyo.platform.touch && enyo.dispatcher.features.push(function (e) {
        b[e.type] && d[e.type](e)
    });
    var b = {
        touchstart: !0,
        touchmove: !0,
        touchend: !0
    }
        , d = {
            orderedTouches: [],
            gesture: null,
            touchstart: function (b) {
                enyo.forEach(b.changedTouches, function (b) {
                    b = b.identifier;
                    enyo.indexOf(b, this.orderedTouches) < 0 && this.orderedTouches.push(b)
                }, this);
                if (b.touches.length >= 2 && !this.gesture) {
                    var d = this.gesturePositions(b);
                    this.gesture = this.gestureVector(d);
                    this.gesture.angle = this.gestureAngle(d);
                    this.gesture.scale = 1;
                    this.gesture.rotation = 0;
                    b = this.makeGesture("gesturestart", b, {
                        vector: this.gesture,
                        scale: 1,
                        rotation: 0
                    });
                    enyo.dispatch(b)
                }
            },
            touchend: function (b) {
                enyo.forEach(b.changedTouches, function (b) {
                    enyo.remove(b.identifier, this.orderedTouches)
                }, this);
                if (b.touches.length <= 1 && this.gesture) {
                    var d = b.touches[0] || b.changedTouches[b.changedTouches.length - 1];
                    enyo.dispatch(this.makeGesture("gestureend", b, {
                        vector: {
                            xcenter: d.pageX,
                            ycenter: d.pageY
                        },
                        scale: this.gesture.scale,
                        rotation: this.gesture.rotation
                    }));
                    this.gesture = null
                }
            },
            touchmove: function (b) {
                if (this.gesture)
                    b = this.makeGesture("gesturechange", b),
                        this.gesture.scale = b.scale,
                        this.gesture.rotation = b.rotation,
                        enyo.dispatch(b)
            },
            findIdentifiedTouch: function (b, d) {
                for (var g = 0, i; i = b[g]; g++)
                    if (i.identifier === d)
                        return i
            },
            gesturePositions: function (b) {
                var d = this.findIdentifiedTouch(b.touches, this.orderedTouches[0])
                    , g = this.findIdentifiedTouch(b.touches, this.orderedTouches[this.orderedTouches.length - 1])
                    , b = d.pageX
                    , i = g.pageX
                    , d = d.pageY
                    , g = g.pageY
                    , j = i - b
                    , k = g - d
                    , l = Math.sqrt(j * j + k * k);
                return {
                    x: j,
                    y: k,
                    h: l,
                    fx: b,
                    lx: i,
                    fy: d,
                    ly: g
                }
            },
            gestureAngle: function (b) {
                var d = Math.asin(b.y / b.h) * (180 / Math.PI);
                return b.x < 0 && (d = 180 - d),
                    b.x > 0 && b.y < 0 && (d += 360),
                    d
            },
            gestureVector: function (b) {
                return {
                    magnitude: b.h,
                    xcenter: Math.abs(Math.round(b.fx + b.x / 2)),
                    ycenter: Math.abs(Math.round(b.fy + b.y / 2))
                }
            },
            makeGesture: function (b, d, g) {
                var i, j;
                g ? (i = g.vector,
                    j = g.scale,
                    g = g.rotation) : (g = this.gesturePositions(d),
                        i = this.gestureVector(g),
                        j = i.magnitude / this.gesture.magnitude,
                        g = (360 + this.gestureAngle(g) - this.gesture.angle) % 360);
                d = enyo.clone(d);
                return enyo.mixin(d, {
                    type: b,
                    scale: j,
                    pageX: i.xcenter,
                    pageY: i.ycenter,
                    rotation: g
                })
            }
        }
}
)();
enyo.kind({
    name: "enyo.ScrollMath",
    kind: enyo.Component,
    published: {
        vertical: !0,
        horizontal: !0
    },
    events: {
        onScrollStart: "",
        onScroll: "",
        onScrollStop: ""
    },
    kSpringDamping: 0.93,
    kDragDamping: 0.5,
    kFrictionDamping: 0.97,
    kSnapFriction: 0.9,
    kFlickScalar: 15,
    kMaxFlick: enyo.platform.android > 2 ? 2 : 1E9,
    kFrictionEpsilon: 0.01,
    topBoundary: 0,
    rightBoundary: 0,
    bottomBoundary: 0,
    leftBoundary: 0,
    interval: 20,
    fixedTime: !0,
    x0: 0,
    x: 0,
    y0: 0,
    y: 0,
    destroy: function () {
        this.stop();
        this.inherited(arguments)
    },
    verlet: function () {
        var b = this.x;
        this.x += b - this.x0;
        this.x0 = b;
        b = this.y;
        this.y += b - this.y0;
        this.y0 = b
    },
    damping: function (b, d, e, f) {
        var g = b - d;
        return Math.abs(g) < 0.5 ? d : b * f > d * f ? e * g + d : b
    },
    boundaryDamping: function (b, d, e, f) {
        return this.damping(this.damping(b, d, f, 1), e, f, -1)
    },
    constrain: function () {
        var b = this.boundaryDamping(this.y, this.topBoundary, this.bottomBoundary, this.kSpringDamping);
        b != this.y && (this.y0 = b - (this.y - this.y0) * this.kSnapFriction,
            this.y = b);
        b = this.boundaryDamping(this.x, this.leftBoundary, this.rightBoundary, this.kSpringDamping);
        b != this.x && (this.x0 = b - (this.x - this.x0) * this.kSnapFriction,
            this.x = b)
    },
    friction: function (b, d, e) {
        var f = this[b] - this[d]
            , e = Math.abs(f) > this.kFrictionEpsilon ? e : 0;
        this[b] = this[d] + e * f
    },
    frame: 10,
    simulate: function (b) {
        for (; b >= this.frame;)
            b -= this.frame,
                this.dragging || this.constrain(),
                this.verlet(),
                this.friction("y", "y0", this.kFrictionDamping),
                this.friction("x", "x0", this.kFrictionDamping);
        return b
    },
    animate: function () {
        this.stop();
        var b = enyo.now(), d = 0, e, f, g = enyo.bind(this, function () {
            var i = enyo.now();
            this.job = enyo.requestAnimationFrame(g);
            var j = i - b;
            b = i;
            this.dragging && (this.y0 = this.y = this.uy,
                this.x0 = this.x = this.ux);
            d += Math.max(16, j);
            this.fixedTime && !this.isInOverScroll() && (d = this.interval);
            d = this.simulate(d);
            f != this.y || e != this.x ? this.scroll() : this.dragging || (this.stop(!0),
                this.scroll());
            f = this.y;
            e = this.x
        });
        this.job = enyo.requestAnimationFrame(g)
    },
    start: function () {
        this.job || (this.animate(),
            this.doScrollStart())
    },
    stop: function (b) {
        this.job = enyo.cancelRequestAnimationFrame(this.job);
        b && this.doScrollStop()
    },
    stabilize: function () {
        this.start();
        var b = Math.min(this.topBoundary, Math.max(this.bottomBoundary, this.y))
            , d = Math.min(this.leftBoundary, Math.max(this.rightBoundary, this.x));
        this.y = this.y0 = b;
        this.x = this.x0 = d;
        this.scroll();
        this.stop(!0)
    },
    startDrag: function (b) {
        this.dragging = !0;
        this.my = b.pageY;
        this.py = this.uy = this.y;
        this.mx = b.pageX;
        this.px = this.ux = this.x
    },
    drag: function (b) {
        if (this.dragging)
            return this.uy = (this.vertical ? b.pageY - this.my : 0) + this.py,
                this.uy = this.boundaryDamping(this.uy, this.topBoundary, this.bottomBoundary, this.kDragDamping),
                this.ux = (this.horizontal ? b.pageX - this.mx : 0) + this.px,
                this.ux = this.boundaryDamping(this.ux, this.leftBoundary, this.rightBoundary, this.kDragDamping),
                this.start(),
                !0
    },
    dragDrop: function () {
        if (this.dragging && !window.PalmSystem)
            this.y = this.uy,
                this.y0 = this.y - (this.y - this.y0) * 0.5,
                this.x = this.ux,
                this.x0 = this.x - (this.x - this.x0) * 0.5;
        this.dragFinish()
    },
    dragFinish: function () {
        this.dragging = !1
    },
    flick: function (b) {
        var d;
        this.vertical && (d = b.yVelocity > 0 ? Math.min(this.kMaxFlick, b.yVelocity) : Math.max(-this.kMaxFlick, b.yVelocity),
            this.y = this.y0 + d * this.kFlickScalar);
        this.horizontal && (d = b.xVelocity > 0 ? Math.min(this.kMaxFlick, b.xVelocity) : Math.max(-this.kMaxFlick, b.xVelocity),
            this.x = this.x0 + d * this.kFlickScalar);
        this.start()
    },
    mousewheel: function (b) {
        b = this.vertical ? b.wheelDeltaY || b.wheelDelta : 0;
        if (b > 0 && this.y < this.topBoundary || b < 0 && this.y > this.bottomBoundary)
            return this.stop(!0),
                this.y = this.y0 += b,
                this.start(),
                !0
    },
    scroll: function () {
        this.doScroll()
    },
    scrollTo: function (b, d) {
        b !== null && (this.y = this.y0 - (b + this.y0) * (1 - this.kFrictionDamping));
        d !== null && (this.x = this.x0 - (d + this.x0) * (1 - this.kFrictionDamping));
        this.start()
    },
    setScrollX: function (b) {
        this.x = this.x0 = b
    },
    setScrollY: function (b) {
        this.y = this.y0 = b
    },
    setScrollPosition: function (b) {
        this.setScrollY(b)
    },
    isScrolling: function () {
        return Boolean(this.job)
    },
    isInOverScroll: function () {
        return this.job && (this.x > this.leftBoundary || this.x < this.rightBoundary || this.y > this.topBoundary || this.y < this.bottomBoundary)
    }
});
enyo.kind({
    name: "enyo.ScrollStrategy",
    tag: null,
    published: {
        vertical: "default",
        horizontal: "default",
        scrollLeft: 0,
        scrollTop: 0,
        maxHeight: null
    },
    handlers: {
        ondragstart: "dragstart",
        ondragfinish: "dragfinish",
        ondown: "down",
        onmove: "move"
    },
    create: function () {
        this.inherited(arguments);
        this.horizontalChanged();
        this.verticalChanged();
        this.maxHeightChanged()
    },
    rendered: function () {
        this.inherited(arguments);
        enyo.makeBubble(this.container, "scroll");
        this.scrollNode = this.calcScrollNode()
    },
    teardownRender: function () {
        this.inherited(arguments);
        this.scrollNode = null
    },
    calcScrollNode: function () {
        return this.container.hasNode()
    },
    horizontalChanged: function () {
        this.container.applyStyle("overflow-x", this.horizontal == "default" ? "auto" : this.horizontal)
    },
    verticalChanged: function () {
        this.container.applyStyle("overflow-y", this.vertical == "default" ? "auto" : this.vertical)
    },
    maxHeightChanged: function () {
        this.container.applyStyle("max-height", this.maxHeight)
    },
    scrollTo: function (b, d) {
        this.scrollNode && (this.setScrollLeft(b),
            this.setScrollTop(d))
    },
    scrollToNode: function (b, d) {
        if (this.scrollNode) {
            for (var e = this.getScrollBounds(), f = b, g = f.offsetHeight, i = f.offsetWidth, j = 0, k = 0; f && f.parentNode && f.id != this.scrollNode.id;)
                j += f.offsetTop,
                    k += f.offsetLeft,
                    f = f.parentNode;
            this.setScrollTop(Math.min(e.maxTop, d === !1 ? j - e.clientHeight + g : j));
            this.setScrollLeft(Math.min(e.maxLeft, d === !1 ? k - e.clientWidth + i : k))
        }
    },
    scrollIntoView: function (b, d) {
        b.hasNode() && b.node.scrollIntoView(d)
    },
    isInView: function (b) {
        var d = this.getScrollBounds()
            , e = b.offsetTop
            , f = b.offsetHeight
            , g = b.offsetLeft
            , b = b.offsetWidth;
        return e >= d.top && e + f <= d.top + d.clientHeight && g >= d.left && g + b <= d.left + d.clientWidth
    },
    setScrollTop: function (b) {
        this.scrollTop = b;
        this.scrollNode && (this.scrollNode.scrollTop = this.scrollTop)
    },
    setScrollLeft: function (b) {
        this.scrollLeft = b;
        this.scrollNode && (this.scrollNode.scrollLeft = this.scrollLeft)
    },
    getScrollLeft: function () {
        return this.scrollNode ? this.scrollNode.scrollLeft : this.scrollLeft
    },
    getScrollTop: function () {
        return this.scrollNode ? this.scrollNode.scrollTop : this.scrollTop
    },
    _getScrollBounds: function () {
        var b = this.getScrollSize()
            , d = this.container.hasNode()
            , b = {
                left: this.getScrollLeft(),
                top: this.getScrollTop(),
                clientHeight: d ? d.clientHeight : 0,
                clientWidth: d ? d.clientWidth : 0,
                height: b.height,
                width: b.width
            };
        return b.maxLeft = Math.max(0, b.width - b.clientWidth),
            b.maxTop = Math.max(0, b.height - b.clientHeight),
            b
    },
    getScrollSize: function () {
        var b = this.scrollNode;
        return {
            width: b ? b.scrollWidth : 0,
            height: b ? b.scrollHeight : 0
        }
    },
    getScrollBounds: function () {
        return this._getScrollBounds()
    },
    calcStartInfo: function () {
        var b = this.getScrollBounds()
            , d = this.getScrollTop()
            , e = this.getScrollLeft();
        this.canVertical = b.maxTop > 0 && this.vertical != "hidden";
        this.canHorizontal = b.maxLeft > 0 && this.horizontal != "hidden";
        this.startEdges = {
            top: d === 0,
            bottom: d === b.maxTop,
            left: e === 0,
            right: e === b.maxLeft
        }
    },
    shouldDrag: function (b) {
        return (b = b.vertical) && this.canVertical || !b && this.canHorizontal
    },
    dragstart: function (b, d) {
        if (this.dragging = this.shouldDrag(d))
            return this.preventDragPropagation
    },
    dragfinish: function (b, d) {
        this.dragging && (this.dragging = !1,
            d.preventTap())
    },
    down: function () {
        this.calcStartInfo()
    },
    move: function (b, d) {
        d.which && (this.canVertical && d.vertical || this.canHorizontal && d.horizontal) && d.disablePrevention()
    }
});
enyo.kind({
    name: "enyo.ScrollThumb",
    axis: "v",
    minSize: 4,
    cornerSize: 6,
    classes: "enyo-thumb",
    create: function () {
        this.inherited(arguments);
        var b = this.axis == "v";
        this.dimension = b ? "height" : "width";
        this.offset = b ? "top" : "left";
        this.translation = b ? "translateY" : "translateX";
        this.positionMethod = b ? "getScrollTop" : "getScrollLeft";
        this.sizeDimension = b ? "clientHeight" : "clientWidth";
        this.addClass("enyo-" + this.axis + "thumb");
        this.transform = enyo.dom.canTransform();
        enyo.dom.canAccelerate() && enyo.dom.transformValue(this, "translateZ", 0)
    },
    sync: function (b) {
        this.scrollBounds = b._getScrollBounds();
        this.update(b)
    },
    update: function (b) {
        if (this.showing) {
            var d = this.dimension
                , e = this.offset
                , f = this.scrollBounds[this.sizeDimension]
                , g = this.scrollBounds[d]
                , i = 0
                , j = 0
                , k = 0;
            f >= g ? this.hide() : (b.isOverscrolling() && (k = b.getOverScrollBounds()["over" + e],
                i = Math.abs(k),
                j = Math.max(k, 0)),
                e = b[this.positionMethod]() - k,
                b = f - this.cornerSize,
                i = Math.floor(f * f / g - i),
                i = Math.max(this.minSize, i),
                g = Math.floor(b * e / g + j),
                g = Math.max(0, Math.min(b - this.minSize, g)),
                this.needed = i < f,
                this.needed && this.hasNode() ? (this._pos !== g && (this._pos = g,
                    this.transform ? enyo.dom.transformValue(this, this.translation, g + "px") : this.axis == "v" ? this.setBounds({
                        top: g + "px"
                    }) : this.setBounds({
                        left: g + "px"
                    })),
                    this._size !== i && (this._size = i,
                        this.node.style[d] = this.domStyles[d] = i + "px")) : this.hide())
        }
    },
    setShowing: function (b) {
        if (!b || !(b != this.showing && this.scrollBounds[this.sizeDimension] >= this.scrollBounds[this.dimension]))
            if (this.hasNode() && this.cancelDelayHide(),
                b != this.showing) {
                var d = this.showing;
                this.showing = b;
                this.showingChanged(d)
            }
    },
    delayHide: function (b) {
        this.showing && enyo.job(this.id + "hide", enyo.bind(this, "hide"), b || 0)
    },
    cancelDelayHide: function () {
        enyo.job.stop(this.id + "hide")
    }
});
enyo.kind({
    name: "enyo.TouchScrollStrategy",
    kind: "ScrollStrategy",
    overscroll: !0,
    preventDragPropagation: !0,
    published: {
        vertical: "default",
        horizontal: "default",
        thumb: !0,
        scrim: !1,
        dragDuringGesture: !0
    },
    events: {
        onShouldDrag: ""
    },
    handlers: {
        onscroll: "domScroll",
        onflick: "flick",
        onhold: "hold",
        ondragstart: "dragstart",
        onShouldDrag: "shouldDrag",
        ondrag: "drag",
        ondragfinish: "dragfinish",
        onmousewheel: "mousewheel"
    },
    tools: [{
        kind: "ScrollMath",
        onScrollStart: "scrollMathStart",
        onScroll: "scrollMathScroll",
        onScrollStop: "scrollMathStop"
    }, {
        name: "vthumb",
        kind: "ScrollThumb",
        axis: "v",
        showing: !1
    }, {
        name: "hthumb",
        kind: "ScrollThumb",
        axis: "h",
        showing: !1
    }],
    scrimTools: [{
        name: "scrim",
        classes: "enyo-fit",
        style: "z-index: 1;",
        showing: !1
    }],
    components: [{
        name: "client",
        classes: "enyo-touch-scroller"
    }],
    create: function () {
        this.inherited(arguments);
        this.transform = enyo.dom.canTransform();
        this.transform || this.overscroll && this.$.client.applyStyle("position", "relative");
        this.accel = enyo.dom.canAccelerate();
        var b = "enyo-touch-strategy-container";
        enyo.platform.ios && this.accel && (b += " enyo-composite");
        this.scrimChanged();
        this.container.addClass(b);
        this.translation = this.accel ? "translate3d" : "translate"
    },
    initComponents: function () {
        this.createChrome(this.tools);
        this.inherited(arguments)
    },
    destroy: function () {
        this.container.removeClass("enyo-touch-strategy-container");
        this.inherited(arguments)
    },
    rendered: function () {
        this.inherited(arguments);
        enyo.makeBubble(this.$.client, "scroll");
        this.calcBoundaries();
        this.syncScrollMath();
        this.thumb && this.alertThumbs()
    },
    scrimChanged: function () {
        this.scrim && !this.$.scrim && this.makeScrim();
        !this.scrim && this.$.scrim && this.$.scrim.destroy()
    },
    makeScrim: function () {
        var b = this.controlParent;
        this.controlParent = null;
        this.createChrome(this.scrimTools);
        this.controlParent = b;
        (b = this.container.hasNode()) && (this.$.scrim.parentNode = b,
            this.$.scrim.render())
    },
    isScrolling: function () {
        return this.$.scrollMath.isScrolling()
    },
    isOverscrolling: function () {
        return this.overscroll ? this.$.scrollMath.isInOverScroll() : !1
    },
    domScroll: function () {
        this.isScrolling() || (this.calcBoundaries(),
            this.syncScrollMath(),
            this.thumb && this.alertThumbs())
    },
    horizontalChanged: function () {
        this.$.scrollMath.horizontal = this.horizontal != "hidden"
    },
    verticalChanged: function () {
        this.$.scrollMath.vertical = this.vertical != "hidden"
    },
    maxHeightChanged: function () {
        this.$.client.applyStyle("max-height", this.maxHeight);
        this.$.client.addRemoveClass("enyo-scrollee-fit", !this.maxHeight)
    },
    thumbChanged: function () {
        this.hideThumbs()
    },
    stop: function () {
        this.isScrolling() && this.$.scrollMath.stop(!0)
    },
    stabilize: function () {
        this.$.scrollMath.stabilize()
    },
    scrollTo: function (b, d) {
        this.stop();
        this.$.scrollMath.scrollTo(d || d === 0 ? d : null, b)
    },
    scrollIntoView: function () {
        this.stop();
        this.inherited(arguments)
    },
    setScrollLeft: function () {
        this.stop();
        this.inherited(arguments)
    },
    setScrollTop: function () {
        this.stop();
        this.inherited(arguments)
    },
    getScrollLeft: function () {
        return this.isScrolling() ? this.scrollLeft : this.inherited(arguments)
    },
    getScrollTop: function () {
        return this.isScrolling() ? this.scrollTop : this.inherited(arguments)
    },
    calcScrollNode: function () {
        return this.$.client.hasNode()
    },
    calcAutoScrolling: function () {
        var b = this.vertical == "auto"
            , d = this.horizontal == "auto" || this.horizontal == "default";
        if ((b || d) && this.scrollNode) {
            var e = this.getScrollBounds();
            b && (this.$.scrollMath.vertical = e.height > e.clientHeight);
            d && (this.$.scrollMath.horizontal = e.width > e.clientWidth)
        }
    },
    shouldDrag: function (b, d) {
        this.calcAutoScrolling();
        var e = d.vertical
            , f = this.$.scrollMath.horizontal && !e
            , e = this.$.scrollMath.vertical && e
            , g = d.dy < 0
            , i = d.dx < 0
            , g = !g && this.startEdges.top || g && this.startEdges.bottom
            , i = !i && this.startEdges.left || i && this.startEdges.right;
        !d.boundaryDragger && (f || e) && (d.boundaryDragger = this);
        if (!g && e || !i && f)
            return d.dragger = this,
                !0
    },
    flick: function (b, d) {
        if ((Math.abs(d.xVelocity) > Math.abs(d.yVelocity) ? this.$.scrollMath.horizontal : this.$.scrollMath.vertical) && this.dragging)
            return this.$.scrollMath.flick(d),
                this.preventDragPropagation
    },
    hold: function (b, d) {
        if (this.isScrolling() && !this.isOverscrolling())
            return this.$.scrollMath.stop(d),
                !0
    },
    move: function () { },
    dragstart: function (b, d) {
        if (!this.dragDuringGesture && d.srcEvent.touches && d.srcEvent.touches.length > 1)
            return !0;
        this.doShouldDrag(d);
        this.dragging = d.dragger == this || !d.dragger && d.boundaryDragger == this;
        if (this.dragging && (d.preventDefault(),
            this.syncScrollMath(),
            this.$.scrollMath.startDrag(d),
            this.preventDragPropagation))
            return !0
    },
    drag: function (b, d) {
        this.dragging && (d.preventDefault(),
            this.$.scrollMath.drag(d),
            this.scrim && this.$.scrim.show())
    },
    dragfinish: function (b, d) {
        this.dragging && (d.preventTap(),
            this.$.scrollMath.dragFinish(),
            this.dragging = !1,
            this.scrim && this.$.scrim.hide())
    },
    mousewheel: function (b, d) {
        if (!this.dragging && (this.calcBoundaries(),
            this.syncScrollMath(),
            this.$.scrollMath.mousewheel(d)))
            return d.preventDefault(),
                !0
    },
    scrollMathStart: function () {
        this.scrollNode && (this.calcBoundaries(),
            this.thumb && this.showThumbs())
    },
    scrollMathScroll: function (b) {
        this.overscroll ? this.effectScroll(-b.x, -b.y) : this.effectScroll(-Math.min(b.leftBoundary, Math.max(b.rightBoundary, b.x)), -Math.min(b.topBoundary, Math.max(b.bottomBoundary, b.y)));
        this.thumb && this.updateThumbs()
    },
    scrollMathStop: function () {
        this.effectScrollStop();
        this.thumb && this.delayHideThumbs(100)
    },
    calcBoundaries: function () {
        var b = this.$.scrollMath
            , d = this._getScrollBounds();
        b.bottomBoundary = d.clientHeight - d.height;
        b.rightBoundary = d.clientWidth - d.width
    },
    syncScrollMath: function () {
        var b = this.$.scrollMath;
        b.setScrollX(-this.getScrollLeft());
        b.setScrollY(-this.getScrollTop())
    },
    effectScroll: function (b, d) {
        this.scrollNode && (this.scrollLeft = this.scrollNode.scrollLeft = b,
            this.scrollTop = this.scrollNode.scrollTop = d,
            this.effectOverscroll(Math.round(b), Math.round(d)))
    },
    effectScrollStop: function () {
        this.effectOverscroll(null, null)
    },
    effectOverscroll: function (b, d) {
        var e = this.scrollNode
            , f = "0"
            , g = "0"
            , i = this.accel ? ",0" : "";
        d !== null && Math.abs(d - e.scrollTop) > 1 && (g = e.scrollTop - d);
        b !== null && Math.abs(b - e.scrollLeft) > 1 && (f = e.scrollLeft - b);
        this.transform ? enyo.dom.transformValue(this.$.client, this.translation, f + "px, " + g + "px" + i) : this.$.client.setBounds({
            left: f + "px",
            top: g + "px"
        })
    },
    getOverScrollBounds: function () {
        var b = this.$.scrollMath;
        return {
            overleft: Math.min(b.leftBoundary - b.x, 0) || Math.max(b.rightBoundary - b.x, 0),
            overtop: Math.min(b.topBoundary - b.y, 0) || Math.max(b.bottomBoundary - b.y, 0)
        }
    },
    _getScrollBounds: function () {
        var b = this.inherited(arguments);
        return enyo.mixin(b, this.getOverScrollBounds()),
            b
    },
    getScrollBounds: function () {
        return this.stop(),
            this.inherited(arguments)
    },
    alertThumbs: function () {
        this.showThumbs();
        this.delayHideThumbs(500)
    },
    syncThumbs: function () {
        this.$.vthumb.sync(this);
        this.$.hthumb.sync(this)
    },
    updateThumbs: function () {
        this.$.vthumb.update(this);
        this.$.hthumb.update(this)
    },
    showThumbs: function () {
        this.syncThumbs();
        this.$.vthumb.show();
        this.$.hthumb.show()
    },
    hideThumbs: function () {
        this.$.vthumb.hide();
        this.$.hthumb.hide()
    },
    delayHideThumbs: function (b) {
        this.$.vthumb.delayHide(b);
        this.$.hthumb.delayHide(b)
    }
});
enyo.kind({
    name: "enyo.TranslateScrollStrategy",
    kind: "TouchScrollStrategy",
    translateOptimized: !1,
    components: [{
        name: "clientContainer",
        classes: "enyo-touch-scroller",
        components: [{
            name: "client"
        }]
    }],
    rendered: function () {
        this.inherited(arguments);
        enyo.makeBubble(this.$.clientContainer, "scroll")
    },
    getScrollSize: function () {
        var b = this.$.client.hasNode();
        return {
            width: b ? b.scrollWidth : 0,
            height: b ? b.scrollHeight : 0
        }
    },
    create: function () {
        this.inherited(arguments);
        enyo.dom.transformValue(this.$.client, this.translation, "0,0,0")
    },
    calcScrollNode: function () {
        return this.$.clientContainer.hasNode()
    },
    maxHeightChanged: function () {
        this.$.client.applyStyle("min-height", this.maxHeight ? null : "100%");
        this.$.client.applyStyle("max-height", this.maxHeight);
        this.$.clientContainer.addRemoveClass("enyo-scrollee-fit", !this.maxHeight)
    },
    shouldDrag: function (b, d) {
        return this.stop(),
            this.calcStartInfo(),
            this.inherited(arguments)
    },
    syncScrollMath: function () {
        this.translateOptimized || this.inherited(arguments)
    },
    setScrollLeft: function (b) {
        this.stop();
        if (this.translateOptimized) {
            var d = this.$.scrollMath;
            d.setScrollX(-b);
            d.stabilize()
        } else
            this.inherited(arguments)
    },
    setScrollTop: function (b) {
        this.stop();
        if (this.translateOptimized) {
            var d = this.$.scrollMath;
            d.setScrollY(-b);
            d.stabilize()
        } else
            this.inherited(arguments)
    },
    getScrollLeft: function () {
        return this.translateOptimized ? this.scrollLeft : this.inherited(arguments)
    },
    getScrollTop: function () {
        return this.translateOptimized ? this.scrollTop : this.inherited(arguments)
    },
    scrollMathStart: function (b) {
        this.inherited(arguments);
        this.scrollStarting = !0;
        this.startX = 0;
        this.startY = 0;
        !this.translateOptimized && this.scrollNode && (this.startX = this.getScrollLeft(),
            this.startY = this.getScrollTop())
    },
    scrollMathScroll: function (b) {
        this.overscroll ? (this.scrollLeft = -b.x,
            this.scrollTop = -b.y) : (this.scrollLeft = -Math.min(b.leftBoundary, Math.max(b.rightBoundary, b.x)),
                this.scrollTop = -Math.min(b.topBoundary, Math.max(b.bottomBoundary, b.y)));
        this.isScrolling() && (this.$.scrollMath.isScrolling() && this.effectScroll(this.startX - this.scrollLeft, this.startY - this.scrollTop),
            this.thumb && this.updateThumbs())
    },
    effectScroll: function (b, d) {
        enyo.dom.transformValue(this.$.client, this.translation, b + "px, " + d + "px" + (this.accel ? ",0" : ""))
    },
    effectScrollStop: function () {
        if (!this.translateOptimized) {
            var b = "0,0" + (this.accel ? ",0" : "")
                , d = this.$.scrollMath
                , e = this._getScrollBounds()
                , d = Boolean(e.maxTop + d.bottomBoundary || e.maxLeft + d.rightBoundary);
            enyo.dom.transformValue(this.$.client, this.translation, d ? null : b);
            this.setScrollLeft(this.scrollLeft);
            this.setScrollTop(this.scrollTop);
            d && enyo.dom.transformValue(this.$.client, this.translation, b)
        }
    },
    twiddle: function () {
        this.translateOptimized && this.scrollNode && (this.scrollNode.scrollTop = 1,
            this.scrollNode.scrollTop = 0)
    },
    down: enyo.nop
});
enyo.kind({
    name: "enyo.Scroller",
    published: {
        horizontal: "default",
        vertical: "default",
        scrollTop: 0,
        scrollLeft: 0,
        maxHeight: null,
        touch: !1,
        strategyKind: "ScrollStrategy",
        thumb: !0
    },
    events: {
        onScrollStart: "",
        onScroll: "",
        onScrollStop: ""
    },
    handlers: {
        onscroll: "domScroll",
        onScrollStart: "scrollStart",
        onScroll: "scroll",
        onScrollStop: "scrollStop"
    },
    classes: "enyo-scroller",
    touchOverscroll: !0,
    preventDragPropagation: !0,
    preventScrollPropagation: !0,
    statics: {
        osInfo: [{
            os: "android",
            version: 3
        }, {
            os: "androidChrome",
            version: 18
        }, {
            os: "androidFirefox",
            version: 16
        }, {
            os: "ios",
            version: 5
        }, {
            os: "webos",
            version: 1E9
        }],
        hasTouchScrolling: function () {
            for (var b = 0, d; d = this.osInfo[b]; b++)
                if (enyo.platform[d.os])
                    return !0
        },
        hasNativeScrolling: function () {
            for (var b = 0, d; d = this.osInfo[b]; b++)
                if (enyo.platform[d.os] < d.version)
                    return !1;
            return !0
        },
        getTouchStrategy: function () {
            return enyo.platform.android >= 3 ? "TranslateScrollStrategy" : "TouchScrollStrategy"
        }
    },
    controlParentName: "strategy",
    create: function () {
        this.inherited(arguments);
        this.horizontalChanged();
        this.verticalChanged()
    },
    importProps: function (b) {
        this.inherited(arguments);
        b && b.strategyKind === void 0 && (enyo.Scroller.touchScrolling || this.touch) && (this.strategyKind = enyo.Scroller.getTouchStrategy())
    },
    initComponents: function () {
        this.strategyKindChanged();
        this.inherited(arguments)
    },
    teardownChildren: function () {
        this.cacheScrollPosition();
        this.inherited(arguments)
    },
    rendered: function () {
        this.inherited(arguments);
        this.restoreScrollPosition()
    },
    strategyKindChanged: function () {
        this.$.strategy && (this.$.strategy.destroy(),
            this.controlParent = null);
        this.createStrategy();
        this.hasNode() && this.render()
    },
    createStrategy: function () {
        this.createComponents([{
            name: "strategy",
            maxHeight: this.maxHeight,
            kind: this.strategyKind,
            thumb: this.thumb,
            preventDragPropagation: this.preventDragPropagation,
            overscroll: this.touchOverscroll,
            isChrome: !0
        }])
    },
    getStrategy: function () {
        return this.$.strategy
    },
    maxHeightChanged: function () {
        this.$.strategy.setMaxHeight(this.maxHeight)
    },
    showingChanged: function () {
        this.showing || (this.cacheScrollPosition(),
            this.setScrollLeft(0),
            this.setScrollTop(0));
        this.inherited(arguments);
        this.showing && this.restoreScrollPosition()
    },
    thumbChanged: function () {
        this.$.strategy.setThumb(this.thumb)
    },
    cacheScrollPosition: function () {
        this.cachedPosition = {
            left: this.getScrollLeft(),
            top: this.getScrollTop()
        }
    },
    restoreScrollPosition: function () {
        this.cachedPosition && (this.setScrollLeft(this.cachedPosition.left),
            this.setScrollTop(this.cachedPosition.top),
            this.cachedPosition = null)
    },
    horizontalChanged: function () {
        this.$.strategy.setHorizontal(this.horizontal)
    },
    verticalChanged: function () {
        this.$.strategy.setVertical(this.vertical)
    },
    setScrollLeft: function (b) {
        this.scrollLeft = b;
        this.$.strategy.setScrollLeft(this.scrollLeft)
    },
    setScrollTop: function (b) {
        this.scrollTop = b;
        this.$.strategy.setScrollTop(b)
    },
    getScrollLeft: function () {
        return this.$.strategy.getScrollLeft()
    },
    getScrollTop: function () {
        return this.$.strategy.getScrollTop()
    },
    getScrollBounds: function () {
        return this.$.strategy.getScrollBounds()
    },
    scrollIntoView: function (b, d) {
        this.$.strategy.scrollIntoView(b, d)
    },
    scrollTo: function (b, d) {
        this.$.strategy.scrollTo(b, d)
    },
    scrollToControl: function (b, d) {
        this.scrollToNode(b.hasNode(), d)
    },
    scrollToNode: function (b, d) {
        this.$.strategy.scrollToNode(b, d)
    },
    domScroll: function (b, d) {
        return this.$.strategy.domScroll && d.originator == this && this.$.strategy.scroll(b, d),
            this.doScroll(d),
            !0
    },
    shouldStopScrollEvent: function (b) {
        return this.preventScrollPropagation && b.originator.owner != this.$.strategy
    },
    scrollStart: function (b, d) {
        return this.shouldStopScrollEvent(d)
    },
    scroll: function (b, d) {
        return d.dispatchTarget ? this.preventScrollPropagation && d.originator != this && d.originator.owner != this.$.strategy : this.shouldStopScrollEvent(d)
    },
    scrollStop: function (b, d) {
        return this.shouldStopScrollEvent(d)
    },
    scrollToTop: function () {
        this.setScrollTop(0)
    },
    scrollToBottom: function () {
        this.setScrollTop(this.getScrollBounds().maxTop)
    },
    scrollToRight: function () {
        this.setScrollTop(this.getScrollBounds().maxLeft)
    },
    scrollToLeft: function () {
        this.setScrollLeft(0)
    },
    stabilize: function () {
        var b = this.getStrategy();
        b.stabilize && b.stabilize()
    }
});
enyo.Scroller.hasTouchScrolling() && (enyo.Scroller.prototype.strategyKind = enyo.Scroller.getTouchStrategy());
enyo.kind({
    name: "enyo.Animator",
    kind: "Component",
    published: {
        duration: 350,
        startValue: 0,
        endValue: 1,
        node: null,
        easingFunction: enyo.easing.cubicOut
    },
    events: {
        onStep: "",
        onEnd: "",
        onStop: ""
    },
    constructed: function () {
        this.inherited(arguments);
        this._next = enyo.bind(this, "next")
    },
    destroy: function () {
        this.stop();
        this.inherited(arguments)
    },
    play: function (b) {
        return this.stop(),
            this.reversed = !1,
            b && enyo.mixin(this, b),
            this.t0 = this.t1 = enyo.now(),
            this.value = this.startValue,
            this.job = !0,
            this.next(),
            this
    },
    stop: function () {
        if (this.isAnimating())
            return this.cancel(),
                this.fire("onStop"),
                this
    },
    reverse: function () {
        if (this.isAnimating()) {
            this.reversed = !this.reversed;
            var b = this.t1 = enyo.now();
            this.t0 = b + (b - this.t0) - this.duration;
            b = this.startValue;
            return this.startValue = this.endValue,
                this.endValue = b,
                this
        }
    },
    isAnimating: function () {
        return Boolean(this.job)
    },
    requestNext: function () {
        this.job = enyo.requestAnimationFrame(this._next, this.node)
    },
    cancel: function () {
        enyo.cancelRequestAnimationFrame(this.job);
        this.node = null;
        this.job = null
    },
    shouldEnd: function () {
        return this.dt >= this.duration
    },
    next: function () {
        this.t1 = enyo.now();
        this.dt = this.t1 - this.t0;
        var b = this.fraction = enyo.easedLerp(this.t0, this.duration, this.easingFunction, this.reversed);
        this.value = this.startValue + b * (this.endValue - this.startValue);
        b >= 1 || this.shouldEnd() ? (this.value = this.endValue,
            this.fraction = 1,
            this.fire("onStep"),
            this.fire("onEnd"),
            this.cancel()) : (this.fire("onStep"),
                this.requestNext())
    },
    fire: function (b) {
        var d = this[b];
        enyo.isString(d) ? this.bubble(b) : d && d.call(this.context || window, this)
    }
});
enyo.kind({
    name: "enyo.BaseLayout",
    kind: enyo.Layout,
    layoutClass: "enyo-positioned",
    reflow: function () {
        enyo.forEach(this.container.children, function (b) {
            b.fit !== null && b.addRemoveClass("enyo-fit", b.fit)
        }, this)
    }
});
enyo.kind({
    name: "enyo.Image",
    noEvents: !1,
    tag: "img",
    attributes: {
        draggable: "false"
    },
    create: function () {
        this.noEvents && (delete this.attributes.onload,
            delete this.attributes.onerror);
        this.inherited(arguments)
    },
    rendered: function () {
        this.inherited(arguments);
        enyo.makeBubble(this, "load", "error")
    }
});
enyo.kind({
    name: "enyo.Input",
    published: {
        value: "",
        placeholder: "",
        type: "",
        disabled: !1,
        selectOnFocus: !1
    },
    events: {
        onDisabledChange: ""
    },
    defaultFocus: !1,
    tag: "input",
    classes: "enyo-input",
    handlers: {
        onfocus: "focused",
        oninput: "input",
        onclear: "clear",
        ondragstart: "dragstart"
    },
    create: function () {
        enyo.platform.ie && (this.handlers.onkeyup = "iekeyup");
        this.inherited(arguments);
        this.placeholderChanged();
        this.type && this.typeChanged();
        this.valueChanged()
    },
    rendered: function () {
        this.inherited(arguments);
        enyo.makeBubble(this, "focus", "blur");
        this.disabledChanged();
        this.defaultFocus && this.focus()
    },
    typeChanged: function () {
        this.setAttribute("type", this.type)
    },
    placeholderChanged: function () {
        this.setAttribute("placeholder", this.placeholder)
    },
    disabledChanged: function () {
        this.setAttribute("disabled", this.disabled);
        this.bubble("onDisabledChange")
    },
    getValue: function () {
        return this.getNodeProperty("value", this.value)
    },
    valueChanged: function () {
        this.setAttribute("value", this.value);
        this.setNodeProperty("value", this.value)
    },
    iekeyup: function (b, d) {
        var e = enyo.platform.ie
            , f = d.keyCode;
        (e <= 8 || e == 9 && (f == 8 || f == 46)) && this.bubble("oninput", d)
    },
    clear: function () {
        this.setValue("")
    },
    focus: function () {
        this.hasNode() && this.node.focus()
    },
    dragstart: function () {
        return !0
    },
    focused: function () {
        this.selectOnFocus && enyo.asyncMethod(this, "selectContents")
    },
    selectContents: function () {
        var b = this.hasNode();
        b && b.setSelectionRange ? b.setSelectionRange(0, b.value.length) : b && b.createTextRange && (b = b.createTextRange(),
            b.expand("textedit"),
            b.select())
    }
});
enyo.kind({
    name: "enyo.RichText",
    classes: "enyo-richtext enyo-selectable",
    published: {
        allowHtml: !0,
        disabled: !1,
        value: ""
    },
    defaultFocus: !1,
    statics: {
        osInfo: [{
            os: "android",
            version: 3
        }, {
            os: "ios",
            version: 5
        }],
        hasContentEditable: function () {
            for (var b = 0, d; d = enyo.RichText.osInfo[b]; b++)
                if (enyo.platform[d.os] < d.version)
                    return !1;
            return !0
        }
    },
    kind: enyo.Input,
    attributes: {
        contenteditable: !0
    },
    handlers: {
        onfocus: "focusHandler",
        onblur: "blurHandler"
    },
    create: function () {
        this.setTag(enyo.RichText.hasContentEditable() ? "div" : "textarea");
        this.inherited(arguments)
    },
    focusHandler: function () {
        this._value = this.getValue()
    },
    blurHandler: function () {
        this._value !== this.getValue() && this.bubble("onchange")
    },
    valueChanged: function () {
        this.hasFocus() ? (this.selectAll(),
            this.insertAtCursor(this.value)) : this.setPropertyValue("content", this.value, "contentChanged")
    },
    getValue: function () {
        if (this.hasNode())
            return this.node.innerHTML
    },
    hasFocus: function () {
        if (this.hasNode())
            return document.activeElement === this.node
    },
    getSelection: function () {
        if (this.hasFocus())
            return window.getSelection()
    },
    removeSelection: function (b) {
        var d = this.getSelection();
        d && d[b ? "collapseToStart" : "collapseToEnd"]()
    },
    modifySelection: function (b, d, e) {
        var f = this.getSelection();
        f && f.modify(b || "move", d, e)
    },
    moveCursor: function (b, d) {
        this.modifySelection("move", b, d)
    },
    moveCursorToEnd: function () {
        this.moveCursor("forward", "documentboundary")
    },
    moveCursorToStart: function () {
        this.moveCursor("backward", "documentboundary")
    },
    selectAll: function () {
        this.hasFocus() && document.execCommand("selectAll")
    },
    insertAtCursor: function (b) {
        this.hasFocus() && (b = this.allowHtml ? b : enyo.Control.escapeHtml(b).replace(/\n/g, "<br/>"),
            document.execCommand("insertHTML", !1, b))
    }
});
enyo.kind({
    name: "enyo.TextArea",
    kind: enyo.Input,
    tag: "textarea",
    classes: "enyo-textarea",
    rendered: function () {
        this.inherited(arguments);
        this.valueChanged()
    }
});
enyo.kind({
    name: "enyo.Select",
    published: {
        selected: 0
    },
    handlers: {
        onchange: "change"
    },
    tag: "select",
    defaultKind: "enyo.Option",
    rendered: function () {
        this.inherited(arguments);
        this.selectedChanged()
    },
    getSelected: function () {
        return Number(this.getNodeProperty("selectedIndex", this.selected))
    },
    setSelected: function (b) {
        this.setPropertyValue("selected", Number(b), "selectedChanged")
    },
    selectedChanged: function () {
        this.setNodeProperty("selectedIndex", this.selected)
    },
    change: function () {
        this.selected = this.getSelected()
    },
    render: function () {
        enyo.platform.ie ? this.parent.render() : this.inherited(arguments)
    },
    getValue: function () {
        if (this.hasNode())
            return this.node.value
    }
});
enyo.kind({
    name: "enyo.Option",
    published: {
        value: ""
    },
    tag: "option",
    create: function () {
        this.inherited(arguments);
        this.valueChanged()
    },
    valueChanged: function () {
        this.setAttribute("value", this.value)
    }
});
enyo.kind({
    name: "enyo.OptionGroup",
    published: {
        label: ""
    },
    tag: "optgroup",
    defaultKind: "enyo.Option",
    create: function () {
        this.inherited(arguments);
        this.labelChanged()
    },
    labelChanged: function () {
        this.setAttribute("label", this.label)
    }
});
enyo.kind({
    name: "enyo.Group",
    published: {
        highlander: !0,
        active: null
    },
    handlers: {
        onActivate: "activate"
    },
    activate: function (b, d) {
        this.highlander && (d.originator.active ? this.setActive(d.originator) : d.originator == this.active && this.active.setActive(!0))
    },
    activeChanged: function (b) {
        b && (b.setActive(!1),
            b.removeClass("active"));
        this.active && this.active.addClass("active")
    }
});
enyo.kind({
    name: "enyo.GroupItem",
    published: {
        active: !1
    },
    rendered: function () {
        this.inherited(arguments);
        this.activeChanged()
    },
    activeChanged: function () {
        this.bubble("onActivate")
    }
});
enyo.kind({
    name: "enyo.ToolDecorator",
    kind: enyo.GroupItem,
    classes: "enyo-tool-decorator"
});
enyo.kind({
    name: "enyo.Button",
    kind: enyo.ToolDecorator,
    tag: "button",
    published: {
        disabled: !1
    },
    create: function () {
        this.inherited(arguments);
        this.disabledChanged()
    },
    disabledChanged: function () {
        this.setAttribute("disabled", this.disabled)
    },
    tap: function () {
        if (this.disabled)
            return !0;
        this.setActive(!0)
    }
});
enyo.kind({
    name: "enyo.Checkbox",
    kind: enyo.Input,
    classes: "enyo-checkbox",
    events: {
        onActivate: ""
    },
    published: {
        checked: !1,
        active: !1,
        type: "checkbox"
    },
    kindClasses: "",
    handlers: {
        onchange: "change",
        onclick: "click"
    },
    create: function () {
        this.inherited(arguments)
    },
    rendered: function () {
        this.inherited(arguments);
        this.active && this.activeChanged();
        this.checkedChanged()
    },
    getChecked: function () {
        return Boolean(this.getNodeProperty("checked", this.checked))
    },
    checkedChanged: function () {
        this.setNodeProperty("checked", this.checked);
        this.setAttribute("checked", this.checked ? "checked" : "");
        this.setActive(this.checked)
    },
    activeChanged: function () {
        this.active = Boolean(this.active);
        this.setChecked(this.active);
        this.bubble("onActivate")
    },
    setValue: function (b) {
        this.setChecked(Boolean(b))
    },
    getValue: function () {
        return this.getChecked()
    },
    valueChanged: function () { },
    change: function () {
        this.setActive(this.getChecked())
    },
    click: function (b, d) {
        enyo.platform.ie <= 8 && this.bubble("onchange", d)
    }
});
enyo.kind({
    name: "enyo.Repeater",
    published: {
        count: 0
    },
    events: {
        onSetupItem: ""
    },
    create: function () {
        this.inherited(arguments);
        this.countChanged()
    },
    initComponents: function () {
        this.itemComponents = this.components || this.kindComponents;
        this.components = this.kindComponents = null;
        this.inherited(arguments)
    },
    setCount: function (b) {
        this.setPropertyValue("count", b, "countChanged")
    },
    countChanged: function () {
        this.build()
    },
    itemAtIndex: function (b) {
        return this.controlAtIndex(b)
    },
    build: function () {
        this.destroyClientControls();
        for (var b = 0, d; b < this.count; b++)
            d = this.createComponent({
                kind: "enyo.OwnerProxy",
                index: b
            }),
                d.createComponents(this.itemComponents),
                this.doSetupItem({
                    index: b,
                    item: d
                });
        this.render()
    },
    renderRow: function (b) {
        var d = this.itemAtIndex(b);
        this.doSetupItem({
            index: b,
            item: d
        })
    }
});
enyo.kind({
    name: "enyo.OwnerProxy",
    tag: null,
    decorateEvent: function (b, d, e) {
        d && (d.index = this.index);
        this.inherited(arguments)
    },
    delegateEvent: function (b, d, e, f, g) {
        return b == this && (b = this.owner.owner),
            this.inherited(arguments, [b, d, e, f, g])
    }
});
enyo.kind({
    name: "enyo._DragAvatar",
    style: "position: absolute; z-index: 10; pointer-events: none; cursor: move;",
    showing: !1,
    showingChanged: function () {
        this.inherited(arguments);
        document.body.style.cursor = this.showing ? "move" : null
    }
});
enyo.kind({
    name: "enyo.DragAvatar",
    kind: enyo.Component,
    published: {
        showing: !1,
        offsetX: 20,
        offsetY: 30
    },
    initComponents: function () {
        this.avatarComponents = this.components;
        this.components = null;
        this.inherited(arguments)
    },
    requireAvatar: function () {
        this.avatar || (this.avatar = this.createComponent({
            kind: enyo._DragAvatar,
            parentNode: document.body,
            showing: !1,
            components: this.avatarComponents
        }).render())
    },
    showingChanged: function () {
        this.avatar.setShowing(this.showing);
        document.body.style.cursor = this.showing ? "move" : null
    },
    drag: function (b) {
        this.requireAvatar();
        this.avatar.setBounds({
            top: b.pageY - this.offsetY,
            left: b.pageX + this.offsetX
        });
        this.show()
    },
    show: function () {
        this.setShowing(!0)
    },
    hide: function () {
        this.setShowing(!1)
    }
});
enyo.kind({
    name: "enyo.FloatingLayer",
    create: function () {
        this.inherited(arguments);
        this.setParent(null)
    },
    render: function () {
        return this.parentNode = document.body,
            this.inherited(arguments)
    },
    generateInnerHtml: function () {
        return ""
    },
    beforeChildRender: function () {
        this.hasNode() || this.render()
    },
    teardownChildren: function () { }
});
enyo.floatingLayer = new enyo.FloatingLayer;
enyo.kind({
    name: "enyo.Popup",
    classes: "enyo-popup",
    published: {
        modal: !1,
        autoDismiss: !0,
        floating: !1,
        centered: !1
    },
    showing: !1,
    handlers: {
        ondown: "down",
        onkeydown: "keydown",
        ondragstart: "dragstart",
        onfocus: "focus",
        onblur: "blur",
        onRequestShow: "requestShow",
        onRequestHide: "requestHide"
    },
    captureEvents: !0,
    events: {
        onShow: "",
        onHide: ""
    },
    tools: [{
        kind: "Signals",
        onKeydown: "keydown"
    }],
    create: function () {
        this.inherited(arguments);
        this.canGenerate = !this.floating
    },
    render: function () {
        this.floating && (enyo.floatingLayer.hasNode() || enyo.floatingLayer.render(),
            this.parentNode = enyo.floatingLayer.hasNode());
        this.inherited(arguments)
    },
    destroy: function () {
        this.showing && this.release();
        this.inherited(arguments)
    },
    reflow: function () {
        this.updatePosition();
        this.inherited(arguments)
    },
    calcViewportSize: function () {
        if (window.innerWidth)
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        var b = document.documentElement;
        return {
            width: b.offsetWidth,
            height: b.offsetHeight
        }
    },
    updatePosition: function () {
        var b = this.calcViewportSize()
            , d = this.getBounds();
        if (this.targetPosition) {
            var e = this.targetPosition;
            typeof e.left == "number" ? e.left + d.width > b.width ? (e.left - d.width >= 0 ? e.right = b.width - e.left : e.right = 0,
                e.left = null) : e.right = null : typeof e.right == "number" && (e.right + d.width > b.width ? (e.right - d.width >= 0 ? e.left = b.width - e.right : e.left = 0,
                    e.right = null) : e.left = null);
            typeof e.top == "number" ? e.top + d.height > b.height ? (e.top - d.height >= 0 ? e.bottom = b.height - e.top : e.bottom = 0,
                e.top = null) : e.bottom = null : typeof e.bottom == "number" && (e.bottom + d.height > b.height ? (e.bottom - d.height >= 0 ? e.top = b.height - e.bottom : e.top = 0,
                    e.bottom = null) : e.top = null);
            this.addStyles("left: " + (e.left !== null ? e.left + "px" : "initial") + "; right: " + (e.right !== null ? e.right + "px" : "initial") + "; top: " + (e.top !== null ? e.top + "px" : "initial") + "; bottom: " + (e.bottom !== null ? e.bottom + "px" : "initial") + ";")
        } else
            this.centered && this.addStyles("top: " + Math.max((b.height - d.height) / 2, 0) + "px; left: " + Math.max((b.width - d.width) / 2, 0) + "px;")
    },
    showingChanged: function () {
        this.floating && this.showing && !this.hasNode() && this.render();
        if (this.centered || this.targetPosition)
            this.applyStyle("visibility", "hidden"),
                this.addStyles("top: 0px; left: 0px; right: initial; bottom: initial;");
        this.inherited(arguments);
        this.showing ? (this.resized(),
            this.captureEvents && this.capture()) : this.captureEvents && this.release();
        (this.centered || this.targetPosition) && this.applyStyle("visibility", null);
        this.hasNode() && this[this.showing ? "doShow" : "doHide"]()
    },
    capture: function () {
        enyo.dispatcher.capture(this, !this.modal)
    },
    release: function () {
        enyo.dispatcher.release()
    },
    down: function (b, d) {
        this.downEvent = d;
        this.modal && !d.dispatchTarget.isDescendantOf(this) && d.preventDefault()
    },
    tap: function (b, d) {
        if (this.autoDismiss && !d.dispatchTarget.isDescendantOf(this) && this.downEvent && !this.downEvent.dispatchTarget.isDescendantOf(this))
            return this.downEvent = null,
                this.hide(),
                !0
    },
    dragstart: function (b, d) {
        var e = d.dispatchTarget === this || d.dispatchTarget.isDescendantOf(this);
        return b.autoDismiss && !e && b.setShowing(!1),
            !0
    },
    keydown: function (b, d) {
        this.showing && this.autoDismiss && d.keyCode == 27 && this.hide()
    },
    blur: function (b, d) {
        d.dispatchTarget.isDescendantOf(this) && (this.lastFocus = d.originator)
    },
    focus: function (b, d) {
        var e = d.dispatchTarget;
        this.modal && !e.isDescendantOf(this) && (e.hasNode() && e.node.blur(),
            (e = this.lastFocus && this.lastFocus.hasNode() || this.hasNode()) && e.focus())
    },
    requestShow: function () {
        return this.show(),
            !0
    },
    requestHide: function () {
        return this.hide(),
            !0
    },
    showAtEvent: function (b, d) {
        var e = {
            left: b.centerX || b.clientX || b.pageX,
            top: b.centerY || b.clientY || b.pageY
        };
        d && (e.left += d.left || 0,
            e.top += d.top || 0);
        this.showAtPosition(e)
    },
    showAtPosition: function (b) {
        this.targetPosition = b;
        this.show()
    }
});
enyo.kind({
    name: "enyo.Selection",
    kind: enyo.Component,
    published: {
        multi: !1
    },
    events: {
        onSelect: "",
        onDeselect: "",
        onChange: ""
    },
    create: function () {
        this.clear();
        this.inherited(arguments)
    },
    multiChanged: function () {
        this.multi || this.clear();
        this.doChange()
    },
    highlander: function () {
        this.multi || this.deselect(this.lastSelected)
    },
    clear: function () {
        this.selected = {}
    },
    isSelected: function (b) {
        return this.selected[b]
    },
    setByKey: function (b, d, e) {
        d ? (this.selected[b] = e || !0,
            this.lastSelected = b,
            this.doSelect({
                key: b,
                data: this.selected[b]
            })) : (d = this.isSelected(b),
                delete this.selected[b],
                this.doDeselect({
                    key: b,
                    data: d
                }));
        this.doChange()
    },
    deselect: function (b) {
        this.isSelected(b) && this.setByKey(b, !1)
    },
    select: function (b, d) {
        this.multi ? this.setByKey(b, !this.isSelected(b), d) : this.isSelected(b) || (this.highlander(),
            this.setByKey(b, !0, d))
    },
    toggle: function (b, d) {
        !this.multi && this.lastSelected != b && this.deselect(this.lastSelected);
        this.setByKey(b, !this.isSelected(b), d)
    },
    getSelected: function () {
        return this.selected
    },
    remove: function (b) {
        var d = {}, e;
        for (e in this.selected)
            e < b ? d[e] = this.selected[e] : e > b && (d[e - 1] = this.selected[e]);
        this.selected = d
    }
});
enyo.path.addPaths({
    layout: "/Volumes/MEDDY/project/_BNIS/zaisan.client.web/enyo/tools/../../lib/layout/",
    onyx: "/Volumes/MEDDY/project/_BNIS/zaisan.client.web/enyo/tools/../../lib/onyx/",
    onyx: "/Volumes/MEDDY/project/_BNIS/zaisan.client.web/enyo/tools/../../lib/onyx/source/"
});
enyo.kind({
    name: "enyo.FittableLayout",
    kind: "Layout",
    calcFitIndex: function () {
        for (var b = 0, d = this.container.children, e; e = d[b]; b++)
            if (e.fit && e.showing)
                return b
    },
    getFitControl: function () {
        var b = this.container.children
            , d = b[this.fitIndex];
        return d && d.fit && d.showing || (this.fitIndex = this.calcFitIndex(),
            d = b[this.fitIndex]),
            d
    },
    getLastControl: function () {
        for (var b = this.container.children, d = b.length - 1, e = b[d]; (e = b[d]) && !e.showing;)
            d--;
        return e
    },
    _reflow: function (b, d, e, f) {
        this.container.addRemoveClass("enyo-stretch", !this.container.noStretch);
        var g = this.getFitControl();
        if (g) {
            var i = 0, j = 0, k = 0, l;
            (j = this.container.hasNode()) && (l = enyo.dom.calcPaddingExtents(j),
                i = j[d] - (l[e] + l[f]));
            d = g.getBounds();
            j = d[e] - (l && l[e] || 0);
            if (l = this.getLastControl())
                f = enyo.dom.getComputedBoxValue(l.hasNode(), "margin", f) || 0,
                    l != g ? (k = l.getBounds(),
                        k = k[e] + k[b] + f - (d[e] + d[b])) : k = f;
            g.applyStyle(b, i - (j + k) + "px")
        }
    },
    reflow: function () {
        this.orient == "h" ? this._reflow("width", "clientWidth", "left", "right") : this._reflow("height", "clientHeight", "top", "bottom")
    }
});
enyo.kind({
    name: "enyo.FittableColumnsLayout",
    kind: "FittableLayout",
    orient: "h",
    layoutClass: "enyo-fittable-columns-layout"
});
enyo.kind({
    name: "enyo.FittableRowsLayout",
    kind: "FittableLayout",
    layoutClass: "enyo-fittable-rows-layout",
    orient: "v"
});
enyo.kind({
    name: "enyo.FittableRows",
    layoutKind: "FittableRowsLayout",
    noStretch: !1
});
enyo.kind({
    name: "enyo.FittableColumns",
    layoutKind: "FittableColumnsLayout",
    noStretch: !1
});
enyo.kind({
    name: "enyo.FlyweightRepeater",
    published: {
        count: 0,
        noSelect: !1,
        multiSelect: !1,
        toggleSelected: !1,
        clientClasses: "",
        clientStyle: ""
    },
    events: {
        onSetupItem: ""
    },
    bottomUp: !1,
    components: [{
        kind: "Selection",
        onSelect: "selectDeselect",
        onDeselect: "selectDeselect"
    }, {
        name: "client"
    }],
    rowOffset: 0,
    create: function () {
        this.inherited(arguments);
        this.noSelectChanged();
        this.multiSelectChanged();
        this.clientClassesChanged();
        this.clientStyleChanged()
    },
    noSelectChanged: function () {
        this.noSelect && this.$.selection.clear()
    },
    multiSelectChanged: function () {
        this.$.selection.setMulti(this.multiSelect)
    },
    clientClassesChanged: function () {
        this.$.client.setClasses(this.clientClasses)
    },
    clientStyleChanged: function () {
        this.$.client.setStyle(this.clientStyle)
    },
    setupItem: function (b) {
        this.doSetupItem({
            index: b,
            selected: this.isSelected(b)
        })
    },
    generateChildHtml: function () {
        var b = "";
        this.index = null;
        for (var d = 0, e = 0; d < this.count; d++)
            e = this.rowOffset + (this.bottomUp ? this.count - d - 1 : d),
                this.setupItem(e),
                this.$.client.setAttribute("data-enyo-index", e),
                b += this.inherited(arguments),
                this.$.client.teardownRender();
        return b
    },
    previewDomEvent: function (b) {
        var d = this.index = this.rowForEvent(b);
        b.rowIndex = b.index = d;
        b.flyweight = this
    },
    decorateEvent: function (b, d, e) {
        var f = d && d.index != null ? d.index : this.index;
        d && f != null && (d.index = f,
            d.flyweight = this);
        this.inherited(arguments)
    },
    tap: function (b, d) {
        this.noSelect || (this.toggleSelected ? this.$.selection.toggle(d.index) : this.$.selection.select(d.index))
    },
    selectDeselect: function (b, d) {
        this.renderRow(d.key)
    },
    getSelection: function () {
        return this.$.selection
    },
    isSelected: function (b) {
        return this.getSelection().isSelected(b)
    },
    renderRow: function (b) {
        var d = this.fetchRowNode(b);
        d && (this.setupItem(b),
            d.innerHTML = this.$.client.generateChildHtml(),
            this.$.client.teardownChildren())
    },
    fetchRowNode: function (b) {
        if (this.hasNode())
            return (b = this.node.querySelectorAll('[data-enyo-index="' + b + '"]')) && b[0]
    },
    rowForEvent: function (b) {
        for (var b = b.target, d = this.hasNode().id; b && b.parentNode && b.id != d;) {
            var e = b.getAttribute && b.getAttribute("data-enyo-index");
            if (e !== null)
                return Number(e);
            b = b.parentNode
        }
        return -1
    },
    prepareRow: function (b) {
        b = this.fetchRowNode(b);
        enyo.FlyweightRepeater.claimNode(this.$.client, b)
    },
    lockRow: function () {
        this.$.client.teardownChildren()
    },
    performOnRow: function (b, d, e) {
        d && (this.prepareRow(b),
            enyo.call(e || null, d),
            this.lockRow())
    },
    statics: {
        claimNode: function (b, d) {
            var e = d && d.querySelectorAll("#" + b.id);
            e = e && e[0];
            b.generated = Boolean(e || !b.tag);
            b.node = e;
            b.node && b.rendered();
            for (var e = 0, f = b.children, g; g = f[e]; e++)
                this.claimNode(g, d)
        }
    }
});
enyo.kind({
    name: "enyo.List",
    kind: "Scroller",
    classes: "enyo-list",
    published: {
        count: 0,
        rowsPerPage: 50,
        bottomUp: !1,
        noSelect: !1,
        multiSelect: !1,
        toggleSelected: !1,
        fixedHeight: !1
    },
    events: {
        onSetupItem: ""
    },
    handlers: {
        onAnimateFinish: "animateFinish"
    },
    rowHeight: 0,
    listTools: [{
        name: "port",
        classes: "enyo-list-port enyo-border-box",
        components: [{
            name: "generator",
            kind: "FlyweightRepeater",
            canGenerate: !1,
            components: [{
                tag: null,
                name: "client"
            }]
        }, {
            name: "page0",
            allowHtml: !0,
            classes: "enyo-list-page"
        }, {
            name: "page1",
            allowHtml: !0,
            classes: "enyo-list-page"
        }]
    }],
    create: function () {
        this.pageHeights = [];
        this.inherited(arguments);
        this.getStrategy().translateOptimized = !0;
        this.bottomUpChanged();
        this.noSelectChanged();
        this.multiSelectChanged();
        this.toggleSelectedChanged()
    },
    createStrategy: function () {
        this.controlParentName = "strategy";
        this.inherited(arguments);
        this.createChrome(this.listTools);
        this.controlParentName = "client";
        this.discoverControlParent()
    },
    rendered: function () {
        this.inherited(arguments);
        this.$.generator.node = this.$.port.hasNode();
        this.$.generator.generated = !0;
        this.reset()
    },
    resizeHandler: function () {
        this.inherited(arguments);
        this.refresh()
    },
    bottomUpChanged: function () {
        this.$.generator.bottomUp = this.bottomUp;
        this.$.page0.applyStyle(this.pageBound, null);
        this.$.page1.applyStyle(this.pageBound, null);
        this.pageBound = this.bottomUp ? "bottom" : "top";
        this.hasNode() && this.reset()
    },
    noSelectChanged: function () {
        this.$.generator.setNoSelect(this.noSelect)
    },
    multiSelectChanged: function () {
        this.$.generator.setMultiSelect(this.multiSelect)
    },
    toggleSelectedChanged: function () {
        this.$.generator.setToggleSelected(this.toggleSelected)
    },
    countChanged: function () {
        this.hasNode() && this.updateMetrics()
    },
    updateMetrics: function () {
        this.defaultPageHeight = this.rowsPerPage * (this.rowHeight || 100);
        this.pageCount = Math.ceil(this.count / this.rowsPerPage);
        this.portSize = 0;
        for (var b = 0; b < this.pageCount; b++)
            this.portSize += this.getPageHeight(b);
        this.adjustPortSize()
    },
    generatePage: function (b, d) {
        this.page = b;
        var e = this.$.generator.rowOffset = this.rowsPerPage * this.page
            , e = this.$.generator.count = Math.min(this.count - e, this.rowsPerPage)
            , f = this.$.generator.generateChildHtml();
        d.setContent(f);
        f = d.getBounds().height;
        !this.rowHeight && f > 0 && (this.rowHeight = Math.floor(f / e),
            this.updateMetrics());
        this.fixedHeight || (e = this.getPageHeight(b),
            e != f && f > 0 && (this.pageHeights[b] = f,
                this.portSize += f - e))
    },
    update: function (b) {
        var d = !1
            , b = this.positionToPageInfo(b)
            , b = Math.floor((b.pos + this.scrollerHeight / 2) / Math.max(b.height, this.scrollerHeight) + 0.5) + b.no
            , e = b % 2 === 0 ? b : b - 1;
        this.p0 != e && this.isPageInRange(e) && (this.generatePage(e, this.$.page0),
            this.positionPage(e, this.$.page0),
            this.p0 = e,
            d = !0);
        e = b % 2 === 0 ? Math.max(1, b - 1) : b;
        this.p1 != e && this.isPageInRange(e) && (this.generatePage(e, this.$.page1),
            this.positionPage(e, this.$.page1),
            this.p1 = e,
            d = !0);
        d && !this.fixedHeight && (this.adjustBottomPage(),
            this.adjustPortSize())
    },
    updateForPosition: function (b) {
        this.update(this.calcPos(b))
    },
    calcPos: function (b) {
        return this.bottomUp ? this.portSize - this.scrollerHeight - b : b
    },
    adjustBottomPage: function () {
        var b = this.p0 >= this.p1 ? this.$.page0 : this.$.page1;
        this.positionPage(b.pageNo, b)
    },
    adjustPortSize: function () {
        this.scrollerHeight = this.getBounds().height;
        this.$.port.applyStyle("height", Math.max(this.scrollerHeight, this.portSize) + "px")
    },
    positionPage: function (b, d) {
        d.pageNo = b;
        var e = this.pageToPosition(b);
        d.applyStyle(this.pageBound, e + "px")
    },
    pageToPosition: function (b) {
        for (var d = 0; b > 0;)
            b--,
                d += this.getPageHeight(b);
        return d
    },
    positionToPageInfo: function (b) {
        for (var d = -1, b = this.calcPos(b), e = this.defaultPageHeight; b >= 0;)
            d++,
                e = this.getPageHeight(d),
                b -= e;
        return {
            no: d,
            height: e,
            pos: b + e
        }
    },
    isPageInRange: function (b) {
        return b == Math.max(0, Math.min(this.pageCount - 1, b))
    },
    getPageHeight: function (b) {
        return this.pageHeights[b] || this.defaultPageHeight
    },
    invalidatePages: function () {
        this.p0 = this.p1 = null;
        this.$.page0.setContent("");
        this.$.page1.setContent("")
    },
    invalidateMetrics: function () {
        this.pageHeights = [];
        this.rowHeight = 0;
        this.updateMetrics()
    },
    scroll: function (b, d) {
        var e = this.inherited(arguments);
        return this.update(this.getScrollTop()),
            e
    },
    scrollToBottom: function () {
        this.update(this.getScrollBounds().maxTop);
        this.inherited(arguments)
    },
    setScrollTop: function (b) {
        this.update(b);
        this.inherited(arguments);
        this.twiddle()
    },
    getScrollPosition: function () {
        return this.calcPos(this.getScrollTop())
    },
    setScrollPosition: function (b) {
        this.setScrollTop(this.calcPos(b))
    },
    scrollToRow: function (b) {
        var d = Math.floor(b / this.rowsPerPage)
            , e = this.pageToPosition(d);
        this.updateForPosition(e);
        e = this.pageToPosition(d);
        this.setScrollPosition(e);
        if (d == this.p0 || d == this.p1)
            if (b = this.$.generator.fetchRowNode(b))
                e = b.offsetTop,
                    this.bottomUp && (e = this.getPageHeight(d) - b.offsetHeight - e),
                    this.setScrollPosition(this.getScrollPosition() + e)
    },
    scrollToStart: function () {
        this[this.bottomUp ? "scrollToBottom" : "scrollToTop"]()
    },
    scrollToEnd: function () {
        this[this.bottomUp ? "scrollToTop" : "scrollToBottom"]()
    },
    refresh: function () {
        this.invalidatePages();
        this.update(this.getScrollTop());
        this.stabilize();
        enyo.platform.android === 4 && this.twiddle()
    },
    reset: function () {
        this.getSelection().clear();
        this.invalidateMetrics();
        this.invalidatePages();
        this.stabilize();
        this.scrollToStart()
    },
    getSelection: function () {
        return this.$.generator.getSelection()
    },
    select: function (b, d) {
        return this.getSelection().select(b, d)
    },
    deselect: function (b) {
        return this.getSelection().deselect(b)
    },
    isSelected: function (b) {
        return this.$.generator.isSelected(b)
    },
    renderRow: function (b) {
        this.$.generator.renderRow(b)
    },
    prepareRow: function (b) {
        this.$.generator.prepareRow(b)
    },
    lockRow: function () {
        this.$.generator.lockRow()
    },
    performOnRow: function (b, d, e) {
        this.$.generator.performOnRow(b, d, e)
    },
    animateFinish: function () {
        return this.twiddle(),
            !0
    },
    twiddle: function () {
        var b = this.getStrategy();
        enyo.call(b, "twiddle")
    }
});
enyo.kind({
    name: "enyo.PulldownList",
    kind: "List",
    touch: !0,
    pully: null,
    pulldownTools: [{
        name: "pulldown",
        classes: "enyo-list-pulldown",
        components: [{
            name: "puller",
            kind: "Puller"
        }]
    }],
    events: {
        onPullStart: "",
        onPullCancel: "",
        onPull: "",
        onPullRelease: "",
        onPullComplete: ""
    },
    handlers: {
        onScrollStart: "scrollStartHandler",
        onScrollStop: "scrollStopHandler",
        ondragfinish: "dragfinish"
    },
    pullingMessage: "Pull down to refresh...",
    pulledMessage: "Release to refresh...",
    loadingMessage: "Loading...",
    pullingIconClass: "enyo-puller-arrow enyo-puller-arrow-down",
    pulledIconClass: "enyo-puller-arrow enyo-puller-arrow-up",
    loadingIconClass: "",
    create: function () {
        this.listTools.splice(0, 0, {
            kind: "Puller",
            showing: !1,
            text: this.loadingMessage,
            iconClass: this.loadingIconClass,
            onCreate: "setPully"
        });
        this.inherited(arguments);
        this.setPulling()
    },
    initComponents: function () {
        this.createChrome(this.pulldownTools);
        this.accel = enyo.dom.canAccelerate();
        this.translation = this.accel ? "translate3d" : "translate";
        this.inherited(arguments)
    },
    setPully: function (b, d) {
        this.pully = d.originator
    },
    scrollStartHandler: function () {
        this.firedPullStart = !1;
        this.firedPull = !1;
        this.firedPullCancel = !1
    },
    scroll: function (b, d) {
        var e = this.inherited(arguments);
        this.completingPull && this.pully.setShowing(!1);
        var f = this.getStrategy().$.scrollMath
            , g = f.y;
        return f.isInOverScroll() && g > 0 && (enyo.dom.transformValue(this.$.pulldown, this.translation, "0," + g + "px" + (this.accel ? ",0" : "")),
            this.firedPullStart || (this.firedPullStart = !0,
                this.pullStart(),
                this.pullHeight = this.$.pulldown.getBounds().height),
            g > this.pullHeight && !this.firedPull && (this.firedPull = !0,
                this.firedPullCancel = !1,
                this.pull()),
            this.firedPull && !this.firedPullCancel && g < this.pullHeight && (this.firedPullCancel = !0,
                this.firedPull = !1,
                this.pullCancel())),
            e
    },
    scrollStopHandler: function () {
        this.completingPull && (this.completingPull = !1,
            this.doPullComplete())
    },
    dragfinish: function () {
        if (this.firedPull) {
            var b = this.getStrategy().$.scrollMath;
            b.setScrollY(b.y - this.pullHeight);
            this.pullRelease()
        }
    },
    completePull: function () {
        this.completingPull = !0;
        this.$.strategy.$.scrollMath.setScrollY(this.pullHeight);
        this.$.strategy.$.scrollMath.start()
    },
    pullStart: function () {
        this.setPulling();
        this.pully.setShowing(!1);
        this.$.puller.setShowing(!0);
        this.doPullStart()
    },
    pull: function () {
        this.setPulled();
        this.doPull()
    },
    pullCancel: function () {
        this.setPulling();
        this.doPullCancel()
    },
    pullRelease: function () {
        this.$.puller.setShowing(!1);
        this.pully.setShowing(!0);
        this.doPullRelease()
    },
    setPulling: function () {
        this.$.puller.setText(this.pullingMessage);
        this.$.puller.setIconClass(this.pullingIconClass)
    },
    setPulled: function () {
        this.$.puller.setText(this.pulledMessage);
        this.$.puller.setIconClass(this.pulledIconClass)
    }
});
enyo.kind({
    name: "enyo.Puller",
    classes: "enyo-puller",
    published: {
        text: "",
        iconClass: ""
    },
    events: {
        onCreate: ""
    },
    components: [{
        name: "icon"
    }, {
        name: "text",
        tag: "span",
        classes: "enyo-puller-text"
    }],
    create: function () {
        this.inherited(arguments);
        this.doCreate();
        this.textChanged();
        this.iconClassChanged()
    },
    textChanged: function () {
        this.$.text.setContent(this.text)
    },
    iconClassChanged: function () {
        this.$.icon.setClasses(this.iconClass)
    }
});
enyo.kind({
    name: "enyo.AroundList",
    kind: "enyo.List",
    listTools: [{
        name: "port",
        classes: "enyo-list-port enyo-border-box",
        components: [{
            name: "aboveClient"
        }, {
            name: "generator",
            kind: "enyo.FlyweightRepeater",
            canGenerate: !1,
            components: [{
                tag: null,
                name: "client"
            }]
        }, {
            name: "page0",
            allowHtml: !0,
            classes: "enyo-list-page"
        }, {
            name: "page1",
            allowHtml: !0,
            classes: "enyo-list-page"
        }, {
            name: "belowClient"
        }]
    }],
    aboveComponents: null,
    initComponents: function () {
        this.inherited(arguments);
        this.aboveComponents && this.$.aboveClient.createComponents(this.aboveComponents, {
            owner: this.owner
        });
        this.belowComponents && this.$.belowClient.createComponents(this.belowComponents, {
            owner: this.owner
        })
    },
    updateMetrics: function () {
        this.defaultPageHeight = this.rowsPerPage * (this.rowHeight || 100);
        this.pageCount = Math.ceil(this.count / this.rowsPerPage);
        this.aboveHeight = this.$.aboveClient.getBounds().height;
        this.belowHeight = this.$.belowClient.getBounds().height;
        this.portSize = this.aboveHeight + this.belowHeight;
        for (var b = 0; b < this.pageCount; b++)
            this.portSize += this.getPageHeight(b);
        this.adjustPortSize()
    },
    positionPage: function (b, d) {
        d.pageNo = b;
        var e = this.pageToPosition(b);
        e += this.bottomUp ? this.belowHeight : this.aboveHeight;
        d.applyStyle(this.pageBound, e + "px")
    },
    scrollToContentStart: function () {
        this.setScrollPosition(this.bottomUp ? this.belowHeight : this.aboveHeight)
    }
});
enyo.kind({
    name: "enyo.Slideable",
    kind: "Control",
    published: {
        axis: "h",
        value: 0,
        unit: "px",
        min: 0,
        max: 0,
        accelerated: "auto",
        overMoving: !0,
        draggable: !0
    },
    events: {
        onAnimateFinish: "",
        onChange: ""
    },
    preventDragPropagation: !1,
    tools: [{
        kind: "Animator",
        onStep: "animatorStep",
        onEnd: "animatorComplete"
    }],
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish"
    },
    kDragScalar: 1,
    dragEventProp: "dx",
    unitModifier: !1,
    canTransform: !1,
    create: function () {
        this.inherited(arguments);
        this.acceleratedChanged();
        this.transformChanged();
        this.axisChanged();
        this.valueChanged();
        this.addClass("enyo-slideable")
    },
    initComponents: function () {
        this.createComponents(this.tools);
        this.inherited(arguments)
    },
    rendered: function () {
        this.inherited(arguments);
        this.canModifyUnit();
        this.updateDragScalar()
    },
    resizeHandler: function () {
        this.inherited(arguments);
        this.updateDragScalar()
    },
    canModifyUnit: function () {
        if (!this.canTransform)
            this.getInitialStyleValue(this.hasNode(), this.boundary).match(/px/i) && this.unit === "%" && (this.unitModifier = this.getBounds()[this.dimension])
    },
    getInitialStyleValue: function (b, d) {
        var e = enyo.dom.getComputedStyle(b);
        return e ? e.getPropertyValue(d) : b && b.currentStyle ? b.currentStyle[d] : "0"
    },
    updateBounds: function (b, d) {
        var e = {};
        e[this.boundary] = b;
        this.setBounds(e, this.unit);
        this.setInlineStyles(b, d)
    },
    updateDragScalar: function () {
        if (this.unit == "%") {
            var b = this.getBounds()[this.dimension];
            this.kDragScalar = b ? 100 / b : 1;
            this.canTransform || this.updateBounds(this.value, 100)
        }
    },
    transformChanged: function () {
        this.canTransform = enyo.dom.canTransform()
    },
    acceleratedChanged: function () {
        enyo.platform.android > 2 || enyo.dom.accelerate(this, this.accelerated)
    },
    axisChanged: function () {
        var b = this.axis == "h";
        this.dragMoveProp = b ? "dx" : "dy";
        this.shouldDragProp = b ? "horizontal" : "vertical";
        this.transform = b ? "translateX" : "translateY";
        this.dimension = b ? "width" : "height";
        this.boundary = b ? "left" : "top"
    },
    setInlineStyles: function (b, d) {
        var e = {};
        this.unitModifier ? (e[this.boundary] = this.percentToPixels(b, this.unitModifier),
            e[this.dimension] = this.unitModifier,
            this.setBounds(e)) : (d ? e[this.dimension] = d : e[this.boundary] = b,
                this.setBounds(e, this.unit))
    },
    valueChanged: function (b) {
        var d = this.value;
        this.isOob(d) && !this.isAnimating() && (this.value = this.overMoving ? this.dampValue(d) : this.clampValue(d));
        enyo.platform.android > 2 && (this.value ? (b === 0 || b === void 0) && enyo.dom.accelerate(this, this.accelerated) : enyo.dom.accelerate(this, !1));
        this.canTransform ? enyo.dom.transformValue(this, this.transform, this.value + this.unit) : this.setInlineStyles(this.value, !1);
        this.doChange()
    },
    getAnimator: function () {
        return this.$.animator
    },
    isAtMin: function () {
        return this.value <= this.calcMin()
    },
    isAtMax: function () {
        return this.value >= this.calcMax()
    },
    calcMin: function () {
        return this.min
    },
    calcMax: function () {
        return this.max
    },
    clampValue: function (b) {
        var d = this.calcMin()
            , e = this.calcMax();
        return Math.max(d, Math.min(b, e))
    },
    dampValue: function (b) {
        return this.dampBound(this.dampBound(b, this.min, 1), this.max, -1)
    },
    dampBound: function (b, d, e) {
        return b * e < d * e && (b = d + (b - d) / 4),
            b
    },
    percentToPixels: function (b, d) {
        return Math.floor(d / 100 * b)
    },
    pixelsToPercent: function (b) {
        var d = this.unitModifier ? this.getBounds()[this.dimension] : this.container.getBounds()[this.dimension];
        return b / d * 100
    },
    shouldDrag: function (b) {
        return this.draggable && b[this.shouldDragProp]
    },
    isOob: function (b) {
        return b > this.calcMax() || b < this.calcMin()
    },
    dragstart: function (b, d) {
        if (this.shouldDrag(d))
            return d.preventDefault(),
                this.$.animator.stop(),
                d.dragInfo = {},
                this.dragging = !0,
                this.drag0 = this.value,
                this.dragd0 = 0,
                this.preventDragPropagation
    },
    drag: function (b, d) {
        if (this.dragging) {
            d.preventDefault();
            var e = this.canTransform ? d[this.dragMoveProp] * this.kDragScalar : this.pixelsToPercent(d[this.dragMoveProp])
                , f = this.drag0 + e
                , g = e - this.dragd0;
            return this.dragd0 = e,
                g && (d.dragInfo.minimizing = g < 0),
                this.setValue(f),
                this.preventDragPropagation
        }
    },
    dragfinish: function (b, d) {
        if (this.dragging)
            return this.dragging = !1,
                this.completeDrag(d),
                d.preventTap(),
                this.preventDragPropagation
    },
    completeDrag: function (b) {
        this.value !== this.calcMax() && this.value != this.calcMin() && this.animateToMinMax(b.dragInfo.minimizing)
    },
    isAnimating: function () {
        return this.$.animator.isAnimating()
    },
    play: function (b, d) {
        this.$.animator.play({
            startValue: b,
            endValue: d,
            node: this.hasNode()
        })
    },
    animateTo: function (b) {
        this.play(this.value, b)
    },
    animateToMin: function () {
        this.animateTo(this.calcMin())
    },
    animateToMax: function () {
        this.animateTo(this.calcMax())
    },
    animateToMinMax: function (b) {
        b ? this.animateToMin() : this.animateToMax()
    },
    animatorStep: function (b) {
        return this.setValue(b.value),
            !0
    },
    animatorComplete: function (b) {
        return this.doAnimateFinish(b),
            !0
    },
    toggleMinMax: function () {
        this.animateToMinMax(!this.isAtMin())
    }
});
enyo.kind({
    name: "enyo.Arranger",
    kind: "Layout",
    layoutClass: "enyo-arranger",
    accelerated: "auto",
    dragProp: "ddx",
    dragDirectionProp: "xDirection",
    canDragProp: "horizontal",
    incrementalPoints: !1,
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            e._arranger = null;
        this.inherited(arguments)
    },
    arrange: function () { },
    size: function () { },
    start: function () {
        var b = this.container.fromIndex
            , d = this.container.toIndex
            , e = this.container.transitionPoints = [b];
        if (this.incrementalPoints)
            for (var f = Math.abs(d - b) - 2, g = b; f >= 0;)
                g += d < b ? -1 : 1,
                    e.push(g),
                    f--;
        e.push(this.container.toIndex)
    },
    finish: function () { },
    calcArrangementDifference: function () { },
    canDragEvent: function (b) {
        return b[this.canDragProp]
    },
    calcDragDirection: function (b) {
        return b[this.dragDirectionProp]
    },
    calcDrag: function (b) {
        return b[this.dragProp]
    },
    drag: function (b, d, e, f, g) {
        return this.measureArrangementDelta(-b, d, e, f, g)
    },
    measureArrangementDelta: function (b, d, e, f, g) {
        b = (d = this.calcArrangementDifference(d, e, f, g)) ? b / Math.abs(d) : 0;
        return b *= this.container.fromIndex > this.container.toIndex ? -1 : 1,
            b
    },
    _arrange: function (b) {
        this.containerBounds || this.reflow();
        this.arrange(this.getOrderedControls(b), b)
    },
    arrangeControl: function (b, d) {
        b._arranger = enyo.mixin(b._arranger || {}, d)
    },
    flow: function () {
        this.c$ = [].concat(this.container.getPanels());
        this.controlsIndex = 0;
        for (var b = 0, d = this.container.getPanels(), e; e = d[b]; b++)
            if (enyo.dom.accelerate(e, this.accelerated),
                enyo.platform.safari) {
                e = e.children;
                for (var f = 0, g; g = e[f]; f++)
                    enyo.dom.accelerate(g, this.accelerated)
            }
    },
    reflow: function () {
        var b = this.container.hasNode();
        this.containerBounds = b ? {
            width: b.clientWidth,
            height: b.clientHeight
        } : {};
        this.size()
    },
    flowArrangement: function () {
        var b = this.container.arrangement;
        if (b)
            for (var d = 0, e = this.container.getPanels(), f; f = e[d]; d++)
                this.flowControl(f, b[d])
    },
    flowControl: function (b, d) {
        enyo.Arranger.positionControl(b, d);
        var e = d.opacity;
        e != null && enyo.Arranger.opacifyControl(b, e)
    },
    getOrderedControls: function (b) {
        for (var b = Math.floor(b), d = b - this.controlsIndex, e = d > 0, f = this.c$ || [], g = 0; g < Math.abs(d); g++)
            e ? f.push(f.shift()) : f.unshift(f.pop());
        return this.controlsIndex = b,
            f
    },
    statics: {
        positionControl: function (b, d, e) {
            var f = e || "px";
            if (!this.updating)
                enyo.dom.canTransform() && !enyo.platform.android ? (e = d.left,
                    d = d.top,
                    e = enyo.isString(e) ? e : e && e + f,
                    d = enyo.isString(d) ? d : d && d + f,
                    enyo.dom.transform(b, {
                        translateX: e || null,
                        translateY: d || null
                    })) : b.setBounds(d, e)
        },
        opacifyControl: function (b, d) {
            var e = d;
            e = e > 0.99 ? 1 : e < 0.01 ? 0 : e;
            enyo.platform.ie < 9 ? b.applyStyle("filter", "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + e * 100 + ")") : b.applyStyle("opacity", e)
        }
    }
});
enyo.kind({
    name: "enyo.CardArranger",
    kind: "Arranger",
    layoutClass: "enyo-arranger enyo-arranger-fit",
    calcArrangementDifference: function () {
        return this.containerBounds.width
    },
    arrange: function (b) {
        for (var d = 0, e, f; e = b[d]; d++)
            f = d === 0 ? 1 : 0,
                this.arrangeControl(e, {
                    opacity: f
                })
    },
    start: function () {
        this.inherited(arguments);
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++) {
            var f = e.showing;
            e.setShowing(d == this.container.fromIndex || d == this.container.toIndex);
            e.showing && !f && e.resized()
        }
    },
    finish: function () {
        this.inherited(arguments);
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            e.setShowing(d == this.container.toIndex)
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            enyo.Arranger.opacifyControl(e, 1),
                e.showing || e.setShowing(!0);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.CardSlideInArranger",
    kind: "CardArranger",
    start: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++) {
            var f = e.showing;
            e.setShowing(d == this.container.fromIndex || d == this.container.toIndex);
            e.showing && !f && e.resized()
        }
        b = this.container.fromIndex;
        d = this.container.toIndex;
        this.container.transitionPoints = [d + "." + b + ".s", d + "." + b + ".f"]
    },
    finish: function () {
        this.inherited(arguments);
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            e.setShowing(d == this.container.toIndex)
    },
    arrange: function (b, d) {
        for (var e = d.split("."), f = e[0], g = e[1], e = e[2] == "s", i = this.containerBounds.width, j = 0, k = this.container.getPanels(), l, m; l = k[j]; j++)
            m = i,
                g == j && (m = e ? 0 : -i),
                f == j && (m = e ? i : 0),
                g == j && g == f && (m = 0),
                this.arrangeControl(l, {
                    left: m
                })
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            enyo.Arranger.positionControl(e, {
                left: null
            });
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.CarouselArranger",
    kind: "Arranger",
    size: function () {
        var b = this.container.getPanels(), d = this.containerPadding = this.container.hasNode() ? enyo.dom.calcPaddingExtents(this.container.node) : {}, e = this.containerBounds, f, g, i, j;
        e.height -= d.top + d.bottom;
        e.width -= d.left + d.right;
        var k;
        for (f = 0,
            g = 0; j = b[f]; f++)
            i = enyo.dom.calcMarginExtents(j.hasNode()),
                j.width = j.getBounds().width,
                j.marginWidth = i.right + i.left,
                g += (j.fit ? 0 : j.width) + j.marginWidth,
                j.fit && (k = j);
        if (k)
            e = e.width - g,
                k.width = e >= 0 ? e : k.width;
        for (f = 0; j = b[f]; f++)
            j.setBounds({
                top: d.top,
                bottom: d.bottom,
                width: j.fit ? j.width : null
            })
    },
    arrange: function (b, d) {
        this.container.wrap ? this.arrangeWrap(b, d) : this.arrangeNoWrap(b, d)
    },
    arrangeNoWrap: function (b, d) {
        var e, f, g, i = this.container.getPanels(), j = this.container.clamp(d), k = this.containerBounds.width;
        for (e = j,
            f = 0; g = i[e]; e++)
            if (f += g.width + g.marginWidth,
                f > k)
                break;
        k -= f;
        var l = 0;
        if (k > 0)
            for (e = j - 1,
                f = 0; g = i[e]; e--)
                if (f += g.width + g.marginWidth,
                    k - f <= 0) {
                    l = k - f;
                    j = e;
                    break
                }
        var m;
        for (e = 0,
            f = this.containerPadding.left + l; g = i[e]; e++)
            m = g.width + g.marginWidth,
                e < j ? this.arrangeControl(g, {
                    left: -m
                }) : (this.arrangeControl(g, {
                    left: Math.floor(f)
                }),
                    f += m)
    },
    arrangeWrap: function (b) {
        for (var d = 0, e = this.containerPadding.left, f; f = b[d]; d++)
            this.arrangeControl(f, {
                left: e
            }),
                e += f.width + f.marginWidth
    },
    calcArrangementDifference: function (b, d, e, f) {
        b = Math.abs(b % this.c$.length);
        return d[b].left - f[b].left
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            enyo.Arranger.positionControl(e, {
                left: null,
                top: null
            }),
                e.applyStyle("top", null),
                e.applyStyle("bottom", null),
                e.applyStyle("left", null),
                e.applyStyle("width", null);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.CollapsingArranger",
    kind: "CarouselArranger",
    size: function () {
        this.clearLastSize();
        this.inherited(arguments)
    },
    clearLastSize: function () {
        for (var b = 0, d = this.container.getPanels(), e; e = d[b]; b++)
            e._fit && b != d.length - 1 && (e.applyStyle("width", null),
                e._fit = null)
    },
    arrange: function (b, d) {
        for (var e = this.container.getPanels(), f = 0, g = this.containerPadding.left, i; i = e[f]; f++)
            this.arrangeControl(i, {
                left: g
            }),
                f >= d && (g += i.width + i.marginWidth),
                f == e.length - 1 && d < 0 && this.arrangeControl(i, {
                    left: g - d
                })
    },
    calcArrangementDifference: function (b, d, e, f) {
        b = this.container.getPanels().length - 1;
        return Math.abs(f[b].left - d[b].left)
    },
    flowControl: function (b, d) {
        this.inherited(arguments);
        if (this.container.realtimeFit) {
            var e = this.container.getPanels();
            b == e[e.length - 1] && this.fitControl(b, d.left)
        }
    },
    finish: function () {
        this.inherited(arguments);
        if (!this.container.realtimeFit && this.containerBounds) {
            var b = this.container.getPanels()
                , d = b.length - 1;
            this.fitControl(b[d], this.container.arrangement[d].left)
        }
    },
    fitControl: function (b, d) {
        b._fit = !0;
        b.applyStyle("width", this.containerBounds.width - d + "px");
        b.resized()
    }
});
enyo.kind({
    name: "enyo.LeftRightArranger",
    kind: "Arranger",
    margin: 40,
    axisSize: "width",
    offAxisSize: "height",
    axisPosition: "left",
    constructor: function () {
        this.inherited(arguments);
        this.margin = this.container.margin != null ? this.container.margin : this.margin
    },
    size: function () {
        for (var b = this.container.getPanels(), d = this.containerBounds[this.axisSize] - this.margin - this.margin, e = 0, f, g; g = b[e]; e++)
            f = {},
                f[this.axisSize] = d,
                f[this.offAxisSize] = "100%",
                g.setBounds(f)
    },
    start: function () {
        this.inherited(arguments);
        for (var b = this.container.fromIndex, d = this.container.toIndex, e = this.getOrderedControls(d), f = Math.floor(e.length / 2), g = 0, i; i = e[g]; g++)
            b > d ? g == e.length - f ? i.applyStyle("z-index", 0) : i.applyStyle("z-index", 1) : g == e.length - 1 - f ? i.applyStyle("z-index", 0) : i.applyStyle("z-index", 1)
    },
    arrange: function (b, d) {
        var e, f, g;
        if (this.container.getPanels().length == 1)
            g = {},
                g[this.axisPosition] = this.margin,
                this.arrangeControl(this.container.getPanels()[0], g);
        else {
            e = Math.floor(this.container.getPanels().length / 2);
            var i = this.getOrderedControls(Math.floor(d) - e)
                , j = this.containerBounds[this.axisSize] - this.margin - this.margin
                , k = this.margin - j * e;
            for (e = 0; f = i[e]; e++)
                g = {},
                    g[this.axisPosition] = k,
                    this.arrangeControl(f, g),
                    k += j
        }
    },
    calcArrangementDifference: function (b, d, e, f) {
        if (this.container.getPanels().length == 1)
            return 0;
        b = Math.abs(b % this.c$.length);
        return d[b][this.axisPosition] - f[b][this.axisPosition]
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            enyo.Arranger.positionControl(e, {
                left: null,
                top: null
            }),
                enyo.Arranger.opacifyControl(e, 1),
                e.applyStyle("left", null),
                e.applyStyle("top", null),
                e.applyStyle("height", null),
                e.applyStyle("width", null);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.TopBottomArranger",
    kind: "LeftRightArranger",
    dragProp: "ddy",
    dragDirectionProp: "yDirection",
    canDragProp: "vertical",
    axisSize: "height",
    offAxisSize: "width",
    axisPosition: "top"
});
enyo.kind({
    name: "enyo.SpiralArranger",
    kind: "Arranger",
    incrementalPoints: !0,
    inc: 20,
    size: function () {
        for (var b = this.container.getPanels(), d = this.containerBounds, e = this.controlWidth = d.width / 3, d = this.controlHeight = d.height / 3, f = 0, g; g = b[f]; f++)
            g.setBounds({
                width: e,
                height: d
            })
    },
    arrange: function (b) {
        for (var d = this.inc, e = 0, f = b.length, g; g = b[e]; e++) {
            var i = Math.cos(e / f * 2 * Math.PI) * e * d + this.controlWidth
                , j = Math.sin(e / f * 2 * Math.PI) * e * d + this.controlHeight;
            this.arrangeControl(g, {
                left: i,
                top: j
            })
        }
    },
    start: function () {
        this.inherited(arguments);
        for (var b = this.getOrderedControls(this.container.toIndex), d = 0, e; e = b[d]; d++)
            e.applyStyle("z-index", b.length - d)
    },
    calcArrangementDifference: function () {
        return this.controlWidth
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            e.applyStyle("z-index", null),
                enyo.Arranger.positionControl(e, {
                    left: null,
                    top: null
                }),
                e.applyStyle("left", null),
                e.applyStyle("top", null),
                e.applyStyle("height", null),
                e.applyStyle("width", null);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.GridArranger",
    kind: "Arranger",
    incrementalPoints: !0,
    colWidth: 100,
    colHeight: 100,
    size: function () {
        for (var b = this.container.getPanels(), d = this.colWidth, e = this.colHeight, f = 0, g; g = b[f]; f++)
            g.setBounds({
                width: d,
                height: e
            })
    },
    arrange: function (b) {
        for (var d = this.colWidth, e = this.colHeight, f = Math.max(1, Math.floor(this.containerBounds.width / d)), g, i = 0, j = 0; j < b.length; i++)
            for (var k = 0; k < f && (g = b[j]); k++,
                j++)
                this.arrangeControl(g, {
                    left: d * k,
                    top: e * i
                })
    },
    flowControl: function (b, d) {
        this.inherited(arguments);
        enyo.Arranger.opacifyControl(b, d.top % this.colHeight !== 0 ? 0.25 : 1)
    },
    calcArrangementDifference: function () {
        return this.colWidth
    },
    destroy: function () {
        for (var b = this.container.getPanels(), d = 0, e; e = b[d]; d++)
            enyo.Arranger.positionControl(e, {
                left: null,
                top: null
            }),
                e.applyStyle("left", null),
                e.applyStyle("top", null),
                e.applyStyle("height", null),
                e.applyStyle("width", null);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "enyo.Panels",
    classes: "enyo-panels",
    published: {
        index: 0,
        draggable: !0,
        animate: !0,
        wrap: !1,
        arrangerKind: "CardArranger",
        narrowFit: !0
    },
    events: {
        onTransitionStart: "",
        onTransitionFinish: ""
    },
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish",
        onscroll: "domScroll"
    },
    tools: [{
        kind: "Animator",
        onStep: "step",
        onEnd: "completed"
    }],
    fraction: 0,
    create: function () {
        this.transitionPoints = [];
        this.inherited(arguments);
        this.arrangerKindChanged();
        this.narrowFitChanged();
        this.indexChanged();
        this.setAttribute("onscroll", enyo.bubbler)
    },
    domScroll: function () {
        this.hasNode() && this.node.scrollLeft > 0 && (this.node.scrollLeft = 0)
    },
    initComponents: function () {
        this.createChrome(this.tools);
        this.inherited(arguments)
    },
    arrangerKindChanged: function () {
        this.setLayoutKind(this.arrangerKind)
    },
    narrowFitChanged: function () {
        this.addRemoveClass("enyo-panels-fit-narrow", this.narrowFit)
    },
    removeControl: function (b) {
        this.inherited(arguments);
        this.controls.length > 0 && this.isPanel(b) && (this.setIndex(Math.max(this.index - 1, 0)),
            this.flow(),
            this.reflow())
    },
    isPanel: function () {
        return !0
    },
    flow: function () {
        this.arrangements = [];
        this.inherited(arguments)
    },
    reflow: function () {
        this.arrangements = [];
        this.inherited(arguments);
        this.refresh()
    },
    getPanels: function () {
        return (this.controlParent || this).children
    },
    getActive: function () {
        var b = this.getPanels()
            , d = this.index % b.length;
        return d < 0 && (d += b.length),
            b[d]
    },
    getAnimator: function () {
        return this.$.animator
    },
    setIndex: function (b) {
        this.setPropertyValue("index", b, "indexChanged")
    },
    setIndexDirect: function (b) {
        this.setIndex(b);
        this.completed()
    },
    previous: function () {
        this.setIndex(this.index - 1)
    },
    next: function () {
        this.setIndex(this.index + 1)
    },
    clamp: function (b) {
        var d = this.getPanels().length - 1;
        return this.wrap ? b : Math.max(0, Math.min(b, d))
    },
    indexChanged: function (b) {
        this.lastIndex = b;
        this.index = this.clamp(this.index);
        !this.dragging && this.$.animator && (this.$.animator.isAnimating() && this.completed(),
            this.$.animator.stop(),
            this.hasNode() && (this.animate ? (this.startTransition(),
                this.$.animator.play({
                    startValue: this.fraction
                })) : this.refresh()))
    },
    step: function (b) {
        this.fraction = b.value;
        this.stepTransition()
    },
    completed: function () {
        this.$.animator.isAnimating() && this.$.animator.stop();
        this.fraction = 1;
        this.stepTransition();
        this.finishTransition()
    },
    dragstart: function (b, d) {
        if (this.draggable && this.layout && this.layout.canDragEvent(d))
            return d.preventDefault(),
                this.dragstartTransition(d),
                this.dragging = !0,
                this.$.animator.stop(),
                !0
    },
    drag: function (b, d) {
        this.dragging && (d.preventDefault(),
            this.dragTransition(d))
    },
    dragfinish: function (b, d) {
        this.dragging && (this.dragging = !1,
            d.preventTap(),
            this.dragfinishTransition(d))
    },
    dragstartTransition: function (b) {
        this.$.animator.isAnimating() ? this.verifyDragTransition(b) : this.toIndex = (this.fromIndex = this.index) - (this.layout ? this.layout.calcDragDirection(b) : 0);
        this.fromIndex = this.clamp(this.fromIndex);
        this.toIndex = this.clamp(this.toIndex);
        this.fireTransitionStart();
        this.layout && this.layout.start()
    },
    dragTransition: function (b) {
        var d = this.layout ? this.layout.calcDrag(b) : 0
            , e = this.transitionPoints
            , f = e[0]
            , e = e[e.length - 1]
            , g = this.fetchArrangement(f)
            , i = this.fetchArrangement(e)
            , f = this.layout ? this.layout.drag(d, f, g, e, i) : 0
            , d = d && !f;
        this.fraction += f;
        f = this.fraction;
        if (f > 1 || f < 0 || d)
            (f > 0 || d) && this.dragfinishTransition(b),
                this.dragstartTransition(b),
                this.fraction = 0;
        this.stepTransition()
    },
    dragfinishTransition: function (b) {
        this.verifyDragTransition(b);
        this.setIndex(this.toIndex);
        this.dragging && this.fireTransitionFinish()
    },
    verifyDragTransition: function (b) {
        var b = this.layout ? this.layout.calcDragDirection(b) : 0
            , d = Math.min(this.fromIndex, this.toIndex)
            , e = Math.max(this.fromIndex, this.toIndex);
        b > 0 && (d = e,
            e = d);
        d != this.fromIndex && (this.fraction = 1 - this.fraction);
        this.fromIndex = d;
        this.toIndex = e
    },
    refresh: function () {
        this.$.animator && this.$.animator.isAnimating() && this.$.animator.stop();
        this.startTransition();
        this.fraction = 1;
        this.stepTransition();
        this.finishTransition()
    },
    startTransition: function () {
        this.fromIndex = this.fromIndex != null ? this.fromIndex : this.lastIndex || 0;
        this.toIndex = this.toIndex != null ? this.toIndex : this.index;
        this.layout && this.layout.start();
        this.fireTransitionStart()
    },
    finishTransition: function () {
        this.layout && this.layout.finish();
        this.transitionPoints = [];
        this.fraction = 0;
        this.fromIndex = this.toIndex = null;
        this.fireTransitionFinish()
    },
    fireTransitionStart: function () {
        var b = this.startTransitionInfo;
        this.hasNode() && (!b || b.fromIndex != this.fromIndex || b.toIndex != this.toIndex) && (this.startTransitionInfo = {
            fromIndex: this.fromIndex,
            toIndex: this.toIndex
        },
            this.doTransitionStart(enyo.clone(this.startTransitionInfo)))
    },
    fireTransitionFinish: function () {
        var b = this.finishTransitionInfo;
        this.hasNode() && (!b || b.fromIndex != this.lastIndex || b.toIndex != this.index) && (this.finishTransitionInfo = {
            fromIndex: this.lastIndex,
            toIndex: this.index
        },
            this.doTransitionFinish(enyo.clone(this.finishTransitionInfo)));
        this.lastIndex = this.index
    },
    stepTransition: function () {
        if (this.hasNode()) {
            var b = this.transitionPoints
                , d = (this.fraction || 0) * (b.length - 1)
                , e = Math.floor(d);
            d -= e;
            var f = b[e + 1]
                , b = this.fetchArrangement(b[e])
                , f = this.fetchArrangement(f);
            this.arrangement = b && f ? enyo.Panels.lerp(b, f, d) : b || f;
            this.arrangement && this.layout && this.layout.flowArrangement()
        }
    },
    fetchArrangement: function (b) {
        return b != null && !this.arrangements[b] && this.layout && (this.layout._arrange(b),
            this.arrangements[b] = this.readArrangement(this.getPanels())),
            this.arrangements[b]
    },
    readArrangement: function (b) {
        for (var d = [], e = 0, f; f = b[e]; e++)
            d.push(enyo.clone(f._arranger));
        return d
    },
    statics: {
        isScreenNarrow: function () {
            return enyo.dom.getWindowWidth() <= 800
        },
        lerp: function (b, d, e) {
            for (var f = [], g = 0, i = enyo.keys(b), j; j = i[g]; g++)
                f.push(this.lerpObject(b[j], d[j], e));
            return f
        },
        lerpObject: function (b, d, e) {
            var f = enyo.clone(b), g, i;
            if (d)
                for (var j in b)
                    g = b[j],
                        i = d[j],
                        g != i && (f[j] = g - (g - i) * e);
            return f
        }
    }
});
enyo.kind({
    name: "enyo.Node",
    published: {
        expandable: !1,
        expanded: !1,
        icon: "",
        onlyIconExpands: !1,
        selected: !1
    },
    style: "padding: 0 0 0 16px;",
    content: "Node",
    defaultKind: "Node",
    classes: "enyo-node",
    components: [{
        name: "icon",
        kind: "Image",
        showing: !1
    }, {
        kind: "Control",
        name: "caption",
        Xtag: "span",
        style: "display: inline-block; padding: 4px;",
        allowHtml: !0
    }, {
        kind: "Control",
        name: "extra",
        tag: "span",
        allowHtml: !0
    }],
    childClient: [{
        kind: "Control",
        name: "box",
        classes: "enyo-node-box",
        Xstyle: "border: 1px solid orange;",
        components: [{
            kind: "Control",
            name: "client",
            classes: "enyo-node-client",
            Xstyle: "border: 1px solid lightblue;"
        }]
    }],
    handlers: {
        ondblclick: "dblclick"
    },
    events: {
        onNodeTap: "nodeTap",
        onNodeDblClick: "nodeDblClick",
        onExpand: "nodeExpand",
        onDestroyed: "nodeDestroyed"
    },
    create: function () {
        this.inherited(arguments);
        this.selectedChanged();
        this.iconChanged()
    },
    destroy: function () {
        this.doDestroyed();
        this.inherited(arguments)
    },
    initComponents: function () {
        this.expandable && (this.kindComponents = this.kindComponents.concat(this.childClient));
        this.inherited(arguments)
    },
    contentChanged: function () {
        this.$.caption.setContent(this.content)
    },
    iconChanged: function () {
        this.$.icon.setSrc(this.icon);
        this.$.icon.setShowing(Boolean(this.icon))
    },
    selectedChanged: function () {
        this.addRemoveClass("enyo-selected", this.selected)
    },
    rendered: function () {
        this.inherited(arguments);
        this.expandable && !this.expanded && this.quickCollapse()
    },
    addNodes: function (b) {
        this.destroyClientControls();
        for (var d = 0, e; e = b[d]; d++)
            this.createComponent(e);
        this.$.client.render()
    },
    addTextNodes: function (b) {
        this.destroyClientControls();
        for (var d = 0, e; e = b[d]; d++)
            this.createComponent({
                content: e
            });
        this.$.client.render()
    },
    tap: function (b, d) {
        return this.onlyIconExpands ? d.target == this.$.icon.hasNode() ? this.toggleExpanded() : this.doNodeTap() : (this.toggleExpanded(),
            this.doNodeTap()),
            !0
    },
    dblclick: function () {
        return this.doNodeDblClick(),
            !0
    },
    toggleExpanded: function () {
        this.setExpanded(!this.expanded)
    },
    quickCollapse: function () {
        this.removeClass("enyo-animate");
        this.$.box.applyStyle("height", "0");
        this.$.client.setBounds({
            top: -this.$.client.getBounds().height
        })
    },
    _expand: function () {
        this.addClass("enyo-animate");
        this.$.box.setBounds({
            height: this.$.client.getBounds().height
        });
        this.$.client.setBounds({
            top: 0
        });
        setTimeout(enyo.bind(this, function () {
            this.expanded && (this.removeClass("enyo-animate"),
                this.$.box.applyStyle("height", "auto"))
        }), 225)
    },
    _collapse: function () {
        this.removeClass("enyo-animate");
        var b = this.$.client.getBounds().height;
        this.$.box.setBounds({
            height: b
        });
        setTimeout(enyo.bind(this, function () {
            this.addClass("enyo-animate");
            this.$.box.applyStyle("height", "0");
            this.$.client.setBounds({
                top: -b
            })
        }), 25)
    },
    expandedChanged: function () {
        if (this.expandable) {
            var b = {
                expanded: this.expanded
            };
            this.doExpand(b);
            b.wait || this.effectExpanded()
        } else
            this.expanded = !1
    },
    effectExpanded: function () {
        this.$.client && (this.expanded ? this._expand() : this._collapse())
    }
});
enyo.kind({
    name: "enyo.ImageView",
    kind: enyo.Scroller,
    touchOverscroll: !1,
    thumb: !1,
    animate: !0,
    verticalDragPropagation: !0,
    horizontalDragPropagation: !0,
    published: {
        scale: "auto",
        disableZoom: !1,
        src: void 0
    },
    events: {
        onZoom: ""
    },
    touch: !0,
    preventDragPropagation: !1,
    handlers: {
        ondragstart: "dragPropagation"
    },
    components: [{
        name: "animator",
        kind: "Animator",
        onStep: "zoomAnimationStep",
        onEnd: "zoomAnimationEnd"
    }, {
        name: "viewport",
        style: "overflow:hidden;min-height:100%;min-width:100%;",
        classes: "enyo-fit",
        ongesturechange: "gestureTransform",
        ongestureend: "saveState",
        ontap: "singleTap",
        ondblclick: "doubleClick",
        onmousewheel: "mousewheel",
        components: [{
            kind: "Image",
            ondown: "down"
        }]
    }],
    create: function () {
        this.inherited(arguments);
        this.canTransform = enyo.dom.canTransform();
        this.canTransform || this.$.image.applyStyle("position", "relative");
        this.canAccelerate = enyo.dom.canAccelerate();
        this.bufferImage = new Image;
        this.bufferImage.onload = enyo.bind(this, "imageLoaded");
        this.bufferImage.onerror = enyo.bind(this, "imageError");
        this.srcChanged();
        this.getStrategy().setDragDuringGesture(!1)
    },
    down: function (b, d) {
        d.preventDefault()
    },
    dragPropagation: function (b, d) {
        var e = this.getStrategy().getScrollBounds()
            , f = e.left === 0 && d.dx > 0 || e.left >= e.maxLeft - 2 && d.dx < 0;
        return !((e.top === 0 && d.dy > 0 || e.top >= e.maxTop - 2 && d.dy < 0) && this.verticalDragPropagation || f && this.horizontalDragPropagation)
    },
    mousewheel: function (b, d) {
        d.pageX |= d.clientX + d.target.scrollLeft;
        d.pageY |= d.clientY + d.target.scrollTop;
        var e = (this.maxScale - this.minScale) / 10
            , f = this.scale;
        if (d.wheelDelta > 0 || d.detail < 0)
            this.scale = this.limitScale(this.scale + e);
        else if (d.wheelDelta < 0 || d.detail > 0)
            this.scale = this.limitScale(this.scale - e);
        return this.eventPt = this.calcEventLocation(d),
            this.transformImage(this.scale),
            f != this.scale && this.doZoom({
                scale: this.scale
            }),
            this.ratioX = this.ratioY = null,
            d.preventDefault(),
            !0
    },
    srcChanged: function () {
        this.src && this.src.length > 0 && this.bufferImage && this.src != this.bufferImage.src && (this.bufferImage.src = this.src)
    },
    imageLoaded: function () {
        this.originalWidth = this.bufferImage.width;
        this.originalHeight = this.bufferImage.height;
        this.scaleChanged();
        this.$.image.setSrc(this.bufferImage.src);
        enyo.dom.transformValue(this.getStrategy().$.client, "translate3d", "0px, 0px, 0")
    },
    resizeHandler: function () {
        this.inherited(arguments);
        this.$.image.src && this.scaleChanged()
    },
    scaleChanged: function () {
        var b = this.hasNode();
        if (b) {
            this.containerWidth = b.clientWidth;
            this.containerHeight = b.clientHeight;
            var b = this.containerWidth / this.originalWidth
                , d = this.containerHeight / this.originalHeight;
            this.minScale = Math.min(b, d);
            this.maxScale = this.minScale * 3 < 1 ? 1 : this.minScale * 3;
            this.scale == "auto" ? this.scale = this.minScale : this.scale == "width" ? this.scale = b : this.scale == "height" ? this.scale = d : (this.maxScale = Math.max(this.maxScale, this.scale),
                this.scale = this.limitScale(this.scale))
        }
        this.eventPt = this.calcEventLocation();
        this.transformImage(this.scale)
    },
    imageError: function (b) {
        enyo.error("Error loading image: " + this.src);
        this.bubble("onerror", b)
    },
    gestureTransform: function (b, d) {
        this.eventPt = this.calcEventLocation(d);
        this.transformImage(this.limitScale(this.scale * d.scale))
    },
    calcEventLocation: function (b) {
        var d = {
            x: 0,
            y: 0
        };
        if (b && this.hasNode()) {
            var e = this.node.getBoundingClientRect();
            d.x = Math.round(b.pageX - e.left - this.imageBounds.x);
            d.x = Math.max(0, Math.min(this.imageBounds.width, d.x));
            d.y = Math.round(b.pageY - e.top - this.imageBounds.y);
            d.y = Math.max(0, Math.min(this.imageBounds.height, d.y))
        }
        return d
    },
    transformImage: function (b) {
        this.tapped = !1;
        var d = this.imageBounds || this.innerImageBounds(b);
        this.imageBounds = this.innerImageBounds(b);
        this.scale > this.minScale ? this.$.viewport.applyStyle("cursor", "move") : this.$.viewport.applyStyle("cursor", null);
        this.$.viewport.setBounds({
            width: this.imageBounds.width + "px",
            height: this.imageBounds.height + "px"
        });
        this.ratioX = this.ratioX || (this.eventPt.x + this.getScrollLeft()) / d.width;
        this.ratioY = this.ratioY || (this.eventPt.y + this.getScrollTop()) / d.height;
        var e, f;
        this.$.animator.ratioLock ? (e = this.$.animator.ratioLock.x * this.imageBounds.width - this.containerWidth / 2,
            f = this.$.animator.ratioLock.y * this.imageBounds.height - this.containerHeight / 2) : (e = this.ratioX * this.imageBounds.width - this.eventPt.x,
                f = this.ratioY * this.imageBounds.height - this.eventPt.y);
        e = Math.max(0, Math.min(this.imageBounds.width - this.containerWidth, e));
        f = Math.max(0, Math.min(this.imageBounds.height - this.containerHeight, f));
        this.canTransform ? (b = {
            scale: b
        },
            this.canAccelerate ? b = enyo.mixin({
                translate3d: Math.round(this.imageBounds.left) + "px, " + Math.round(this.imageBounds.top) + "px, 0px"
            }, b) : b = enyo.mixin({
                translate: this.imageBounds.left + "px, " + this.imageBounds.top + "px"
            }, b),
            enyo.dom.transform(this.$.image, b)) : this.$.image.setBounds({
                width: this.imageBounds.width + "px",
                height: this.imageBounds.height + "px",
                left: this.imageBounds.left + "px",
                top: this.imageBounds.top + "px"
            });
        this.setScrollLeft(e);
        this.setScrollTop(f)
    },
    limitScale: function (b) {
        return this.disableZoom ? b = this.scale : b > this.maxScale ? b = this.maxScale : b < this.minScale && (b = this.minScale),
            b
    },
    innerImageBounds: function (b) {
        var d = this.originalWidth * b;
        b *= this.originalHeight;
        var e = 0
            , f = 0
            , g = 0
            , i = 0;
        return d < this.containerWidth && (e += (this.containerWidth - d) / 2),
            b < this.containerHeight && (f += (this.containerHeight - b) / 2),
            this.canTransform && (g -= (this.originalWidth - d) / 2,
                i -= (this.originalHeight - b) / 2),
        {
            left: e + g,
            top: f + i,
            width: d,
            height: b,
            x: e,
            y: f
        }
    },
    saveState: function (b, d) {
        var e = this.scale;
        this.scale *= d.scale;
        this.scale = this.limitScale(this.scale);
        e != this.scale && this.doZoom({
            scale: this.scale
        });
        this.ratioX = this.ratioY = null
    },
    doubleClick: function (b, d) {
        enyo.platform.ie == 8 && (this.tapped = !0,
            d.pageX = d.clientX + d.target.scrollLeft,
            d.pageY = d.clientY + d.target.scrollTop,
            this.singleTap(b, d),
            d.preventDefault())
    },
    singleTap: function (b, d) {
        setTimeout(enyo.bind(this, function () {
            this.tapped = !1
        }), 300);
        this.tapped ? (this.tapped = !1,
            this.smartZoom(b, d)) : this.tapped = !0
    },
    smartZoom: function (b, d) {
        var e = this.hasNode()
            , f = this.$.image.hasNode();
        if (e && f && this.hasNode() && !this.disableZoom)
            e = this.scale,
                this.scale != this.minScale ? this.scale = this.minScale : this.scale = this.maxScale,
                this.eventPt = this.calcEventLocation(d),
                this.animate ? this.$.animator.play({
                    duration: 350,
                    ratioLock: {
                        x: (this.eventPt.x + this.getScrollLeft()) / this.imageBounds.width,
                        y: (this.eventPt.y + this.getScrollTop()) / this.imageBounds.height
                    },
                    baseScale: e,
                    deltaScale: this.scale - e
                }) : (this.transformImage(this.scale),
                    this.doZoom({
                        scale: this.scale
                    }))
    },
    zoomAnimationStep: function () {
        this.transformImage(this.$.animator.baseScale + this.$.animator.deltaScale * this.$.animator.value)
    },
    zoomAnimationEnd: function () {
        this.doZoom({
            scale: this.scale
        });
        this.$.animator.ratioLock = void 0
    }
});
enyo.kind({
    name: "enyo.ImageCarousel",
    kind: enyo.Panels,
    arrangerKind: "enyo.CarouselArranger",
    defaultScale: "auto",
    disableZoom: !1,
    lowMemory: !1,
    published: {
        images: []
    },
    handlers: {
        onTransitionStart: "transitionStart",
        onTransitionFinish: "transitionFinish"
    },
    create: function () {
        this.inherited(arguments);
        this.imageCount = this.images.length;
        this.images.length > 0 && (this.initContainers(),
            this.loadNearby())
    },
    initContainers: function () {
        for (var b = 0; b < this.images.length; b++)
            this.$["container" + b] || (this.createComponent({
                name: "container" + b,
                style: "height:100%; width:100%;"
            }),
                this.$["container" + b].render());
        for (b = this.images.length; b < this.imageCount; b++)
            this.$["image" + b] && this.$["image" + b].destroy(),
                this.$["container" + b].destroy();
        this.imageCount = this.images.length
    },
    loadNearby: function () {
        this.images.length > 0 && (this.loadImageView(this.index - 1),
            this.loadImageView(this.index),
            this.loadImageView(this.index + 1))
    },
    loadImageView: function (b) {
        return this.wrap && (b = (b % this.images.length + this.images.length) % this.images.length),
            b >= 0 && b <= this.images.length - 1 && (this.$["image" + b] ? (this.$["image" + b].src != this.images[b] && this.$["image" + b].setSrc(this.images[b]),
                this.$["image" + b].setScale(this.defaultScale),
                this.$["image" + b].setDisableZoom(this.disableZoom)) : (this.$["container" + b].createComponent({
                    name: "image" + b,
                    kind: "ImageView",
                    scale: this.defaultScale,
                    disableZoom: this.disableZoom,
                    src: this.images[b],
                    verticalDragPropagation: !1,
                    style: "height:100%; width:100%;"
                }, {
                    owner: this
                }),
                    this.$["image" + b].render())),
            this.$["image" + b]
    },
    setImages: function (b) {
        this.setPropertyValue("images", b, "imagesChanged")
    },
    imagesChanged: function () {
        this.initContainers();
        this.loadNearby()
    },
    indexChanged: function () {
        this.loadNearby();
        this.lowMemory && this.cleanupMemory();
        this.inherited(arguments)
    },
    transitionStart: function (b, d) {
        if (d.fromIndex == d.toIndex)
            return !0
    },
    transitionFinish: function () {
        this.loadImageView(this.index - 1);
        this.loadImageView(this.index + 1);
        this.lowMemory && this.cleanupMemory()
    },
    getActiveImage: function () {
        return this.getImageByIndex(this.index)
    },
    getImageByIndex: function (b) {
        return this.$["image" + b] || this.loadImageView(b)
    },
    cleanupMemory: function () {
        for (var b = 0; b < this.images.length; b++)
            (b < this.index - 1 || b > this.index + 1) && this.$["image" + b] && this.$["image" + b].destroy()
    }
});
enyo.kind({
    name: "onyx.Icon",
    published: {
        src: "",
        disabled: !1
    },
    classes: "onyx-icon",
    create: function () {
        this.inherited(arguments);
        this.src && this.srcChanged();
        this.disabledChanged()
    },
    disabledChanged: function () {
        this.addRemoveClass("disabled", this.disabled)
    },
    srcChanged: function () {
        this.applyStyle("background-image", "url(" + enyo.path.rewrite(this.src) + ")")
    }
});
enyo.kind({
    name: "onyx.Button",
    kind: "enyo.Button",
    classes: "onyx-button enyo-unselectable"
});
enyo.kind({
    name: "onyx.IconButton",
    kind: "onyx.Icon",
    published: {
        active: !1
    },
    classes: "onyx-icon-button",
    rendered: function () {
        this.inherited(arguments);
        this.activeChanged()
    },
    tap: function () {
        if (this.disabled)
            return !0;
        this.setActive(!0)
    },
    activeChanged: function () {
        this.bubble("onActivate")
    }
});
enyo.kind({
    name: "onyx.Checkbox",
    classes: "onyx-checkbox",
    kind: enyo.Checkbox,
    tag: "div",
    handlers: {
        ondown: "downHandler",
        onclick: ""
    },
    downHandler: function () {
        return this.disabled || (this.setChecked(!this.getChecked()),
            this.bubble("onchange")),
            !0
    },
    tap: function () {
        return !this.disabled
    }
});
enyo.kind({
    name: "onyx.Drawer",
    published: {
        open: !0,
        orient: "v",
        animated: !0
    },
    style: "overflow: hidden; position: relative;",
    tools: [{
        kind: "Animator",
        onStep: "animatorStep",
        onEnd: "animatorEnd"
    }, {
        name: "client",
        style: "position: relative;",
        classes: "enyo-border-box"
    }],
    create: function () {
        this.inherited(arguments);
        this.animatedChanged();
        this.openChanged()
    },
    initComponents: function () {
        this.createChrome(this.tools);
        this.inherited(arguments)
    },
    animatedChanged: function () {
        !this.animated && this.hasNode() && this.$.animator.isAnimating() && (this.$.animator.stop(),
            this.animatorEnd())
    },
    openChanged: function () {
        this.$.client.show();
        if (this.hasNode())
            if (this.$.animator.isAnimating())
                this.$.animator.reverse();
            else {
                var b = this.orient == "v"
                    , d = b ? "height" : "width"
                    , e = b ? "top" : "left";
                this.applyStyle(d, null);
                b = this.hasNode()[b ? "scrollHeight" : "scrollWidth"];
                this.animated ? this.$.animator.play({
                    startValue: this.open ? 0 : b,
                    endValue: this.open ? b : 0,
                    dimension: d,
                    position: e
                }) : this.animatorEnd()
            }
        else
            this.$.client.setShowing(this.open)
    },
    animatorStep: function (b) {
        if (this.hasNode()) {
            var d = b.dimension;
            this.node.style[d] = this.domStyles[d] = b.value + "px"
        }
        if (d = this.$.client.hasNode()) {
            var e = b.position;
            d.style[e] = this.$.client.domStyles[e] = b.value - (this.open ? b.endValue : b.startValue) + "px"
        }
        this.container && this.container.resized()
    },
    animatorEnd: function () {
        if (this.open) {
            var b = this.orient == "v"
                , d = b ? "height" : "width"
                , b = b ? "top" : "left"
                , e = this.$.client.hasNode();
            e && (e.style[b] = this.$.client.domStyles[b] = null);
            this.node && (this.node.style[d] = this.domStyles[d] = null)
        } else
            this.$.client.hide();
        this.container && this.container.resized()
    }
});
enyo.kind({
    name: "onyx.Grabber",
    classes: "onyx-grabber"
});
enyo.kind({
    name: "onyx.Groupbox",
    classes: "onyx-groupbox"
});
enyo.kind({
    name: "onyx.GroupboxHeader",
    classes: "onyx-groupbox-header"
});
enyo.kind({
    name: "onyx.Input",
    kind: "enyo.Input",
    classes: "onyx-input"
});
enyo.kind({
    name: "onyx.Popup",
    kind: "Popup",
    classes: "onyx-popup",
    published: {
        scrimWhenModal: !0,
        scrim: !1,
        scrimClassName: ""
    },
    statics: {
        count: 0
    },
    defaultZ: 120,
    showingChanged: function () {
        this.showing ? (onyx.Popup.count++,
            this.applyZIndex()) : onyx.Popup.count > 0 && onyx.Popup.count--;
        this.showHideScrim(this.showing);
        this.inherited(arguments)
    },
    showHideScrim: function (b) {
        if (this.floating && (this.scrim || this.modal && this.scrimWhenModal)) {
            var d = this.getScrim();
            b ? (b = this.getScrimZIndex(),
                this._scrimZ = b,
                d.showAtZIndex(b)) : d.hideAtZIndex(this._scrimZ);
            enyo.call(d, "addRemoveClass", [this.scrimClassName, d.showing])
        }
    },
    getScrimZIndex: function () {
        return this.findZIndex() - 1
    },
    getScrim: function () {
        return this.modal && this.scrimWhenModal && !this.scrim ? onyx.scrimTransparent.make() : onyx.scrim.make()
    },
    applyZIndex: function () {
        this._zIndex = onyx.Popup.count * 2 + this.findZIndex() + 1;
        this.applyStyle("z-index", this._zIndex)
    },
    findZIndex: function () {
        var b = this.defaultZ;
        return this._zIndex ? b = this._zIndex : this.hasNode() && (b = Number(enyo.dom.getComputedStyleValue(this.node, "z-index")) || b),
            this._zIndex = b
    }
});
enyo.kind({
    name: "onyx.TextArea",
    kind: "enyo.TextArea",
    classes: "onyx-textarea"
});
enyo.kind({
    name: "onyx.RichText",
    kind: "enyo.RichText",
    classes: "onyx-richtext"
});
enyo.kind({
    name: "onyx.InputDecorator",
    kind: "enyo.ToolDecorator",
    tag: "label",
    classes: "onyx-input-decorator",
    published: {
        alwaysLooksFocused: !1
    },
    handlers: {
        onDisabledChange: "disabledChange",
        onfocus: "receiveFocus",
        onblur: "receiveBlur"
    },
    create: function () {
        this.inherited(arguments);
        this.updateFocus(!1)
    },
    alwaysLooksFocusedChanged: function () {
        this.updateFocus(this.focus)
    },
    updateFocus: function (b) {
        this.focused = b;
        this.addRemoveClass("onyx-focused", this.alwaysLooksFocused || this.focused)
    },
    receiveFocus: function () {
        this.updateFocus(!0)
    },
    receiveBlur: function () {
        this.updateFocus(!1)
    },
    disabledChange: function (b, d) {
        this.addRemoveClass("onyx-disabled", d.originator.disabled)
    }
});
enyo.kind({
    name: "onyx.Tooltip",
    kind: "onyx.Popup",
    classes: "onyx-tooltip below left-arrow",
    autoDismiss: !1,
    showDelay: 500,
    defaultLeft: -6,
    handlers: {
        onRequestShowTooltip: "requestShow",
        onRequestHideTooltip: "requestHide"
    },
    requestShow: function () {
        return this.showJob = setTimeout(enyo.bind(this, "show"), this.showDelay),
            !0
    },
    cancelShow: function () {
        clearTimeout(this.showJob)
    },
    requestHide: function () {
        return this.cancelShow(),
            this.inherited(arguments)
    },
    showingChanged: function () {
        this.cancelShow();
        this.adjustPosition(!0);
        this.inherited(arguments)
    },
    applyPosition: function (b) {
        var d = "", e;
        for (e in b)
            d += e + ":" + b[e] + (isNaN(b[e]) ? "; " : "px; ");
        this.addStyles(d)
    },
    adjustPosition: function () {
        if (this.showing && this.hasNode()) {
            var b = this.node.getBoundingClientRect();
            b.top + b.height > window.innerHeight ? (this.addRemoveClass("below", !1),
                this.addRemoveClass("above", !0)) : (this.addRemoveClass("above", !1),
                    this.addRemoveClass("below", !0));
            b.left + b.width > window.innerWidth && (this.applyPosition({
                "margin-left": -b.width,
                bottom: "auto"
            }),
                this.addRemoveClass("left-arrow", !1),
                this.addRemoveClass("right-arrow", !0))
        }
    },
    resizeHandler: function () {
        this.applyPosition({
            "margin-left": this.defaultLeft,
            bottom: "auto"
        });
        this.addRemoveClass("left-arrow", !0);
        this.addRemoveClass("right-arrow", !1);
        this.adjustPosition(!0);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "onyx.TooltipDecorator",
    defaultKind: "onyx.Button",
    classes: "onyx-popup-decorator",
    handlers: {
        onenter: "enter",
        onleave: "leave"
    },
    enter: function () {
        this.requestShowTooltip()
    },
    leave: function () {
        this.requestHideTooltip()
    },
    tap: function () {
        this.requestHideTooltip()
    },
    requestShowTooltip: function () {
        this.waterfallDown("onRequestShowTooltip")
    },
    requestHideTooltip: function () {
        this.waterfallDown("onRequestHideTooltip")
    }
});
enyo.kind({
    name: "onyx.MenuDecorator",
    kind: "onyx.TooltipDecorator",
    defaultKind: "onyx.Button",
    classes: "onyx-popup-decorator enyo-unselectable",
    handlers: {
        onActivate: "activated",
        onHide: "menuHidden"
    },
    activated: function (b, d) {
        this.requestHideTooltip();
        d.originator.active && (this.menuActive = !0,
            this.activator = d.originator,
            this.activator.addClass("active"),
            this.requestShowMenu())
    },
    requestShowMenu: function () {
        this.waterfallDown("onRequestShowMenu", {
            activator: this.activator
        })
    },
    requestHideMenu: function () {
        this.waterfallDown("onRequestHideMenu")
    },
    menuHidden: function () {
        this.menuActive = !1;
        this.activator && (this.activator.setActive(!1),
            this.activator.removeClass("active"))
    },
    enter: function (b) {
        this.menuActive || this.inherited(arguments)
    },
    leave: function (b, d) {
        this.menuActive || this.inherited(arguments)
    }
});
enyo.kind({
    name: "onyx.Menu",
    kind: "onyx.Popup",
    modal: !0,
    defaultKind: "onyx.MenuItem",
    classes: "onyx-menu",
    published: {
        maxHeight: 200,
        scrolling: !0
    },
    handlers: {
        onActivate: "itemActivated",
        onRequestShowMenu: "requestMenuShow",
        onRequestHideMenu: "requestHide"
    },
    childComponents: [{
        name: "client",
        kind: "enyo.Scroller",
        strategyKind: "TouchScrollStrategy"
    }],
    showOnTop: !1,
    scrollerName: "client",
    create: function () {
        this.inherited(arguments);
        this.maxHeightChanged()
    },
    initComponents: function () {
        this.scrolling && this.createComponents(this.childComponents, {
            isChrome: !0
        });
        this.inherited(arguments)
    },
    getScroller: function () {
        return this.$[this.scrollerName]
    },
    maxHeightChanged: function () {
        this.scrolling && this.getScroller().setMaxHeight(this.maxHeight + "px")
    },
    itemActivated: function (b, d) {
        return d.originator.setActive(!1),
            !0
    },
    showingChanged: function () {
        this.inherited(arguments);
        this.scrolling && this.getScroller().setShowing(this.showing);
        this.adjustPosition(!0)
    },
    requestMenuShow: function (b, d) {
        if (this.floating) {
            var e = d.activator.hasNode();
            if (e)
                e = this.activatorOffset = this.getPageOffset(e),
                    this.applyPosition({
                        top: e.top + (this.showOnTop ? 0 : e.height),
                        left: e.left,
                        width: e.width
                    })
        }
        return this.show(),
            !0
    },
    applyPosition: function (b) {
        var d = "";
        for (n in b)
            d += n + ":" + b[n] + (isNaN(b[n]) ? "; " : "px; ");
        this.addStyles(d)
    },
    getPageOffset: function (b) {
        b = b.getBoundingClientRect();
        return {
            top: b.top + (window.pageYOffset === void 0 ? document.documentElement.scrollTop : window.pageYOffset),
            left: b.left + (window.pageXOffset === void 0 ? document.documentElement.scrollLeft : window.pageXOffset),
            height: b.height === void 0 ? b.bottom - b.top : b.height,
            width: b.width === void 0 ? b.right - b.left : b.width
        }
    },
    adjustPosition: function () {
        if (this.showing && this.hasNode()) {
            this.scrolling && !this.showOnTop && this.getScroller().setMaxHeight(this.maxHeight + "px");
            this.removeClass("onyx-menu-up");
            this.floating || this.applyPosition({
                left: "auto"
            });
            var b = this.node.getBoundingClientRect()
                , d = b.height === void 0 ? b.bottom - b.top : b.height
                , e = window.innerHeight === void 0 ? document.documentElement.clientHeight : window.innerHeight
                , f = window.innerWidth === void 0 ? document.documentElement.clientWidth : window.innerWidth;
            this.menuUp = b.top + d > e && e - b.bottom < b.top - d;
            this.addRemoveClass("onyx-menu-up", this.menuUp);
            if (this.floating) {
                var g = this.activatorOffset;
                this.menuUp ? this.applyPosition({
                    top: g.top - d + (this.showOnTop ? g.height : 0),
                    bottom: "auto"
                }) : b.top < g.top && g.top + (this.showOnTop ? 0 : g.height) + d < e && this.applyPosition({
                    top: g.top + (this.showOnTop ? 0 : g.height),
                    bottom: "auto"
                })
            }
            b.right > f && (this.floating ? this.applyPosition({
                left: f - b.width
            }) : this.applyPosition({
                left: -(b.right - f)
            }));
            b.left < 0 && (this.floating ? this.applyPosition({
                left: 0,
                right: "auto"
            }) : this.getComputedStyleValue("right") == "auto" ? this.applyPosition({
                left: -b.left
            }) : this.applyPosition({
                right: b.left
            }));
            if (this.scrolling && !this.showOnTop) {
                var b = this.node.getBoundingClientRect(), i;
                this.menuUp ? i = this.maxHeight < b.bottom ? this.maxHeight : b.bottom : i = b.top + this.maxHeight < e ? this.maxHeight : e - b.top;
                this.getScroller().setMaxHeight(i + "px")
            }
        }
    },
    resizeHandler: function () {
        this.inherited(arguments);
        this.adjustPosition()
    },
    requestHide: function () {
        this.setShowing(!1)
    }
});
enyo.kind({
    name: "onyx.MenuItem",
    kind: "enyo.Button",
    events: {
        onSelect: ""
    },
    classes: "onyx-menu-item",
    tag: "div",
    tap: function (b) {
        this.inherited(arguments);
        this.bubble("onRequestHideMenu");
        this.doSelect({
            selected: this,
            content: this.content
        })
    }
});
enyo.kind({
    name: "onyx.PickerDecorator",
    kind: "onyx.MenuDecorator",
    classes: "onyx-picker-decorator",
    defaultKind: "onyx.PickerButton",
    handlers: {
        onChange: "change"
    },
    change: function (b, d) {
        this.waterfallDown("onChange", d)
    }
});
enyo.kind({
    name: "onyx.PickerButton",
    kind: "onyx.Button",
    handlers: {
        onChange: "change"
    },
    change: function (b, d) {
        this.setContent(d.content)
    }
});
enyo.kind({
    name: "onyx.Picker",
    kind: "onyx.Menu",
    classes: "onyx-picker enyo-unselectable",
    published: {
        selected: null
    },
    events: {
        onChange: ""
    },
    floating: !0,
    showOnTop: !0,
    initComponents: function () {
        this.setScrolling(!0);
        this.inherited(arguments)
    },
    showingChanged: function () {
        this.getScroller().setShowing(this.showing);
        this.inherited(arguments);
        this.showing && this.selected && this.scrollToSelected()
    },
    scrollToSelected: function () {
        this.getScroller().scrollToControl(this.selected, !this.menuUp)
    },
    itemActivated: function (b, d) {
        return this.processActivatedItem(d.originator),
            this.inherited(arguments)
    },
    processActivatedItem: function (b) {
        b.active && this.setSelected(b)
    },
    selectedChanged: function (b) {
        b && b.removeClass("selected");
        this.selected && (this.selected.addClass("selected"),
            this.doChange({
                selected: this.selected,
                content: this.selected.content
            }))
    },
    resizeHandler: function () {
        this.inherited(arguments);
        this.adjustPosition()
    }
});
enyo.kind({
    name: "onyx.FlyweightPicker",
    kind: "onyx.Picker",
    classes: "onyx-flyweight-picker",
    published: {
        count: 0
    },
    events: {
        onSetupItem: "",
        onSelect: ""
    },
    handlers: {
        onSelect: "itemSelect"
    },
    components: [{
        name: "scroller",
        kind: "enyo.Scroller",
        strategyKind: "TouchScrollStrategy",
        components: [{
            name: "flyweight",
            kind: "FlyweightRepeater",
            ontap: "itemTap"
        }]
    }],
    scrollerName: "scroller",
    initComponents: function () {
        this.controlParentName = "flyweight";
        this.inherited(arguments)
    },
    create: function () {
        this.inherited(arguments);
        this.countChanged()
    },
    rendered: function () {
        this.inherited(arguments);
        this.selectedChanged()
    },
    scrollToSelected: function () {
        var b = this.$.flyweight.fetchRowNode(this.selected);
        this.getScroller().scrollToNode(b, !this.menuUp)
    },
    countChanged: function () {
        this.$.flyweight.count = this.count
    },
    processActivatedItem: function (b) {
        this.item = b
    },
    selectedChanged: function (b) {
        this.item && (b !== void 0 && (this.item.removeClass("selected"),
            this.$.flyweight.renderRow(b)),
            this.item.addClass("selected"),
            this.$.flyweight.renderRow(this.selected),
            this.item.removeClass("selected"),
            b = this.$.flyweight.fetchRowNode(this.selected),
            this.doChange({
                selected: this.selected,
                content: b && b.textContent || this.item.content
            }))
    },
    itemTap: function (b, d) {
        this.setSelected(d.rowIndex);
        this.doSelect({
            selected: this.item,
            content: this.item.content
        })
    },
    itemSelect: function (b, d) {
        if (d.originator != this)
            return !0
    }
});
enyo.kind({
    name: "onyx.DatePicker",
    classes: "onyx-toolbar-inline",
    published: {
        disabled: !1,
        locale: null,
        dayHidden: !1,
        monthHidden: !1,
        yearHidden: !1,
        minYear: 1900,
        maxYear: 2099,
        value: null
    },
    events: {
        onSelect: ""
    },
    create: function () {
        this.inherited(arguments);
        if (!this.locale)
            try {
                this.locale = enyo.g11n.currentLocale().getLocale()
            } catch (b) {
                this.locale = "en_us"
            }
        this.initDefaults()
    },
    initDefaults: function () {
        var b;
        try {
            this._tf = new enyo.g11n.Fmts({
                locale: this.locale
            }),
                b = this._tf.getMonthFields()
        } catch (d) {
            b = "Jan,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC".split(",")
        }
        this.setupPickers(this._tf ? this._tf.getDateFieldOrder() : "mdy");
        this.dayHiddenChanged();
        this.monthHiddenChanged();
        this.yearHiddenChanged();
        for (var e = this.value = this.value || new Date, f = 0, g; g = b[f]; f++)
            this.$.monthPicker.createComponent({
                content: g,
                value: f,
                active: f == e.getMonth()
            });
        b = e.getFullYear();
        this.$.yearPicker.setSelected(b - this.minYear);
        this.$.year.setContent(b);
        for (f = 1; f <= this.monthLength(e.getYear(), e.getMonth()); f++)
            this.$.dayPicker.createComponent({
                content: f,
                value: f,
                active: f == e.getDate()
            })
    },
    monthLength: function (b, d) {
        return 32 - (new Date(b, d, 32)).getDate()
    },
    setupYear: function (b, d) {
        this.$.year.setContent(this.minYear + d.index)
    },
    setupPickers: function (b) {
        var b = b.split(""), d, e, f;
        for (e = 0,
            f = b.length; e < f; e++)
            switch (d = b[e],
            d) {
                case "d":
                    this.createDay();
                    break;
                case "m":
                    this.createMonth();
                    break;
                case "y":
                    this.createYear()
            }
    },
    createYear: function () {
        var b = this.maxYear - this.minYear;
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateYear",
            components: [{
                classes: "onyx-datepicker-year",
                name: "yearPickerButton",
                disabled: this.disabled
            }, {
                name: "yearPicker",
                kind: "onyx.FlyweightPicker",
                count: ++b,
                onSetupItem: "setupYear",
                components: [{
                    name: "year"
                }]
            }]
        })
    },
    createMonth: function () {
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateMonth",
            components: [{
                classes: "onyx-datepicker-month",
                name: "monthPickerButton",
                disabled: this.disabled
            }, {
                name: "monthPicker",
                kind: "onyx.Picker"
            }]
        })
    },
    createDay: function () {
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateDay",
            components: [{
                classes: "onyx-datepicker-day",
                name: "dayPickerButton",
                disabled: this.disabled
            }, {
                name: "dayPicker",
                kind: "onyx.Picker"
            }]
        })
    },
    localeChanged: function () {
        this.refresh()
    },
    dayHiddenChanged: function () {
        this.$.dayPicker.getParent().setShowing(this.dayHidden ? !1 : !0)
    },
    monthHiddenChanged: function () {
        this.$.monthPicker.getParent().setShowing(this.monthHidden ? !1 : !0)
    },
    yearHiddenChanged: function () {
        this.$.yearPicker.getParent().setShowing(this.yearHidden ? !1 : !0)
    },
    minYearChanged: function () {
        this.refresh()
    },
    maxYearChanged: function () {
        this.refresh()
    },
    valueChanged: function () {
        this.refresh()
    },
    disabledChanged: function () {
        this.yearPickerButton.setDisabled(this.disabled);
        this.monthPickerButton.setDisabled(this.disabled);
        this.dayPickerButton.setDisabled(this.disabled)
    },
    updateDay: function (b, d) {
        var e = this.calcDate(this.value.getFullYear(), this.value.getMonth(), d.selected.value);
        return this.doSelect({
            name: this.name,
            value: e
        }),
            this.setValue(e),
            !0
    },
    updateMonth: function (b, d) {
        var e = this.calcDate(this.value.getFullYear(), d.selected.value, this.value.getDate());
        return this.doSelect({
            name: this.name,
            value: e
        }),
            this.setValue(e),
            !0
    },
    updateYear: function (b, d) {
        if (d.originator.selected != -1) {
            var e = this.calcDate(this.minYear + d.originator.selected, this.value.getMonth(), this.value.getDate());
            this.doSelect({
                name: this.name,
                value: e
            });
            this.setValue(e)
        }
        return !0
    },
    calcDate: function (b, d, e) {
        return new Date(b, d, e, this.value.getHours(), this.value.getMinutes(), this.value.getSeconds(), this.value.getMilliseconds())
    },
    refresh: function () {
        this.destroyClientControls();
        this.initDefaults();
        this.render()
    }
});
enyo.kind({
    name: "onyx.TimePicker",
    classes: "onyx-toolbar-inline",
    published: {
        disabled: !1,
        locale: null,
        is24HrMode: null,
        value: null
    },
    events: {
        onSelect: ""
    },
    create: function () {
        this.inherited(arguments);
        if (!this.locale)
            try {
                this.locale = enyo.g11n.currentLocale().getLocale()
            } catch (b) {
                this.locale = "en_us"
            }
        this.initDefaults()
    },
    initDefaults: function () {
        var b, d;
        try {
            this._tf = new enyo.g11n.Fmts({
                locale: this.locale
            }),
                b = this._tf.getAmCaption(),
                d = this._tf.getPmCaption(),
                this.is24HrMode == null && (this.is24HrMode = !this._tf.isAmPm())
        } catch (e) {
            b = "AM",
                d = "PM",
                this.is24HrMode = !1
        }
        this.setupPickers(this._tf ? this._tf.getTimeFieldOrder() : "hma");
        var f = this.value = this.value || new Date, g;
        if (this.is24HrMode)
            for (g = 0; g < 24; g++)
                this.$.hourPicker.createComponent({
                    content: g,
                    value: g,
                    active: g == f.getHours()
                });
        else {
            var i = f.getHours()
                , i = i === 0 ? 12 : i;
            for (g = 1; g <= 12; g++)
                this.$.hourPicker.createComponent({
                    content: g,
                    value: g,
                    active: g == (i > 12 ? i % 12 : i)
                })
        }
        for (g = 0; g <= 59; g++)
            this.$.minutePicker.createComponent({
                content: g < 10 ? "0" + g : g,
                value: g,
                active: g == f.getMinutes()
            });
        f.getHours() >= 12 ? this.$.ampmPicker.createComponents([{
            content: b
        }, {
            content: d,
            active: !0
        }]) : this.$.ampmPicker.createComponents([{
            content: b,
            active: !0
        }, {
            content: d
        }]);
        this.$.ampmPicker.getParent().setShowing(!this.is24HrMode)
    },
    setupPickers: function (b) {
        var b = b.split(""), d, e, f;
        for (e = 0,
            f = b.length; e < f; e++)
            switch (d = b[e],
            d) {
                case "h":
                    this.createHour();
                    break;
                case "m":
                    this.createMinute();
                    break;
                case "a":
                    this.createAmPm()
            }
    },
    createHour: function () {
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateHour",
            components: [{
                classes: "onyx-timepicker-hour",
                name: "hourPickerButton",
                disabled: this.disabled
            }, {
                name: "hourPicker",
                kind: "onyx.Picker"
            }]
        })
    },
    createMinute: function () {
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateMinute",
            components: [{
                classes: "onyx-timepicker-minute",
                name: "minutePickerButton",
                disabled: this.disabled
            }, {
                name: "minutePicker",
                kind: "onyx.Picker"
            }]
        })
    },
    createAmPm: function () {
        this.createComponent({
            kind: "onyx.PickerDecorator",
            onSelect: "updateAmPm",
            components: [{
                classes: "onyx-timepicker-ampm",
                name: "ampmPickerButton",
                disabled: this.disabled
            }, {
                name: "ampmPicker",
                kind: "onyx.Picker"
            }]
        })
    },
    disabledChanged: function () {
        this.$.hourPickerButton.setDisabled(this.disabled);
        this.$.minutePickerButton.setDisabled(this.disabled);
        this.$.ampmPickerButton.setDisabled(this.disabled)
    },
    localeChanged: function () {
        this.is24HrMode = null;
        this.refresh()
    },
    is24HrModeChanged: function () {
        this.refresh()
    },
    valueChanged: function () {
        this.refresh()
    },
    updateHour: function (b, d) {
        var e = d.selected.value;
        if (!this.is24HrMode)
            var f = this.$.ampmPicker.getParent().controlAtIndex(0).content
                , e = e + (e == 12 ? -12 : 0) + (this.isAm(f) ? 0 : 12);
        return this.value = this.calcTime(e, this.value.getMinutes()),
            this.doSelect({
                name: this.name,
                value: this.value
            }),
            !0
    },
    updateMinute: function (b, d) {
        return this.value = this.calcTime(this.value.getHours(), d.selected.value),
            this.doSelect({
                name: this.name,
                value: this.value
            }),
            !0
    },
    updateAmPm: function (b, d) {
        var e = this.value.getHours();
        return this.is24HrMode || (e += e > 11 ? this.isAm(d.content) ? -12 : 0 : this.isAm(d.content) ? 0 : 12),
            this.value = this.calcTime(e, this.value.getMinutes()),
            this.doSelect({
                name: this.name,
                value: this.value
            }),
            !0
    },
    calcTime: function (b, d) {
        return new Date(this.value.getFullYear(), this.value.getMonth(), this.value.getDate(), b, d, this.value.getSeconds(), this.value.getMilliseconds())
    },
    isAm: function (b) {
        var d;
        try {
            d = this._tf.getAmCaption(),
                this._tf.getPmCaption()
        } catch (e) {
            d = "AM"
        }
        return b == d ? !0 : !1
    },
    refresh: function () {
        this.destroyClientControls();
        this.initDefaults();
        this.render()
    }
});
enyo.kind({
    name: "onyx.RadioButton",
    kind: "Button",
    classes: "onyx-radiobutton"
});
enyo.kind({
    name: "onyx.RadioGroup",
    kind: "Group",
    defaultKind: "onyx.RadioButton",
    highlander: !0
});
enyo.kind({
    name: "onyx.ToggleButton",
    classes: "onyx-toggle-button",
    published: {
        active: !1,
        value: !1,
        onContent: "On",
        offContent: "Off",
        disabled: !1
    },
    events: {
        onChange: ""
    },
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish"
    },
    components: [{
        name: "contentOn",
        classes: "onyx-toggle-content on"
    }, {
        name: "contentOff",
        classes: "onyx-toggle-content off"
    }, {
        classes: "onyx-toggle-button-knob"
    }],
    create: function () {
        this.inherited(arguments);
        this.value = Boolean(this.value || this.active);
        this.onContentChanged();
        this.offContentChanged();
        this.disabledChanged()
    },
    rendered: function () {
        this.inherited(arguments);
        this.updateVisualState()
    },
    updateVisualState: function () {
        this.addRemoveClass("off", !this.value);
        this.$.contentOn.setShowing(this.value);
        this.$.contentOff.setShowing(!this.value);
        this.setActive(this.value)
    },
    valueChanged: function () {
        this.updateVisualState();
        this.doChange({
            value: this.value
        })
    },
    activeChanged: function () {
        this.setValue(this.active);
        this.bubble("onActivate")
    },
    onContentChanged: function () {
        this.$.contentOn.setContent(this.onContent || "");
        this.$.contentOn.addRemoveClass("empty", !this.onContent)
    },
    offContentChanged: function () {
        this.$.contentOff.setContent(this.offContent || "");
        this.$.contentOff.addRemoveClass("empty", !this.onContent)
    },
    disabledChanged: function () {
        this.addRemoveClass("disabled", this.disabled)
    },
    updateValue: function (b) {
        this.disabled || this.setValue(b)
    },
    tap: function () {
        this.updateValue(!this.value)
    },
    dragstart: function (b, d) {
        if (d.horizontal)
            return d.preventDefault(),
                this.dragging = !0,
                this.dragged = !1,
                !0
    },
    drag: function (b, d) {
        if (this.dragging) {
            var e = d.dx;
            return Math.abs(e) > 10 && (this.updateValue(e > 0),
                this.dragged = !0),
                !0
        }
    },
    dragfinish: function (b, d) {
        this.dragging = !1;
        this.dragged && d.preventTap()
    }
});
enyo.kind({
    name: "onyx.ToggleIconButton",
    kind: "onyx.Icon",
    published: {
        active: !1,
        value: !1
    },
    events: {
        onChange: ""
    },
    classes: "onyx-icon-button onyx-icon-toggle",
    activeChanged: function () {
        this.addRemoveClass("active", this.value);
        this.bubble("onActivate")
    },
    updateValue: function (b) {
        this.disabled || (this.setValue(b),
            this.doChange({
                value: this.value
            }))
    },
    tap: function () {
        this.updateValue(!this.value)
    },
    valueChanged: function () {
        this.setActive(this.value)
    },
    create: function () {
        this.inherited(arguments);
        this.value = Boolean(this.value || this.active)
    },
    rendered: function () {
        this.inherited(arguments);
        this.valueChanged();
        this.removeClass("onyx-icon")
    }
});
enyo.kind({
    name: "onyx.Toolbar",
    classes: "onyx onyx-toolbar onyx-toolbar-inline",
    create: function () {
        this.inherited(arguments);
        this.hasClass("onyx-menu-toolbar") && enyo.platform.android >= 4 && this.applyStyle("position", "static")
    }
});
enyo.kind({
    name: "onyx.Tooltip",
    kind: "onyx.Popup",
    classes: "onyx-tooltip below left-arrow",
    autoDismiss: !1,
    showDelay: 500,
    defaultLeft: -6,
    handlers: {
        onRequestShowTooltip: "requestShow",
        onRequestHideTooltip: "requestHide"
    },
    requestShow: function () {
        return this.showJob = setTimeout(enyo.bind(this, "show"), this.showDelay),
            !0
    },
    cancelShow: function () {
        clearTimeout(this.showJob)
    },
    requestHide: function () {
        return this.cancelShow(),
            this.inherited(arguments)
    },
    showingChanged: function () {
        this.cancelShow();
        this.adjustPosition(!0);
        this.inherited(arguments)
    },
    applyPosition: function (b) {
        var d = "", e;
        for (e in b)
            d += e + ":" + b[e] + (isNaN(b[e]) ? "; " : "px; ");
        this.addStyles(d)
    },
    adjustPosition: function () {
        if (this.showing && this.hasNode()) {
            var b = this.node.getBoundingClientRect();
            b.top + b.height > window.innerHeight ? (this.addRemoveClass("below", !1),
                this.addRemoveClass("above", !0)) : (this.addRemoveClass("above", !1),
                    this.addRemoveClass("below", !0));
            b.left + b.width > window.innerWidth && (this.applyPosition({
                "margin-left": -b.width,
                bottom: "auto"
            }),
                this.addRemoveClass("left-arrow", !1),
                this.addRemoveClass("right-arrow", !0))
        }
    },
    resizeHandler: function () {
        this.applyPosition({
            "margin-left": this.defaultLeft,
            bottom: "auto"
        });
        this.addRemoveClass("left-arrow", !0);
        this.addRemoveClass("right-arrow", !1);
        this.adjustPosition(!0);
        this.inherited(arguments)
    }
});
enyo.kind({
    name: "onyx.TooltipDecorator",
    defaultKind: "onyx.Button",
    classes: "onyx-popup-decorator",
    handlers: {
        onenter: "enter",
        onleave: "leave"
    },
    enter: function () {
        this.requestShowTooltip()
    },
    leave: function () {
        this.requestHideTooltip()
    },
    tap: function () {
        this.requestHideTooltip()
    },
    requestShowTooltip: function () {
        this.waterfallDown("onRequestShowTooltip")
    },
    requestHideTooltip: function () {
        this.waterfallDown("onRequestHideTooltip")
    }
});
enyo.kind({
    name: "onyx.ProgressBar",
    classes: "onyx-progress-bar",
    published: {
        progress: 0,
        min: 0,
        max: 100,
        barClasses: "",
        showStripes: !0,
        animateStripes: !0
    },
    events: {
        onAnimateProgressFinish: ""
    },
    components: [{
        name: "progressAnimator",
        kind: "Animator",
        onStep: "progressAnimatorStep",
        onEnd: "progressAnimatorComplete"
    }, {
        name: "bar",
        classes: "onyx-progress-bar-bar"
    }],
    create: function () {
        this.inherited(arguments);
        this.progressChanged();
        this.barClassesChanged();
        this.showStripesChanged();
        this.animateStripesChanged()
    },
    barClassesChanged: function (b) {
        this.$.bar.removeClass(b);
        this.$.bar.addClass(this.barClasses)
    },
    showStripesChanged: function () {
        this.$.bar.addRemoveClass("striped", this.showStripes)
    },
    animateStripesChanged: function () {
        this.$.bar.addRemoveClass("animated", this.animateStripes)
    },
    progressChanged: function () {
        this.progress = this.clampValue(this.min, this.max, this.progress);
        this.updateBarPosition(this.calcPercent(this.progress))
    },
    clampValue: function (b, d, e) {
        return Math.max(b, Math.min(e, d))
    },
    calcRatio: function (b) {
        return (b - this.min) / (this.max - this.min)
    },
    calcPercent: function (b) {
        return this.calcRatio(b) * 100
    },
    updateBarPosition: function (b) {
        this.$.bar.applyStyle("width", b + "%")
    },
    animateProgressTo: function (b) {
        this.$.progressAnimator.play({
            startValue: this.progress,
            endValue: b,
            node: this.hasNode()
        })
    },
    progressAnimatorStep: function (b) {
        return this.setProgress(b.value),
            !0
    },
    progressAnimatorComplete: function (b) {
        return this.doAnimateProgressFinish(b),
            !0
    }
});
enyo.kind({
    name: "onyx.ProgressButton",
    kind: "onyx.ProgressBar",
    classes: "onyx-progress-button",
    events: {
        onCancel: ""
    },
    components: [{
        name: "progressAnimator",
        kind: "Animator",
        onStep: "progressAnimatorStep",
        onEnd: "progressAnimatorComplete"
    }, {
        name: "bar",
        classes: "onyx-progress-bar-bar onyx-progress-button-bar"
    }, {
        name: "client",
        classes: "onyx-progress-button-client"
    }, {
        kind: "onyx.Icon",
        src: "$lib/onyx/images/progress-button-cancel.png",
        classes: "onyx-progress-button-icon",
        ontap: "cancelTap"
    }],
    cancelTap: function () {
        this.doCancel()
    }
});
enyo.kind({
    name: "onyx.Scrim",
    showing: !1,
    classes: "onyx-scrim enyo-fit",
    floating: !1,
    create: function () {
        this.inherited(arguments);
        this.zStack = [];
        this.floating && this.setParent(enyo.floatingLayer)
    },
    showingChanged: function () {
        this.floating && this.showing && !this.hasNode() && this.render();
        this.inherited(arguments)
    },
    addZIndex: function (b) {
        enyo.indexOf(b, this.zStack) < 0 && this.zStack.push(b)
    },
    removeZIndex: function (b) {
        enyo.remove(b, this.zStack)
    },
    showAtZIndex: function (b) {
        this.addZIndex(b);
        b !== void 0 && this.setZIndex(b);
        this.show()
    },
    hideAtZIndex: function (b) {
        this.removeZIndex(b);
        this.zStack.length ? this.setZIndex(this.zStack[this.zStack.length - 1]) : this.hide()
    },
    setZIndex: function (b) {
        this.zIndex = b;
        this.applyStyle("z-index", b)
    },
    make: function () {
        return this
    }
});
enyo.kind({
    name: "onyx.scrimSingleton",
    kind: null,
    constructor: function (b, d) {
        this.instanceName = b;
        enyo.setObject(this.instanceName, this);
        this.props = d || {}
    },
    make: function () {
        var b = new onyx.Scrim(this.props);
        return enyo.setObject(this.instanceName, b),
            b
    },
    showAtZIndex: function (b) {
        this.make().showAtZIndex(b)
    },
    hideAtZIndex: enyo.nop,
    show: function () {
        this.make().show()
    }
});
new onyx.scrimSingleton("onyx.scrim", {
    floating: !0,
    classes: "onyx-scrim-translucent"
});
new onyx.scrimSingleton("onyx.scrimTransparent", {
    floating: !0,
    classes: "onyx-scrim-transparent"
});
enyo.kind({
    name: "onyx.Slider",
    kind: "onyx.ProgressBar",
    classes: "onyx-slider",
    published: {
        value: 0,
        lockBar: !0,
        tappable: !0
    },
    events: {
        onChange: "",
        onChanging: "",
        onAnimateFinish: ""
    },
    showStripes: !1,
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish"
    },
    moreComponents: [{
        kind: "Animator",
        onStep: "animatorStep",
        onEnd: "animatorComplete"
    }, {
        classes: "onyx-slider-taparea"
    }, {
        name: "knob",
        classes: "onyx-slider-knob"
    }],
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.moreComponents);
        this.valueChanged()
    },
    valueChanged: function () {
        this.value = this.clampValue(this.min, this.max, this.value);
        this.updateKnobPosition(this.calcPercent(this.value));
        this.lockBar && this.setProgress(this.value)
    },
    updateKnobPosition: function (b) {
        this.$.knob.applyStyle("left", b + "%")
    },
    calcKnobPosition: function (b) {
        return (b.clientX - this.hasNode().getBoundingClientRect().left) / this.getBounds().width * (this.max - this.min) + this.min
    },
    dragstart: function (b, d) {
        if (d.horizontal)
            return d.preventDefault(),
                this.dragging = !0,
                !0
    },
    drag: function (b, d) {
        if (this.dragging)
            return this.setValue(this.calcKnobPosition(d)),
                this.doChanging({
                    value: this.value
                }),
                !0
    },
    dragfinish: function (b, d) {
        return this.dragging = !1,
            d.preventTap(),
            this.doChange({
                value: this.value
            }),
            !0
    },
    tap: function (b, d) {
        if (this.tappable) {
            var e = this.calcKnobPosition(d);
            return this.tapped = !0,
                this.animateTo(e),
                !0
        }
    },
    animateTo: function (b) {
        this.$.animator.play({
            startValue: this.value,
            endValue: b,
            node: this.hasNode()
        })
    },
    animatorStep: function (b) {
        return this.setValue(b.value),
            !0
    },
    animatorComplete: function (b) {
        return this.tapped && (this.tapped = !1,
            this.doChange({
                value: this.value
            })),
            this.doAnimateFinish(b),
            !0
    }
});
enyo.kind({
    name: "onyx.RangeSlider",
    kind: "onyx.ProgressBar",
    classes: "onyx-slider",
    published: {
        rangeMin: 0,
        rangeMax: 100,
        rangeStart: 0,
        rangeEnd: 100,
        increment: 0,
        beginValue: 0,
        endValue: 0
    },
    events: {
        onChange: "",
        onChanging: ""
    },
    showStripes: !1,
    showLabels: !1,
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish",
        ondown: "down"
    },
    moreComponents: [{
        name: "startKnob",
        classes: "onyx-slider-knob"
    }, {
        name: "endKnob",
        classes: "onyx-slider-knob onyx-range-slider-knob"
    }],
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.moreComponents);
        this.initControls()
    },
    rendered: function () {
        this.inherited(arguments);
        this.updateBarPosition(this.calcPercent(this.beginValue))
    },
    initControls: function () {
        this.$.bar.applyStyle("position", "relative");
        this.refreshRangeSlider();
        this.showLabels && (this.$.startKnob.createComponent({
            name: "startLabel",
            kind: "onyx.RangeSliderKnobLabel"
        }),
            this.$.endKnob.createComponent({
                name: "endLabel",
                kind: "onyx.RangeSliderKnobLabel"
            }))
    },
    refreshRangeSlider: function () {
        this.beginValue = this.calcKnobPercent(this.rangeStart);
        this.endValue = this.calcKnobPercent(this.rangeEnd);
        this.beginValueChanged();
        this.endValueChanged()
    },
    calcKnobRatio: function (b) {
        return (b - this.rangeMin) / (this.rangeMax - this.rangeMin)
    },
    calcKnobPercent: function (b) {
        return this.calcKnobRatio(b) * 100
    },
    beginValueChanged: function (b) {
        b === void 0 && this.updateKnobPosition(this.calcPercent(this.beginValue), this.$.startKnob)
    },
    endValueChanged: function (b) {
        b === void 0 && this.updateKnobPosition(this.calcPercent(this.endValue), this.$.endKnob)
    },
    calcKnobPosition: function (b) {
        return (b.clientX - this.hasNode().getBoundingClientRect().left) / this.getBounds().width * (this.max - this.min) + this.min
    },
    updateKnobPosition: function (b, d) {
        d.applyStyle("left", b + "%");
        this.updateBarPosition()
    },
    updateBarPosition: function () {
        if (this.$.startKnob !== void 0 && this.$.endKnob !== void 0) {
            var b = this.calcKnobPercent(this.rangeStart)
                , d = this.calcKnobPercent(this.rangeEnd) - b;
            this.$.bar.applyStyle("left", b + "%");
            this.$.bar.applyStyle("width", d + "%")
        }
    },
    calcIncrement: function (b) {
        return Math.ceil(b / this.increment) * this.increment
    },
    calcRangeRatio: function (b) {
        return b / 100 * (this.rangeMax - this.rangeMin) + this.rangeMin - this.increment / 2
    },
    swapZIndex: function (b) {
        b === "startKnob" ? (this.$.startKnob.applyStyle("z-index", 1),
            this.$.endKnob.applyStyle("z-index", 0)) : b === "endKnob" && (this.$.startKnob.applyStyle("z-index", 0),
                this.$.endKnob.applyStyle("z-index", 1))
    },
    down: function (b) {
        this.swapZIndex(b.name)
    },
    dragstart: function (b, d) {
        if (d.horizontal)
            return d.preventDefault(),
                this.dragging = !0,
                !0
    },
    drag: function (b, d) {
        if (this.dragging) {
            var e = this.calcKnobPosition(d);
            if (b.name === "startKnob" && e >= 0) {
                if (e <= this.endValue && d.xDirection === -1 || e <= this.endValue) {
                    this.setBeginValue(e);
                    var e = this.calcRangeRatio(this.beginValue)
                        , e = this.increment ? this.calcIncrement(e) : e
                        , f = this.calcKnobPercent(e);
                    this.updateKnobPosition(f, this.$.startKnob);
                    this.setRangeStart(e);
                    this.doChanging({
                        value: e
                    })
                }
            } else if (b.name === "endKnob" && e <= 100 && (e >= this.beginValue && d.xDirection === 1 || e >= this.beginValue))
                this.setEndValue(e),
                    e = this.calcRangeRatio(this.endValue),
                    e = this.increment ? this.calcIncrement(e) : e,
                    f = this.calcKnobPercent(e),
                    this.updateKnobPosition(f, this.$.endKnob),
                    this.setRangeEnd(e),
                    this.doChanging({
                        value: e
                    });
            return !0
        }
    },
    dragfinish: function (b, d) {
        this.dragging = !1;
        d.preventTap();
        if (b.name === "startKnob") {
            var e = this.calcRangeRatio(this.beginValue);
            this.doChange({
                value: e,
                startChanged: !0
            })
        } else
            b.name === "endKnob" && (e = this.calcRangeRatio(this.endValue),
                this.doChange({
                    value: e,
                    startChanged: !1
                }));
        return !0
    },
    rangeMinChanged: function () {
        this.refreshRangeSlider()
    },
    rangeMaxChanged: function () {
        this.refreshRangeSlider()
    },
    rangeStartChanged: function () {
        this.refreshRangeSlider()
    },
    rangeEndChanged: function () {
        this.refreshRangeSlider()
    },
    setStartLabel: function (b) {
        this.$.startKnob.waterfallDown("onSetLabel", b)
    },
    setEndLabel: function (b) {
        this.$.endKnob.waterfallDown("onSetLabel", b)
    }
});
enyo.kind({
    name: "onyx.RangeSliderKnobLabel",
    classes: "onyx-range-slider-label",
    handlers: {
        onSetLabel: "setLabel"
    },
    setLabel: function (b, d) {
        this.setContent(d)
    }
});
enyo.kind({
    name: "onyx.Item",
    classes: "onyx-item",
    tapHighlight: !0,
    handlers: {
        onhold: "hold",
        onrelease: "release"
    },
    hold: function (b, d) {
        this.tapHighlight && onyx.Item.addFlyweightClass(this.controlParent || this, "onyx-highlight", d)
    },
    release: function (b, d) {
        this.tapHighlight && onyx.Item.removeFlyweightClass(this.controlParent || this, "onyx-highlight", d)
    },
    statics: {
        addFlyweightClass: function (b, d, e, f) {
            var g = e.flyweight;
            g && (g.performOnRow(f !== void 0 ? f : e.index, function () {
                b.hasClass(d) ? b.setClassAttribute(b.getClassAttribute()) : b.addClass(d)
            }),
                b.removeClass(d))
        },
        removeFlyweightClass: function (b, d, e, f) {
            var g = e.flyweight;
            g && g.performOnRow(f !== void 0 ? f : e.index, function () {
                b.hasClass(d) ? b.removeClass(d) : b.setClassAttribute(b.getClassAttribute())
            })
        }
    }
});
enyo.kind({
    name: "onyx.Spinner",
    classes: "onyx-spinner",
    stop: function () {
        this.setShowing(!1)
    },
    start: function () {
        this.setShowing(!0)
    },
    toggle: function () {
        this.setShowing(!this.getShowing())
    }
});
enyo.kind({
    name: "onyx.MoreToolbar",
    classes: "onyx-toolbar onyx-more-toolbar",
    menuClass: "",
    movedClass: "",
    layoutKind: "FittableColumnsLayout",
    noStretch: !0,
    handlers: {
        onHide: "reflow"
    },
    published: {
        clientLayoutKind: "FittableColumnsLayout"
    },
    tools: [{
        name: "client",
        noStretch: !0,
        fit: !0,
        classes: "onyx-toolbar-inline"
    }, {
        name: "nard",
        kind: "onyx.MenuDecorator",
        showing: !1,
        onActivate: "activated",
        components: [{
            kind: "onyx.IconButton",
            classes: "onyx-more-button"
        }, {
            name: "menu",
            kind: "onyx.Menu",
            scrolling: !1,
            classes: "onyx-more-menu"
        }]
    }],
    initComponents: function () {
        this.menuClass && this.menuClass.length > 0 && !this.$.menu.hasClass(this.menuClass) && this.$.menu.addClass(this.menuClass);
        this.createChrome(this.tools);
        this.inherited(arguments);
        this.$.client.setLayoutKind(this.clientLayoutKind)
    },
    clientLayoutKindChanged: function () {
        this.$.client.setLayoutKind(this.clientLayoutKind)
    },
    reflow: function () {
        this.inherited(arguments);
        this.isContentOverflowing() ? (this.$.nard.show(),
            this.popItem() && this.reflow()) : this.tryPushItem() ? this.reflow() : this.$.menu.children.length || (this.$.nard.hide(),
                this.$.menu.hide())
    },
    activated: function (b, d) {
        this.addRemoveClass("active", d.originator.active)
    },
    popItem: function () {
        var b = this.findCollapsibleItem();
        if (b) {
            this.movedClass && this.movedClass.length > 0 && !b.hasClass(this.movedClass) && b.addClass(this.movedClass);
            this.$.menu.addChild(b, null);
            var d = this.$.menu.hasNode();
            return d && b.hasNode() && b.insertNodeInParent(d),
                !0
        }
    },
    pushItem: function () {
        var b = this.$.menu.children[0];
        if (b) {
            this.movedClass && this.movedClass.length > 0 && b.hasClass(this.movedClass) && b.removeClass(this.movedClass);
            this.$.client.addChild(b);
            var d = this.$.client.hasNode();
            if (d && b.hasNode()) {
                for (var e, f, g = 0; g < this.$.client.children.length; g++) {
                    var i = this.$.client.children[g];
                    if (i.toolbarIndex !== void 0 && i.toolbarIndex != g) {
                        e = i;
                        f = g;
                        break
                    }
                }
                e && e.hasNode() ? (b.insertNodeInParent(d, e.node),
                    b = this.$.client.children.pop(),
                    this.$.client.children.splice(f, 0, b)) : b.appendNodeToParent(d)
            }
            return !0
        }
    },
    tryPushItem: function () {
        if (this.pushItem()) {
            if (!this.isContentOverflowing())
                return !0;
            this.popItem()
        }
    },
    isContentOverflowing: function () {
        if (this.$.client.hasNode()) {
            var b = this.$.client.children;
            if (b = b[b.length - 1].hasNode())
                return this.$.client.reflow(),
                    b.offsetLeft + b.offsetWidth > this.$.client.node.clientWidth
        }
    },
    findCollapsibleItem: function () {
        for (var b = this.$.client.children, d = b.length - 1; c = b[d]; d--) {
            if (!c.unmoveable)
                return c;
            c.toolbarIndex === void 0 && (c.toolbarIndex = d)
        }
    }
});
enyo.kind({
    name: "onyx.custom.SelectDecorator",
    classes: "onyx-button select-decorator",
    handlers: {
        onchange: "changeHandler"
    },
    published: {
        disabled: !1,
        showCaption: !0,
        showArrow: !0,
        icon: ""
    },
    showCaptionChanged: function () {
        this.$.innerText.setShowing(this.showCaption);
        this.addRemoveClass("select-decorator-no-caption", !this.showCaption)
    },
    disabledChanged: function () {
        this.addRemoveClass("select-decorator-disabled", this.disabled)
    },
    showArrowChanged: function () {
        this.addRemoveClass("select-decorator-no-arrow", !this.showArrow)
    },
    iconChanged: function () {
        this.$.innerIcon.setStyle("background-image: url('" + this.icon + "')");
        this.$.innerIcon.setShowing(this.icon !== "")
    },
    create: function () {
        this.inherited(arguments);
        this.disabledChanged();
        this.showCaptionChanged();
        this.showArrowChanged();
        this.iconChanged()
    },
    rendered: function () {
        this.inherited(arguments);
        var b = this.getClientControls()[0];
        b && this.changeHandler(b)
    },
    changeHandler: function (b) {
        this.$.innerText.setContent(b.getControls()[b.getSelected()].getContent())
    },
    components: [{
        classes: "select-decorator-inner",
        components: [{
            classes: "select-decorator-inner-arrow"
        }, {
            name: "innerIcon",
            classes: "select-decorator-inner-icon"
        }, {
            name: "innerText",
            fit: !0,
            classes: "select-decorator-inner-text"
        }]
    }]
});
(function () {
    var b = {};
    b._zaisan = "version 1.3";
    b._topic = "jms.topic.";
    b._queue = "jms.queue.";
    b._ord = "order";
    b._ss = "stocksummary";
    b._info = "marketinfo";
    b._brokerrank = "trade.brokerrank";
    b._currency = "currency";
    b._gidx = "globalindices";
    b._comm = "commodities";
    b._fund = "fundamental";
    b._fut = "futures";
    b._ia = "trade.stockbyinvestor";
    b._idx = "indices";
    b._market = "trade.board";
    b._quote = "quote";
    b._stock = "stock";
    b._broker = "broker";
    b._tprice = "trade.byprice";
    b._tsector = "trade.sector";
    b._tsubsector = "trade.subsector";
    b._trade = "trade.live";
    b._snapr = "snapshotreply";
    b._snap = "snapshot";
    b._query = "query";
    b._hb = "heartbeat";
    b._admr = "adminreply";
    b._adm = "admin";
    b._body = "body";
    b._replyto = "replyto";
    b._module = "module";
    b._ttime = 200;
    b._feed = "feed.engine";
    b._news = "news";
    b._bbs = "trade.brokerbystock";
    b._sbb = "trade.stockbybroker";
    b._ts = "trade.stock";
    b._hol = "holiday";
    b._trdquery = "trading.query";
    b._trading = "trading";
    b._zaisanwatch = "zaisan.watch";
    b._quotedef = [["ADRO", ""], ["TLKM", ""], ["BBNI", ""], ["ASII", ""], ["BUMI", ""], ["WIKA", ""]];
    b._def_quote = "zaisan.def.quote";
    b._def_quoteopen = "zaisan.def.quote.open";
    b._def_quoteord = "zaisan.def.quote.ord";
    b._def_broker = "NI";
    b._def_trade = "zaisan.def.trade";
    b._def_ss = "zaisan.def.ss";
    b._def_br = "zaisan.def.br";
    b._def_md = "zaisan.def.md";
    b._def_ns = "zaisan.def.ns";
    b._def_cl = "zaisan.def.cl";
    b._def_qt = "zaisan.def.qt";
    b._def_ad = "zaisan.def.ad";
    b._def_fr = "zaisan.def.fr";
    b._def_cn = "zaisan.def.cn";
    b._def_ci = "zaisan.def.ci";
    b._def_ol = "zaisan.def.ol";
    b._def_tl = "zaisan.def.tl";
    b._def_wl = "zaisan.def.wl";
    b._def_pf = "zaisan.def.pf";
    b._def_sc = "zaisan.def.sc";
    b._def_mr = "zaisan.def.mr";
    b._def_tb = "zaisan.def.tb";
    b._def_ts = "zaisan.def.ts";
    b._def_fd = "zaisan.def.fd";
    b._def_c1 = "zaisan.def.c1";
    b._def_c2 = "zaisan.def.c2";
    b._def_wbanner = "window.def.banner";
    b._snapshot = "https://bions.id/snapshot.php";
    b._check = "check.php";
    b._emiten = "https://bions.id/emitenjsonp.php";
    b._def_type = "zaisan.def.type";
    b._url = "https://bions.id/zaisan/web/";
    b._urlfrm = "https://bions.id/zaisan/forum/";
    b._urlmutual = "https://fund.bions.id/";
    b._urlfrod = "https://bions.id/zaisan/web/";
    b._urlfrmfrod = "https://bions.id/zaisan/forum/";
    b._urlforum = "ws/user/login";
    b._urlforumout = "ws/user/logout";
    b._urlforumdata = "ws/forum/load";
    b._urldata = "ws/data/load";
    b._urlsearch = "ws/data/search";
    b._urlaggregate = "ws/data/aggregate";
    b._urlwebsite = "ws/website/load";
    b._urlsubmit = "ws/website/submit";
    b._urlreport = "ws/data/report";
    b._urltrial = "https://bnisekuritas.co.id/trialaccount/";
    b._urlfreetrial = "https://bnisekuritas.co.id/wp-content/plugins/trialaccount/?themes=light";
    b._urlregonline = "https://bnisekuritas.co.id/wp-content/plugins/regonline/?themes=light";
    b._urlchart = "highstock-ext/index.php";
    b._urlpromo = "https://bnisekuritas.co.id/lpmgm/";
    b._urlheatmap = "heatmap-ext/index.php";
    b._urlchartcompare = "highstock-compare/index.php";
    b._urlpiechart = "highchart/pie.php";
    b.Account = "1";
    b.AvgPx = "6";
    b.BeginSeqNo = "7";
    b.ClOrdID = "11";
    b.CumQty = "14";
    b.HandlInst = "21";
    b.LastPx = "31";
    b.LastShares = "32";
    b.OrderID = "37";
    b.OrderQty = "38";
    b.OrdStatus = "39";
    b.OrdType = "40";
    b.OrigClOrdID = "41";
    b.OrigTime = "42";
    b.Price = "44";
    b.Side = "54";
    b.Symbol = "55";
    b.Text = "58";
    b.TimeInForce = "59";
    b.TransactTime = "60";
    b.FutSettDate = "64";
    b.SymbolSfx = "65";
    b.TradeDate = "75";
    b.ExecBroker = "76";
    b.EncryptMethod = "98";
    b.StopPx = "99";
    b.HeartBtInt = "108";
    b.ClientID = "109";
    b.TestReqID = "112";
    b.GapFillFlag = "123";
    b.Headline = "148";
    b.ExecType = "150";
    b.LeavesQty = "151";
    b.EffectiveTime = "168";
    b.SecondaryOrderID = "198";
    b.SecurityTradingStatus = "326";
    b.TradingSessionID = "336";
    b.ContraTrader = "337";
    b.TradSesStatus = "340";
    b.ContraBroker = "375";
    b.ComplianceID = "376";
    b.NoContraBrokers = "382";
    b.ExpireDate = "432";
    b.CxlRejResponseTo = "434";
    b.ClearingAccount = "440";
    b.ContraAccount = "7001";
    b.ContraAccId = "7002";
    b.ContraComplienceID = "7003";
    b.tudUserID = "10001";
    b.tudPassword = "10002";
    b.tudNewPassword = "10003";
    b.tudCurrentTime = "10004";
    b.tudSubOrdID = "10005";
    b.tudCAC_ID = "10006";
    b.tudXCG_ID = "10007";
    b.InitialCode = "10095";
    b.ClAccID = "10006";
    b.CttID = "10061";
    b.ExchangeID = "10007";
    b.DirectID = "10008";
    b.SID = "376";
    b.tudSID = "10376";
    b.lotSize = 100;
    b.AlgoHeartbeat = "C0";
    b.AlgoNew = "CD";
    b.AlgoCancel = "CF";
    b.AlgoReport = "C8";
    b.AlgoReject = "C9";
    b.AlgoSymbol = "50055";
    b.AlgoBookingType = "50001";
    b.AlgoOperatorType = "50002";
    b.AlgoPriceType = "50003";
    b.AlgoPrice = "50044";
    b.AlgoTime = "50000";
    b.AlgoStatus = "50039";
    b.AlgoValidFrom = "50004";
    b.AlgoValidTo = "50005";
    b.AlgoSendAs = "50006";
    b.AlgoClCriteriaID = "50011";
    b.AlgoCriteriaID = "50037";
    b.AlgoTransacTime = "50060";
    b.AlgoServerStatus = "50007";
    b.AlgoServerTime = "50008";
    b.AlgoDescription = "50009";
    b.AlgoAccount = "50099";
    b.version = "build:20140630";
    var d = {};
    d.version = "mapping.broker";
    d[1] = "";
    d[2] = "";
    d[3] = "";
    d.getColor = function (b) {
        return d[1].indexOf(b) > -1 ? "green" : d[2].indexOf(b) > -1 ? "red" : "ungu-muda"
    }
        ;
    var e = {};
    e.ss = {};
    e.info = {};
    e.info[1] = !1;
    e.watch = {};
    e.idx = {};
    e.topstock = [];
    e.topbroker = [];
    e.tbval = [];
    e.tbvol = [];
    e.tbfrq = [];
    e.trade = [];
    e.orderbook = [];
    e.orderbooktemp = [];
    e.market = {};
    e.tprice = {};
    e.currency = {};
    e.target = {};
    e.target2 = {};
    e.comm = {};
    e.sector = {};
    e.subsector = {};
    e.fut = {};
    e.gi = {};
    e.stock = {};
    e.broker = {};
    e.bbs = {};
    e.sbb = {};
    e.stocklist = [];
    e.brokerlist = [];
    e.fd = null;
    e.holiday = {};
    e.SEC = {};
    e.OST = {};
    e.ATY = {};
    e.SEB = {};
    e.ASE = {};
    e.DWC = {};
    e.DWS = {};
    e.PRO = {};
    e.UMN = {};
    e.UGR = {};
    e.CUS = {};
    e.ACC = {};
    e.PFO = {};
    e.ORD = {};
    e.TRD = {};
    e.ID = [];
    e.IDCUS = [];
    e.ca = {};
    e.ca.A = "IPO";
    e.ca.B = "RUPS";
    e.ca.C = "Right Issue";
    e.ca.D = "Warrant";
    e.ca.E = "Stock Split";
    e.ca.F = "Reverse Stock";
    e.ca.G = "Cash Devidend";
    e.ca.H = "Stock Devidend";
    e.ca.I = "Bonus";
    e.ca.J = "Merger";
    e.ca.K = "Tender Offer";
    e.acc = {};
    e.pf = {};
    e.ord = {};
    e.trd = {};
    e.stock.nonSyariah = function (b) {
        b = e.stock[b];
        return b != null && b[15].indexOf("T") > -1 ? "" : "strike"
    }
        ;
    e.stock.isSyariah = function () {
        return bridge.getObj("type") == "Syariah"
    }
        ;
    e.stock.getSecColor = function (b) {
        return b == "1" ? "hijau-muda" : b == "2" ? "hijau-pupus" : b == "3" ? "merah-tua" : b == "4" ? "merah" : b == "5" ? "orange" : b == "6" ? "white" : b == "7" ? "biru" : b == "8" ? "biru-muda" : b == "9" ? "kuning" : "abuabu"
    }
        ;
    e.stock.getSecColorCode = function (b) {
        return b == "1" ? "#00b200" : b == "2" ? "#00ff00" : b == "3" ? "#b20000" : b == "4" ? "#FF0000" : b == "5" ? "#FF9900" : b == "6" ? "#FFFFFF" : b == "7" ? "#0066ff" : b == "8" ? "#00ffff" : b == "9" ? "#FFFF00" : "#b2b2b2"
    }
        ;
    e.stock.getSecDesc = function (b) {
        return b == "1" ? "Agri" : b == "2" ? "Mining" : b == "3" ? "Basic Ind" : b == "4" ? "Misc" : b == "5" ? "Consumer" : b == "6" ? "Property" : b == "7" ? "Infrastruc" : b == "8" ? "Finance" : b == "9" ? "Trade" : "Others"
    }
        ;
    e.stock.getColor = function (b) {
        b = e.stock[b];
        return e.stock.getSecColor(b != null ? b[14] : "")
    }
        ;
    e.ia = {};
    e.news = {};
    e.maxRow = 10;
    e.status = {};
    e.status.R0 = "Request Entry";
    e.status[0] = "Open";
    e.status[1] = "Partial Match";
    e.status[2] = "Full Match";
    e.status.T = "Temporary";
    e.status.RT = "Request Temp";
    e.status.RD = "Request Delete";
    e.status.D = "Delete";
    e.status[4] = "Withdraw";
    e.status[5] = "Amend";
    e.status.R4 = "Request Withdraw";
    e.status[8] = "Reject";
    e.status.R5 = "Request Amend";
    e.status.N5 = "New Order Amend";
    e.status.F = "Failed";
    e.algoStatus = {};
    e.algoStatus.R0 = "Request";
    e.algoStatus[0] = "Queuing";
    e.algoStatus[1] = "Executed";
    e.algoStatus[4] = "Cancelled";
    e.algoStatus.R4 = "Cancel request";
    e.algoStatus[8] = "Rejected";
    e.algoStatus.F = "Failed";
    e.hmetdStatus = {};
    e.hmetdStatus.R0 = "Entry";
    e.hmetdStatus[0] = "Request";
    e.hmetdStatus[1] = "Processing";
    e.hmetdStatus[2] = "Executed";
    e.hmetdStatus[4] = "Cancelled";
    e.hmetdStatus[8] = "Rejected";
    var f = {};
    f.set = function (b, d) {
        localStorage.setItem(b, d)
    }
        ;
    f.get = function (b, d) {
        var e = localStorage.getItem(b);
        return e == null ? d : e
    }
        ;
    f.remove = function (b) {
        localStorage.removeItem(b)
    }
        ;
    b.glue = function (b) {
        for (var d = [], e = 0; e < b.length; e++)
            d.push(b.charCodeAt(e));
        return d
    }
        ;
    b.unglue = function (b) {
        for (var d = "", e = 0; e < b.length; e++)
            d = d.concat(String.fromCharCode(b[e]));
        return d
    }
        ;
    window.Const = b;
    window.Store = e;
    window.mod = {
        version: "3.1.0"
    };
    window.broker = d;
    window.dbs = f
}
)(window);
var r = null;
(function (b) {
    core = b.core || {};
    var d = {};
    d.Ra = function (b, f) {
        return d.Sa(b, f)
    }
        ;
    d.Sa = function (b, d) {
        var g = {
            L: !1,
            id: 0,
            M: b,
            Ta: d
        };
        g.start = function () {
            g.La()
        }
            ;
        g.La = function () {
            g.L || (g.L = !0,
                g.id = setInterval(g.M, g.Ta))
        }
            ;
        g.stop = function () {
            g.Na()
        }
            ;
        g.Na = function () {
            g.L = !1;
            clearInterval(g.id)
        }
            ;
        var i = {};
        return i.start = g.start,
            i.stop = g.stop,
            i
    }
        ;
    core.Thread = d.Ra
}
)(window);
(function (b) {
    core = b.core || {};
    var d = {
        j: "idsub",
        s: "idmore",
        R: "selector",
        Q: "destination",
        _module: "module",
        _snapshot: "snapshot",
        H: "onlySnapshot",
        p: "running",
        C: "filter",
        e: "unique",
        ma: "store",
        _queue: "queue",
        z: "localThread",
        J: "singleReply",
        I: "page",
        t: "seqno",
        m: "session",
        G: "dirty"
    };
    d.module = function (b) {
        return d.Aa(b)
    }
        ;
    d.Aa = function (b) {
        var f = {}
            , g = {};
        return g[d.s] = "",
            g[d._snapshot] = !0,
            g[d.H] = !0,
            g[d.p] = !1,
            g[d.C] = "",
            g[d.J] = !1,
            g[d.I] = 0,
            g[d.t] = 0,
            g[d.G] = !0,
            f.Ka = function (b) {
                try {
                    g[d.Q] = b[0],
                        g[d._module] = b[1],
                        g[d.R] = b[2],
                        g[d.C] = b[3],
                        g[d.e] = b[4],
                        g[d.ma] = b[5],
                        g[d._snapshot] = b[6],
                        g[d.H] = b[7]
                } catch (e) { }
                g[d._queue] = []
            }
            ,
            g.sDirty = function () {
                return g[d.G]
            }
            ,
            g.setDirty = function (b) {
                g[d.G] = b
            }
            ,
            f.Ja = function () {
                if (g.run != r)
                    g.run();
                else if (g[d._queue].length > 0) {
                    for (var b = g[d._queue].splice(0, g[d._queue].length); b.length > 0;)
                        g.onMessageSplit(b.shift());
                    g.dirtyOn()
                }
            }
            ,
            g.dirtyOn = function () { }
            ,
            g.startThread = function () {
                f.Ma()
            }
            ,
            f.Ma = function () {
                g[d.z] == r && (g[d.z] = new core.Thread(f.Ja, Const._ttime),
                    g[d.z].start())
            }
            ,
            g.stopThread = function () {
                f.Oa()
            }
            ,
            f.Oa = function () {
                g[d.z].stop();
                g[d.z] = r
            }
            ,
            g.unsubscribe = function () {
                f.Va()
            }
            ,
            f.Va = function () {
                g[d.j] != r && (stomp.unsub(g[d.j]),
                    g[d.j] = r);
                g[d.s] != "" && (stomp.unsub(g[d.s]),
                    g[d.s] = "");
                g[d.p] = !1
            }
            ,
            f.ga = function (b) {
                if (g.reply != r)
                    g.reply(b);
                else
                    try {
                        var e = b.bucket[Const._body]
                            , k = e[7]
                            , l = e[4];
                        if (k != 0)
                            if (l == 1) {
                                for (var m = e[8], b = 0; b < m.length; b++)
                                    f.ba(m[b]);
                                stomp.unsub(g[d.j]);
                                f.v()
                            } else
                                f.ba(e[8]),
                                    e[6] == k && (stomp.unsub(g[d.j]),
                                        f.v());
                        else
                            stomp.unsub(g[d.j]),
                                f.v()
                    } catch (w) {
                        stomp.unsub(g[d.j]),
                            f.v()
                    }
            }
            ,
            f.Ca = function (b) {
                try {
                    var d = b.bucket[Const._body]
                        , e = d[7]
                        , g = d[4];
                    if (e != 0)
                        if (g == 1)
                            for (var m = d[8], b = 0; b < m.length; b++)
                                f.ca(m[b]);
                        else
                            f.ca(d[8]),
                                d[6] == e && f.v()
                } catch (w) { }
            }
            ,
            f.v = function () {
                g.begin != r ? g.begin() : g[d.j] = g[d.H] ? r : stomp.sub(g[d.Q], g[d.R], f.Ga)
            }
            ,
            g.doStart = function () {
                g.permanent != r ? f.ra() : f.sa()
            }
            ,
            f.ra = function () {
                g[d.p] || (g[d.p] = !0,
                    g[d.m] = stomp.getSession(),
                    g[d.j] = stomp.sub(Const._topic + g[d.m] + "." + ("" == g[d.e] ? g[d._module] : g[d.e]), {}, f.ga))
            }
            ,
            f.sa = function () {
                g[d.p] || (g[d.p] = !0,
                    g[d.m] = stomp.getSession(),
                    g[d._snapshot] ? (g[d.j] = stomp.sub(Const._topic + g[d.m] + "." + ("" == g[d.e] ? g[d._module] : g[d.e]), {}, f.ga),
                        f.Pa()) : f.v())
            }
            ,
            f.gb = function (b) {
                g[d.j] = b
            }
            ,
            g.refresh = function () { }
            ,
            g.moreSnapshot = function () {
                f.Ba()
            }
            ,
            f.Ba = function () {
                "" == g[d.s] && (g[d.s] = stomp.sub(Const._topic + g[d.m] + ".mss." + ("" == g[d.e] ? g[d._module] : g[d.e]), {}, f.Ca));
                f.Qa()
            }
            ,
            f.hb = function (b) {
                g[d.s] = b
            }
            ,
            f.Qa = function () {
                var b = Array(8);
                b[0] = 11;
                b[1] = g[d.m];
                b[2] = "" == g[d.e] ? g[d._module] : g[d.e];
                b[3] = g[d._module];
                b[4] = g[d.J];
                b[5] = g[d.t];
                b[6] = g[d.C];
                b[7] = g[d.I];
                var e = {};
                e[Const._body] = b;
                e[Const._replyto] = Const._topic + g[d.m] + ".mss." + ("" == g[d.e] ? g[d._module] : g[d.e]);
                stomp.send(Const._queue + Const._snap, e)
            }
            ,
            f.Pa = function () {
                if (g.subscribe != r)
                    g.subscribe();
                else {
                    var b = Array(8);
                    b[0] = 11;
                    b[1] = g[d.m];
                    b[2] = "" == g[d.e] ? g[d._module] : g[d.e];
                    b[3] = g[d._module];
                    b[4] = g[d.J];
                    b[5] = g[d.t];
                    b[6] = g[d.C];
                    b[7] = g[d.I];
                    var e = {};
                    e[Const._body] = b;
                    e[Const._replyto] = Const._topic + g[d.m] + "." + ("" == g[d.e] ? g[d._module] : g[d.e]);
                    stomp.send(Const._queue + Const._snap, e)
                }
            }
            ,
            g.exit = function () {
                f.va()
            }
            ,
            f.va = function () {
                g[d.p] && (g[d.p] = !1,
                    g.stopThread())
            }
            ,
            g.doStop = function () {
                f.ta()
            }
            ,
            f.ta = function () {
                g.unsubscribe();
                g[d.t] = 0;
                g[d._queue].splice(0, g[d._queue].length)
            }
            ,
            g.doRestart = function () {
                g.doStop();
                g.doStart()
            }
            ,
            g.updateSeqno = function (b) {
                f.Wa(b)
            }
            ,
            f.Wa = function (b) {
                g[d.t] = g[d.t] == 0 ? b : Math.min(g[d.t], b)
            }
            ,
            g.onMessageSplit = function () { }
            ,
            g.getKeys = function () {
                return r
            }
            ,
            f.Ga = function (b) {
                try {
                    g[d._queue].push(b.bucket[Const._body])
                } catch (e) { }
            }
            ,
            f.ba = function (b) {
                g.onData != r ? g.onData(b) : g[d._queue].push(b)
            }
            ,
            f.ca = function (b) {
                g.onDataMore != r ? g.onDataMore(b) : g[d._queue].push(b)
            }
            ,
            f.Ka(b),
            g.startThread(),
            g
    }
        ;
    core.Module = d.module
}
)(window);
(function () {
    var b = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    Math.uuid = function (d, e) {
        var f = [], g, e = e || b.length;
        if (d)
            for (g = 0; g < d; g++)
                f[g] = b[0 | Math.random() * e];
        else {
            var i;
            f[8] = f[13] = f[18] = f[23] = "-";
            f[14] = "4";
            for (g = 0; g < 36; g++)
                f[g] || (i = 0 | Math.random() * 16,
                    f[g] = b[g == 19 ? i & 3 | 8 : i])
        }
        return f.join("")
    }
        ;
    Math.jb = function () {
        for (var d = Array(36), e = 0, f, g = 0; g < 36; g++)
            g == 8 || g == 13 || g == 18 || g == 23 ? d[g] = "-" : g == 14 ? d[g] = "4" : (e <= 2 && (e = 33554432 + Math.random() * 16777216 | 0),
                f = e & 15,
                e >>= 4,
                d[g] = b[g == 19 ? f & 3 | 8 : f]);
        return d.join("")
    }
        ;
    Math.ib = function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (b) {
            var e = Math.random() * 16 | 0;
            return (b == "x" ? e : e & 3 | 8).toString(16)
        })
    }
}
)();

window.k = function (b, d) {
    if (!b || isNaN(+d))
        return d;
    var d = b.charAt(0) == "-" ? -d : +d
        , e = d < 0 ? d = -d : 0
        , f = b.match(/[^\d\-\+#]/g)
        , g = f && f[f.length - 1] || "."
        , f = f && f[1] && f[0] || ","
        , b = b.split(g)
        , d = d.toFixed(b[1] && b[1].length)
        , d = +d + ""
        , i = b[1] && b[1].lastIndexOf("0")
        , j = d.split(".");
    if (!j[1] || j[1] && j[1].length <= i)
        d = (+d).toFixed(i + 1);
    i = b[0].split(f);
    b[0] = i.join("");
    var k = b[0] && b[0].indexOf("0");
    if (k > -1)
        for (; j[0].length < b[0].length - k;)
            j[0] = "0" + j[0];
    else
        +j[0] == 0 && (j[0] = "");
    d = d.split(".");
    d[0] = j[0];
    if (j = i[1] && i[i.length - 1].length) {
        for (var i = d[0], k = "", l = i.length % j, m = 0, w = i.length; m < w; m++)
            k += i.charAt(m),
                !((m - l + 1) % j) && m < w - j && (k += f);
        d[0] = k
    }
    return d[1] = b[1] && d[1] ? g + d[1] : "",
        (e ? "-" : "") + d[0] + d[1]
}
    ;
window.lpad = function (b, d, e) {
    for (var f = b.toString(), b = b.length + 1; b <= d; b++)
        f = e + f;
    return f
}
    ;
window.numformat = function (b) {
    return window.k("#,##0 ", b)
}
    ;
window.numformat2 = function (b) {
    return window.k("#,##0.##", b)
}
    ;
window.money = function (b) {
    return Math.abs(b) > 1E9 ? window.k("#,##0.###", b / 1E9) + "B" : Math.abs(b) > 1E6 ? window.k("#,##0.###", b / 1E6) + "M" : window.k("#,##0 ", b)
}
    ;
window.money2 = function (b) {
    return Math.abs(b) > 1E9 ? window.k("#,##0.###", b / 1E9) + "B" : Math.abs(b) > 1E6 ? window.k("#,##0.###", b / 1E6) + "M" : window.k("#,##0.##", b)
}
    ;
window.money3 = function (b) {
    return Math.abs(b) > 1E9 ? window.k("#,##0.000", b / 1E9) + "B" : Math.abs(b) > 1E6 ? window.k("#,##0.000", b / 1E6) + "M" : window.k("#,##0.000", b)
}
    ;
window.foreign = function (b) {
    return b == "F" ? "orange" : "biru"
}
    ;
window.updown = function (b, d) {
    return b > d ? "green" : b < d ? "red" : "orange"
}
    ;
window.updownRound = function (b, d) {
    return b > d ? "greenround" : b < d ? "redround" : "orangeround"
}
    ;
window.updownArrow = function (b, d) {
    return b > d ? "up" : b < d ? "down" : "flat"
}
    ;
window.updownImg = function (b, d) {
    return b > d ? "upimg" : b < d ? "downimg" : "flatimg"
}
    ;
window.updownImgBig = function (b, d) {
    return b > d ? "upimg-big" : b < d ? "downimg-big" : "flatimg-big"
}
    ;
window.changeColor = function (b, d, e) {
    b.addRemoveClass("green", d > e);
    b.addRemoveClass("red", d < e);
    b.addRemoveClass("orange", d == e)
}
    ;
window.changeImg = function (b, d, e) {
    b.addRemoveClass("upimg", d > e);
    b.addRemoveClass("downimg", d < e);
    b.addRemoveClass("flatimg", d == e)
}
    ;
window.changeImgBig = function (b, d, e) {
    b.addRemoveClass("upimg-big", d > e);
    b.addRemoveClass("downimg-big", d < e);
    b.addRemoveClass("flatimg-big", d == e)
}
    ;
window.net = function (b, d) {
    return b > d ? "red" : b < d ? "green" : "orange"
}
    ;
window.BrowserDetect = {
    init: function () {
        this.browser = this.ea(this.pa) || "An unknown browser";
        this.version = this.fa(navigator.userAgent) || this.fa(navigator.appVersion) || "an unknown version";
        this.OS = this.ea(this.qa) || "an unknown OS"
    },
    ea: function (b) {
        for (var d = 0; d < b.length; d++) {
            var e = b[d].f
                , f = b[d].Ha;
            this.ka = b[d].w || b[d].d;
            if (e) {
                if (e.indexOf(b[d].g) != -1)
                    return b[d].d
            } else if (f)
                return b[d].d
        }
    },
    fa: function (b) {
        var d = b.indexOf(this.ka);
        return d == -1 ? void 0 : parseFloat(b.substring(d + this.ka.length + 1))
    },
    pa: [{
        f: navigator.userAgent,
        g: "Chrome",
        d: "Chrome"
    }, {
        f: navigator.userAgent,
        g: "OmniWeb",
        w: "OmniWeb/",
        d: "OmniWeb"
    }, {
        f: navigator.vendor,
        g: "Apple",
        d: "Safari",
        w: "Version"
    }, {
        Ha: window.opera,
        d: "Opera",
        w: "Version"
    }, {
        f: navigator.vendor,
        g: "iCab",
        d: "iCab"
    }, {
        f: navigator.vendor,
        g: "KDE",
        d: "Konqueror"
    }, {
        f: navigator.userAgent,
        g: "Firefox",
        d: "Firefox"
    }, {
        f: navigator.vendor,
        g: "Camino",
        d: "Camino"
    }, {
        f: navigator.userAgent,
        g: "Netscape",
        d: "Netscape"
    }, {
        f: navigator.userAgent,
        g: "MSIE",
        d: "Explorer",
        w: "MSIE"
    }, {
        f: navigator.userAgent,
        g: "Gecko",
        d: "Mozilla",
        w: "rv"
    }, {
        f: navigator.userAgent,
        g: "Mozilla",
        d: "Netscape",
        w: "Mozilla"
    }],
    qa: [{
        f: navigator.platform,
        g: "Win",
        d: "Windows"
    }, {
        f: navigator.platform,
        g: "Mac",
        d: "Mac"
    }, {
        f: navigator.userAgent,
        g: "iPhone",
        d: "iPhone/iPod"
    }, {
        f: navigator.platform,
        g: "Linux",
        d: "Linux"
    }]
};
BrowserDetect.init();
window.since = function (b) {
    var d = ""
        , b = new Date(b)
        , d = new Date
        , e = Math.round((d - b) / 6E4);
    return e == 0 ? (b = Math.round((d - b) / 1E3),
        d = b < 10 ? "about 10s ago" : b < 20 ? "about 20s ago" : "30s ago") : e == 1 ? (b = Math.round((d - b) / 1E3),
            d = b == 30 ? "30s ago" : b < 60 ? "about 1m ago" : "1m ago") : e < 45 ? d = e + "m ago" : e > 44 && e < 60 ? d = "about 1h ago" : e < 1440 ? (b = Math.round(e / 60),
                d = b == 1 ? "about 1h ago" : "about " + b + "h ago") : e > 1439 && e < 2880 ? d = "1 day ago" : (d = Math.round(e / 1440),
                    d = d < 30 ? d + " days ago" : b.getFullYear() + "/" + (b.getMonth() + 1) + "/" + b.getDate()),
        d
}
    ;
Date.prototype.format = function (b) {
    var d = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        S: this.getMilliseconds()
    };
    /(y+)/.test(b) && (b = b.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)));
    for (var e in d)
        RegExp("(" + e + ")").test(b) && (b = b.replace(RegExp.$1, RegExp.$1.length == 1 ? d[e] : ("00" + d[e]).substr(("" + d[e]).length)));
    return b
}
    ;
var p = null;

window.trim = function (b) {
    return b.replace(/^\s+/g, "").replace(/\s+$/g, "")
}
    ;
window.fixfield = function (b) {
    var d = {};
    return d.e = String.fromCharCode(1),
        d.q = {},
        d.na = "8=FIX.4.2" + d.e + "9=34" + d.e + "35=" + b + d.e,
        d.sa = "10=144",
        d.type = b,
        d.set = function (b, f) {
            d.q[b] = f
        }
        ,
        d.get = function (b) {
            return d.q[b]
        }
        ,
        d.getType = function () {
            return d.type
        }
        ,
        d.toString = function () {
            var b = d.na, f;
            for (f in d.q)
                b = b.concat(f).concat("=").concat(d.q[f]).concat(d.e);
            return b.concat(d.sa).concat(d.e)
        }
        ,
        d.fromString = function (b) {
            for (var b = b.split(d.e), f = idx = p, g = "", i = "", j = "", k = 0; k < b.length; k++)
                f = b[k],
                    idx = f.indexOf("="),
                    trim(f.substring(0, idx)) == "8" ? g = f : trim(f.substring(0, idx)) == "9" ? i = f : trim(f.substring(0, idx)) == "35" ? (j = f,
                        d.type = trim(f.substring(idx + 1))) : trim(f.substring(0, idx)) == "10" ? d.sa = f : d.q[trim(f.substring(0, idx))] = trim(f.substring(idx + 1));
            d.na = g + d.e + i + d.e + j + d.e
        }
        ,
        d
};
// BUNDLE
// FEED
// TRADING
// BRIDGE

enyo.kind({
    name: "xinput",
    kind: "onyx.InputDecorator",
    handlers: {
        oninput: "input",
        onSelect: "itemSelected",
        onchange: "inputchanged"
    },
    published: {
        values: "",
        delay: 200,
        active: !1,
        avail: !0,
        statemn: !1
    },
    events: {
        onInputChanged: "",
        onValueSelected: ""
    },
    components: [{
        name: "popup",
        kind: "onyx.Menu",
        floating: !0,
        onShow: "stateon",
        onHide: "stateoff"
    }],
    stateon: function () {
        this.setStatemn(!0)
    },
    stateoff: function () {
        this.setStatemn(!1)
    },
    input: function (b, d) {
        this.setAvail(!0);
        this.inputField = this.inputField || d.originator;
        enyo.job(null, enyo.bind(this, "fireInputChanged"), this.delay)
    },
    fireInputChanged: function () {
        this.doInputChanged({
            value: this.inputField.getValue()
        })
    },
    hideMenu: function () {
        this.waterfall("onRequestHideMenu", {
            activator: this
        })
    },
    valuesChanged: function () {
        if (this.avail)
            if (!this.values || this.values.length === 0)
                this.waterfall("onRequestHideMenu", {
                    activator: this
                });
            else {
                this.$.popup.destroyClientControls();
                for (var b = [], d = 0; d < this.values.length; d++)
                    b.push({
                        content: this.values[d]
                    });
                this.$.popup.createComponents(b);
                this.$.popup.render();
                this.waterfall("onRequestShowMenu", {
                    activator: this
                })
            }
        else
            this.waterfall("onRequestHideMenu", {
                activator: this
            })
    },
    inputchanged: function () {
        this.setAvail(!1);
        this.statemn && this.$.popup.controls.length == 2 && (this.inputField.setValue(this.$.popup.controls[1].content),
            this.doValueSelected({
                value: this.$.popup.controls[1].content
            }),
            enyo.job(null, enyo.bind(this, "hideMn"), this.delay))
    },
    hideMn: function () {
        this.waterfall("onRequestHideMenu", {
            activator: this
        })
    },
    itemSelected: function (b, d) {
        this.inputField.setValue(d.content);
        this.doValueSelected({
            value: d.content
        })
    }
});
enyo.kind({
    name: "LabeledItem",
    published: {
        label: "",
        value2: ""
    },
    components: [{
        name: "label",
        allowHtml: !0,
        kind: "Control"
    }, {
        name: "input",
        classes: "label-item-input enyo-selectable",
        onkeyup: "validate"
    }, {
        name: "input2",
        classes: "label-item-input",
        onkeyup: "validate2"
    }],
    validate: function () {
        this.type && this.type == "number" && /\D/g.test(this.$.input.getValue()) && this.$.input.setValue(this.$.input.getValue().replace(/\D/g, ""));
        this.afterValidate && this.afterValidate()
    },
    validate2: function () {
        this.type2 && this.type2 == "number" && /\D/g.test(this.$.input2.getValue()) && this.$.input2.setValue(this.$.input2.getValue().replace(/\D/g, ""))
    },
    focus: function () { },
    defaultKind: "onyx.Checkbox",
    create: function () {
        this.inherited(arguments);
        this.labelChanged();
        this.cls && (this.$.input.addClass(this.cls),
            this.$.input2.addClass(this.cls));
        this.type && this.type == "password" && this.$.input.setAttribute("type", this.type);
        this.style1 && (this.$.input.style = this.style1);
        this.style2 && (this.$.input2.style = this.style2);
        this.combo ? this.$.input2.setShowing(!0) : this.$.input2.setShowing(!1);
        this.type && this.type == "number" && this.$.input.setSelectOnFocus(!0)
    },
    labelChanged: function () {
        this.$.label.setContent(this.label)
    },
    getValue: function () {
        return this.$.input.getValue ? this.$.input.getValue() : this.$.input.getContent()
    },
    setValue: function (b) {
        this.$.input.setValue ? this.$.input.setValue(b) : this.$.input.setContent(b)
    },
    getValue2: function () {
        return this.$.input2.getValue ? this.$.input2.getValue() : this.$.input2.getContent()
    },
    value2Changed: function () {
        this.$.input2.setValue ? this.$.input2.setValue(this.value) : this.$.input2.setContent(this.value2)
    }
});
enyo.kind({
    name: "xtable",
    kind: "Panels",
    classes: "enyo-unselectable",
    layoutKind: "FittableRowsLayout",
    handlers: {
        ondragfinish: "drag"
    },
    drag: function (b, d) {
        d.type == "dragfinish" && Math.abs(d.dx - d.ddx) > Math.abs(d.dy - d.ddy) && (d.xDirection > 0 ? this.onPrior() : d.xDirection < 0 && this.onNext())
    },
    published: {
        fieldno: 1
    },
    events: {
        onRowSelect: ""
    },
    fieldnoChanged: function () {
        try {
            if (this.horz) {
                for (var b = 1; b < this.$.item.controls[0].controls.length; b++)
                    this.$.item.controls[0].controls[b].setShowing(b < this.fieldno ? !1 : !0);
                this.getList().refresh();
                for (b = 1; b < this.$.hdr.controls.length; b++)
                    this.$.hdr.controls[b].setShowing(b < this.fieldno ? !1 : !0)
            }
        } catch (d) {
            console.log(d)
        }
    },
    onPrior: function () {
        this.fieldno > 1 && this.setFieldno(this.fieldno - 1)
    },
    onNext: function () {
        this.fieldno < this.$.hdr.controls.length - 1 && this.setFieldno(this.fieldno + 1)
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "hdr",
            allowHtml: !0,
            classes: "pnl-header grid-container",
            layoutKind: "FittableColumnsLayout"
        }, {
            name: "ctn",
            fit: !0,
            classes: "enyo-unselectable",
            kind: "Panels",
            components: [{
                name: "list",
                kind: "List",
                count: 0,
                toggleSelected: !1,
                fit: !0,
                touch: !0,
                multiSelect: !1,
                onSetupItem: "setupItem",
                ontap: "onSelect",
                classes: "defaultcolor"
            }]
        }]
    }],
    onSelect: function (b, d) {
        return b.sumber = b,
            b.sumberevent = d,
            d.sumber = b,
            d.sumberevent = d,
            this.doRowSelect(b, d),
            !0
    },
    create: function () {
        this.inherited(arguments);
        this.header ? this.$.hdr.createComponents(this.header) : this.$.hdr.removeClass("pnl-header");
        this.rows instanceof Array ? this.$.list.createComponents(this.rows, {
            owner: this
        }) : this.$.list.createComponent(this.rows, {
            owner: this
        });
        this.pojo = [];
        this.datas && enyo.mixin(this.pojo, this.datas);
        this.fieldnoChanged();
        this.refreshList()
    },
    setupItem: function (b, d) {
        var e = d.index
            , f = this.getDb()[e];
        this.getItem().update(f, d, b, this.getDb());
        this.getItem().applyColor ? this.getItem().applyColor(e, b.isSelected(e), this) : this.applyColor(e, b.isSelected(e))
    },
    getItem: function () {
        return this.$.item
    },
    getDb: function () {
        return this.pojo
    },
    getList: function () {
        return this.$.list
    },
    applyColor: function (b, d) {
        this.getItem().removeClass("mySelected");
        this.getItem().removeClass("myEven");
        this.getItem().removeClass("myOdd");
        d ? this.getItem().addClass("mySelected") : this.getItem().addClass(b % 2 == 0 ? "myEven" : "myOdd")
    },
    insertItem: function (b) {
        this.getDb().splice(0, 0, b);
        this.refreshList()
    },
    addAll: function (b) {
        for (var d = 0; d < b.length; d++)
            this.getDb().push(b[d]);
        this.refreshList();
        this.getList().scrollToRow(0)
    },
    updateRow: function (b, d) {
        this.getDb()[d] = b;
        this.getList().renderRow(d)
    },
    updateItem: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++) {
                if (e[0] == b[0]) {
                    this.getDb()[d] = b;
                    this.getList().renderRow(d);
                    break
                }
                if (e[0] > b[0]) {
                    this.getDb().splice(d, 0, b);
                    this.refreshList();
                    this.getList().scrollToRow(d);
                    break
                }
            }
        e || (this.getDb().push(b),
            this.refreshList(),
            this.getList().scrollToRow(d))
    },
    updateReal: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[0] == b[0]) {
                    this.getDb()[d] = b;
                    this.getList().renderRow(d);
                    break
                }
        e || (this.getDb().push(b),
            this.refreshList(),
            this.getList().scrollToRow(d))
    },
    onlyAdd: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[0] > b[0]) {
                    this.getDb().splice(d, 0, b);
                    break
                }
        e || this.getDb().push(b)
    },
    addItem: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[0] > b[0]) {
                    this.getDb().splice(d, 0, b);
                    break
                }
        e || this.getDb().push(b);
        this.refreshList()
    },
    getData: function (b) {
        return this.getDb()[b]
    },
    getByKey: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[0] == b)
                    return e;
        return null
    },
    removeItem: function (b) {
        this._removeItem(b);
        this.refreshList();
        this.getList().getSelection().deselect(b)
    },
    _removeItem: function (b) {
        this.getDb().splice(b, 1)
    },
    getSelected: function () {
        for (var b in this.$.list.getSelection().getSelected())
            return this.getDb()[b];
        return null
    },
    removeSelected: function () {
        for (var b in this.$.list.getSelection().getSelected())
            this._removeItem(b);
        this.getList().getSelection().clear();
        this.refreshList()
    },
    removeAll: function () {
        this.getDb().splice(0, this.getDb().length)
    },
    refreshList: function () {
        this.getList().setCount(this.getDb().length);
        this.getList().reset()
    },
    sortChanged: function () { }
});
enyo.kind({
    name: "xtable2",
    kind: "Panels",
    classes: "enyo-unselectable ",
    layoutKind: "FittableRowsLayout",
    handlers: {
        ondragfinish: "drag"
    },
    drag: function (b, d) {
        d.type == "dragfinish" && Math.abs(d.dx - d.ddx) > Math.abs(d.dy - d.ddy) && (d.xDirection > 0 ? this.onPrior() : d.xDirection < 0 && this.onNext())
    },
    published: {
        fieldno: 1,
        keys: 0,
        sort: 0,
        sorttype: 1,
        master: null
    },
    events: {
        onRowSelect: ""
    },
    fieldnoChanged: function () {
        try {
            if (this.horz) {
                for (var b = 1; b < this.$.item.controls[0].controls.length; b++)
                    this.$.item.controls[0].controls[b].setShowing(b < this.fieldno ? !1 : !0);
                this.getList().refresh();
                for (b = 1; b < this.$.hdr.controls.length; b++)
                    this.$.hdr.controls[b].setShowing(b < this.fieldno ? !1 : !0)
            }
        } catch (d) {
            console.log(d)
        }
    },
    keysChanged: function () { },
    sortChanged: function () { },
    sorttypeChanged: function () { },
    onPrior: function () {
        this.fieldno > 1 && this.setFieldno(this.fieldno - 1)
    },
    onNext: function () {
        this.fieldno < this.$.hdr.controls.length - 1 && this.setFieldno(this.fieldno + 1)
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "hdr",
            allowHtml: !0,
            classes: "pnl-header grid-container",
            layoutKind: "FittableColumnsLayout"
        }, {
            name: "ctn",
            fit: !0,
            classes: "enyo-unselectable",
            kind: "Panels",
            components: [{
                name: "list",
                kind: "List",
                count: 0,
                toggleSelected: !1,
                fit: !0,
                touch: !0,
                multiSelect: !1,
                onSetupItem: "setupItem",
                ontap: "onSelect",
                classes: "defaultcolor"
            }]
        }]
    }],
    onSelect: function (b, d) {
        return b.sumber = b,
            b.sumberevent = d,
            d.sumber = b,
            d.sumberevent = d,
            this.doRowSelect(d),
            !0
    },
    create: function () {
        this.inherited(arguments);
        this.filterReady = !1;
        this.header ? this.$.hdr.createComponents(this.header) : this.$.hdr.removeClass("pnl-header");
        this.rows instanceof Array ? this.$.list.createComponents(this.rows, {
            owner: this
        }) : this.$.list.createComponent(this.rows, {
            owner: this
        });
        this.pojo = [];
        this.datas && enyo.mixin(this.pojo, this.datas);
        this.fieldnoChanged();
        this.keysChanged();
        this.sortChanged();
        this.sorttypeChanged();
        this.refreshList()
    },
    setupItem: function (b, d) {
        var e = d.index
            , f = this.filterReady ? this.filtered[e] : this.getDb()[e];
        this.getItem().update(f, d, b, this.getDb());
        this.getItem().applyColor ? this.getItem().applyColor(e, b.isSelected(e), this) : this.applyColor(e, b.isSelected(e))
    },
    getItem: function () {
        return this.$.item
    },
    getDb: function () {
        return this.pojo
    },
    getFiltered: function () {
        return this.filtered
    },
    getList: function () {
        return this.$.list
    },
    applyColor: function (b, d) {
        this.getItem().removeClass("mySelected");
        this.getItem().removeClass("myEven");
        this.getItem().removeClass("myOdd");
        d ? this.getItem().addClass("mySelected") : this.getItem().addClass(b % 2 == 0 ? "myEven" : "myOdd")
    },
    insertItem: function (b) {
        this.getDb().splice(0, 0, b);
        this.refreshList()
    },
    addAll: function (b) {
        for (var d = 0; d < b.length; d++)
            this.getDb().push(b[d]);
        this.refreshList();
        this.getList().scrollToRow(0)
    },
    updateRow: function (b, d) {
        this.getDb()[d] = b;
        if (this.filterReady)
            for (var e = 0, f; f = this.filtered[e]; e++)
                if (f.dbIndex == d) {
                    d = e;
                    break
                }
        this.getList().renderRow(d)
    },
    updateItem: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[this.keys] == b[this.keys]) {
                    this.getDb()[d] = b;
                    if (this.filterReady)
                        for (b = 0; e = this.filtered[b]; b++)
                            if (e.dbIndex == d) {
                                d = b;
                                break
                            }
                    this.getList().renderRow(d);
                    break
                }
    },
    onlyAdd: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (this.sorttype == 1) {
                    if (e[this.sort] > b[this.sort]) {
                        this.getDb().splice(d, 0, b);
                        break
                    }
                } else if (e[this.sort] < b[this.sort]) {
                    this.getDb().splice(d, 0, b);
                    break
                }
        e || this.getDb().push(b)
    },
    addItem: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (this.sorttype == 1) {
                    if (e[this.sort] > b[this.sort]) {
                        this.getDb().splice(d, 0, b);
                        break
                    }
                } else if (e[this.sort] < b[this.sort]) {
                    this.getDb().splice(d, 0, b);
                    break
                }
        e || this.getDb().push(b);
        this.refreshList()
    },
    getData: function (b) {
        return this.getDb()[b]
    },
    getByKey: function (b) {
        var d = 0;
        if (this.getDb().length > 0)
            for (var e; e = this.getDb()[d]; d++)
                if (e[this.keys] == b)
                    return e;
        return null
    },
    removeItem: function (b) {
        this._removeItem(b);
        this.refreshList();
        this.getList().getSelection().deselect(b)
    },
    _removeItem: function (b) {
        this.getDb.splice(this.filterReady ? this.filtered[b].dbIndex : b, 1)
    },
    getSelected: function () {
        for (var b in this.$.list.getSelection().getSelected())
            return this.filterReady ? this.filtered[b] : this.getDb()[b];
        return null
    },
    removeSelected: function () {
        for (var b in this.$.list.getSelection().getSelected())
            this._removeItem(b);
        this.getList().getSelection().clear();
        this.refreshList()
    },
    removeAll: function () {
        this.getDb().splice(0, this.getDb().length)
    },
    refreshList: function () {
        this.filterReady ? (this.filtered = this.generateFilteredData(this.filter),
            this.$.list.setCount(this.filtered.length)) : this.getList().setCount(this.getDb().length);
        this.$.list.reset()
    },
    filterList: function (b) {
        b != this.filter && (this.filter = b,
            this.filterReady = !0,
            this.filtered = this.generateFilteredData(b),
            this.$.list.setCount(this.filtered.length),
            this.$.list.reset())
    },
    generateFilteredData: function (b) {
        return this.master != null ? this.master.generateFilteredData(b) : []
    }
});
enyo.kind({
    name: "clientengine",
    timelag: 0,
    create: function () {
        this.inherited(arguments);
        bridge.register(this);
        bridge.addObj("clientengine", this)
    },
    showLoading: function (b) {
        bridge.getObj("dashboard").showLoading(b)
    },
    hideLoading: function () {
        bridge.getObj("dashboard").hideLoading()
    },
    setProgress: function (b) {
        bridge.getObj("dashboard").setProgress(b)
    },
    showError: function (b, d) {
        return this.showAlert(d),
            !0
    },
    showAlert: function (b) {
        bridge.getObj("dashboard").showAlert(b);
        enyo.job("hideAlert", enyo.bind(this, "hideAlert"), 3E3)
    },
    hideAlert: function () {
        bridge.getObj("dashboard").hideAlert()
    },
    showLogin: function () {
        bridge.getObj("dashboard").$.panel.index == 0 ? bridge.getObj("home-pnllogin").reqFocus() : bridge.getObj("dashboard").$.panel.index == 1 && bridge.getObj("dash-pnllogin").reqFocus()
    },
    sendLogout: function () {
        setTimeout(enyo.bind(this, this.afterLogout), 150)
    },
    showLogout: function () {
        this.sendLogout()
    },
    showChgPwd: function () {
        setTimeout(enyo.bind(this, this.internalChgPwd), 250)
    },
    internalChgPwd: function () {
        bridge.getObj("pnlchgpwd").toggle()
    },
    showTrdLogin: function () {
        bridge.getObj("trd") ? this.showAlert("you are already logon") : bridge.getObj("pnlpin").show(this.param[0])
    },
    showTrdLogout: function () {
        bridge.doTrdLogout();
        setTimeout(enyo.bind(this, this.afterTradingLogout), 150)
    },
    showChgPIN: function () {
        bridge.getObj("pnlchgpin").setUser(bridge.getObj("userid"));
        setTimeout(enyo.bind(this, this.internalChgPIN), 250)
    },
    internalChgPIN: function () {
        bridge.getObj("pnlchgpin").showMe()
    },
    showLock: function () {
        bridge.getObj("pnllock").show(this.param)
    },
    showBuy: function () {
        bridge.getObj("trd") ? (bridge.getObj("bos").close(),
            bridge.getObj("bos").changeTitle("BUY"),
            bridge.getObj("bos").open()) : this.showTrdLogin(this.param[0])
    },
    showSell: function () {
        bridge.getObj("trd") ? (bridge.getObj("bos").close(),
            bridge.getObj("bos").changeTitle("SELL"),
            bridge.getObj("bos").open()) : this.showTrdLogin(this.param[0])
    },
    showAlgo: function () {
        bridge.getObj("trd") ? (bridge.getObj("algo").close(),
            bridge.getObj("algo").open()) : this.showTrdLogin(this.param[0])
    },
    showAmend: function (b, d) {
        bridge.getObj("trd") ? (bridge.getObj("amd").changeTitle(d),
            bridge.getObj("amd").toggle()) : this.showTrdLogin(this.param[0])
    },
    sendLogin: function (b, d) {
        this.showLoading("login, please wait . . .");
        this.param = d;
        var e = new enyo.JsonpRequest({
            url: Const._check,
            callbackName: "callback"
        });
        e.response(this, this.preloginResponse);
        e.error(this, this.preloginError);
        e.go()
    },
    showRegis: function () {
        bridge.getObj("pnlregis").show()
    },
    showTrial: function () {
        bridge.getObj("pnltrial").show()
    },
    showForum: function () {
        window.open(Const._urlmutual, "Mutual Unity")
    },
    showOldversion: function () {
        window.open("https://zaisan.id", "zaisan v.1.2")
    },
    showPromo: function () {
        bridge.getObj("pnlpromo").show()
    },
    showDisclaimer: function () {
        bridge.getObj("pnldisclaimer").show()
    },
    chgTheme1: function () {
        changeSkin("zaisan.skin")
    },
    chgTheme2: function () {
        changeSkin("zaisan.skin2")
    },
    sendTrdLogin: function (b, d) {
        bridge.addObj("pin", d[1]);
        bridge.doTrdLogin(d[0], d[1])
    },
    components: [{
        kind: "offlineengine"
    }, {
        kind: "onlineengine"
    }, {
        kind: "Signals",
        onError: "showError",
        onAlert: "showError"
    }, {
        kind: "Router",
        onShowLogin: "showLogin",
        onShowLogout: "showLogout",
        onShowChgPwd: "showChgPwd",
        onShowTrdLogin: "showTrdLogin",
        onShowTrdLogout: "showTrdLogout",
        onShowChgPIN: "showChgPIN",
        onShowLock: "showLock",
        onShowBuy: "showBuy",
        onShowSell: "showSell",
        onShowAmend: "showAmend",
        onOrder: "sendOrder",
        onAmend: "sendAmend",
        onWithdraw: "sendWithdraw",
        onSendTemporary: "sendTemporary",
        onDeleteTemporary: "deleteTemporary",
        onTrdLogin: "sendTrdLogin",
        onChgPwd: "chgPwd",
        onChgPIN: "chgPIN",
        onLogin: "sendLogin",
        onRegis: "showRegis",
        onTrial: "showTrial",
        onForum: "showForum",
        onOldversion: "showOldversion",
        onPromo: "showPromo",
        onDisclaimer: "showDisclaimer",
        onChgTheme1: "showChgTheme1",
        onChgTheme2: "showChgTheme2",
        onAlgoOrder: "sendAlgoOrder",
        onAlgoWithdraw: "sendAlgoWithdraw",
        onShowAlgo: "showAlgo",
        onAlgoStatus: "statusAlgo"
    }],
    preloginResponse: function (b, d) {
        try {
            bridge.addObj("IP", d.ip),
                this.feedLoginInternal(this.param)
        } catch (e) {
            isTablet() ? enyo.Signals.send("onError", "failed, please check your network") : enyo.Signals.send("onError", "failed,<br/>please check<br/>your network")
        }
    },
    preloginError: function () {
        this.hideLoading();
        isTablet() ? enyo.Signals.send("onError", "failed, please check your network") : enyo.Signals.send("onError", "failed,<br/>please check<br/>your network")
    },
    feedLoginInternal: function (b) {
        bridge.addObj("userid", b[0].toUpperCase());
        bridge.addObj("pass", cryptoMD5.en(b[1]));
        bridge.addObj("passori", b[1]);
        this.setProgress("connecting....");
        setTimeout(enyo.bind(this, this.startLogin, b), 10)
    },
    startLogin: function (b) {
        this.currtime = (new Date).getTime();
        bridge.doLogin(b[0].toUpperCase(), b[1])
    },
    doLoginToForum: function () {
        var b = new enyo.JsonpRequest({
            url: Const._url + Const._urlforum + "?q=" + bundle.en(this.param[0] + "|" + this.param[1]),
            callbackName: "c"
        });
        b.response(this, this.forumLoginOK);
        b.error(this, this.forumLoginError);
        b.go()
    },
    forumLoginOK: function (b, d) {
        try {
            this.hideLoading(),
                d.status != "1" ? (enyo.Signals.send("onError", "login successfully, but found error:<br/>" + d.msg + "<br/>please logout and login again<br/>or contact helpdesk " + d),
                    bridge.doLogout()) : setTimeout(enyo.bind(this, this.afterloginok), 10)
        } catch (e) {
            enyo.Signals.send("onError", "login successfully, but found error:<br/>" + e + "<br/>please logout and login again<br/>or contact helpdesk " + d),
                bridge.doLogout()
        }
    },
    forumLoginError: function (b, d) {
        this.hideLoading();
        enyo.Signals.send("onError", "login successfully, but found error, some data may be not available<br/>please logout and login again<br/>or contact helpdesk " + d);
        bridge.doLogout()
    },
    doLogoutToForum: function () {
        (new enyo.JsonpRequest({
            url: Const._url + Const._urlforumout,
            callbackName: "c"
        })).go()
    },
    afterloginok: function () {
        Broadcast.send("onLoginOK")
    },
    afterLogout: function () {
        this.afterTradingLogout();
        Broadcast.send("onLogoutOK");
        setTimeout(function () {
            bridge.doLogout()
        }, 500);
        this.doLogoutToForum()
    },
    chgPwd: function (b, d) {
        this.showLoading(isTablet() ? "change password, please wait . . ." : "change password,<br/>please wait...");
        this.param.temppass = d[2];
        bridge.doChgpwd(d[0], d[1], d[2])
    },
    chgPIN: function (b, d) {
        this.showLoading(isTablet() ? "change PIN, please wait . . ." : "change PIN,<br/>please wait...");
        this.param.temppin = d[2];
        bridge.doTrdChgpwd(d[0], d[1], d[2])
    },
    sendTrdLogin: function (b, d) {
        bridge.addObj("pin", d[1]);
        bridge.doTrdLogin(d[0], d[1])
    },
    loginBAD: function (b) {
        this.hideLoading();
        enyo.Signals.send("onError", b)
    },
    loginOK: function (b) {
        this.timelag = this.currtime - b.bucket[Const._body][3];
        var d = b.bucket[Const._body][5];
        bridge.addObj("svr", b.bucket[Const._body][4]);
        b = d.split("|");
        broker[1] = b[0];
        broker[2] = b[1];
        broker[3] = b[2];
        this.setProgress("Login to gateway successfully<br/>now login to FORUM<br/>please wait....");
        this.doLoginToForum()
    },
    chgpwdOK: function () {
        this.hideLoading();
        this.showAlert("change password<br/>successfully");
        this.param[1] = this.param.temppass;
        bridge.addObj("pass", cryptoMD5.en(this.param.temppass))
    },
    chgpwdBAD: function () {
        this.hideLoading();
        this.showAlert("change passwordfailed<br/>please try again later...")
    },
    kill: function () {
        enyo.job("alrt", enyo.bind(this, this.showAlert, "app logout,<br/>because you are logon<br/>at another terminal"), 1E3);
        this.afterLogout()
    },
    disco: function () {
        this.sendLogout();
        this.showAlert("connection lost,<br/>please relogin")
    },
    trdLoginOK: function (b) {
        var b = b.bucket.body
            , d = new fixfield(b[3]);
        d.fromString(b[4]);
        bridge.addObj("98", d.get("98"));
        this.setTrdSession(b[1]);
        this.loadCounter();
        this.trdquery || (this.trdquery = new mod.trading(this));
        this.trdacc || (this.trdacc = new mod.acc(this));
        this.trdpf || (this.trdpf = new mod.pf(this));
        this.trdol || (this.trdol = new mod.ordlst(this));
        this.trdtl || (this.trdtl = new mod.trdlst(this));
        this.trdauto || (this.trdauto = new mod.autolst(this));
        this.trdquery.doQuery();
        this.trdacc.doRestart();
        this.trdpf.doRestart();
        this.trdol.doRestart();
        this.trdtl.doRestart();
        this.trdauto.doRestart()
    },
    trdStatus: function (b) {
        bridge.getObj("pnlpin").setStatus(b)
    },
    trdReady: function () {
        bridge.addObj("trd", !0);
        bridge.getObj("pnlpin").hide();
        document.activeElement.blur();
        Broadcast.send("onTrdLoginOK");
        bridge.getObj("98") == "1" && this.showChgPIN()
    },
    trdLoginBAD: function (b) {
        bridge.getObj("trd") ? this.trdKill(b) : bridge.getObj("pnlpin").onError()
    },
    trdKill: function () {
        bridge.getObj("trd") && (enyo.job("alrt", enyo.bind(this, this.showAlert, "trading logout,<br/>because you are logon<br/>at another terminal"), 1E3),
            this.afterTradingLogout())
    },
    trdChgpwdOK: function () {
        this.hideLoading();
        this.showAlert("change PIN successfully");
        bridge.addObj("98", "0");
        bridge.addObj("pin", cryptoMD5.en(this.param.temppin))
    },
    trdChgpwdBAD: function () {
        this.hideLoading();
        this.showAlert("change PIN failed")
    },
    trdDisco: function () {
        this.afterTradingLogout()
    },
    trdData: function (b) {
        this.onOrderReply(b)
    },
    afterTradingLogout: function () {
        bridge.addObj("trd", !1);
        Broadcast.send("onTrdLogoutOK");
        bridge.getObj("pnlchgpin").close();
        bridge.getObj("bos").close();
        bridge.getObj("algo").close();
        bridge.getObj("amd").close();
        Store.SEC = {};
        Store.OST = {};
        Store.ATY = {};
        Store.SEB = {};
        Store.ASE = {};
        Store.DWC = {};
        Store.DWS = {};
        Store.PRO = {};
        Store.UMN = {};
        Store.UGR = {};
        Store.CUS = {};
        Store.ACC = {};
        Store.PFO = {};
        Store.ORD = {};
        Store.TRD = {};
        Store.ALGO = {};
        Store.ID = [];
        Store.IDCUS = [];
        bridge.addObj("statusserver", ["OFF", "", ""]);
        Broadcast.send("onStatusServer");
        bridge.getObj("autolst").getComp("wl").removeAll();
        bridge.getObj("autolst").getComp("wl").refreshList()
    },
    saveCounter: function () {
        var b = [];
        b.push(this.genDateFormatted(!1));
        b.push(this.counter);
        dbs.set("trdseq", JSON.stringify(b))
    },
    loadCounter: function () {
        var b = dbs.get("trdseq", JSON.stringify([this.genDateFormatted(!1), 0]));
        b = JSON.parse(b);
        this.counter = b[0] == this.genDateFormatted(!1) ? b[1] : 0
    },
    setTrdSession: function (b) {
        this.trdsession = lpad(b, 13, "0") + "Z"
    },
    genOrderId: function () {
        this.counter == 99999 && (this.counter = 0);
        this.counter++;
        var b = 20 - this.trdsession.length;
        this.saveCounter();
        return this.trdsession + lpad(this.counter + "", b, "0")
    },
    genTime: function () {
        return new Date((new Date).getTime() - this.timelag + 300)
    },
    genDateFormatted: function (b) {
        var d = this.genTime()
            , e = d.getFullYear() + ""
            , f = d.getMonth() + 1 + ""
            , g = d.getDate() + ""
            , i = d.getHours() + ""
            , j = d.getMinutes() + ""
            , d = d.getSeconds() + "";
        return b ? e + (f.length == 1 ? "0" + f : f) + (g.length == 1 ? "0" + g : g) + "-" + (i.length == 1 ? "0" + i : i) + ":" + (j.length == 1 ? "0" + j : j) + ":" + (d.length == 1 ? "0" + d : d) : e + (f.length == 1 ? "0" + f : f) + (g.length == 1 ? "0" + g : g)
    },
    genTimeFormatted: function () {
        var b = this.genTime()
            , d = b.getHours() + ""
            , e = b.getMinutes() + ""
            , b = b.getSeconds() + "";
        return (d.length == 1 ? "0" + d : d) + ":" + (e.length == 1 ? "0" + e : e) + ":" + (b.length == 1 ? "0" + b : b)
    },
    onOrderReply: function (b) {
        var d = b.bucket.body
            , b = new fixfield(d[3]);
        b.fromString(d[4]);
        d[3] == "8" ? b.get(Const.OrdStatus) == "0" ? this.onOrderOK(b) : b.get(Const.OrdStatus) == "8" ? this.onOrderBAD(b) : b.get(Const.OrdStatus) == "4" ? this.onCancelOK(b) : b.get(Const.OrdStatus) == "5" ? this.onReplaceOK(b) : b.get(Const.OrdStatus) == "T" ? this.onOrderOK(b) : b.get(Const.OrdStatus) == "D" ? this.onDeleteOK(b) : (b.get(Const.OrdStatus) == "1" || b.get(Const.OrdStatus) == "2") && this.onOrderMatch(b) : d[3] == "9" ? b.get("434") == "1" ? this.onCancelBAD(b) : this.onReplaceBAD(b) : d[3] == "D" || d[3] == "UT" ? this.onOrderTaker(b) : d[3] == "F" ? this.onCancelTaker(b) : d[3] == "G" ? this.onReplaceTaker(b) : d[3] == "UD" ? this.onDeleteTaker(b) : d[3] == "C8" ? (console.log("receive algo: " + d[3] + b.get(Const.AlgoStatus)),
            b.get(Const.AlgoStatus) == "0" ? this.onAlgoOK(b) : b.get(Const.AlgoStatus) == "8" ? this.onAlgoBAD(b) : b.get(Const.AlgoStatus) == "4" ? this.onAlgoCancelOK(b) : b.get(Const.AlgoStatus) == "1" && this.onAlgoMatch(b)) : d[3] == "C9" ? this.onAlgoCancelBAD(b) : d[3] == "CD" ? this.onAlgoTaker(b) : d[3] == "CF" ? this.onAlgoCancelTaker(b) : d[3] == "C0" && this.statusAlgo(b)
    },
    statusAlgo: function (b) {
        var d = b.get(Const.AlgoServerStatus)
            , e = b.get(Const.AlgoServerTime)
            , b = b.get(Const.Text);
        bridge.addObj("statusserver", [d == "01" ? "ON" : "OFF", e, b]);
        Broadcast.send("onStatusServer")
    },
    genOrder: function (b, d) {
        var e = Store.ACC[b[3]]
            , f = Store.CUS[e[2]]
            , g = d == "" ? this.genOrderId() : d;
        return [g, b[3], this.genTimeFormatted() + "", b[0], b[7], b[1], b[2], b[1] * Const.lotSize * b[2], b[6] ? "RT" : "R0", b[2], 0, "", g, "", this.genDateFormatted(!1), b[4], "", bridge.getObj("userid"), "", "", "", "", "", "", "", f[5], "JSX", "1", f[11], b[5], e[2], e[1], e[4], "", b[2] * Const.lotSize, b[2] * Const.lotSize, 0, "1", "", "", "", "", "", "", "", "", "", b[1]]
    },
    getBookingCode: function (b) {
        var d = b[2] + 1;
        return d == 1 ? d + "" + (b[3][0] + 1) : d == 2 ? d + "" + (b[4][0] + 1) : d + "" + (b[5][0] + 1)
    },
    getOperatorType: function (b) {
        var d = b[2] + 1;
        return d == 1 ? b[3][1] : d == 2 ? b[4][1] : "="
    },
    getPriceType: function (b) {
        return b[2] + 1 == 3 ? b[5][2] == 0 ? "1" : "0" : "0"
    },
    getCriteriaPrice: function (b) {
        var d = b[2] + 1;
        return d == 1 ? b[3][2] : d == 2 ? b[4][2] : 0
    },
    genAlgo: function (b, d) {
        var e = Store.ACC[b[0]]
            , f = Store.CUS[e[2]]
            , g = d == "" ? this.genOrderId() : d
            , i = [];
        i.push(b[1]);
        var j = this.getBookingCode(b)
            , k = "0";
        return i.push(j),
            j.substring(0, 1) == "3" ? i.push("0") : i.push(this.getOperatorType(b)),
            j.substring(0, 1) == "1" || j.substring(0, 1) == "2" ? (i.push("0"),
                k = "0") : (i.push(this.getPriceType(b)),
                    k = this.getPriceType(b)),
            i.push(this.getCriteriaPrice(b)),
            i.push(b[5][1]),
            i.push("R0"),
            i.push(b[6]),
            k == "1" ? i.push(0) : i.push(b[7] == "" ? 0 : b[7]),
            i.push(b[8] * Const.lotSize),
            i.push(b[8]),
            i.push(b[0]),
            i.push(b[9]),
            i.push(b[10]),
            i.push(b[12]),
            i.push(b[13]),
            i.push(b[11]),
            i.push(g),
            i.push(""),
            i.push("1"),
            i.push(f[5]),
            i.push(b[0]),
            i.push(f[11]),
            i.push(e[4]),
            i.push(e[1]),
            i.push(""),
            i.push(this.genDateFormatted(!0)),
            i.push(bridge.getObj("userid")),
            i.push(""),
            i.push(""),
            i.push(""),
            i.push(""),
            i.push(""),
            i.push(""),
            i.push(b[14]),
            i.push(""),
            i
    },
    sendOrder: function (b, d) {
        var d = this.genOrder(d, "")
            , e = new fixfield(d[8] == "RO" ? "D" : "UT");
        e.set(Const.ClOrdID, d[12]);
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.ClAccID, d[31]);
        e.set(Const.CttID, d[32]);
        e.set(Const.InitialCode, d[30]);
        e.set(Const.ExchangeID, "JSX");
        e.set(Const.DirectID, "OL");
        e.set(Const.Account, d[28]);
        e.set(Const.HandlInst, d[27]);
        e.set(Const.SymbolSfx, d[15]);
        e.set(Const.Symbol, d[3]);
        e.set(Const.Side, d[4]);
        e.set(Const.TransactTime, this.genDateFormatted(!0));
        e.set(Const.OrderQty, d[34]);
        e.set(Const.OrdType, d[29]);
        e.set(Const.Price, d[5]);
        e.set(Const.TimeInForce, d[29]);
        e.set(Const.SID, d[25]);
        e.set(Const.tudSID, d[25]);
        e.set(Const.OrdStatus, d[8]);
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        bridge.sendFix(f);
        bridge.getObj("orderlst").getComp("wl").addItem(d)
    },
    sendAlgoOrder: function (b, d) {
        console.log("criteria : ", d);
        o = this.genAlgo(d, "");
        console.log("autoorder: ", o);
        var e = new fixfield("CD");
        e.set(Const.AlgoSymbol, o[0]);
        e.set(Const.AlgoBookingType, o[1]);
        e.set(Const.AlgoOperatorType, o[2]);
        e.set(Const.AlgoPriceType, o[3]);
        e.set(Const.AlgoPrice, o[4]);
        e.set(Const.AlgoTime, o[5]);
        e.set(Const.AlgoStatus, o[6]);
        e.set(Const.AlgoValidFrom, o[14]);
        e.set(Const.AlgoValidTo, o[15]);
        e.set(Const.AlgoSendAs, o[16]);
        e.set(Const.AlgoClCriteriaID, o[17]);
        e.set(Const.SymbolSfx, o[12]);
        e.set(Const.Side, o[7]);
        e.set(Const.Price, o[8]);
        e.set(Const.OrderQty, o[9]);
        e.set(Const.OrdType, o[13]);
        e.set(Const.HandlInst, o[19]);
        e.set(Const.SID, o[20]);
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.Account, o[22]);
        e.set(Const.InitialCode, o[21]);
        e.set(Const.tudXCG_ID, "JSX");
        e.set(Const.CttID, o[23]);
        e.set(Const.ClAccID, o[24]);
        e.set(Const.AlgoTransacTime, o[26]);
        e.set(Const.AlgoDescription, o[34]);
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        console.log(e.getType() + " " + e.toString());
        bridge.sendFix(f);
        bridge.getObj("autolst").getComp("wl").addItem(o)
    },
    onOrderOK: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        d != null && (d[8] = b.get(Const.OrdStatus),
            d[8] == "0" && (d[11] = b.get(Const.OrderID),
                b = b.get(Const.TransactTime),
                d[19] = b.split("-")[1],
                d[8] = d[10] == 0 ? "0" : d[10] < d[6] ? "1" : "2"),
            bridge.getObj("orderlst").getComp("wl").updateItem(d),
            b = d[31],
            this.refreshACC(d[1], b),
            this.refreshPF(b, d[3]))
    },
    onAlgoOK: function (b) {
        var d = b.get(Const.AlgoClCriteriaID)
            , d = bridge.getObj("autolst").getComp("wl").getByKey(d);
        d != null && (d[6] = b.get(Const.AlgoStatus),
            console.log("execute algoOK " + b.get(Const.AlgoCriteriaID) + " with status " + d[6]),
            d[6] == "0" && (d[18] = b.get(Const.AlgoCriteriaID),
                d[28] = b.get(Const.AlgoTransacTime),
                d[6] = "0"),
            bridge.getObj("autolst").getComp("wl").updateItem(d))
    },
    onDeleteOK: function (b) {
        b = b.get(Const.ClOrdID);
        b = bridge.getObj("orderlst").getComp("wl").getByKey(b);
        if (b != null) {
            b[8] = "D";
            bridge.getObj("orderlst").getComp("wl").updateItem(b);
            var d = b[31];
            this.refreshACC(b[1], d);
            this.refreshPF(d, b[3])
        }
    },
    onOrderBAD: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        d != null && d[8] != "0" && d[8] != "1" && d[8] != "2" && (d[8] = "8",
            d[13] = b.get(Const.Text),
            bridge.getObj("orderlst").getComp("wl").updateItem(d),
            b = d[31],
            this.refreshACC(d[1], b),
            this.refreshPF(b, d[3]))
    },
    onAlgoBAD: function (b) {
        var d = b.get(Const.AlgoClCriteriaID)
            , d = bridge.getObj("autolst").getComp("wl").getByKey(d);
        d != null && (console.log("execute algo bad " + b.get(Const.AlgoClCriteriaID) + " reason " + b.get(Const.Text)),
            d[6] != "1" && d[6] != "2" && (d[6] = "8",
                d[33] = b.get(Const.Text),
                d[32] = b.get(Const.AlgoTransacTime),
                bridge.getObj("autolst").getComp("wl").updateItem(d)))
    },
    onOrderMatch: function (b) {
        try {
            var d = b.get(Const.ClOrdID)
                , e = b.get(Const.SecondaryOrderID)
                , f = bridge.getObj("orderlst").getComp("wl").getByKey(d);
            if (f != null) {
                var g = bridge.getObj("tradelst").getComp("wl").getByKey(d + e);
                if (g == null) {
                    try {
                        if (f[19] == "" || f[19] == void 0) {
                            var i = b.get(Const.TransactTime);
                            f[19] = i.split("-")[1]
                        }
                    } catch (j) {
                        f[19] = this.genTimeFormatted()
                    }
                    try {
                        i = b.get(Const.TransactTime),
                            f[24] = i.split("-")[1]
                    } catch (k) {
                        f[24] = this.genTimeFormatted()
                    }
                    g = f.slice(0);
                    g[8] = "2";
                    g[34] = b.get(Const.LastShares);
                    g[6] = g[34] / Const.lotSize;
                    g[5] = b.get(Const.LastPx);
                    g[7] = g[34] * g[5];
                    g[9] = 0;
                    g[35] = 0;
                    g[36] = g[34];
                    g[10] = g[6];
                    g[46] = e;
                    g[44] = b.get(Const.ContraBroker);
                    g[45] = b.get(Const.ContraTrader);
                    f[35] -= g[34];
                    f[9] -= g[6];
                    f[36] += g[34];
                    f[10] += g[6];
                    f[35] < 0 && (f[35] = 0,
                        f[9] = 0,
                        f[36] = f[34],
                        f[10] = f[6]);
                    f[8] = f[10] == 0 ? "0" : f[10] < f[6] ? "1" : "2";
                    try {
                        f[11] = b.get(Const.OrderID)
                    } catch (l) { }
                    bridge.getObj("tradelst").getComp("wl").addItem(g);
                    bridge.getObj("orderlst").getComp("wl").updateItem(f);
                    var m = f[31];
                    this.refreshACC(f[1], m);
                    this.refreshPF(m, f[3])
                }
            }
        } catch (w) { }
    },
    onAlgoMatch: function (b) {
        try {
            var d = b.get(Const.AlgoClCriteriaID)
                , e = bridge.getObj("autolst").getComp("wl").getByKey(d);
            e != null && (console.log("execute match " + b.get(Const.AlgoClCriteriaID) + " w orderno: " + b.get(Const.ClOrdID)),
                e[6] = "1",
                e[25] = b.get(Const.ClOrdID),
                e[29] = b.get(Const.AlgoTransacTime),
                bridge.getObj("autolst").getComp("wl").updateItem(e))
        } catch (f) { }
    },
    sendAmend: function (b, d) {
        var e = d[0].slice(0)
            , f = this.genOrderId();
        e[8] = "N5";
        e[12] = f;
        e[5] = d[1];
        e[47] = d[1];
        e[6] = d[2];
        e[2] = this.genTimeFormatted();
        e[0] = f;
        e[38] = d[0][0];
        e[11] = "";
        e[17] = bridge.getObj("userid");
        e[26] = "JSX";
        var g = d[2] * Const.lotSize
            , i = e[35] + (g - e[34]);
        e[35] = i;
        e[34] = g;
        e[7] = g * d[1];
        e[9] = i / Const.lotSize;
        d[0][8] = "R5";
        d[0][22] = bridge.getObj("userid");
        d[0][23] = e[2];
        d[0][39] = f;
        g = new fixfield("G");
        g.set(Const.ClientID, bridge.getObj("userid"));
        g.set(Const.ClOrdID, f);
        g.set(Const.Account, d[0][28]);
        g.set(Const.Symbol, d[0][3]);
        g.set(Const.Side, d[0][4]);
        g.set(Const.TransactTime, this.genDateFormatted(!0));
        g.set(Const.OrdType, d[0][29]);
        g.set(Const.OrderQty, d[2] * Const.lotSize);
        g.set(Const.Price, d[1]);
        g.set(Const.OrderID, d[0][11]);
        g.set(Const.OrigClOrdID, d[0][0]);
        g.set(Const.HandlInst, d[0][27]);
        g.set(Const.SymbolSfx, d[0][15]);
        g.set(Const.SID, d[0][25]);
        g.set(Const.tudSID, d[0][25]);
        f = [];
        f.push(g.getType());
        f.push(g.toString());
        bridge.getObj("orderlst").getComp("wl").updateItem(d[0]);
        bridge.getObj("orderlst").getComp("wl").addItem(e);
        bridge.sendFix(f)
    },
    onReplaceOK: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        d != null && (d[8] = "5",
            d[23] = b.get(Const.TransactTime),
            bridge.getObj("orderlst").getComp("wl").updateItem(d),
            b = d[31],
            this.refreshACC(d[1], b),
            this.refreshPF(b, d[3]))
    },
    onReplaceBAD: function (b) {
        var d = b.get(Const.ClOrdID)
            , e = b.get(Const.OrigClOrdID)
            , e = bridge.getObj("orderlst").getComp("wl").getByKey(e);
        if (e != null && e[8] != "2" && e[8] != "4" && e[8] != "5") {
            e[8] = e[10] == 0 ? "0" : e[10] < e[6] ? "1" : "2";
            e[22] = "";
            e[23] = "";
            e[39] = "";
            bridge.getObj("orderlst").getComp("wl").updateItem(e);
            var f = e[31];
            this.refreshACC(e[1], f);
            this.refreshPF(f, e[3])
        }
        d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        d != null && (d[8] = "8",
            d[38] = "",
            d[13] = b.get(Const.Text),
            bridge.getObj("orderlst").getComp("wl").updateItem(d))
    },
    sendWithdraw: function (b, d) {
        d[8] = "R4";
        d[21] = this.genTimeFormatted();
        d[20] = bridge.getObj("userid");
        var e = new fixfield("F");
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.OrigClOrdID, d[11]);
        e.set(Const.ClOrdID, d[12]);
        e.set(Const.OrderID, d[11]);
        e.set(Const.Account, d[28]);
        e.set(Const.Symbol, d[3]);
        e.set(Const.Side, d[4]);
        e.set(Const.TransactTime, this.genDateFormatted(!0));
        e.set(Const.HandlInst, d[27]);
        e.set(Const.SymbolSfx, d[15]);
        e.set(Const.OrderQty, d[34]);
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        bridge.getObj("orderlst").getComp("wl").updateItem(d);
        bridge.sendFix(f)
    },
    sendAlgoWithdraw: function (b, d) {
        d[6] = "R4";
        d[30] = this.genDateFormatted(!0);
        d[31] = bridge.getObj("userid");
        var e = new fixfield("CF");
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.AlgoClCriteriaID, d[17]);
        e.set(Const.AlgoCriteriaID, d[18]);
        e.set(Const.AlgoStatus, "R4");
        e.set(Const.AlgoTransacTime, this.genDateFormatted(!0));
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        bridge.getObj("autolst").getComp("wl").updateItem(d);
        console.log("send cancel algo " + e.toString());
        bridge.sendFix(f)
    },
    onCancelOK: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        d != null && (d[8] = "4",
            d[21] = b.get(Const.TransacTime),
            bridge.getObj("orderlst").getComp("wl").updateItem(d),
            b = d[31],
            this.refreshACC(d[1], b),
            this.refreshPF(b, d[3]))
    },
    onAlgoCancelOK: function (b) {
        var d = b.get(Const.AlgoClCriteriaID)
            , d = bridge.getObj("autolst").getComp("wl").getByKey(d);
        d != null && (console.log("execute cancel algo OK " + b.get(Const.AlgoClCriteriaID)),
            d[6] = "4",
            d[30] = b.get(Const.AlgoTransacTime),
            bridge.getObj("autolst").getComp("wl").updateItem(d))
    },
    onCancelBAD: function (b) {
        b = b.get(Const.ClOrdID);
        b = bridge.getObj("orderlst").getComp("wl").getByKey(b);
        b != null && b[8] != "8" && b[8] != "RD" && b[8] != "2" && b[8] != "4" && b[8] != "5" && (b[8] = b[10] == 0 ? "0" : b[10] < b[6] ? "1" : "2",
            b[20] = "",
            b[21] = "",
            bridge.getObj("orderlst").getComp("wl").updateItem(b))
    },
    onAlgoCancelBAD: function (b) {
        var d = b.get(Const.AlgoClCriteriaID)
            , d = bridge.getObj("autolst").getComp("wl").getByKey(d);
        d != null && d[6] != "8" && d[6] != "RD" && d[6] != "1" && d[6] != "4" && d[6] != "5" && (console.log("execute cancel algo bad " + b.get(Const.AlgoClCriteriaID)),
            d[6] = "0",
            d[30] = "",
            d[31] = "",
            bridge.getObj("autolst").getComp("wl").updateItem(d))
    },
    deleteTemporary: function (b, d) {
        d[8] = "RD";
        d[21] = this.genTimeFormatted();
        d[20] = bridge.getObj("userid");
        var e = new fixfield("UD");
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.OrigClOrdID, d[11]);
        e.set(Const.ClOrdID, d[12]);
        e.set(Const.OrderID, d[11]);
        e.set(Const.Account, d[28]);
        e.set(Const.Symbol, d[3]);
        e.set(Const.Side, d[4]);
        e.set(Const.TransactTime, this.genDateFormatted(!0));
        e.set(Const.HandlInst, d[27]);
        e.set(Const.SymbolSfx, d[15]);
        e.set(Const.OrderQty, d[34]);
        e.set(Const.OrdStatus, d[8]);
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        bridge.getObj("orderlst").getComp("wl").updateItem(d);
        bridge.sendFix(f)
    },
    sendTemporary: function (b, d) {
        d[8] = "R0";
        var e = new fixfield("D");
        e.set(Const.ClOrdID, d[12]);
        e.set(Const.ClientID, bridge.getObj("userid"));
        e.set(Const.ClAccID, d[31]);
        e.set(Const.CttID, d[32]);
        e.set(Const.InitialCode, d[30]);
        e.set(Const.ExchangeID, "JSX");
        e.set(Const.DirectID, "OL");
        e.set(Const.Account, d[28]);
        e.set(Const.HandlInst, d[27]);
        e.set(Const.SymbolSfx, d[15]);
        e.set(Const.Symbol, d[3]);
        e.set(Const.Side, d[4]);
        e.set(Const.TransactTime, this.genDateFormatted(!0));
        e.set(Const.OrderQty, d[34]);
        e.set(Const.OrdType, d[29]);
        e.set(Const.Price, d[5]);
        e.set(Const.TimeInForce, d[29]);
        e.set(Const.SID, d[25]);
        e.set(Const.tudSID, d[25]);
        e.set(Const.OrdStatus, d[8]);
        var f = [];
        f.push(e.getType());
        f.push(e.toString());
        bridge.sendFix(f);
        bridge.getObj("orderlst").getComp("wl").updateItem(d)
    },
    onOrderTaker: function (b) {
        var d = [b.get(Const.Symbol), b.get(Const.Price), b.get(Const.OrderQty) / Const.lotSize, b.get(Const.InitialCode), b.get(Const.SymbolSfx), b.get(Const.OrdType), b.get(Const.OrdStatus) == "RT", b.get(Const.Side)];
        d = this.genOrder(d, b.get(Const.ClOrdID));
        d[26] = b.get(Const.tudXCG_ID);
        d[17] = b.get(Const.ClientID);
        d[26] != "JSX" && (d[17] = a[26]);
        bridge.getObj("orderlst").getComp("wl").getByKey(d[0]) == null && bridge.getObj("orderlst").getComp("wl").addItem(d)
    },
    onAlgoTaker: function (b) {
        var d = [];
        d.push(b.get(Const.AlgoSymbol));
        d.push(b.get(Const.AlgoBookingType));
        d.push(b.get(Const.AlgoOperatorType));
        d.push(b.get(Const.AlgoPriceType));
        d.push(b.get(Const.AlgoPrice));
        d.push(b.get(Const.AlgoTime));
        d.push(b.get(Const.AlgoStatus));
        d.push(b.get(Const.Side));
        d.push(b.get(Const.Price));
        d.push(b.get(Const.OrderQty));
        d.push(b.get(Const.OrderQty) / Const.lotSize);
        d.push(b.get(Const.InitialCode));
        d.push(b.get(Const.SymbolSfx));
        d.push(b.get(Const.OrdType));
        d.push(b.get(Const.AlgoValidFrom));
        d.push(b.get(Const.AlgoValidTo));
        d.push(b.get(Const.AlgoSendAs));
        d.push(b.get(Const.AlgoClCriteriaID));
        d.push("");
        d.push("1");
        d.push(b.get(Const.SID));
        d.push(b.get(Const.InitialCode));
        d.push(b.get(Const.Account));
        d.push(b.get(Const.CttID));
        d.push(b.get(Const.ClAccID));
        d.push("");
        d.push(b.get(Const.AlgoTransacTime));
        d.push(b.get(Const.ClientID));
        d.push("");
        d.push("");
        d.push("");
        d.push("");
        d.push("");
        d.push("");
        d.push(b.get(Const.AlgoDescription));
        d.push("");
        bridge.getObj("autolst").getComp("wl").getByKey(d[17]) == null && bridge.getObj("autolst").getComp("wl").addItem(d)
    },
    onCancelTaker: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        if (d != null) {
            var e = d[8];
            e != "4" && e != "5" && e != "2" && (d[8] = "R4",
                d[20] = b.get(Const.ClientID),
                d[21] = b.get(Const.TransactTime),
                bridge.getObj("orderlst").getComp("wl").updateItem(d))
        }
    },
    onAlgoCancelTaker: function (b) {
        var d = b.get(Const.AlgoClCriteriaID)
            , d = bridge.getObj("autolst").getComp("wl").getByKey(d);
        if (d != null) {
            var e = d[6];
            e != "4" && e != "5" && e != "1" && (console.log("execute take cancel algo " + b.get(Const.AlgoClCriteriaID)),
                d[6] = "R4",
                d[31] = b.get(Const.ClientID),
                d[30] = b.get(Const.AlgoTransacTime),
                bridge.getObj("autolst").getComp("wl").updateItem(d))
        }
    },
    onReplaceTaker: function (b) {
        var d = b.get(Const.OrigClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        if (d != null) {
            var e = d[8];
            if (e != "4" && e != "5" && e != "2") {
                var e = d.slice(0)
                    , f = b.get(Const.ClOrdID);
                e[8] = "N5";
                e[12] = f;
                e[5] = b.get(Const.Price);
                e[47] = b.get(Const.Price);
                e[34] = b.get(Const.OrderQty);
                e[6] = b.get(Const.OrderQty) / Const.lotSize;
                var g = b.get(Const.TransactTime);
                e[2] = g.split("-")[1];
                e[11] = "";
                e[0] = f;
                e[8] = "N5";
                e[38] = d[0];
                e[17] = b.get(Const.ClientID);
                var g = e[34]
                    , i = e[35] + (g - e[34]);
                e[35] = i;
                e[34] = g;
                e[7] = g * e[5];
                e[9] = i / Const.lotSize;
                d[8] = "R5";
                d[22] = b.get(Const.ClientID);
                d[23] = b.get(Const.TransactTime);
                d[39] = f;
                bridge.getObj("orderlst").getComp("wl").addItem(e);
                bridge.getObj("orderlst").getComp("wl").updateItem(d)
            }
        }
    },
    onDeleteTaker: function (b) {
        var d = b.get(Const.ClOrdID)
            , d = bridge.getObj("orderlst").getComp("wl").getByKey(d);
        if (d != null) {
            var e = d[8];
            e != "4" && e != "5" && e != "D" && e != "2" && e != "1" && (d[8] = "RD",
                d[20] = b.get(ClientiD),
                d[21] = b.get(TransactTime),
                bridge.getObj("orderlst").getComp("wl").updateItem(d))
        }
    },
    refreshPF: function (b, d) {
        this.trdpf.doQuery(b + "#" + d)
    },
    refreshACC: function (b, d) {
        this.trdacc.doQuery(b + "#" + d)
    },
    refreshORD: function () {
        bridge.getObj("trd") ? this.trdol.doQuery() : this.showTrdLogin()
    },
    refreshTRD: function () {
        bridge.getObj("trd") ? this.trdtl.doQuery() : this.showTrdLogin()
    },
    refreshAUTO: function () {
        bridge.getObj("trd") ? this.trdauto.doQuery() : this.showTrdLogin()
    },
    refreshACCView: function () {
        bridge.getObj("pf").refreshHeader()
    },
    refreshPFView: function () {
        bridge.getObj("pf").refreshPFView()
    },
    refreshHeader: function () {
        bridge.getObj("pf").refreshHeader()
    }
});
enyo.kind({
    name: "offlineengine",
    firsttime: !0,
    masterURL: Const._url + Const._urlaggregate + "?q=MSD",
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.updateMe), 6E5);
        bridge.addObj("offlineengine", this);
        setTimeout(function () {
            bridge.getObj("clientengine").showLoading("loading data, please wait...");
            bridge.getObj("offlineengine").startDelayed();
            bridge.getObj("offlineengine").getDelayed()
        }, 1E3)
    },
    startDelayed: function () {
        this.thread.start()
    },
    stopDelayed: function () {
        this.thread.stop()
    },
    onLoginOK: function () {
        this.stopDelayed()
    },
    onLogoutOK: function () {
        this.startDelayed();
        Store.fd = null;
        bridge.getObj("offlineengine").getDelayed()
    },
    updateMe: function () {
        this.getDelayed()
    },
    getDelayed: function () {
        var b = new enyo.JsonpRequest({
            url: Const._url + Const._urlaggregate + "?q=MRD",
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                this.delayed_market = e.data;
                for (var f = this.delayed_market.ssum, g = 0; g < f.length; g++) {
                    var i = f[g];
                    Store.ss[i[2] + i[3]] = i
                }
                bridge.getObj("home-pnlsrank").doUpdate();
                Store.tbval.splice(0, Store.tbval.length);
                for (var j = this.delayed_market.brankval, g = 0; g < j.length; g++)
                    i = j[g],
                        Store.tbval.push(i);
                Store.tbvol.splice(0, Store.tbvol.length);
                for (var k = this.delayed_market.brankvol, g = 0; g < k.length; g++)
                    i = k[g],
                        Store.tbvol.push(i);
                Store.tbfrq.splice(0, Store.tbfrq.length);
                for (var l = this.delayed_market.brankfrq, g = 0; g < l.length; g++)
                    i = l[g],
                        Store.tbfrq.push(i);
                bridge.getObj("home-pnlbrank").doUpdate();
                for (var m = this.delayed_market.indices, g = 0; g < m.length; g++)
                    i = m[g],
                        Store.idx[i[3]] = i;
                var w = this.delayed_market.fdsumm[0];
                w && (Store.fd = w);
                this.firsttime && (this.firsttime = !1,
                    bridge.getObj("clientengine").hideLoading(),
                    setTimeout(function () {
                        processHash()
                    }, 1E3))
            } catch (y) {
                bridge.getObj("clientengine").hideLoading()
            }
        });
        b.error(this, function () {
            bridge.getObj("clientengine").hideLoading()
        });
        b.go()
    },
    components: [{
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "onlineengine",
    firsttime: !0,
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.getData), 6E4);
        bridge.addObj("onlineengine", this);
        setTimeout(function () {
            bridge.getObj("onlineengine").startThread();
            bridge.getObj("onlineengine").getData()
        }, 1E3)
    },
    stopThread: function () {
        this.thread.stop()
    },
    startThread: function () {
        this.thread.start()
    },
    genDateFormatted: function (b) {
        var d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , b = b.getDate() + "";
        return d + "/" + (e.length == 1 ? "0" + e : e) + "/" + (b.length == 1 ? "0" + b : b)
    },
    onLoginOK: function () {
        Store.stocklist.splice(0, Store.stocklist.length);
        Store.brokerlist.splice(0, Store.brokerlist.length);
        this.modstock || (this.modstock = new mod.stock);
        this.modbroker || (this.modbroker = new mod.broker);
        this.ss || (this.ss = new mod.ss(bridge.getObj("pnlwatchlist")));
        this.info || (this.info = new mod.info);
        this.modmarket || (this.modmarket = new mod.market(bridge.getObj("pnlmarket").getComp("sr")));
        this.modhol || (this.modhol = new mod.holiday);
        this.modidx || (this.modidx = new mod.indices);
        var b = bridge.getObj("clientengine").genTime();
        b.setFullYear(b.getFullYear() - 1);
        this.modhol.filter = "HOL#" + this.genDateFormatted(b) + "#" + this.genDateFormatted(bridge.getObj("clientengine").genTime());
        this.modstock.doRestart();
        this.modbroker.doRestart();
        this.ss.doRestart();
        this.info.doRestart();
        this.modmarket.doRestart();
        this.modhol.doRestart();
        this.modidx.doRestart()
    },
    onLogoutOK: function () {
        this.modstock.doStop();
        this.modbroker.doStop();
        this.ss.doStop();
        this.info.doStop();
        this.modmarket.doStop();
        this.modhol.doStop();
        this.modidx.doStop()
    },
    getData: function () {
        var b = new enyo.JsonpRequest({
            url: Const._url + Const._urlaggregate + "?q=GMD",
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                this.delayed_market = e;
                this.delayed_market.status = "1";
                for (var f = this.delayed_market.data.gindices, g = 0; g < f.length; g++) {
                    var i = f[g];
                    i[1] = i[0];
                    i[0] = i[8] + i[1];
                    Store.gi[i[0]] = i
                }
                for (var j = this.delayed_market.data.currency, g = 0; g < j.length; g++)
                    i = j[g],
                        Store.currency[i[0]] = i;
                for (var k = this.delayed_market.data.commodities, g = 0; g < k.length; g++)
                    i = k[g],
                        Store.comm[i[0]] = i;
                for (var l = this.delayed_market.data.futures, g = 0; g < l.length; g++)
                    i = l[g],
                        Store.fut[i[0]] = i;
                bridge.getObj("pnlworldinfo").doUpdate();
                bridge.getObj("pnlworldinfo").doUpdateCurr()
            } catch (m) { }
        });
        b.error(this, function () { });
        b.go()
    },
    components: [{
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "mainframe",
    kind: "FittableRows",
    classes: "enyo-fit",
    create: function () {
        this.inherited(arguments);
        this.$.pane.$.animator.setDuration(250);
        enyo.bind(this, this.toggle);
        enyo.bind(this, this.changeIndex);
        bridge.addObj("dashboard", this)
    },
    changeIndex: function (b) {
        this.$.panel.setIndex(b)
    },
    toggle: function () {
        this.$.pane.toggleMinMax()
    },
    menuTapHandler: function (b, d) {
        this.$.pane.animateToMin();
        d.cmd == "showLogout" ? (this.$.ii2.setContent("Are you sure want to logout?"),
            this.$.confirmLogout.ctype = "feed",
            this.$.confirmLogout.show()) : d.cmd == "showTrdLogout" ? (this.$.ii2.setContent("Are you sure want to logout (trading)?"),
                this.$.confirmLogout.ctype = "trading",
                this.$.confirmLogout.show()) : bridge.getObj("clientengine")[d.cmd]()
    },
    showLoading: function (b) {
        this.setProgress(b);
        this.$.popupLoading.show()
    },
    hideLoading: function () {
        this.$.popupLoading.hide()
    },
    setProgress: function (b) {
        this.$.loadingMsg.setContent(b)
    },
    showAlert: function (b) {
        this.$.popupFlash.setContent(b);
        this.$.popupFlash.show();
        enyo.job("hideAlert", enyo.bind(this, "hideAlert"), 3E3)
    },
    hideAlert: function () {
        this.$.popupFlash.hide()
    },
    onOKLogout: function () {
        this.$.confirmLogout.hide();
        this.$.confirmLogout.ctype == "feed" ? bridge.getObj("clientengine").showLogout() : bridge.getObj("clientengine").showTrdLogout()
    },
    onCancelLogout: function () {
        this.$.confirmLogout.hide()
    },
    components: [{
        kind: "FittableRows",
        name: "menu",
        classes: "enyo-fit menupane-menu",
        components: [{
            content: "PT BNI Sekuritas",
            classes: "rows2 line white bold bg-param"
        }, {
            kind: "enyo.Scroller",
            touch: !0,
            horizontal: "hidden",
            fit: !0,
            components: [{
                kind: "zaisan.menu",
                ontap: "menuTapHandler"
            }]
        }, {
            kind: "FittableRows",
            style: "height:3em;",
            classes: "bg-param",
            components: [{
                allowHtml: !0,
                content: "Copyright \u00a9 2019 - <a href='https://www.bnisekuritas.co.id' class='lightblue' target='_blank'>BNI Sekuritas</a>,",
                classes: "bold menu-footer f14"
            }, {
                allowHtml: !0,
                content: "unless otherwise noted.- V.3.4",
                classes: "menu-footer2 f14"
            }, {
                allowHtml: !0,
                content: "designed by kang.meddy",
                classes: "menu-footer f14"
            }]
        }]
    }, {
        name: "pane",
        kind: "enyo.Slideable",
        classes: "menupane-pane",
        value: 0,
        min: 0,
        max: 15,
        unit: "em",
        draggable: !1,
        components: [{
            kind: "FittableRows",
            style: "height:100%;",
            classes: "body2",
            components: [{
                kind: "Panels",
                fit: !0,
                draggable: !1,
                arrangerKind: "CardSlideInArranger",
                components: [{
                    kind: "FittableColumns",
                    fit: !0,
                    draggable: !1,
                    classes: "fittable-sample-box",
                    components: [{
                        name: "toolbox",
                        kind: "zaisan.toolbox"
                    }, {
                        style: "width:10px;"
                    }, {
                        name: "panel",
                        kind: "Panels",
                        draggable: !1,
                        arrangerKind: "CarouselArranger",
                        fit: !0,
                        components: [{
                            kind: "zaisan.home",
                            classes: "enyo-fit"
                        }, {
                            kind: "zaisan.dashboard",
                            classes: "enyo-fit"
                        }, {
                            kind: "zaisan.account",
                            classes: "enyo-fit"
                        }, {
                            kind: "zaisan.report",
                            classes: "enyo-fit"
                        }]
                    }]
                }]
            }]
        }]
    }, {
        name: "popupLoading",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        classes: "bold shadow pullout-popup",
        scrim: !0,
        components: [{
            name: "loadingMsg",
            content: "",
            allowHtml: !0
        }]
    }, {
        kind: "zaisan.pnllock"
    }, {
        kind: "zaisan.pnlpin"
    }, {
        name: "popupFlash",
        allowHtml: !0,
        kind: "onyx.Popup",
        centered: !0,
        floating: !0,
        allowHtml: !0,
        classes: "bold shadow pullout-popup"
    }, {
        kind: "zaisan.pnlchgpwd",
        draggable: !1,
        classes: "pullout-chgpwd"
    }, {
        kind: "zaisan.pnlchgpin",
        draggable: !1,
        classes: "pullout-chgpwd"
    }, {
        kind: "zaisan.pnlentryorder",
        draggable: !1,
        classes: "pullout-entry mobile-pullout-entry"
    }, {
        kind: "zaisan.pnlentryalgo",
        draggable: !1,
        classes: "pullout-entryAlgo mobile-pullout-entry"
    }, {
        kind: "zaisan.pnlchangeorder",
        draggable: !1,
        classes: "pullout-entry mobile-pullout-entry"
    }, {
        kind: "zaisan.pnlchart"
    }, {
        kind: "zaisan.pnlheatmap"
    }, {
        kind: "zaisan.pnlpromo"
    }, {
        kind: "zaisan.pnltradewatch"
    }, {
        kind: "zaisan.pnlnewsdetail"
    }, {
        kind: "zaisan.pnlnewspopup"
    }, {
        kind: "zaisan.pnlbrokersrank"
    }, {
        kind: "zaisan.pnldisclaimer"
    }, {
        kind: "zaisan.pnlregis"
    }, {
        kind: "zaisan.pnltrial"
    }, {
        kind: "zaisan.pnlvideo"
    }, {
        kind: "zaisan.pnlfaqdetail"
    }, {
        kind: "zaisan.pnlcaldetail"
    }, {
        kind: "zaisan.pnlcustinfo"
    }, {
        kind: "zaisan.pnlstockdetail"
    }, {
        name: "confirmLogout",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed; padding: 2em;",
        classes: "bold shadow",
        scrim: !0,
        components: [{
            kind: "FittableRows",
            style: "width:18em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to logout?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOKLogout"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancelLogout"
                }]
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.home",
    layoutKind: "FittableRowLayout",
    create: function () {
        this.inherited(arguments);
        setTimeout(enyo.bind(this, this.resized), 10)
    },
    resizeHandler: function (b, d) {
        this.$.s.setBounds({
            height: this.getBounds().height
        }, "px");
        this.inherited(arguments)
    },
    onLoginOK: function () {
        this.$.pnl.setIndex(1)
    },
    onLogoutOK: function () {
        this.$.pnl.setIndex(0)
    },
    components: [{
        name: "s",
        kind: "Scroller",
        touch: !0,
        vertical: "hidden",
        horizontal: "auto",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            style: "height:49%",
            components: [{
                kind: "zaisan.indices",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.stockrank",
                style: "width:32%;min-width:260px;",
                linkTo: "home-ob"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.brokerrank",
                fit: !0,
                style: "min-width:260px;"
            }]
        }, {
            style: "height:2%"
        }, {
            kind: "FittableColumns",
            style: "height:49%",
            fit: !0,
            components: [{
                kind: "zaisan.worldinfo",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.banner",
                style: "width:32%;min-width:260px;",
                unique: "home-pnlbanner"
            }, {
                style: "width:1%"
            }, {
                name: "pnl",
                kind: "Panels",
                fit: !0,
                draggable: !1,
                style: "min-width:260px;",
                components: [{
                    kind: "zaisan.login",
                    unique: "home-pnllogin"
                }, {
                    kind: "zaisan.pnlorderbook",
                    unique: "home-ob"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.dashboard",
    layoutKind: "FittableRowLayout",
    create: function () {
        this.inherited(arguments);
        setTimeout(enyo.bind(this, this.resized), 10)
    },
    resizeHandler: function (b, d) {
        this.$.s.setBounds({
            height: this.getBounds().height
        }, "px");
        this.inherited(arguments)
    },
    onLoginOK: function () {
        this.$.pnl1.setIndex(1);
        this.$.pnl2.setIndex(1)
    },
    onLogoutOK: function () {
        this.$.pnl1.setIndex(0);
        this.$.pnl2.setIndex(0)
    },
    components: [{
        name: "s",
        kind: "Scroller",
        touch: !0,
        vertical: "hidden",
        horizontal: "auto",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            style: "height:49%",
            components: [{
                kind: "zaisan.pnlgroupdashboard",
                style: "width:65%;min-width:530px;"
            }, {
                style: "width:1%"
            }, {
                name: "pnl1",
                kind: "Panels",
                fit: !0,
                draggable: !1,
                style: "min-width:260px;",
                components: [{
                    kind: "zaisan.banner",
                    unique: "dash-pnlbanner"
                }, {
                    kind: "zaisan.pnlgrouprank"
                }]
            }]
        }, {
            style: "height:2%"
        }, {
            kind: "FittableColumns",
            style: "height:49%",
            fit: !0,
            components: [{
                kind: "zaisan.pnlgroupdashboard2",
                style: "width:65%;min-width:530px;"
            }, {
                style: "width:1%"
            }, {
                name: "pnl2",
                kind: "Panels",
                fit: !0,
                draggable: !1,
                style: "min-width:260px;",
                components: [{
                    kind: "zaisan.login",
                    unique: "dash-pnllogin"
                }, {
                    kind: "zaisan.pnlorderbook",
                    unique: "dash-ob"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.account",
    layoutKind: "FittableRowLayout",
    create: function () {
        this.inherited(arguments);
        setTimeout(enyo.bind(this, this.resized), 10)
    },
    resizeHandler: function (b, d) {
        this.$.s.setBounds({
            height: this.getBounds().height
        }, "px");
        this.inherited(arguments)
    },
    components: [{
        name: "s",
        kind: "Scroller",
        touch: !0,
        vertical: "hidden",
        horizontal: "auto",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            style: "height:49%;min-width:790px;",
            components: [{
                kind: "zaisan.pnlgroupaccount",
                fit: !0
            }]
        }, {
            style: "height:2%"
        }, {
            kind: "FittableColumns",
            style: "height:49%",
            fit: !0,
            components: [{
                kind: "zaisan.pnlgroupaccount2",
                style: "width:65%;min-width:530px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.pnlorderbook",
                fit: !0,
                style: "min-width:260px;",
                unique: "acc-ob"
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.report",
    layoutKind: "FittableRowLayout",
    create: function () {
        this.inherited(arguments);
        setTimeout(enyo.bind(this, this.resized), 10)
    },
    resizeHandler: function (b, d) {
        this.$.s.setBounds({
            height: this.getBounds().height
        }, "px");
        this.inherited(arguments)
    },
    components: [{
        name: "s",
        kind: "Scroller",
        touch: !0,
        vertical: "hidden",
        horizontal: "auto",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            style: "height:49%",
            components: [{
                kind: "zaisan.pnlnotes",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.pnlannouncement",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.banner",
                fit: !0,
                style: "min-width:260px;"
            }]
        }, {
            style: "height:2%"
        }, {
            kind: "FittableColumns",
            style: "height:49%",
            fit: !0,
            components: [{
                kind: "zaisan.faq",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.calendar",
                style: "width:32%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.pnlreport",
                fit: !0,
                style: "min-width:260px;"
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.banner",
    kind: "FittableRows",
    classes: "enyo-unselectable bg-bar block rows white",
    create: function () {
        this.inherited(arguments);
        website && website.bnr2 && this.$.banner.setContent(website.bnr2);
        this.$.banners.reflow();
        var b = {};
        b.setBanner = enyo.bind(this, this.setBanner);
        bridge.addObj(this.unique ? this.unique : "pnlbanner", b)
    },
    setBanner: function (b) {
        this.$.banners.setContent(b)
    },
    components: [{
        name: "banners",
        kind: "FittableRows",
        fit: !0,
        components: [{
            kind: "enyo.Scroller",
            fit: !0,
            touch: !0,
            components: [{
                name: "banner",
                classes: "banner",
                allowHtml: !0,
                content: ""
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.login",
    kind: "FittableRows",
    classes: "enyo-unselectable bg-bar block rows white",
    create: function () {
        this.inherited(arguments);
        website && website.sosmed2 && this.$.sosmed.setContent(website.sosmed2);
        this.reflow();
        enyo.bind(this, this.setSosmed);
        enyo.bind(this, this.setPhoneno);
        enyo.bind(this, this.setInfo);
        enyo.bind(this, this.doReset);
        enyo.bind(this, this.reqFocus);
        bridge.addObj(this.unique ? this.unique : "pnllogin", this)
    },
    reqFocus: function () {
        this.$.fielduser.focus()
    },
    doReset: function () {
        this.setInfo("Welcome, please login to get access");
        this.$.fielduser.setValue("");
        this.$.fieldpassword.setValue("")
    },
    setSosmed: function (b) {
        this.$.sosmed.setContent(b)
    },
    setPhoneno: function (b) {
        this.$.phonenumber.setContent(b)
    },
    setInfo: function (b) {
        this.$.info.setContent(b)
    },
    onLogin: function () {
        var b = [this.$.fielduser.getValue().trim(), this.$.fieldpassword.getValue(), bridge.getObj(this.unique)];
        return b[0] == "" || b[1] == "" ? this.$.info.setContent("please enter valid custid & passwd") : (document.activeElement.blur(),
            Router.send("onLogin", b)),
            !0
    },
    onRegis: function () {
        Router.send("onRegis")
    },
    onTrial: function () {
        Router.send("onTrial")
    },
    focusMe: function (b) {
        b.container.focus()
    },
    components: [{
        name: "top",
        kind: "FittableRows",
        fit: !0,
        components: [{
            allowHtml: !0,
            content: "<img src='assets/icons/bions.png'/>",
            classes: "zaisan center"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "info",
            content: "Welcome, please login to get access",
            classes: "center"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "entry1",
            kind: "onyx.InputDecorator",
            classes: "grid100",
            alwaysLooksFocused: !1,
            components: [{
                name: "fielduser",
                kind: "onyx.Input",
                placeholder: "Cust ID",
                classes: "enyo-selectable",
                defaultFocus: !0
            }]
        }, {
            content: "&nbsp;",
            allowHtml: !0,
            style: "height:.25em"
        }, {
            name: "entry2",
            kind: "onyx.InputDecorator",
            classes: "grid100",
            alwaysLooksFocused: !1,
            components: [{
                name: "fieldpassword",
                kind: "onyx.Input",
                type: "password",
                placeholder: "Password",
                classes: "enyo-selectable"
            }]
        }, {
            content: "&nbsp;",
            allowHtml: !0,
            style: "height:.25em"
        }, {
            name: "btnLogin",
            kind: "onyx.Button",
            classes: "grid100 bg-bright white",
            style: "height: 2.1em;",
            content: "LOGIN",
            ontap: "onLogin"
        }, {
            content: "&nbsp;",
            allowHtml: !0,
            style: "height:.25em"
        }, {
            kind: "FittableColumns",
            components: [{
                name: "btnregis",
                kind: "onyx.Button",
                classes: "grid49",
                style: "height: 2.1em;",
                content: "Register Here",
                ontap: "onRegis"
            }, {
                classes: "grid2",
                allowHtml: !0,
                content: "&nbsp;"
            }, {
                name: "btntrial",
                kind: "onyx.Button",
                classes: "bg-green white grid49",
                style: "height: 2.1em;",
                content: "Free Trial Here",
                ontap: "onTrial"
            }]
        }, {
            allowHtml: !0,
            content: "<a href='https://www.bnisekuritas.co.id/onlinetrading/resetpassword/' class='white plain' target='_blank'>Forgot Password?</a>",
            classes: "centered"
        }, {
            name: "sosmed",
            allowHtml: !0,
            fit: !0,
            style: "height:3em;",
            content: ""
        }, {
            content: "You are not login, data delayed 10 minutes",
            classes: "center f14"
        }, {
            name: "phonenumber",
            content: "CALL US 14016",
            classes: "center"
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "doReset",
        onLogoutOK: "doReset"
    }]
});
enyo.kind({
    name: "zaisan.pnlchart",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:90%; width:90%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-param",
    scrim: !0,
    realtime: !1,
    siap: !1,
    fromShow: !1,
    myX: 0,
    myY: 0,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlchart", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "CHART",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "rb",
                kind: "onyx.Button",
                content: "BUY",
                ontap: "onBuy",
                classes: "bg-red white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "rs",
                kind: "onyx.Button",
                content: "SELL",
                ontap: "onSell",
                classes: "bg-green white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill",
                style: "border: none;"
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }, {
        style: "height:.5em;"
    }],
    onLoginOK: function () { },
    onLogoutOK: function () {
        this.close()
    },
    show: function (b) {
        this.inherited(arguments);
        this.siap ? (this.fromShow = !1,
            this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100)) : (this.siap = !0,
                this.urlChanged())
    },
    close: function () {
        return this.hide(),
            this.fromShow = !0,
            !0
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100);
        this.fromShow = !1
    },
    rendered: function () {
        this.inherited(arguments)
    },
    urlChanged: function () {
        if (Math.abs(this.myX - this.getBounds().width) > 4 || Math.abs(this.myY - this.getBounds().height))
            this.myX = this.getBounds().width,
                this.myY = this.getBounds().height,
                this.$.iframe.setSrc(Const._urlchart + "?v=1.0&width=" + (this.getBounds().width - 30) + "&height=" + (this.getBounds().height - 70))
    },
    changeQuote: function () {
        var b = localStorage.getItem("__H.rymnz_v1.0__cc.StockChooser.selectedStock");
        (b != null || b != "") && Store.stock[b] && Router.send("onChangeQuote", b)
    },
    onBuy: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowBuy")
    },
    onSell: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowSell")
    }
});
enyo.kind({
    name: "zaisan.pnlheatmap",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:90%; width:90%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-param",
    scrim: !0,
    realtime: !1,
    siap: !1,
    fromShow: !1,
    myX: 0,
    myY: 0,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlheatmap", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "HEATMAP",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "rb",
                kind: "onyx.Button",
                content: "BUY",
                ontap: "onBuy",
                classes: "bg-red white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "rs",
                kind: "onyx.Button",
                content: "SELL",
                ontap: "onSell",
                classes: "bg-green white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill bg-param",
                style: "border: none;"
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }, {
        style: "height:.5em;"
    }],
    onLoginOK: function () { },
    onLogoutOK: function () {
        this.close()
    },
    show: function (b) {
        this.inherited(arguments);
        this.siap ? (this.fromShow = !1,
            this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100)) : (this.siap = !0,
                this.urlChanged())
    },
    close: function () {
        return this.hide(),
            this.fromShow = !0,
            !0
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100);
        this.fromShow = !1
    },
    rendered: function () {
        this.inherited(arguments)
    },
    urlChanged: function () {
        if (Math.abs(this.myX - this.getBounds().width) > 4 || Math.abs(this.myY - this.getBounds().height))
            this.myX = this.getBounds().width,
                this.myY = this.getBounds().height,
                this.$.iframe.setSrc(Const._urlheatmap + "?v=1.0&width=" + (this.getBounds().width - 30) + "&height=" + (this.getBounds().height - 50))
    },
    changeQuote: function () { },
    onBuy: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowBuy")
    },
    onSell: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowSell")
    }
});
enyo.kind({
    name: "staticfield",
    kindLayout: "FittableRows",
    create: function () {
        this.inherited(arguments);
        this.label && this.$.label.setContent(this.label);
        this.value && this.$.field.setContent(this.value);
        this.alignment && this.$.field.addClasses(this.aligment)
    },
    setValue: function (b) {
        this.$.field.setContent(b)
    },
    getValue: function () {
        return this.$.field.getContent()
    },
    components: [{
        kind: "FittableColumns",
        classes: "btm-spacer grid100",
        components: [{
            name: "label",
            allowHtml: !0,
            classes: "grid30"
        }, {
            name: "field",
            classes: "staticbox grid70 texts"
        }]
    }]
});
enyo.kind({
    name: "LabeledItem2",
    published: {
        label: ""
    },
    kind: "FittableRows",
    focus: function () {
        this.$.input.focus()
    },
    components: [{
        name: "ipt",
        fit: !0,
        layoutKind: "FittableColumnsLayout",
        classes: "grid100",
        components: [{
            name: "label",
            allowHtml: !0,
            classes: "grid40"
        }, {
            name: "entry1",
            kind: "onyx.InputDecorator",
            classes: "grid60 enyo-selectable",
            alwaysLooksFocused: !1,
            components: [{
                kind: "onyx.Input",
                name: "input",
                selectOnFocus: !0,
                classes: "enyo-selectable grid100",
                onkeyup: "validate"
            }]
        }]
    }],
    validate: function () {
        this.type && this.type == "number" && /\D/g.test(this.$.input.getValue()) && this.$.input.setValue(this.$.input.getValue().replace(/\D/g, ""));
        this.afterValidate && this.afterValidate()
    },
    create: function () {
        this.inherited(arguments);
        this.labelChanged();
        this.type && this.type == "password" && this.$.input.setAttribute("type", this.type);
        this.type && this.type == "number" && (this.$.input.setSelectOnFocus(!0),
            this.$.input.addClass("right"));
        this.cls && this.$.input.addClass(this.cls)
    },
    labelChanged: function () {
        this.$.label.setContent(this.label)
    },
    getValue: function () {
        return this.$.input.getValue ? this.$.input.getValue() : this.$.input.getContent()
    },
    setValue: function (b) {
        this.$.input.setValue ? this.$.input.setValue(b) : this.$.input.setContent(b)
    }
});
enyo.kind({
    name: "onyx.ddStock",
    events: {
        onChgstock: ""
    },
    layoutKind: "FittableRowsLayout",
    components: [{
        name: "ipt",
        fit: !0,
        onInputChanged: "inputChanged",
        onValueSelected: "chgStock",
        kind: "xinput",
        layoutKind: "FittableColumnsLayout",
        classes: "enyo-selectable",
        alwaysLooksFocused: !1,
        components: [{
            name: "field",
            kind: "onyx.Input",
            value: "",
            selectOnFocus: !0,
            fit: !0,
            style: "text-transform: uppercase;",
            onchange: "chgStock"
        }]
    }],
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.ipt.setValues(e)
    },
    getValueMe: function () {
        this.$.ipt.getValues()
    },
    setValueMe: function (b) {
        this.$.ipt.setValues(b)
    },
    chgStock: function (b) {
        b.datas = this.$.field.getValue();
        this.doChgstock(b)
    }
});
enyo.kind({
    name: "onyx.ddID",
    events: {
        onChgid: ""
    },
    layoutKind: "FittableRowsLayout",
    components: [{
        name: "ipt",
        fit: !0,
        onInputChanged: "inputChanged",
        onValueSelected: "chgID",
        kind: "xinput",
        classes: "grid100 enyo-selectable",
        layoutKind: "FittableColumnsLayout",
        alwaysLooksFocused: !1,
        components: [{
            name: "field",
            kind: "onyx.Input",
            selectOnFocus: !0,
            value: "",
            fit: !0,
            style: "text-transform: uppercase;",
            onchange: "chgID"
        }]
    }],
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.ID[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.ipt.setValues(e)
    },
    getValueMe: function () {
        this.$.ipt.getValues()
    },
    setValueMe: function (b) {
        this.$.ipt.setValues(b)
    },
    chgID: function (b) {
        b.datas = this.$.field.getValue();
        this.doChgid(b)
    }
});
enyo.kind({
    name: "onyx.ddCUS",
    events: {
        onChgCus: ""
    },
    layoutKind: "FittableRowsLayout",
    components: [{
        name: "ipt",
        fit: !0,
        onInputChanged: "inputChanged",
        onValueSelected: "chgID",
        kind: "xinput",
        classes: "grid100 enyo-selectable",
        layoutKind: "FittableColumnsLayout",
        alwaysLooksFocused: !1,
        components: [{
            name: "field",
            kind: "onyx.Input",
            value: "",
            selectOnFocus: !0,
            fit: !0,
            style: "text-transform: uppercase;",
            onchange: "chgID"
        }]
    }],
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.IDCUS[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.ipt.setValues(e)
    },
    getValueMe: function () {
        this.$.ipt.getValues()
    },
    setValueMe: function (b) {
        this.$.ipt.setValues(b)
    },
    chgID: function (b) {
        b.datas = this.$.field.getValue();
        this.doChgCus(b)
    }
});
enyo.kind({
    name: "Broadcast",
    kind: enyo.Component,
    create: function () {
        this.inherited(arguments);
        Broadcast.addListener(this)
    },
    destroy: function () {
        Broadcast.removeListener(this);
        this.inherited(arguments)
    },
    notify: function (b, d) {
        this.dispatchEvent(b, d)
    },
    statics: {
        listeners: [],
        addListener: function (b) {
            this.listeners.push(b)
        },
        removeListener: function (b) {
            enyo.remove(b, this.listeners)
        },
        send: function (b, d) {
            enyo.forEach(this.listeners, function (e) {
                e[b] && e.notify(b, d)
            })
        }
    }
});
enyo.kind({
    name: "Router",
    kind: enyo.Component,
    create: function () {
        this.inherited(arguments);
        Router.addListener(this)
    },
    destroy: function () {
        Router.removeListener(this);
        this.inherited(arguments)
    },
    notify: function (b, d) {
        this.dispatchEvent(b, d)
    },
    statics: {
        listeners: [],
        addListener: function (b) {
            this.listeners.push(b)
        },
        removeListener: function (b) {
            enyo.remove(b, this.listeners)
        },
        send: function (b, d) {
            enyo.forEach(this.listeners, function (e) {
                e[b] && e.notify(b, d)
            })
        }
    }
});
enyo.kind({
    name: "zaisan.menuitem",
    feed: !1,
    trading: !1,
    published: {
        header: !1,
        disabled: !1,
        label: "",
        cmd: "",
        sec: "1111"
    },
    kind: "FittableRows",
    components: [{
        name: "lbl",
        allowHtml: !0,
        kind: "Control",
        ontap: "doClick"
    }, {
        kind: "Broadcast",
        onLoginOK: "fdLogin",
        onLogoutOK: "fdLogout",
        onTrdLoginOK: "trdLogin",
        onTrdLogoutOK: "trdLogout"
    }],
    fdLogin: function () {
        this.feed = !0;
        this.sec[1] == 1 && !this.header ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    fdLogout: function () {
        this.trading = !1;
        this.sec[0] == 1 && !this.header ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogin: function () {
        this.trading = !0;
        this.sec[3] == 1 && !this.header ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogout: function () {
        this.trading = !1;
        this.sec[2] == 1 && !this.header ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    create: function () {
        this.inherited(arguments);
        this.labelChanged();
        this.secChanged();
        this.$.lbl.addClass(this.header ? "menu-header" : "menu-item")
    },
    labelChanged: function () {
        this.$.lbl.setContent(this.label)
    },
    secChanged: function () {
        this.sec[0] == 1 && !this.header ? this.setDisabled(!1) : this.setDisabled(!0)
    },
    disabledChanged: function () {
        this.$.lbl.removeClass("disabled");
        this.disabled && this.$.lbl.addClass("disabled")
    },
    doClick: function (b, d) {
        if (this.disabled || this.header) {
            try {
                d.preventDefault()
            } catch (e) { }
            return !0
        }
        d.cmd = this.cmd;
        d.disabled = this.disabled
    }
});
enyo.kind({
    name: "zaisan.menu",
    classes: "bold",
    kind: "FittableRows",
    defaultKind: "zaisan.menuitem",
    components: [{
        label: "Market",
        header: !0
    }, {
        label: "Login",
        cmd: "showLogin",
        sec: "1000"
    }, {
        label: "Logout",
        cmd: "showLogout",
        sec: "0111"
    }, {
        label: "Change password",
        cmd: "showChgPwd",
        sec: "0111"
    }, {
        label: "Trading",
        header: !0
    }, {
        label: "Login",
        cmd: "showTrdLogin",
        sec: "0110"
    }, {
        label: "Logout",
        cmd: "showTrdLogout",
        sec: "0001"
    }, {
        label: "Change PIN",
        cmd: "showChgPIN",
        sec: "0001"
    }, {
        label: "More...",
        header: !0
    }, {
        label: "Lock",
        cmd: "showLock",
        sec: "0111"
    }, {
        label: "Mutual Unity",
        cmd: "showForum"
    }, {
        label: "Light Themes",
        cmd: "chgTheme1"
    }, {
        label: "Dark Themes",
        cmd: "chgTheme2"
    }, {
        label: "Promo",
        cmd: "showPromo"
    }, {
        label: "Disclaimer",
        cmd: "showDisclaimer"
    }]
});
enyo.kind({
    name: "zaisan.toolbox",
    kind: "FittableRows",
    classes: "enyo-unselectable toolbox",
    cmd: 0,
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.updateMe), 1E3)
    },
    rendered: function (b) {
        this.inherited(arguments)
    },
    reset: function () {
        this.$.selector.resetTo(0);
        this.triggered(this, {
            cmd: 0
        })
    },
    updateMe: function () {
        var b = bridge.getObj("clientengine").genTime()
            , d = b.getHours() + ""
            , d = d.length == 2 ? d : "0" + d
            , e = b.getMinutes() + ""
            , e = e.length == 2 ? e : "0" + e
            , b = b.getSeconds() + "";
        b = b.length == 2 ? b : "0" + b;
        this.$.time.setContent(d + ":" + e + ":" + b);
        try {
            this.$.status.setContent(Store.info[0][10])
        } catch (f) {
            this.$.status.setContent("-")
        }
    },
    components: [{
        kind: "zaisan.selectorbutton",
        icon: "assets/icons/logo.png",
        ontap: "showmenu",
        classes: "bg-param"
    }, {
        kind: "Control",
        classes: "bar"
    }, {
        name: "svr",
        content: "",
        kind: "zaisan.selectorspacer"
    }, {
        name: "algo",
        content: "",
        kind: "zaisan.selectorspacer"
    }, {
        name: "selector",
        kind: "zaisan.selector",
        onTriggered: "triggered",
        components: [{
            cmd: 0,
            content: "HOME",
            icon: "assets/icons/8.png",
            active: !0
        }, {
            cmd: 1,
            content: "MARKET",
            icon: "assets/icons/2.png"
        }, {
            cmd: 2,
            content: "ACCOUNT",
            icon: "assets/icons/10.png",
            sec: "0111"
        }, {
            cmd: 3,
            content: "REPORT",
            icon: "assets/icons/3.png",
            sec: "0111"
        }]
    }, {
        name: "selector3",
        kind: "zaisan.selector",
        onTriggered: "onPromo",
        grouped: !1,
        components: [{
            cmd: 4,
            content: "PROMO",
            icon: "assets/icons/6.png"
        }]
    }, {
        fit: !0
    }, {
        name: "selector2",
        kind: "zaisan.selector",
        onTriggered: "onBos",
        grouped: !1,
        showing: !1,
        components: [{
            cmd: 7,
            content: "AUTO",
            selected_color: "bg-blue",
            bg: !0,
            sec: "0111"
        }, {
            cmd: 5,
            content: "BUY",
            selected_color: "bg-red",
            bg: !0,
            sec: "0111"
        }, {
            cmd: 6,
            content: "SELL",
            selected_color: "bg-green",
            bg: !0,
            sec: "0111"
        }, {
            name: "status",
            content: "-",
            kind: "zaisan.selectorspacer",
            classes: "texts"
        }, {
            name: "time",
            content: "--:--:--",
            kind: "zaisan.selectorspacer"
        }]
    }, {
        kind: "Broadcast",
        onStatusServer: "statusServer",
        onLoginOK: "fdLogin",
        onLogoutOK: "fdLogout",
        onTrdLoginOK: "trdLogin",
        onTrdLogoutOK: "trdLogout"
    }],
    statusServer: function (b) {
        (b = bridge.getObj("statusserver")) && this.$.algo.setContent("Auto:" + b[0])
    },
    fdLogout: function () {
        this.thread.stop();
        this.$.selector2.setShowing(!1);
        if (this.cmd == 2 || this.cmd == 3)
            this.$.selector.resetTo(0),
                this.triggered(this, {
                    cmd: 0
                });
        this.$.svr.setContent("");
        this.$.status.setContent("");
        this.$.time.setContent("");
        this.reflow()
    },
    fdLogin: function () {
        this.thread.start();
        this.$.selector2.setShowing(!0);
        this.$.svr.setContent(bridge.getObj("svr"));
        this.reflow()
    },
    trdLogin: function () { },
    trdLogout: function () { },
    onBos: function (b, d) {
        d.cmd == 5 ? Router.send("onShowBuy") : d.cmd == 6 ? Router.send("onShowSell") : d.cmd == 7 && Router.send("onShowAlgo")
    },
    onPromo: function () {
        Router.send("onPromo")
    },
    triggered: function (b, d) {
        this.cmd != d.cmd && (this.cmd = d.cmd,
            bridge.getObj("dashboard").changeIndex(this.cmd))
    },
    showmenu: function () {
        return bridge.getObj("dashboard").toggle(),
            !0
    }
});
enyo.kind({
    name: "zaisan.selector",
    kind: "FittableRows",
    classes: "selector-bar",
    defaultKind: "zaisan.selectorbutton",
    grouped: !0,
    handlers: {
        ontap: "buttonTap"
    },
    events: {
        onTriggered: ""
    },
    create: function () {
        this.inherited(arguments);
        this.grouped && (this.lastCircle = this.controls[0])
    },
    buttonTap: function (b) {
        b.pressed && (this.grouped && (this.lastCircle && this.lastCircle.unpressed(),
            this.lastCircle = b,
            this.lastCircle.pressed()),
            this.doTriggered(b))
    },
    resetTo: function (b) {
        this.grouped && (this.lastCircle.unpressed(),
            this.lastCircle = this.controls[b],
            this.lastCircle.pressed())
    }
});
enyo.kind({
    name: "zaisan.selectorbutton",
    kind: "Control",
    classes: "selector-button",
    feed: !1,
    trading: !1,
    published: {
        selected_color: "selector-selected",
        icon: "",
        disabled: !1,
        cmd: "",
        sec: "1111"
    },
    allowHtml: !0,
    fdLogin: function () {
        this.feed = !0;
        this.sec[1] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    fdLogout: function () {
        this.trading = !1;
        this.sec[0] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogin: function () {
        this.trading = !0;
        this.sec[3] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogout: function () {
        this.trading = !1;
        this.sec[2] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    create: function () {
        this.inherited(arguments);
        (this.active || this.bg) && this.addClass(this.selected_color);
        this.icon ? this.iconChanged() : this.addClass("selector-button-only");
        this.secChanged()
    },
    components: [{
        kind: "Broadcast",
        onLoginOK: "fdLogin",
        onLogoutOK: "fdLogout",
        onTrdLoginOK: "trdLogin",
        onTrdLogoutOK: "trdLogout"
    }],
    secChanged: function () {
        this.sec[0] == 1 ? this.setDisabled(!1) : this.setDisabled(!0)
    },
    disabledChanged: function () {
        this.setAttribute("disabled", this.disabled)
    },
    iconChanged: function () {
        this.applyStyle("background-image", "url(" + enyo.path.rewrite(this.icon) + ")")
    },
    pressed: function () {
        this.addClass(this.selected_color)
    },
    unpressed: function () {
        this.removeClass(this.selected_color)
    },
    tap: function (b, d) {
        if (this.disabled) {
            try {
                d.preventDefault()
            } catch (e) { }
            return !0
        }
        d.cmd = this.cmd;
        d.disabled = this.disabled
    }
});
enyo.kind({
    name: "zaisan.selectorspacer",
    kind: "Control",
    classes: "selector-spacer",
    allowHtml: !0
});
enyo.kind({
    name: "zaisan.tab",
    kind: "FittableColumns",
    classes: "selector-tab",
    defaultKind: "zaisan.tabbutton",
    grouped: !0,
    handlers: {
        ontap: "buttonTap"
    },
    events: {
        onTriggered: ""
    },
    create: function () {
        this.inherited(arguments);
        this.grouped && (this.lastCircle = this.controls[0])
    },
    buttonTap: function (b) {
        b.pressed && (this.grouped && (this.lastCircle && this.lastCircle.unpressed(),
            this.lastCircle = b,
            this.lastCircle.pressed()),
            this.doTriggered(b))
    },
    resetTo: function (b) {
        this.grouped && (this.lastCircle.unpressed(),
            this.lastCircle = this.controls[b],
            this.lastCircle.pressed())
    }
});
enyo.kind({
    name: "zaisan.tabbutton",
    kind: "Control",
    classes: "tab-button",
    published: {
        selected_color: "tab-selected",
        normal_color: "selector-normal",
        disabled: !1,
        sec: "1111"
    },
    allowHtml: !0,
    components: [{
        kind: "Broadcast",
        onLoginOK: "fdLogin",
        onLogoutOK: "fdLogout",
        onTrdLoginOK: "trdLogin",
        onTrdLogoutOK: "trdLogout"
    }],
    fdLogin: function () {
        this.feed = !0;
        this.sec[1] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    fdLogout: function () {
        this.trading = !1;
        this.sec[0] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogin: function () {
        this.trading = !0;
        this.sec[3] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    trdLogout: function () {
        this.trading = !1;
        this.sec[2] == 1 ? this.disabled = !1 : this.disabled = !0;
        this.disabledChanged()
    },
    create: function () {
        this.inherited(arguments);
        this.active || this.bg ? this.addClass(this.selected_color) : this.addClass(this.normal_color);
        this.secChanged()
    },
    secChanged: function () {
        this.sec[0] == 1 ? this.setDisabled(!1) : this.setDisabled(!0)
    },
    disabledChanged: function () {
        this.setAttribute("disabled", this.disabled)
    },
    pressed: function () {
        this.removeClass(this.normal_color);
        this.addClass(this.selected_color)
    },
    unpressed: function () {
        this.removeClass(this.selected_color);
        this.addClass(this.normal_color)
    },
    tap: function () {
        if (this.disabled)
            return !0
    }
});
enyo.kind({
    name: "zaisan.indices",
    kind: "FittableRows",
    classes: "enyo-unselectable bg-normal block f22",
    realtime: !1,
    lastidx: 0,
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.updateMe), 2E3);
        enyo.bind(this, this.doUpdate);
        enyo.bind(this, this.getFields);
        enyo.bind(this, this.updateMe);
        bridge.addObj("pnlindices", this);
        this.startUpdate()
    },
    removeFlash: function () {
        this.$.fidx.removeClass("flash")
    },
    startUpdate: function () {
        this.thread.start();
        this.updateMe()
    },
    endUpdate: function () {
        this.thread.stop()
    },
    onLoginOK: function () {
        this.realtime = !0
    },
    onLogoutOK: function () {
        this.realtime = !1
    },
    getFields: function (b) {
        return this.$[b]
    },
    updateMe: function () {
        var b = {};
        b.last = 0;
        b.open = 0;
        b.hi = 0;
        b.lo = 0;
        b.prev = 0;
        b.chg = 0;
        b.pcn = 0;
        var d = Store.idx.COMPOSITE;
        d && (b.last = d[6],
            b.open = d[7],
            b.hi = d[8],
            b.lo = d[9],
            b.prev = d[10],
            b.chg = d[11],
            b.pcn = d[12]);
        b.val = 0;
        b.vol = 0;
        b.freq = 0;
        b.adv = 0;
        b.dec = 0;
        b.unchg = 0;
        b.untrd = 0;
        d = Store.info[0];
        if (this.realtime && d)
            b.val = d[6],
                b.vol = d[7],
                b.freq = d[8],
                b.adv = d[11],
                b.dec = d[12],
                b.unchg = d[13],
                b.untrd = d[14];
        else {
            var e;
            for (key in Store.ss)
                e = Store.ss[key],
                    b.val += e[11],
                    b.vol += e[10],
                    b.freq += e[12],
                    e[12] > 0 && e[9] > 0 ? b.adv++ : e[12] > 0 && e[9] < 0 ? b.dec++ : e[12] > 0 ? b.unchg++ : b.untrd++
        }
        b.fb = "-";
        b.fs = "-";
        b.db = "-";
        b.ds = "-";
        if (this.realtime) {
            if (e = bridge.getObj("pnlmarket").getComp("sr").getDb(),
                e = e[e.length - 1],
                e[2] == "Total")
                d = e[4],
                    b.fb = e[19] * 100 / d,
                    b.fs = e[22] * 100 / d,
                    b.db = e[10] * 100 / d,
                    b.ds = e[13] * 100 / d
        } else
            Store.fd && Store.fd.length > 0 && (b.fb = Store.fd[0],
                b.fs = Store.fd[1],
                b.db = Store.fd[2],
                b.ds = Store.fd[3]);
        this.doUpdate(b)
    },
    doUpdate: function (b) {
        try {
            this.getFields("flast").setContent("JCI " + numformat2(b.last)),
                this.getFields("fchg").setContent(numformat2(b.chg) + "<br/>" + numformat2(b.pcn) + "%"),
                changeColor(this.getFields("fidx"), b.chg, 0),
                changeImgBig(this.getFields("ficon"), b.chg, 0),
                this.lastidx != b.last && (this.lastidx = b.last),
                this.getFields("fprev").setContent(numformat2(b.prev)),
                this.getFields("fopen").setContent(numformat2(b.open)),
                this.getFields("fhi").setContent(numformat2(b.hi)),
                this.getFields("flo").setContent(numformat2(b.lo)),
                this.getFields("fvol").setContent(money2(b.vol)),
                this.getFields("fval").setContent(money2(b.val)),
                this.getFields("ffreq").setContent(money2(b.freq)),
                b.fb == "-" ? (this.getFields("ffb").setContent(b.fb),
                    this.getFields("ffs").setContent(b.fs),
                    this.getFields("fdb").setContent(b.db),
                    this.getFields("fds").setContent(b.ds)) : (this.getFields("ffb").setContent(numformat2("F " + money2(b.fb) + "%")),
                        this.getFields("ffs").setContent(numformat2("F " + money2(b.fs) + "%")),
                        this.getFields("fdb").setContent(numformat2("D " + money2(b.db) + "%")),
                        this.getFields("fds").setContent(numformat2("D " + money2(b.ds) + "%"))),
                this.getFields("fadv").setContent(numformat2(b.adv)),
                this.getFields("fdec").setContent(numformat2(b.dec)),
                this.getFields("funchg").setContent(numformat2(b.unchg)),
                this.getFields("funtrd").setContent(numformat2(b.untrd))
        } catch (d) { }
    },
    components: [{
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }, {
        name: "fidx",
        kind: "FittableColumns",
        classes: "bg-param rows2 grid-container line orange",
        components: [{
            name: "flast",
            content: "JCI 0,000.00",
            classes: "grid50 medium cells"
        }, {
            name: "ficon",
            classes: "flatimg-big grid20",
            style: "height:30px;"
        }, {
            name: "fchg",
            content: "000.00<br/>000.00%",
            allowHtml: !0,
            classes: "grid30 right normal"
        }]
    }, {
        kind: "Scroller",
        touch: !0,
        classes: "f14 bold",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            classes: "bg-selected rows center grid-container",
            components: [{
                content: "Prev",
                classes: "grid20 left"
            }, {
                name: "fprev",
                content: "0,000.00",
                classes: "grid25 right"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid10"
            }, {
                content: "Hi",
                classes: "grid20 left"
            }, {
                name: "fhi",
                content: "0,000.00",
                classes: "grid25 right"
            }]
        }, {
            kind: "FittableColumns",
            classes: "bg-selected rows center grid-container",
            components: [{
                content: "Open",
                classes: "grid20 left"
            }, {
                name: "fopen",
                content: "0,000.00",
                classes: "grid25 right"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid10"
            }, {
                content: "Lo",
                classes: "grid20 left"
            }, {
                name: "flo",
                content: "0,000.00",
                classes: "grid25 right"
            }]
        }, {
            kind: "FittableColumns",
            classes: "rows center grid-container",
            components: [{
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }, {
                content: "Volume",
                classes: "grid30 left"
            }, {
                name: "fvol",
                content: "0,000.000",
                classes: "grid30 right"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }]
        }, {
            kind: "FittableColumns",
            classes: "rows center grid-container",
            components: [{
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }, {
                content: "Value",
                classes: "grid30 left"
            }, {
                name: "fval",
                content: "0,000.00",
                classes: "grid30 right"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }]
        }, {
            kind: "FittableColumns",
            classes: "rows center grid-container",
            components: [{
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }, {
                content: "Frequency",
                classes: "grid30 left"
            }, {
                name: "ffreq",
                content: "0,000",
                classes: "grid30 right"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid20"
            }]
        }, {
            kind: "FittableColumns",
            classes: "bg-selected rows center grid-container",
            components: [{
                content: "BUY",
                classes: "grid50 center"
            }, {
                content: "SELL",
                classes: "grid50 center"
            }]
        }, {
            kind: "FittableColumns",
            classes: "rows center grid-container",
            components: [{
                name: "ffb",
                content: "F 0",
                classes: "grid50 center"
            }, {
                name: "ffs",
                content: "F 0",
                classes: "grid50 center"
            }]
        }, {
            kind: "FittableColumns",
            classes: "rows center grid-container",
            components: [{
                name: "fdb",
                content: "D 0",
                classes: "grid50 center"
            }, {
                name: "fds",
                content: "D 0",
                classes: "grid50 center"
            }]
        }, {
            kind: "FittableColumns",
            classes: "bg-selected rows center grid-container",
            components: [{
                allowHtml: !0,
                content: "adv&nbsp;",
                classes: "grid10 right smallest"
            }, {
                name: "fadv",
                content: "000",
                classes: "grid10"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid5"
            }, {
                allowHtml: !0,
                content: "dec&nbsp;",
                classes: "grid10 right smallest"
            }, {
                name: "fdec",
                content: "000",
                classes: "grid10"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid5"
            }, {
                allowHtml: !0,
                content: "unchg&nbsp;",
                classes: "grid15 right smallest"
            }, {
                name: "funchg",
                content: "000",
                classes: "grid10"
            }, {
                content: "&nbsp;",
                allowHtml: !0,
                classes: "grid5"
            }, {
                allowHtml: !0,
                content: "untrd&nbsp;",
                classes: "grid10 right smallest"
            }, {
                name: "funtrd",
                content: "000",
                classes: "grid10"
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.stockrank",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.pnl.linkTo = this.linkTo;
        this.$.top.reflow()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Stock Ranking",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        name: "pnl",
        kind: "zaisan.pnlstockrank",
        fit: !0,
        unique: "home-pnlsrank"
    }]
});
enyo.kind({
    name: "zaisan.pnlstockrank",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    direction: "DESC",
    field: 20,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.doUpdate), 5E3);
        var b = {};
        b.doUpdate = enyo.bind(this, this.doUpdate);
        bridge.addObj(this.unique ? this.unique : "pnlsrank", b)
    },
    showDetail: function () {
        var b = this.$.tab.getSelected();
        return b && this.linkTo && bridge.getObj(this.linkTo).updateMe(b[2]),
            !0
    },
    actived: function () {
        this.$.tab.removeAll();
        this.$.tab.refreshList();
        this.thread.start();
        this.doUpdate()
    },
    deactived: function () {
        this.thread.stop();
        this.$.tab.removeAll();
        this.$.tab.refreshList()
    },
    changeView: function (b, d) {
        this.field = b;
        this.direction = d;
        this.doUpdate()
    },
    doUpdate: function () {
        var b = []
            , d = this.field
            , e = this.direction;
        for (key in Store.ss)
            Store.ss[key][12] > 0 && b.push(Store.ss[key]);
        b = b.slice(0);
        b.sort(function (b, f) {
            return (b[d] - f[d]) * (e == "ASC" ? 1 : -1)
        });
        b = b.slice(0, 20);
        if (this.field == 20) {
            for (var f = [], g = 0; g < b.length; g++)
                e == "DESC" ? b[g][9] > 0 && f.push(b[g]) : b[g][9] < 0 && f.push(b[g]);
            b = f
        }
        if (this.$.tab.getDb().length == b.length)
            for (g = 0; g < b.length; g++)
                this.$.tab.updateRow(b[g], g);
        else
            this.$.tab.removeAll(),
                this.$.tab.addAll(b)
    },
    onLoginOK: function () {
        this.actived()
    },
    onLogoutOK: function () {
        this.deactived()
    },
    selectChanged: function (b, d) {
        for (var e = d.originator, e = e.components[e.selected].kode, f = 2; f < this.$.tab.getItem().controls.length; f++)
            this.$.tab.getItem().controls[f].setShowing(f == e ? !0 : !1);
        e == 2 ? this.changeView(20, "DESC") : e == 3 ? this.changeView(20, "ASC") : e == 4 ? this.changeView(10, "DESC") : e == 5 ? this.changeView(11, "DESC") : this.changeView(12, "DESC")
    },
    components: [{
        name: "title",
        kind: "FittableColumns",
        classes: "pnl-header-bar grid-container",
        components: [{
            content: "CODE",
            classes: "grid25 left cells"
        }, {
            content: "LAST",
            classes: "grid50 center cells"
        }, {
            kind: "onyx.custom.SelectDecorator",
            classes: "grid25 white bold bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    content: "% GAIN",
                    kode: 2,
                    active: !0
                }, {
                    content: "% LOSS",
                    kode: 3
                }, {
                    content: "VOL",
                    kode: 4
                }, {
                    content: "VAL",
                    kode: 5
                }, {
                    content: "FREQ",
                    kode: 6
                }]
            }]
        }]
    }, {
        name: "tab",
        kind: "xtable",
        fit: !0,
        datas: [[0, 0, "PTBA-W2", 2E3, 4E3, 0, 0, 0, 11220, 1E3, 300, 60, 80, 0, 0, 0, 0, 0, 0, 0, 0.23], [0, 0, "ASII", 12E3, 44E3, 0, 0, 0, 12500, -2200, 200, 70, 80, 0, 0, 0, 0, 0, 0, 0, -2.77], [0, 0, "ADRO", 23E3, 41E3, 0, 0, 0, 860, 0, 0, 0, 0, 100, 80, 80, 0, 0, 0, 0, 0], [0, 0, "PTBA-W2", 2E3, 4E3, 0, 0, 0, 11220, 1E3, 300, 60, 80, 0, 0, 0, 0, 0, 0, 0, 0.23], [0, 0, "ASII", 12E3, 44E3, 0, 0, 0, 12500, -2200, 200, 70, 80, 0, 0, 0, 0, 0, 0, 0, -2.77], [0, 0, "ADRO", 23E3, 41E3, 0, 0, 0, 860, 0, 0, 0, 0, 100, 80, 80, 0, 0, 0, 0, 0], [0, 0, "PTBA-W2", 2E3, 4E3, 0, 0, 0, 11220, 1E3, 300, 60, 80, 0, 0, 0, 0, 0, 0, 0, 0.23], [0, 0, "ASII", 12E3, 44E3, 0, 0, 0, 12500, -2200, 200, 70, 80, 0, 0, 0, 0, 0, 0, 0, -2.77], [0, 0, "ADRO", 23E3, 41E3, 0, 0, 0, 860, 0, 0, 0, 0, 100, 80, 80, 0, 0, 0, 0, 0]],
        classes: "rw",
        rows: {
            name: "item",
            kind: "zaisan.rowSR"
        }
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowSR",
    layoutKind: "FittableColumnsLayout",
    classes: "rows grid-container smallest bold f14",
    components: [{
        name: "code",
        classes: "texts grid20"
    }, {
        name: "last",
        kind: "FittableColumns",
        classes: "texts grid60 right",
        components: [{
            name: "a",
            classes: "right grid25"
        }, {
            classes: "grid5",
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "b",
            classes: "upimg grid15",
            style: "height: 1.2em;"
        }, {
            classes: "grid5",
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "c",
            classes: "right grid50"
        }]
    }, {
        name: "gain",
        allowHtml: !0,
        classes: "texts grid20 right",
        showing: !0
    }, {
        name: "loss",
        allowHtml: !0,
        classes: "texts grid20 right",
        showing: !1
    }, {
        name: "vol",
        allowHtml: !0,
        classes: "texts grid20 right",
        showing: !1
    }, {
        name: "val",
        allowHtml: !0,
        classes: "texts grid20 right",
        showing: !1
    }, {
        name: "freq",
        allowHtml: !0,
        classes: "texts grid20 right",
        showing: !1
    }],
    removeFlash: function () {
        this.$.last.removeClass("flash")
    },
    update: function (b) {
        this.$.code.setContent(b[2]);
        changeColor(this.$.last, b[9], 0);
        this.$.a.setContent(money(b[8]));
        changeImg(this.$.b, b[9], 0);
        this.$.c.setContent(money(b[9]) + " (" + money2(b[20]) + "%)");
        this.$.gain.setContent(money(b[9]));
        this.$.loss.setContent(money(b[9]));
        this.$.vol.setContent(money(b[10] / Const.lotSize));
        this.$.val.setContent(money(b[11]));
        this.$.freq.setContent(money(b[12]))
    }
});
enyo.kind({
    name: "zaisan.brokerrank",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Broker Ranking",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        kind: "zaisan.pnlbrokerrank",
        fit: !0,
        unique: "home-pnlbrank"
    }]
});
enyo.kind({
    name: "zaisan.pnlbrokerrank",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    kode: "VOL",
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        var b = {};
        b.doUpdate = enyo.bind(this, this.doUpdate);
        bridge.addObj(this.unique ? this.unique : "pnlbrank", b)
    },
    showDetail: function () {
        if (this.realtime) {
            var b = this.$.tab.getSelected();
            b && bridge.getObj("pnlbsrank").show(b[0], this.kode)
        }
        return !0
    },
    doUpdate: function (b) {
        this.$.tab.removeAll();
        b == null && (b = this.module ? this.module.filter : "VOL");
        this.$.tab.addAll(b == "VAL" ? Store.tbval : b == "VOL" ? Store.tbvol : Store.tbfrq)
    },
    actived: function () {
        this.$.tab.removeAll();
        this.$.tab.refreshList();
        this.module || (this.module = new mod.brank(this.$.tab));
        this.module.selector = {
            selector: "field= '" + this.kode + "'"
        };
        this.module.filter = this.kode;
        this.module.doRestart()
    },
    deactived: function () {
        this.module && this.module.doStop();
        this.$.tab.removeAll();
        this.$.tab.refreshList()
    },
    selectChanged: function (b, d) {
        for (var e = d.originator, f = e.components[e.selected].kode, g = 1; g < this.$.tab.getItem().controls.length; g++)
            this.$.tab.getItem().controls[g].setShowing(g == f ? !0 : !1);
        this.kode = e.components[e.selected].field;
        this.module && this.realtime ? (this.module.selector = {
            selector: "field= '" + this.kode + "'"
        },
            this.module.filter = this.kode,
            this.module.doRestart()) : this.doUpdate(this.kode)
    },
    onLoginOK: function () {
        this.realtime = !0;
        this.actived()
    },
    onLogoutOK: function () {
        this.realtime = !1;
        this.deactived()
    },
    components: [{
        name: "title",
        kind: "FittableColumns",
        classes: "pnl-header-bar grid-container",
        components: [{
            content: "BROKER",
            classes: "grid75 left cells"
        }, {
            kind: "onyx.custom.SelectDecorator",
            classes: "grid25 white bold bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    content: "VOL",
                    kode: 1,
                    field: "VOL",
                    active: !0
                }, {
                    content: "VAL",
                    kode: 2,
                    field: "VAL"
                }, {
                    content: "FREQ",
                    kode: 3,
                    field: "FREQ"
                }]
            }]
        }]
    }, {
        name: "tab",
        kind: "xtable",
        fit: !0,
        datas: [],
        classes: "rw",
        rows: {
            name: "item",
            kind: "zaisan.rowBR"
        }
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowBR",
    layoutKind: "FittableColumnsLayout",
    classes: "rows grid-container smallest bold",
    components: [{
        name: "code",
        classes: "texts grid75 left"
    }, {
        name: "vol",
        allowHtml: !0,
        classes: "texts grid25 right"
    }, {
        name: "val",
        allowHtml: !0,
        classes: "texts grid25 right",
        showing: !1
    }, {
        name: "freq",
        allowHtml: !0,
        classes: "texts grid25 right",
        showing: !1
    }],
    update: function (b) {
        var d = Store.broker[b[0]];
        this.$.code.setContent(b[0] + (d ? " - " + d[3] : ""));
        this.$.vol.setContent(money(b[1] / Const.lotSize));
        this.$.val.setContent(money(b[2]));
        this.$.freq.setContent(money(b[3]))
    }
});
enyo.kind({
    name: "zaisan.pnlbrokersrank",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:40%; width:50%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal",
    scrim: !1,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlbsrank", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tit",
                content: "Top 5 Stock By Broker"
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            name: "sr",
            kind: "xtable",
            fit: !0,
            header: [{
                content: "Code",
                classes: "grid20"
            }, {
                content: "Lot",
                classes: "grid25 right"
            }, {
                content: "Val",
                classes: "grid30 right"
            }, {
                content: "Frq",
                classes: "grid25 right"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowBSR2"
            }
        }, {
            kind: "Broadcast",
            onLoginOK: "onLoginOK",
            onLogoutOK: "onLogoutOK"
        }]
    }],
    onTrdLoginOK: function () {
        this.realtime = !0
    },
    onTrdLogoutOK: function () {
        this.realtime = !1;
        this.module && this.module.doStop();
        this.close()
    },
    show: function (b, d) {
        this.inherited(arguments);
        this.refreshMe(b, d)
    },
    refreshMe: function (b, d) {
        this.$.sr.removeAll();
        this.$.sr.refreshList();
        var e = Store.broker[b];
        e && this.$.tit.setContent("Top 5 Stock By Broker " + b + " - " + e[3]);
        this.$.t.reflow();
        this.module || (this.module = new mod.stockbybroker(this.$.sr, null, null));
        e = b.split(".");
        this.module.filter = e[0] + "#" + (e.length == 2 ? e[1] : "RG");
        this.module.kode = d;
        this.module.temp = [];
        this.module.doRestart()
    },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    }
});
enyo.kind({
    name: "zaisan.rowBSR2",
    layoutKind: "FittableRowsLayout",
    classes: "rows small bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid20 left"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid30 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid25 right"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(b[0]);
        this.$.b.setContent(money(b[1]));
        this.$.c.setContent(money(b[2]));
        this.$.d.setContent(money(b[3]))
    }
});
enyo.kind({
    name: "zaisan.worldinfo",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "World Indices",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        kind: "zaisan.pnlworldinfo",
        fit: !0
    }]
});
enyo.kind({
    name: "zaisan.pnlworldinfo",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    curr: "USD-IDR",
    create: function () {
        this.inherited(arguments);
        var b = {};
        b.doUpdate = enyo.bind(this, this.doUpdate);
        b.doUpdateCurr = enyo.bind(this, this.doUpdateCurr);
        bridge.addObj("pnlworldinfo", b)
    },
    getLabel: function (b) {
        return b == 1 ? "USA" : b == 2 ? "ASIA" : b == 3 ? "EURO" : b == 4 ? "Middle East" : "Others"
    },
    doUpdate: function () {
        if (this.$.tabASIA.getDb().length == 0) {
            for (key in Store.gi)
                Store.gi[key][8] == 2 && this.$.tabASIA.onlyAdd(Store.gi[key]);
            this.$.tabASIA.refreshList()
        } else
            for (key in Store.gi)
                Store.gi[key][8] == 2 && this.$.tabASIA.updateItem(Store.gi[key]);
        if (this.$.tabUSA.getDb().length == 0) {
            for (key in Store.gi)
                Store.gi[key][8] == 1 && this.$.tabUSA.onlyAdd(Store.gi[key]);
            this.$.tabUSA.refreshList()
        } else
            for (key in Store.gi)
                Store.gi[key][8] == 1 && this.$.tabUSA.updateItem(Store.gi[key]);
        if (this.$.tabEURO.getDb().length == 0) {
            for (key in Store.gi)
                Store.gi[key][8] == 3 && this.$.tabEURO.onlyAdd(Store.gi[key]);
            this.$.tabEURO.refreshList()
        } else
            for (key in Store.gi)
                Store.gi[key][8] == 3 && this.$.tabEURO.updateItem(Store.gi[key]);
        if (this.$.tabCOMM.getDb().length == 0) {
            for (key in Store.comm)
                this.$.tabCOMM.onlyAdd(Store.comm[key]);
            this.$.tabCOMM.refreshList()
        } else
            for (key in Store.comm)
                this.$.tabCOMM.updateItem(Store.comm[key]);
        if (this.$.tabFUT.getDb().length == 0) {
            for (key in Store.fut)
                this.$.tabFUT.onlyAdd(Store.fut[key]);
            this.$.tabFUT.refreshList()
        } else
            for (key in Store.fut)
                this.$.tabFUT.updateItem(Store.fut[key])
    },
    doUpdateCurr: function () {
        var b = Store.currency[this.curr];
        this.$.konversi.setContent(b ? money2(b[2]) : "-");
        this.$.lastUpdate.setContent(b ? "last update " + b[8] : "last update -");
        this.$.bottom.reflow()
    },
    selectChanged: function (b, d) {
        var e = d.originator;
        this.$.tab.setIndex(e.components[e.selected].kode)
    },
    selectChanged2: function (b, d) {
        var e = d.originator;
        this.curr = e.components[e.selected].content;
        this.doUpdateCurr()
    },
    components: [{
        name: "title",
        kind: "FittableColumns",
        classes: "pnl-header-bar grid-container",
        components: [{
            content: "CATEGORY",
            classes: "grid55 left cells"
        }, {
            kind: "onyx.custom.SelectDecorator",
            classes: "grid45 white bold bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    content: "ASIA INDICES",
                    kode: 0,
                    active: !0
                }, {
                    content: "AMERICA INDICES",
                    kode: 1
                }, {
                    content: "EUROPE INDICES",
                    kode: 2
                }, {
                    content: "FUTURES",
                    kode: 3
                }, {
                    content: "COMODITIES",
                    kode: 4
                }]
            }]
        }]
    }, {
        name: "tab",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        components: [{
            name: "tabASIA",
            kind: "xtable",
            datas: [],
            classes: "rw",
            rows: {
                name: "item",
                kind: "zaisan.rowWI"
            }
        }, {
            name: "tabUSA",
            kind: "xtable",
            datas: [],
            classes: "rw",
            rows: {
                name: "item",
                kind: "zaisan.rowWI"
            }
        }, {
            name: "tabEURO",
            kind: "xtable",
            datas: [],
            classes: "rw",
            rows: {
                name: "item",
                kind: "zaisan.rowWI"
            }
        }, {
            name: "tabFUT",
            kind: "xtable",
            datas: [],
            classes: "rw",
            rows: {
                name: "item",
                kind: "zaisan.rowWI"
            }
        }, {
            name: "tabCOMM",
            kind: "xtable",
            datas: [],
            classes: "rw",
            rows: {
                name: "item",
                kind: "zaisan.rowWI"
            }
        }]
    }, {
        name: "bottom",
        kind: "FittableColumns",
        classes: "pnl-header",
        components: [{
            content: "Currencies",
            classes: "left"
        }, {
            fit: !0
        }, {
            name: "lastUpdate",
            content: "last update -",
            classes: "right cells"
        }]
    }, {
        kind: "FittableColumns",
        classes: "pnl-header-bar bg-selected grid-container",
        components: [{
            kind: "onyx.custom.SelectDecorator",
            classes: "grid50",
            components: [{
                name: "curr",
                kind: "Select",
                onchange: "selectChanged2",
                components: [{
                    content: "USD-IDR",
                    kode: 18,
                    active: !0
                }, {
                    content: "AUD-IDR",
                    kode: 0
                }, {
                    content: "AUD-USD",
                    kode: 1
                }, {
                    content: "EUR-IDR",
                    kode: 2
                }, {
                    content: "EUR-USD",
                    kode: 3
                }, {
                    content: "GBP-IDR",
                    kode: 4
                }, {
                    content: "GBP-USD",
                    kode: 5
                }, {
                    content: "HKD-IDR",
                    kode: 6
                }, {
                    content: "JPY-IDR",
                    kode: 7
                }, {
                    content: "KRW-IDR",
                    kode: 8
                }, {
                    content: "NZD-IDR",
                    kode: 9
                }, {
                    content: "NZD-USD",
                    kode: 10
                }, {
                    content: "GBP-IDR",
                    kode: 11
                }, {
                    content: "SAR-IDR",
                    kode: 12
                }, {
                    content: "SGD-IDR",
                    kode: 13
                }, {
                    content: "THB-IDR",
                    kode: 14
                }, {
                    content: "USD-CAD",
                    kode: 15
                }, {
                    content: "USD-CNY",
                    kode: 16
                }, {
                    content: "USD-HKD",
                    kode: 17
                }, {
                    content: "USD-JPY",
                    kode: 19
                }, {
                    content: "USD-KRW",
                    kode: 20
                }, {
                    content: "USD-PHP",
                    kode: 21
                }, {
                    content: "USD-SGD",
                    kode: 22
                }, {
                    content: "USD-THB",
                    kode: 23
                }, {
                    content: "USD-TWD",
                    kode: 24
                }]
            }]
        }, {
            name: "konversi",
            content: "-",
            classes: "grid50 right large green cells"
        }]
    }]
});
enyo.kind({
    name: "zaisan.rowWI",
    layoutKind: "FittableColumnsLayout",
    classes: "rows grid-container smallest bold",
    components: [{
        name: "code",
        classes: "texts grid35 left"
    }, {
        name: "last",
        kind: "FittableColumns",
        classes: "texts grid65 right",
        components: [{
            name: "a",
            classes: "right grid25"
        }, {
            classes: "grid5",
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "b",
            classes: "upimg grid15",
            style: "height: 1.2em;"
        }, {
            classes: "grid5",
            content: "&nbsp;",
            allowHtml: !0
        }, {
            name: "c",
            classes: "right grid50"
        }]
    }],
    update: function (b) {
        this.$.code.setContent(b[1]);
        changeColor(this.$.last, b[4], 0);
        this.$.a.setContent(money2(b[2]));
        changeImg(this.$.b, b[4], 0);
        this.$.c.setContent(money2(b[4]) + " (" + money2(b[5]) + "%)")
    }
});
enyo.kind({
    name: "zaisan.faq",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    contents: {},
    playlist: "",
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    showVideo: function () {
        bridge.getObj("pnlvideo").show(this.playlist)
    },
    rendered: function (b) {
        this.inherited(arguments);
        this.doRefresh()
    },
    showDetail: function () {
        if (this.contents.content) {
            var b = this.$.tab.getSelected();
            bridge.getObj("pnlfaqdetail").show(b[1] + " - " + b[3], this.contents.content[b[0]][b[2]])
        }
    },
    doRefresh: function () {
        var b = new enyo.JsonpRequest({
            url: Const._url + Const._urlwebsite + "?q=HLP",
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            this.$.tab.removeAll();
            try {
                if (e.status == "1") {
                    this.contents = e.data;
                    this.playlist = e.data.playlist;
                    for (var f = 0; f < this.contents.section.length; f++)
                        for (var g = 0; g < this.contents.section[f].length; g++)
                            this.$.tab.onlyAdd([f, this.contents.header[f], g, this.contents.section[f][g]])
                } else
                    this.$.tab.onlyAdd([0, "Error", 0, "Failed to retrive help page"])
            } catch (i) {
                this.$.tab.onlyAdd([0, "Error", 0, "Failed to retrive help page"])
            }
            this.$.tab.refreshList()
        });
        b.error(this, function () {
            this.$.tab.onlyAdd([0, "Error", 0, "Failed to retrive help page"]);
            this.$.tab.refreshList()
        });
        b.go()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "FAQ",
            active: !0
        }, {
            fit: !0
        }, {
            kind: "zaisan.tabbutton",
            content: "Video",
            ontap: "showVideo"
        }]
    }, {
        name: "tab",
        kind: "xtable",
        fit: !0,
        datas: [],
        classes: "rw",
        rows: {
            name: "item",
            kind: "zaisan.rowHR"
        }
    }]
});
enyo.kind({
    name: "zaisan.rowHR",
    layoutKind: "FittableRowsLayout",
    classes: "f14 bold",
    components: [{
        name: "split",
        classes: "rows bg-bar white bold"
    }, {
        name: "t",
        kind: "FittableColumns",
        classes: "rows",
        components: [{
            kind: "FittableRows",
            allowHtml: !0,
            classes: "grid100",
            components: [{
                name: "a",
                allowHtml: !0,
                classes: "texts"
            }]
        }]
    }],
    update: function (b, d, e, f) {
        this.$.a.setContent(b[3]);
        e = b[0];
        f = d.index == 0 ? null : f[d.index - 1];
        d = d.index == 0 ? !0 : e != f[0];
        this.$.split.setContent(b[1]);
        this.$.split.setShowing(d)
    }
});
enyo.kind({
    name: "zaisan.pnlvideo",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:90%; width:90%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-normal",
    scrim: !0,
    realtime: !1,
    siap: !1,
    fromShow: !1,
    myX: 0,
    myY: 0,
    playlist: "",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlvideo", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "Video",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill",
                style: "border: none;"
            }]
        }]
    }],
    show: function (b) {
        this.playlist = b;
        this.inherited(arguments);
        this.siap ? (this.fromShow = !1,
            this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100)) : (this.siap = !0,
                this.urlChanged())
    },
    close: function (b, d) {
        this.hide();
        this.fromShow = !0;
        try {
            d.preventDefault()
        } catch (e) { }
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100);
        this.fromShow = !1
    },
    rendered: function () {
        this.inherited(arguments)
    },
    urlChanged: function () {
        if (Math.abs(this.myX - this.getBounds().width) > 4 || Math.abs(this.myY - this.getBounds().height))
            this.myX = this.getBounds().width,
                this.myY = this.getBounds().height,
                this.$.iframe.setSrc("http://www.youtube.com/embed/videoseries?list=" + this.playlist + "&showinfo=1")
    }
});
enyo.kind({
    name: "zaisan.pnlfaqdetail",
    kind: "onyx.Popup",
    style: "padding: 1em; position:fixed; height:70%; width:70%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal",
    scrim: !0,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlfaqdetail", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                kind: "Scroller",
                touch: !0,
                classes: "enyo-fit",
                fit: !0,
                components: [{
                    name: "pr",
                    classes: "defaultcolor",
                    style: "padding:1em;",
                    allowHtml: !0,
                    content: ""
                }]
            }]
        }]
    }],
    show: function (b, d) {
        this.inherited(arguments);
        this.$.tcontent.setContent(b);
        this.$.pr.setContent(d)
    },
    close: function (b, d) {
        try {
            d.preventDefault()
        } catch (e) { }
        return this.hide(),
            !1
    }
});
enyo.kind({
    name: "zaisan.calendar",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    monthNames: "JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEPT,OCT,NOV,DEC".split(","),
    diff: 0,
    curr: new Date,
    kode: "ALL",
    cat: "%",
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow();
        this.$.tab.setMaster(this);
        this.$.tgl.setContent(this.genDate(this.diff));
        this.doQuery(this.genDatePar())
    },
    prev: function () {
        this.diff = -1;
        this.$.tgl.setContent(this.genDate(this.diff));
        this.doQuery(this.genDatePar())
    },
    next: function () {
        this.diff = 1;
        this.$.tgl.setContent(this.genDate(this.diff));
        this.doQuery(this.genDatePar())
    },
    genDate: function (b) {
        return this.curr.setMonth(this.curr.getMonth() + b),
            this.monthNames[this.curr.getMonth()] + " " + this.curr.getFullYear()
    },
    genDatePar: function () {
        return this.curr.getFullYear() + "/" + (this.curr.getMonth() + 1)
    },
    genDateFormatted: function () {
        var b = this.curr.getFullYear() + ""
            , d = this.curr.getMonth() + 1 + ""
            , e = this.curr.getDate() + "";
        return b + "-" + (d.length == 1 ? "0" + d : d) + "-" + (e.length == 1 ? "0" + e : e)
    },
    showDetail: function () {
        var b = this.$.tab.getSelected();
        bridge.getObj("pnlcaldetail").show(b[34], this.$.tab.getDb(), this.kode)
    },
    controlStatus: function (b) {
        this.$.btnprev.setDisabled(!b);
        this.$.btnnext.setDisabled(!b)
    },
    doQuery: function (b) {
        this.$.tab.removeAll();
        this.$.tab.refreshList();
        this.controlStatus(!1);
        b = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|CAG|" + this.cat + "|%|" + b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            this.controlStatus(!0);
            try {
                e.status == "1" && this.$.tab.addAll(e.data)
            } catch (f) { }
        });
        b.error(this, function () {
            this.controlStatus(!0)
        });
        b.go()
    },
    generateFilteredData: function (b) {
        for (var b = RegExp("^" + b, "i"), d = [], e = 0, f; f = this.$.tab.getDb()[e]; e++)
            f[1].match(b) && (f.dbIndex = e,
                d.push(f));
        return d
    },
    typeChanged: function (b, d) {
        if (bridge.getObj("trd")) {
            if (d.originator.active)
                if (this.kode = d.originator.kode,
                    d.originator.kode == "PF") {
                    this.$.tab.filterList("");
                    for (var e = "XXXXX", f = 0, g; g = bridge.getObj("pf").getComp("wl").getDb()[f]; f++)
                        e = e + "|" + g[7];
                    this.$.tab.filterList(e)
                } else
                    this.$.tab.filterList("")
        } else
            d.originator.active && (this.kode = d.originator.kode,
                d.originator.kode == "PF" ? (this.$.tab.filterList(""),
                    this.$.tab.filterList("XXXXXXXXXXX"),
                    d.originator.silent || enyo.Signals.send("onError", "please login trading first")) : this.$.tab.filterList(""))
    },
    onLoginOK: function () {
        this.realtime = !0
    },
    onLogoutOK: function () {
        this.realtime = !1
    },
    onTrd: function () {
        this.kode == "PF" && this.typeChanged(this, {
            originator: {
                silent: !0,
                active: !0,
                kode: "PF"
            }
        })
    },
    selectChanged: function (b, d) {
        console.log(b, d);
        this.cat = b.controls[b.selected].kode;
        this.doQuery(this.genDatePar())
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Calendar",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        name: "title",
        kind: "FittableColumns",
        classes: "pnl-header-bar",
        components: [{
            name: "btnprev",
            kind: "onyx.Button",
            content: "<",
            style: "height:2.5em;",
            ontap: "prev"
        }, {
            style: "width:.5em;"
        }, {
            name: "tgl",
            content: "",
            classes: "staticbox",
            style: "width:8em;"
        }, {
            style: "width:.5em;"
        }, {
            name: "btnnext",
            kind: "onyx.Button",
            content: ">",
            style: "height:2.5em;",
            ontap: "next"
        }, {
            name: "f",
            kind: "onyx.custom.SelectDecorator",
            style: "width:12em;height:2.35em;",
            classes: "white bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    name: "e",
                    content: "ALL",
                    kode: "%",
                    active: !0
                }, {
                    content: "IPO",
                    kode: "A"
                }, {
                    content: "RUPS",
                    kode: "B"
                }, {
                    content: "Right Issue",
                    kode: "C"
                }, {
                    content: "Warrant",
                    kode: "D"
                }, {
                    content: "Stock Split",
                    kode: "E"
                }, {
                    content: "Reverse Stock",
                    kode: "F"
                }, {
                    content: "Cash Devidend",
                    kode: "G"
                }, {
                    content: "Stock Devidend",
                    kode: "H"
                }, {
                    content: "Bonus",
                    kode: "I"
                }, {
                    content: "Merger",
                    kode: "J"
                }, {
                    content: "Tender Offer",
                    kode: "K"
                }]
            }]
        }, {
            fit: !0
        }, {
            name: "btnopt",
            kind: "onyx.RadioGroup",
            onActivate: "typeChanged",
            style: "height:2.5em;",
            components: [{
                content: "all",
                active: !0,
                kode: "ALL"
            }, {
                content: "PF",
                kode: "PF"
            }]
        }]
    }, {
        name: "tab",
        kind: "xtable2",
        fit: !0,
        classes: "rw",
        rows: {
            name: "item",
            kind: "zaisan.rowCA"
        }
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK",
        onTrdLoginOK: "onTrd",
        onTrdLogoutOK: "onTrd"
    }]
});
enyo.kind({
    name: "zaisan.rowCA",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold  grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid10"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid30"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid60"
        }]
    }],
    update: function (b, d, e, f) {
        this.$.a.setContent(b[34].split("/")[2]);
        this.$.b.setContent(b[1]);
        this.$.c.setContent(Store.ca[b[0]]);
        b = b[34];
        f = d.index == 0 ? null : f[d.index - 1];
        d.index == 0 || b != f[34] || this.$.a.setContent("&nbsp")
    }
});
enyo.kind({
    name: "zaisan.pnlcaldetail",
    kind: "onyx.Popup",
    style: "padding: 1em; position:fixed; height:80%; width:70%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal",
    scrim: !0,
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.tab.setSort(0);
        this.$.tab.setSorttype(0);
        this.$.tab.setMaster(this);
        bridge.addObj("pnlcaldetail", this)
    },
    showDetail: function () {
        this.setDetail(this.$.tab.getSelected())
    },
    setDetail: function (b) {
        this.$.scr.scrollToTop();
        this.$.f0.setContent(Store.ca[b[0]] + "&nbsp; ");
        this.$.f1.setContent(b[1] + "&nbsp ");
        var d = Store.stock[b[1]];
        this.$.f2.setContent(d ? d[3] + "&nbsp" : "-&nbsp");
        this.$.f3.setContent(b[3] + "&nbsp ");
        this.$.f4.setContent(b[4] + "&nbsp ");
        this.$.f5.setContent(b[5] + "&nbsp ");
        this.$.f6.setContent(b[6] + "&nbsp ");
        this.$.f7.setContent(b[7] + "&nbsp ");
        this.$.f8.setContent(b[8] + "&nbsp ");
        this.$.f10.setContent(b[10] + "&nbsp ");
        this.$.f11.setContent(b[11] + "&nbsp ");
        this.$.f13.setContent(b[13] + "&nbsp ");
        this.$.f15.setContent(b[15] + "&nbsp ");
        this.$.f16.setContent(b[16] + "&nbsp ");
        this.$.f20.setContent(b[20] + "&nbsp ");
        this.$.f21.setContent(b[21] + "&nbsp ");
        this.$.f22.setContent(b[22] + "&nbsp ");
        this.$.f23.setContent(b[23] + "&nbsp ");
        this.$.f24.setContent(b[24] + "&nbsp ");
        this.$.f25.setContent(b[25] + "&nbsp ");
        this.$.f28.setContent(b[28] + "&nbsp ");
        this.$.f29.setContent(b[29] + "&nbsp ");
        this.$.f30.setContent(b[30] + "&nbsp ");
        this.$.f31.setContent(b[31] + "&nbsp ");
        this.$.f32.setContent(b[32] + "&nbsp ");
        this.$.f33.setContent(b[33] + "&nbsp ")
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            classes: "medium bold",
            components: [{
                name: "tab",
                kind: "xtable2",
                style: "height:25%;",
                rows: {
                    name: "item",
                    kind: "zaisan.rowCAD"
                }
            }, {
                name: "scr",
                kind: "enyo.Scroller",
                touch: !0,
                fit: !0,
                classes: "bg-normal2 ",
                components: [{
                    kind: "FittableColumns",
                    name: "dtl",
                    classes: "pnl defaultcolor",
                    components: [{
                        kind: "FittableRows",
                        classes: "grid50 pnl",
                        components: [{
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Type",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f0",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Stock",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f1",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Name",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f2",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f3",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Time",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f4",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Amount",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f5",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Place",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f6",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Agenda",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f7",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Ratio",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f8",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Price",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f10",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Cum.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f11",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Ex.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f13",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Rec.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f15",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Pay.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f16",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }]
                    }, {
                        kind: "FittableRows",
                        classes: "grid50 pnl",
                        components: [{
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Mat.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f20",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Split.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f21",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Exr.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f22",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Allot.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f23",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Ref.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f24",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "List.Date",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f25",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Listed",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f28",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "%.Shares",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f29",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Underwriter",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f30",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Subs",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f31",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Share.Delivery",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f32",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "allrows",
                            components: [{
                                content: "Share.Return",
                                classes: "bg-selected grid50"
                            }, {
                                name: "f33",
                                classes: "grid50 right",
                                allowHtml: !0
                            }]
                        }]
                    }]
                }]
            }]
        }]
    }],
    show: function (b, d, e) {
        this.inherited(arguments);
        this.dateca = b;
        this.$.tab.removeAll();
        if (e == "PF")
            if (bridge.getObj("trd"))
                if (e == "PF") {
                    for (var f = "XXXXX", g = 0, i; i = bridge.getObj("pf").getComp("wl").getDb()[g]; g++)
                        f = f + "|" + i[7];
                    this.$.tab.filterList(f)
                } else
                    this.$.tab.filterList("");
            else
                this.$.tab.filterList(e == "PF" ? "XXXXXXXXXXX" : "");
        else
            this.$.tab.filterList("");
        this.$.tcontent.setContent(b);
        this.$.tab.addAll(d);
        this.$.tab.refreshList();
        this.$.tab.$.list.select(0);
        this.showDetail()
    },
    close: function (b, d) {
        try {
            d.preventDefault()
        } catch (e) { }
        return this.hide(),
            !0
    },
    generateFilteredData: function (b) {
        for (var b = RegExp("^" + b, "i"), d = [], e = 0, f; f = this.$.tab.getDb()[e]; e++)
            f[1].match(b) && f[34] == this.dateca && (f.dbIndex = e,
                d.push(f));
        return d
    }
});
enyo.kind({
    name: "zaisan.rowCAD",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid70"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid30"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(b[1]);
        this.$.b.setContent(Store.ca[b[0]])
    }
});
enyo.kind({
    name: "zaisan.pnlorderbook",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    pl: 0,
    pt: 0,
    last: 0,
    create: function () {
        this.inherited(arguments);
        bridge.addObj(this.unique ? this.unique : "pnlorderbook", this)
    },
    events: {
        onRowSelect: ""
    },
    handlers: {
        onRowSelect: "showDetail"
    },
    showDetail: function (b, d) {
        if (!d.master) {
            if (this.unique != "")
                return !0;
            if (this.$.tab.getIndex() != 0)
                return !0;
            var e = this.$.field1.getValue().toUpperCase().trim();
            d.from = "obv";
            d.datas = e;
            d.price = this.$.wl.getDb()[d.index][this.$.wl.$.item.field]
        }
    },
    setUnique: function (b) {
        this.unique = b;
        this.$.field1.setValue(dbs.get(Const._def_quote + this.unique, "BBNI").toUpperCase())
    },
    getComp: function (b) {
        return this.$[b]
    },
    actived: function () {
        this.chg()
    },
    deactived: function () {
        this.module && this.module.doStop();
        this.module2 && this.module2.doStop();
        this.module3 && this.module3.doStop()
    },
    updateRow: function (b, d, e, f, g, i, j, k, l) {
        this.pl = d != 0 ? d : l;
        this.$.l.setContent(money(d));
        this.last = d;
        this.$.c.setContent(money(e) + " (" + money2(f) + "%)");
        this.$.l.setAttribute("class", "box");
        this.$.c.setAttribute("class", "box");
        changeImg(this.$.img, d, l);
        e > 0 ? this.$.c.addClass("green") : e < 0 ? this.$.c.addClass("red") : this.$.c.addClass("orange");
        this.$.ipt.reflow();
        this.$.n.setAttribute("class", "");
        b = this.$.field1.getValue().toUpperCase().trim();
        b = Store.stock[b];
        b != null ? (this.$.n.setContent(b[3]),
            bridge.getObj("type") == "Syariah" && b[15].indexOf("T") == -1 && this.$.n.addClass("strike")) : this.$.n.setContent("&nbsp;");
        this.$.inf.reflow();
        this.$.btm.reflow();
        this.$.x2.setContent(money(g));
        this.$.x2.setAttribute("class", "box");
        this.$.x2.addClass(g > l ? "green" : g < l ? "red" : "orange");
        this.$.x4.setContent(money2(j));
        this.$.x4.setAttribute("class", "box");
        this.$.x4.addClass(j > l ? "green" : j < l ? "red" : "orange");
        this.$.nn.setContent("AVG " + money2(i));
        this.$.nn.setAttribute("class", "box");
        this.$.nn.addClass(i > l ? "green" : i < l ? "red" : "orange");
        this.$.y4.setContent(money(k));
        this.$.y4.setAttribute("class", "box");
        this.$.y4.addClass(k > l ? "green" : k < l ? "red" : "orange");
        this.$.z2.setContent(money(l));
        this.$.y.reflow();
        this.$.x.reflow();
        this.queryYTD()
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.ipt.setValues(e)
    },
    calcPotential: function () {
        this.startJob("calcpt", "calcPotentialOri", 1500)
    },
    calcPotentialOri: function () {
        this.pl != 0 ? (this.$.tpotential.setContent(money2((this.pt - this.pl) / this.pl * 100) + "%"),
            changeColor(this.$.tpotential, this.pt, this.pl)) : this.$.tpotential.setContent("-")
    },
    removeFlash: function () {
        this.$.ipt.removeClass("flash")
    },
    components: [{
        name: "ipt",
        onInputChanged: "inputChanged",
        onValueSelected: "chgField",
        kind: "xinput",
        layoutKind: "FittableColumnsLayout",
        style: "width: 100%;",
        alwaysLooksFocused: !0,
        components: [{
            name: "h",
            content: "0%",
            classes: "orangeround box"
        }, {
            name: "field1",
            selectOnFocus: !0,
            kind: "onyx.Input",
            value: "",
            fit: !0,
            value: "BBNI",
            style: "text-transform: uppercase;",
            onchange: "chgField",
            classes: "enyo-selectable"
        }, {
            name: "l",
            content: "0",
            classes: "green box"
        }, {
            name: "img",
            classes: "flatimg",
            style: "width:15px; height: 1.2em;"
        }, {
            name: "c",
            content: "0",
            classes: "green box"
        }]
    }, {
        name: "inf",
        kind: "FittableColumns",
        classes: "pnl bg-param white",
        components: [{
            name: "n",
            fit: !0,
            content: "",
            classes: "texts",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "width:1em;margin-right:.3em;",
            content: "I",
            ontap: "detail"
        }, {
            name: "btnt",
            kind: "onyx.Button",
            style: "width:1.5em;margin-right:.3em;center;",
            content: "T",
            ontap: "btntrade"
        }, {
            name: "btno",
            kind: "onyx.Button",
            style: "width:1.5em;margin-right:.3em;center;",
            content: "O",
            ontap: "btnorder",
            showing: !1
        }, {
            name: "btnr",
            kind: "onyx.Button",
            content: "refresh",
            ontap: "btnrefresh",
            showing: !1
        }]
    }, {
        name: "dlg",
        open: !0,
        kind: "onyx.Drawer",
        components: [{
            kind: "FittableRows",
            classes: "pnl bg-normal f14 bold",
            components: [{
                name: "x",
                kind: "FittableColumns",
                components: [{
                    name: "z1",
                    allowHtml: !0,
                    content: "Prev",
                    classes: "box",
                    style: "width:10%;"
                }, {
                    name: "z2",
                    allowHtml: !0,
                    tag: "span",
                    classes: "orange box",
                    content: "0",
                    style: "width:35%;text-align: right;"
                }, {
                    name: "x3",
                    allowHtml: !0,
                    content: "Hi",
                    classes: "box",
                    style: "width:10%;"
                }, {
                    name: "x4",
                    allowHtml: !0,
                    tag: "span",
                    classes: "box",
                    content: "0",
                    style: "width:35%;text-align: right;"
                }]
            }, {
                name: "y",
                kind: "FittableColumns",
                components: [{
                    name: "x1",
                    allowHtml: !0,
                    content: "Open",
                    classes: "box",
                    style: "width:10%;"
                }, {
                    name: "x2",
                    allowHtml: !0,
                    tag: "span",
                    classes: "box",
                    content: "0",
                    style: "width:35%;text-align: right;"
                }, {
                    name: "y3",
                    allowHtml: !0,
                    content: "Lo",
                    classes: "box",
                    style: "width:10%;"
                }, {
                    name: "y4",
                    allowHtml: !0,
                    tag: "span",
                    classes: "box",
                    content: "0",
                    style: "width:35%;text-align: right;"
                }]
            }]
        }]
    }, {
        name: "tab",
        kind: "Panels",
        fit: !0,
        classes: "f16 bold",
        components: [{
            name: "wl",
            kind: "xtable",
            fit: !0,
            datas: [[1200, 13E4, 15E3, 16E3, 11E4, 5600, 16E3], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], ["", 0, "", "", 0, "", 0]],
            header: [{
                content: "#",
                classes: "grid10 right"
            }, {
                content: "Lot",
                classes: "grid20 right"
            }, {
                content: "Bid",
                classes: "grid20 right"
            }, {
                content: "Offer",
                classes: "grid20 right"
            }, {
                content: "Lot",
                classes: "grid20 right"
            }, {
                content: "#",
                classes: "grid10 right"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowOB"
            }
        }, {
            name: "tl",
            kind: "xtable",
            fit: !0,
            datas: [],
            header: [{
                content: "Trade",
                classes: "grid20 right"
            }, {
                content: "Vol",
                classes: "grid20 right"
            }, {
                content: "Val",
                classes: "grid25 right"
            }, {
                content: "Freq",
                classes: "grid20 right"
            }, {
                content: "F.B%",
                classes: "grid15 right"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowTPL"
            }
        }, {
            name: "target",
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "tt",
                kind: "FittableRows",
                classes: "pnl white bg-column row center",
                content: "TARGET PRICE"
            }, {
                kind: "Scroller",
                touch: !0,
                horizontal: "hidden",
                fit: !0,
                components: [{
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "Buy",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "tbuy",
                        content: "0",
                        classes: "grid45 left"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "Sell",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "tsell",
                        content: "0",
                        classes: "grid45 left"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "Hold",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "thold",
                        content: "0",
                        classes: "grid45 left"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "Avg Target",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "tprice",
                        content: "00,000.00",
                        classes: "grid45 left"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "%YTD",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "ttyd",
                        content: "00.00%",
                        classes: "grid45 left"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "rows center grid-container",
                    components: [{
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid15"
                    }, {
                        content: "%Potential",
                        classes: "grid30 left"
                    }, {
                        content: "&nbsp;",
                        allowHtml: !0,
                        classes: "grid10"
                    }, {
                        name: "tpotential",
                        content: "00.00%",
                        classes: "grid45 left"
                    }]
                }]
            }]
        }]
    }, {
        name: "btm",
        kind: "FittableColumns",
        classes: "pnl bg-selected white f14 bold",
        components: [{
            name: "nn",
            fit: !0,
            content: "AVG 00,000.00",
            classes: "texts",
            allowHtml: !0
        }, {
            name: "btntarget",
            kind: "onyx.Button",
            content: "Target Price",
            ontap: "btntarget"
        }, {
            name: "btnclose",
            kind: "onyx.Button",
            content: "Back",
            ontap: "btnclose",
            showing: !1
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () {
        this.realtime = !0;
        this.$.field1.setValue(dbs.get(Const._def_quote + this.unique, "BBNI").toUpperCase());
        this.actived()
    },
    onLogoutOK: function () {
        this.realtime = !1;
        this.deactived()
    },
    detail: function () {
        return this.$.dlg.setOpen(!this.$.dlg.open),
            !0
    },
    btntrade: function () {
        this.$.tab.setIndex(1);
        this.$.btno.setShowing(!0);
        this.$.btnr.setShowing(!0);
        this.$.btnt.setShowing(!1);
        this.$.inf.reflow();
        this.btnrefresh();
        this.resettg()
    },
    btnorder: function () {
        this.$.tab.setIndex(0);
        this.$.btno.setShowing(!1);
        this.$.btnr.setShowing(!1);
        this.$.btnt.setShowing(!0);
        this.$.inf.reflow();
        this.resettg()
    },
    btntarget: function () {
        this.$.tab.setIndex(2);
        this.$.btntarget.setShowing(!1);
        this.$.btnclose.setShowing(!0);
        this.$.btm.reflow();
        this.resetTP();
        this.queryTarget()
    },
    queryTarget: function () {
        var b = this.$.field1.getValue().toUpperCase().trim();
        b.indexOf(".") == -1 ? b += "#RG" : b = b.replace(".", "#");
        this.module3 || (this.module3 = new mod.target(this));
        this.module3.unique = this.unique + "TG";
        b = b.replace("#RG", "");
        b = b.replace("#NG", "");
        b = b.replace("#TN", "");
        this.module3.filter = "TP#" + b;
        this.module3.doRestart();
        this.queryYTD()
    },
    queryYTD: function () {
        var b = this.$.field1.getValue().toUpperCase().trim();
        b.indexOf(".") == -1 ? b += "#RG" : b = b.replace(".", "#");
        b = b.replace("#RG", "");
        b = b.replace("#NG", "");
        b = b.replace("#TN", "");
        var b = Store.stock[b]
            , d = 0;
        b ? d = this.last == 0 ? "-" : (this.last - b[19]) / b[19] * 100 : d = "-";
        this.$.ttyd.setContent(d == "-" ? d : money2(d) + "%")
    },
    updateTP: function (b) {
        b[0] == "BUY" ? this.$.tbuy.setContent(money2(b[2])) : b[0] == "SELL" ? this.$.tsell.setContent(money2(b[2])) : b[0] == "HOLD" ? this.$.thold.setContent(money2(b[2])) : b[0] == "TARGET PRICE" ? (this.$.tprice.setContent(money2(b[3])),
            this.$.tt.setContent("TARGET PRICE (" + b[4] + ")")) : b[0] == "%YTD" ? this.$.ttyd.setContent(money2(b[3]) + "%") : b[0] == "%POTENTIAL" ? this.$.tpotential.setContent(money2(b[3])) : console.log("unknown target price data", b)
    },
    resetTP: function () {
        this.$.tbuy.setContent("-");
        this.$.tsell.setContent("-");
        this.$.thold.setContent("-");
        this.$.tprice.setContent("-");
        this.$.tt.setContent("TARGET PRICE");
        this.$.ttyd.setContent("-");
        this.$.tpotential.setContent("-")
    },
    btnclose: function () {
        this.btnorder()
    },
    resettg: function () {
        this.$.btnclose.setShowing(!1);
        this.$.btntarget.setShowing(!0);
        this.$.btm.reflow()
    },
    btnrefresh: function () {
        this.$.tl.removeAll();
        this.$.tl.refreshList();
        var b = this.$.field1.getValue().toUpperCase().trim();
        b.indexOf(".") == -1 ? b += "#RG" : b = b.replace(".", "#");
        this.module2 || (this.module2 = new mod.tprice(this.$.tl));
        this.module2.unique = this.unique + "TP";
        this.module2.filter = b;
        b = b.replace("#", "");
        this.module2.selector = {
            selector: "stock= '" + b + "'"
        };
        this.module2.doRestart();
        this.resetTP();
        this.$.tab.index == 2 && this.queryTarget()
    },
    updateMe: function (b) {
        this.realtime ? (this.$.field1.setValue(b),
            this.chg(),
            this.btnrefresh()) : dbs.set(Const._def_quote + this.unique, b)
    },
    chgField: function () {
        this.chg();
        this.btnrefresh();
        var b = this.$.field1.getValue().toUpperCase().trim();
        this.unique == "" && this.doRowSelect({
            datas: b,
            master: 1,
            from: "obv"
        });
        Router.send("onUpdateNews", b)
    },
    chg: function () {
        var b = this.$.field1.getValue().toUpperCase().trim()
            , d = b.split(".")[0]
            , d = Store.stock[d];
        return d ? (this.$.h.setContent(d[23] + "%"),
            this.$.h.setAttribute("class", "box"),
            d[23] == 0 ? this.$.h.addClass("blueround") : d[23] == 100 ? this.$.h.addClass("redround") : this.$.h.addClass("orangeround")) : (this.$.h.setContent("-"),
                this.$.h.setAttribute("class", "greyround box")),
            dbs.set(Const._def_quote + this.unique, b),
            dbs.set(Const._def_quote, b),
            b.indexOf(".") == -1 ? b += "RG" : b = b.replace(".", ""),
            this.module || (this.module = new mod.ob(this)),
            this.module.filter = b,
            this.module.selector = {
                selector: "stock= '" + b + "'"
            },
            this.module.doRestart(),
            !0
    }
});
enyo.kind({
    name: "zaisan.rowOB",
    layoutKind: "FittableRowsLayout",
    classes: "rows grid-container",
    field: 0,
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "b1",
            allowHtml: !0,
            classes: "grid10 right small"
        }, {
            name: "b2",
            allowHtml: !0,
            classes: "grid20 right small",
            ontap: "onbid"
        }, {
            name: "b3",
            allowHtml: !0,
            classes: "grid20 right small",
            ontap: "onbid"
        }, {
            name: "o1",
            allowHtml: !0,
            classes: "grid20 right small",
            ontap: "onoff"
        }, {
            name: "o2",
            allowHtml: !0,
            classes: "grid20 right small",
            ontap: "onoff"
        }, {
            name: "o3",
            allowHtml: !0,
            classes: "grid10 right small"
        }]
    }],
    onbid: function () {
        this.field = 2
    },
    onoff: function () {
        this.field = 3
    },
    update: function (b, d) {
        if (d.index == 10)
            this.$.b2.setContent(money(b[1])),
                this.$.b3.setContent("&nbsp;"),
                this.$.o1.setContent("&nbsp;"),
                this.$.o2.setContent(money(b[4]));
        else {
            b[0] != 0 ? (this.$.b1.setContent(money(b[0])),
                this.$.b2.setContent(money(b[1])),
                this.$.b3.setContent(money(b[2]))) : (this.$.b1.setContent("&nbsp;"),
                    this.$.b2.setContent("&nbsp;"),
                    this.$.b3.setContent("&nbsp;"));
            b[5] != 0 ? (this.$.o1.setContent(money(b[3])),
                this.$.o2.setContent(money(b[4])),
                this.$.o3.setContent(money(b[5]))) : (this.$.o1.setContent("&nbsp;"),
                    this.$.o2.setContent("&nbsp;"),
                    this.$.o3.setContent("&nbsp;"));
            var e = b[6]
                , f = b[3];
            changeColor(this.$.b3, b[2], e);
            changeColor(this.$.o1, f, e)
        }
    }
});
enyo.kind({
    name: "zaisan.rowTPL",
    layoutKind: "FittableRowsLayout",
    classes: "small rows grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "e",
            allowHtml: !0,
            classes: "grid15 right"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(money(b[4]));
        this.$.b.setContent(money(b[5]));
        this.$.c.setContent(money(b[7]));
        this.$.d.setContent(money(b[6]));
        this.$.e.setContent(b[4] == "TOTAL" ? "&nbsp;" : money2(b[10]))
    }
});
mod.ob = function (b) {
    var d = new core.Module([Const._topic + Const._quote, Const._quote, {
        selector: "stock= 'BBNIRG'"
    }, "BBNIRG", "OB", [], !0, !1]);
    return d.getKeys = function (b) {
        return b[0]
    }
        ,
        d.run = function () {
            if (d.queue.length > 0) {
                var b = d.queue.splice(0, d.queue.length);
                d.onMessageSplit(b.pop())
            }
        }
        ,
        d.onMessageSplit = function (d) {
            try {
                for (var f = d[16], g = d[17], i = Math.max(10, Math.max(f.length, g.length)), j = 0, k = mo = 0; k < i; k++) {
                    var l = [];
                    if (k < f.length) {
                        var m = f[k];
                        l.push(m[2]);
                        l.push(m[1]);
                        l.push(m[0]);
                        j += m[1]
                    } else
                        l.push(0),
                            l.push(0),
                            l.push(0);
                    if (k < g.length) {
                        var w = g[k];
                        l.push(w[0]);
                        l.push(w[1]);
                        l.push(w[2]);
                        mo += w[1]
                    } else
                        l.push(0),
                            l.push(0),
                            l.push(0);
                    l.push(d[5]);
                    k < 10 && b.$.wl.updateRow(l, k)
                }
                b.$.wl.updateRow([0, j, 0, 0, mo, 0, 0], 10);
                b.updateRow(+d[3], +d[6], +d[11], +d[12], +d[8], +d[15], +d[9], +d[10], +d[5], +d[13], +d[14])
            } catch (y) { }
        }
        ,
        d
}
    ;
mod.tprice = function (b) {
    var d = new core.Module([Const._topic + Const._tprice, Const._tprice, {}, "", "TPL", Store.tprice, !0, !0]);
    return d.getKeys = function (b) {
        return b[3]
    }
        ,
        d.total = ["z", "", "", "", "TOTAL", 0, 0, 0, 0, 0, ""],
        d.onData = function (e) {
            d.setDirty(!0);
            e[0] = e[4] * -1;
            d.total[5] += e[5];
            d.total[6] += e[6];
            d.total[7] += e[7];
            b.updateItem(e)
        }
        ,
        d.begin = function () {
            b.updateItem(d.total);
            d.total = ["z", "", "", "", "TOTAL", 0, 0, 0, 0, 0, ""];
            b.refreshList()
        }
        ,
        d
}
    ;
mod.target = function (b) {
    var d = new core.Module([Const._topic + Const._currency, Const._currency, {}, "TP#BBNI", "TPM", Store.target, !0, !0]);
    return d.subscribe = function () {
        var b = Array(8);
        b[0] = 11;
        b[1] = d.session;
        b[2] = "" == d.unique ? d.module : d.unique;
        b[3] = d.module;
        b[4] = d.singleReply;
        b[5] = d.seqno;
        b[6] = d.filter;
        b[7] = d.page;
        var f = {};
        f[Const._body] = b;
        f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
        stomp.send(Const._queue + Const._query, f)
    }
        ,
        d.getKeys = function (b) {
            return b[1]
        }
        ,
        d.onMessageSplit = function (e) {
            try {
                var f = d.getKeys(e);
                e[4] = e[0];
                e[0] = e[1];
                d.setDirty(!0);
                b.updateTP(e);
                f == "TARGET PRICE" && (b.pt = e[3],
                    b.calcPotential())
            } catch (g) { }
        }
        ,
        d
}
    ;
enyo.kind({
    name: "zaisan.pnlnews",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    cat: "ALL",
    lock: !1,
    lockby: "",
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.componentsT, {
            owner: this
        });
        try {
            for (var b = 0; b < masters.newscat.length; b++)
                this.$.d.createComponents([{
                    content: masters.newscat[b],
                    kode: b
                }], {
                    owner: this.$.d
                })
        } catch (d) { }
        this.$.d.reflow();
        this.$.stock.setValue(dbs.get(Const._def_quote + this.unique, "").split(".")[0].toUpperCase());
        b = {};
        b.doRefresh = enyo.bind(this, this.doRefresh);
        b.getComp = enyo.bind(this, this.getComp);
        b.lockBy = enyo.bind(this, this.lockBy);
        b.unlock = enyo.bind(this, this.unlock);
        bridge.addObj(this.unique ? this.unique : "pnlnews", b)
    },
    rendered: function (b) {
        this.inherited(arguments);
        this.doRefresh()
    },
    getComp: function (b) {
        return this.$[b]
    },
    lockBy: function (b) {
        this.lock = !0;
        this.lockby = b;
        this.$.acid.setShowing(!1);
        this.$.info.setShowing(!0);
        this.$.pnl.reflow();
        this.doRefresh()
    },
    unlock: function () {
        this.lock = !1;
        this.lockby = "";
        this.$.acid.setShowing(!0);
        this.$.info.setShowing(!1);
        this.$.pnl.reflow();
        this.doRefresh()
    },
    showDetail: function (b, d) {
        var e = this.$.wl.getSelected();
        e && (d.title = e[1],
            d.sources = e[2],
            d.time = e[3],
            d.dat = e,
            d.active = 0,
            d.newsid = e[0],
            d.datas = e[6],
            d.src = "MNC",
            d.datas += "<br/><br/>",
            bridge.getObj("newsdetail").show(),
            bridge.getObj("newsdetail").setDetail(d))
    },
    componentsT: [{
        name: "pnl",
        kind: "FittableColumns",
        classes: "pnl bg-bar grid100",
        components: [{
            name: "f",
            kind: "onyx.custom.SelectDecorator",
            style: "width:12em;height:2.35em;",
            classes: "white bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    name: "e",
                    content: "ALL",
                    kode: 0,
                    active: !0
                }]
            }]
        }, {
            content: "",
            fit: !0
        }, {
            name: "acid",
            classes: "enyo-selectable",
            onInputChanged: "inputChanged",
            onValueSelected: "filterChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 10em;",
            alwaysLooksFocused: !1,
            components: [{
                name: "stock",
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;",
                selectOnFocus: !0,
                onchange: "filterChanged"
            }, {
                name: "clear",
                kind: "onyx.Button",
                content: "All",
                ontap: "filterCleared"
            }]
        }, {
            name: "info",
            content: "filtered by portfolio",
            style: "padding-top:.5em;height:2.35em",
            classes: "white",
            showing: !1
        }, {
            style: "width:.5em"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "doRefresh",
            style: "height:2.35em"
        }]
    }, {
        name: "wl",
        kind: "xtable",
        fit: !0,
        datas: [],
        rows: {
            name: "item",
            kind: "zaisan.rowNews"
        }
    }],
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.acid.setValues(e)
    },
    updateMe: function () {
        this.$.stock.setValue(dbs.get(Const._def_quote + this.unique, "").split(".")[0].toUpperCase());
        this.filterChanged()
    },
    doRefresh: function () {
        this.filterChanged()
    },
    filterChanged: function () {
        this.firsttime = !0;
        var b = this.lock ? this.lockby : this.$.stock.getValue().toUpperCase();
        b = b == "" ? "%" : b;
        b != "%" && Router.send("onUpdateQuote", b);
        b = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|MNS|" + (this.cat == "ALL" ? "%" : this.cat) + "|" + b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                this.$.wl.removeAll(),
                    e.status == "1" && this.$.wl.addAll(e.data)
            } catch (f) { }
        });
        b.error(this, function () { });
        b.go()
    },
    filterCleared: function () {
        this.$.stock.setValue("");
        this.$.d.setSelected(this.$.e.kode);
        this.$.f.$.innerText.setContent(this.$.e.content);
        this.cat = "ALL";
        this.filterChanged()
    },
    selectChanged: function (b) {
        this.cat = b.getValue();
        this.filterChanged()
    }
});
enyo.kind({
    name: "zaisan.rowNews",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold",
    components: [{
        kind: "FittableRows",
        components: [{
            name: "n",
            fit: !0,
            content: "&nbsp;",
            classes: "small",
            allowHtml: !0
        }]
    }],
    update: function (b) {
        b != null && this.$.n.setContent(b[1] + (b[2] == null || b[2] == "null" ? "" : " | " + b[2]) + " <span>" + b[3] + "</span>")
    }
});
enyo.kind({
    name: "zaisan.pnlresearch",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    cat: "ALL",
    realtime: !1,
    lock: !1,
    lockby: "",
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.componentsT, {
            owner: this
        });
        try {
            for (var b = 0; b < masters.researchcat.length; b++)
                this.$.d.createComponents([{
                    content: masters.researchcat[b],
                    kode: b
                }], {
                    owner: this.$.d
                })
        } catch (d) { }
        this.$.d.reflow();
        this.$.stock.setValue(dbs.get(Const._def_quote + this.unique, "").split(".")[0].toUpperCase());
        b = {};
        b.doRefresh = enyo.bind(this, this.doRefresh);
        b.getComp = enyo.bind(this, this.getComp);
        b.lockBy = enyo.bind(this, this.lockBy);
        b.unlock = enyo.bind(this, this.unlock);
        bridge.addObj(this.unique ? this.unique : "pnlresearch", b)
    },
    rendered: function (b) {
        this.inherited(arguments);
        this.doRefresh()
    },
    getComp: function (b) {
        return this.$[b]
    },
    lockBy: function (b) {
        this.lock = !0;
        this.lockby = b;
        this.$.acid.setShowing(!1);
        this.$.info.setShowing(!0);
        this.$.pnl.reflow();
        this.doRefresh()
    },
    unlock: function () {
        this.lock = !1;
        this.lockby = "";
        this.$.acid.setShowing(!0);
        this.$.info.setShowing(!1);
        this.$.pnl.reflow();
        this.doRefresh()
    },
    showDetail: function (b, d) {
        var e = this.$.wl.getSelected();
        e && (d.title = e[1],
            d.sources = e[2],
            d.time = e[3],
            d.dat = e,
            d.active = 1,
            d.newsid = e[0],
            d.datas = e[6],
            d.src = "RNC",
            e[7] != "" && (d.datas = d.datas + '<br/><br/><a target="_blank" href="' + e[7] + '" style="height: 1.6em;" class="enyo-tool-decorator onyx-button enyo-unselectable bg-green white bold">Download</a>'),
            d.datas += "<br/><br/>",
            bridge.getObj("newsdetail").show(),
            bridge.getObj("newsdetail").setDetail(d))
    },
    componentsT: [{
        name: "pnl",
        kind: "FittableColumns",
        classes: "pnl bg-bar grid100",
        components: [{
            name: "f",
            kind: "onyx.custom.SelectDecorator",
            style: "width:12em;height:2.35em;",
            classes: "white bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    name: "e",
                    content: "ALL",
                    kode: 0,
                    active: !0
                }]
            }]
        }, {
            content: "",
            fit: !0
        }, {
            name: "acid",
            onInputChanged: "inputChanged",
            onValueSelected: "filterChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 10em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock",
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;",
                selectOnFocus: !0,
                onchange: "filterChanged"
            }, {
                name: "clear",
                kind: "onyx.Button",
                content: "All",
                ontap: "filterCleared"
            }]
        }, {
            name: "info",
            content: "filtered by portfolio",
            style: "padding-top:.5em;height:2.35em",
            classes: "white",
            showing: !1
        }, {
            style: "width:.5em"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "doRefresh",
            style: "height:2.35em"
        }]
    }, {
        name: "wl",
        kind: "xtable",
        fit: !0,
        datas: [],
        rows: {
            name: "item",
            kind: "zaisan.rowNews"
        }
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () {
        this.realtime = !0;
        this.$.stock.setValue(dbs.get(Const._def_quote + this.unique, "").split(".")[0].toUpperCase())
    },
    onLogoutOK: function () {
        this.realtime = !1
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.acid.setValues(e)
    },
    updateMe: function () {
        this.$.stock.setValue(dbs.get(Const._def_quote + this.unique, "").split(".")[0].toUpperCase());
        this.filterChanged()
    },
    doRefresh: function () {
        this.filterChanged()
    },
    filterChanged: function () {
        this.firsttime = !0;
        var b = this.lock ? this.lockby : this.$.stock.getValue().toUpperCase();
        b = b == "" ? "%" : b;
        b != "%" && Router.send("onUpdateQuote", b);
        b = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|RNS|" + (this.cat == "ALL" ? "%" : this.cat) + "|" + b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                this.$.wl.removeAll(),
                    e.status == "1" && this.$.wl.addAll(e.data)
            } catch (f) { }
        });
        b.error(this, function () { });
        b.go()
    },
    filterCleared: function () {
        this.$.stock.setValue("");
        this.$.d.setSelected(this.$.e.kode);
        this.$.f.$.innerText.setContent(this.$.e.content);
        this.cat = "ALL";
        this.filterChanged()
    },
    selectChanged: function (b) {
        this.cat = b.getValue();
        this.filterChanged()
    }
});
enyo.kind({
    name: "zaisan.pnlnewsdetail",
    kind: "onyx.Popup",
    style: "padding: 1em; position:fixed; height:80%; width:80%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal defaultcolor",
    scrim: !0,
    realtime: !1,
    data: {},
    create: function () {
        this.inherited(arguments);
        bridge.addObj("newsdetail", this)
    },
    onFacebook: function () {
        var b = "https://www.facebook.com/dialog/feed?app_id=134530986736267&link=" + encodeURIComponent("https://bions.id/#" + (this.data.src == "MNC" ? "news" : "research") + "/" + this.data.newsid) + "&name=" + this.data.title + "&redirect_uri=http://facebook.com/";
        window.open(b, "facebook")
    },
    onTwitter: function () {
        var b = "http://twitter.com/home?status=" + encodeURIComponent(this.data.title + " - bions.id/#" + (this.data.src == "MNC" ? "news" : "research") + "/" + this.data.newsid);
        window.open(b, "twitter")
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "TITLE",
                classes: "texts",
                fit: !0
            }, {
                tag: "span",
                components: [{
                    name: "btnfb",
                    classes: "iconsmall",
                    tag: "img",
                    src: "assets/icons/facebook.png",
                    ontap: "onFacebook"
                }]
            }, {
                tag: "span",
                components: [{
                    name: "btntwitter",
                    classes: "iconsmall",
                    tag: "img",
                    src: "assets/icons/twitter.png",
                    ontap: "onTwitter"
                }]
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            name: "t2",
            kind: "FittableColumns",
            classes: "rows bg-bar small bold white",
            components: [{
                name: "t2content",
                content: "sub title",
                classes: "texts"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "scl",
                kind: "Scroller",
                touch: !0,
                classes: "enyo-fit",
                fit: !0,
                components: [{
                    name: "pr",
                    style: "padding:1em;",
                    allowHtml: !0,
                    content: ""
                }]
            }]
        }, {
            name: "cp",
            showing: !1,
            kind: "FittableColumns",
            classes: "pnl-header medium2 bold grid100",
            components: [{
                name: "entry1",
                onInputChanged: "inputChanged",
                kind: "xinput",
                layoutKind: "FittableColumnsLayout",
                classes: "enyo-selectable",
                style: "width: 6em;",
                alwaysLooksFocused: !1,
                components: [{
                    name: "field1",
                    selectOnFocus: !0,
                    kind: "onyx.Input",
                    fit: !0,
                    placeholder: "alias"
                }]
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "entry2",
                kind: "onyx.InputDecorator",
                alwaysLooksFocused: !1,
                fit: !0,
                classes: "enyo-selectable",
                components: [{
                    name: "field2",
                    kind: "onyx.Input",
                    style: "width:100%;",
                    placeholder: "comment"
                }]
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "b1",
                kind: "onyx.Button",
                style: "height: 2em;",
                content: "submit",
                ontap: "add"
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () {
        this.$.cp.setShowing(!0);
        this.$.cp.reflow();
        this.$.t.reflow();
        this.$.n.reflow()
    },
    onLogoutOK: function () {
        this.$.cp.setShowing(!1);
        this.$.cp.reflow();
        this.$.t.reflow();
        this.$.n.reflow()
    },
    show: function (b) {
        this.inherited(arguments)
    },
    setDetail: function (b) {
        this.$.scl.scrollToTop();
        this.data = b;
        this.$.tcontent.setContent(b.title);
        this.$.t2content.setContent(b.sources + " " + b.time);
        this.$.pr.setContent("loading...");
        var d = b.datas.replace(/\n/gi, "<br/>");
        this.loadComment(b.newsid, d, b.src)
    },
    loadComment: function (b, d, e) {
        b = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|" + e + "|" + b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            var i = "<div class='grid100'>Comments:</div><br/>";
            i += "<div class='grid-container bg-selected' id='commentsdet'>";
            try {
                if (e.status == "1")
                    for (var j = e.data.length - 1; j >= 0; j--)
                        i = i + "<div class='grid100'>" + e.data[j][3] + " (" + e.data[j][2] + "):</div><div class='grid100 smallest'>" + e.data[j][5] + "</div><br/>";
                else
                    enyo.Signals.send("onError", "failed to load comments data from server<br/>" + e.msg + "<br/>please relogin")
            } catch (k) {
                enyo.Signals.send("onError", "failed to load comments data from server<br/>" + k)
            }
            i += "</div>";
            d = d + "<br/><br/>" + i;
            this.$.pr.setContent(d)
        });
        b.error(this, function () {
            var b = "<div class='grid100'>Comments:</div><br/>";
            b += "<div class='grid-container bg-selected' id='commentsdet'>";
            b += "</div>";
            d = d + "<br/><br/>" + b;
            enyo.Signals.send("onError", "cannot load comments data from server");
            this.$.pr.setContent(d)
        });
        b.go()
    },
    close: function () {
        this.hide()
    },
    genDateFormatted: function (b) {
        var d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , f = b.getDate() + ""
            , g = b.getHours() + ""
            , i = b.getMinutes() + ""
            , b = b.getSeconds() + "";
        return d + (e.length == 1 ? "0" + e : e) + (f.length == 1 ? "0" + f : f) + (g.length == 1 ? "0" + g : g) + (i.length == 1 ? "0" + i : i) + (b.length == 1 ? "0" + b : b)
    },
    add: function () {
        var b = this.$.field1.getValue().trim()
            , d = this.$.field2.getValue().trim()
            , e = this.data.dat;
        if (e == null)
            return enyo.Signals.send("onError", "please select the news first"),
                !0;
        if (b != "" && d != "") {
            this.$.field2.setValue("");
            var f = new Date;
            dbs.set(bridge.getObj("userid") + "-ALIAS", b);
            d = Const._url + Const._urlsubmit + "?q=" + (this.data.active == 0 ? "SNC" : "SRC") + "|" + e[0] + "|" + this.genDateFormatted(f) + "|" + bridge.getObj("userid") + "|" + b + "|" + d;
            d = new enyo.JsonpRequest({
                url: d,
                callbackName: "c"
            });
            d.response(this, function (d, e) {
                try {
                    e.status != "1" ? enyo.Signals.send("onError", "saving data on server failed<br/>" + e.msg + "<br/>please relogin") : enyo.dom.byId("commentsdet").insertAdjacentHTML("afterbegin", "<div class='grid100'>" + b + " (" + e.data[0] + "):</div><div class='grid100 smallest'>" + e.data[1] + "</div><br/>")
                } catch (f) {
                    enyo.Signals.send("onError", "invalid response on save data<br/>" + f)
                }
            });
            d.error(this, function () {
                enyo.Signals.send("onError", "error while sending save request")
            });
            d.go()
        } else
            enyo.Signals.send("onError", "please enter valid alias & comment");
        return !0
    }
});
enyo.kind({
    name: "zaisan.pnlnewspopup",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:80%; width:80%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal defaultcolor",
    scrim: !0,
    realtime: !1,
    searchText: "",
    datas: "",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlnewspopup", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "News Detail",
                classes: "texts",
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "Panels",
            name: "gp",
            fit: !0,
            draggable: !0,
            classes: "round grid-100 mobile-grid-100",
            components: [{
                name: "scr",
                kind: "enyo.Scroller",
                touch: !0,
                components: [{
                    name: "dtl",
                    allowHtml: !0,
                    content: "",
                    classes: "box"
                }]
            }]
        }]
    }],
    show: function (b) {
        this.inherited(arguments);
        this.searchText = b;
        this.$.dtl.setContent("loading, please wait...");
        setTimeout(enyo.bind(this, this.doSearch, b), 50)
    },
    loadComment: function (b, d) {
        var e = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|" + d + "|" + b,
            callbackName: "c"
        });
        e.response(this, function (b, d) {
            var e = "<div class='grid100'>Comments:</div><br/>";
            e += "<div class='grid-container bg-selected' id='commentsdet'>";
            try {
                if (d.status == "1")
                    for (var j = d.data.length - 1; j >= 0; j--)
                        e = e + "<div class='grid100'>" + d.data[j][3] + " (" + d.data[j][2] + "):</div><div class='grid100 smallest'>" + d.data[j][5] + "</div><br/>";
                else
                    enyo.Signals.send("onError", "failed to load comments data from server<br/>" + d.msg + "<br/>please relogin")
            } catch (k) {
                enyo.Signals.send("onError", "failed to load comments data from server<br/>" + k)
            }
            e += "</div>";
            this.datas = this.datas + "<br/><br/>" + e + "<br/><br/>";
            this.$.dtl.setContent(this.datas);
            this.$.scr.scrollToTop()
        });
        e.error(this, function () {
            var b = "<div class='grid100'>Comments:</div><br/>";
            b += "<div class='grid-container bg-selected' id='commentsdet'>";
            b += "</div>";
            this.datas = this.datas + "<br/><br/>" + b;
            enyo.Signals.send("onError", "cannot load comments data from server");
            this.$.dtl.setContent(this.datas)
        });
        e.go()
    },
    doSearch: function (b) {
        b = Const._url + Const._urldata + "?q=feed|" + (b[0].toLowerCase() == "#news" ? "MND" : "RND") + "|" + b[1];
        b = new enyo.JsonpRequest({
            url: b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                if (e.status == "1")
                    if (e.data.length == 0)
                        this.$.dtl.setContent("no result found");
                    else {
                        var f = e.data[0];
                        this.datas = f[1] + (f[2] == null || f[2] == "null" ? "" : ", " + f[2]) + " - <span class='orange'>" + f[3] + "</span>";
                        this.datas = this.datas + "<br/><br/>" + f[6] + "<br/><br/>";
                        this.searchText[0] == "#research" && f[7] != "" && (this.datas = this.datas + '<a target="_blank" class="white" href="' + f[7] + '">download</a><br/><br/>');
                        this.datas = this.datas.replace(/\n/gi, "<br/>");
                        this.datas += "<br/><br/>";
                        this.loadComment(f[0], this.searchText[0] == "#news" ? "MNC" : "RNC")
                    }
                else
                    this.$.dtl.setContent("loading page failed")
            } catch (g) {
                this.$.dtl.setContent("loading page failed: " + g)
            }
            this.$.scr.scrollToTop()
        });
        b.error(this, function (b, e) {
            this.$.dtl.setContent("loading page failed: " + e);
            this.$.scr.scrollToTop()
        });
        b.go()
    },
    close: function () {
        this.hide()
    }
});
enyo.kind({
    name: "zaisan.pnlfundamental",
    classes: "enyo-unselectable enyo-fit onyx rw",
    kind: "FittableRows",
    cat: "12M",
    create: function () {
        this.inherited(arguments);
        try {
            if (masters.period.length == 0)
                this.$.per.createComponents([{
                    content: "none",
                    kode: "none",
                    active: !0
                }], {
                    owner: this.$.per
                });
            else
                for (var b = 0; b < masters.period.length; b++)
                    this.$.per.createComponents([{
                        content: masters.period[b],
                        kode: masters.period[b],
                        active: b == 0 ? !0 : !1
                    }], {
                        owner: this.$.per
                    })
        } catch (d) {
            this.$.per.createComponents([{
                content: "12M",
                kode: "12M",
                active: !0
            }], {
                owner: this.$.per
            })
        }
        this.$.per.reflow();
        this.refresh = !0;
        b = dbs.get(Const._def_quote, "BBNI").split(".")[0];
        this.$.stock.setValue(b.toUpperCase());
        dbs.set(Const._def_quote, b);
        enyo.bind(this, this.refreshMe);
        enyo.bind(this, this.getComp);
        bridge.addObj("pnlfundamental", this)
    },
    getComp: function (b) {
        return this.$[b]
    },
    events: {
        onRowSelect: "",
        onMove: ""
    },
    handlers: {
        onTransitionFinish: "viewChanged"
    },
    viewChanged: function () {
        return !0
    },
    changeStock: function (b) {
        this.$.stock.setValue(b.toUpperCase());
        this.stockChanged()
    },
    stockChanged: function (b, d) {
        var e = this.$.stock.getValue().toUpperCase().trim();
        e != "" && (Router.send("onChangeQuote", e),
            this.filterChanged(b, d),
            b = Store.stock[e],
            b ? (this.$.h.setContent(b[23] + "%"),
                this.$.h.setAttribute("class", "box"),
                b[23] == 0 ? this.$.h.addClass("blueround") : b[23] == 100 ? this.$.h.addClass("redround") : this.$.h.addClass("orangeround")) : (this.$.h.setContent("-"),
                    this.$.h.setAttribute("class", "greyround box")),
            bridge.getObj("pnlprofile").changeStock(e))
    },
    filterChanged: function (b) {
        this.$.sr.removeAll();
        this.$.sr.refreshList();
        var b = this.$.stock.getValue().toUpperCase().trim()
            , d = Const._url + Const._urldata + "?q=feed|FD|" + this.cat + "|" + b
            , b = Store.stock[b];
        this.$.n.setContent(b == null ? "" : "&nbsp;" + b[3]);
        d = new enyo.JsonpRequest({
            url: d,
            callbackName: "c"
        });
        d.response(this, function (b, d) {
            try {
                d.status == "1" ? (this.$.sr.addAll(d.data),
                    this.$.sr.refreshList()) : enyo.Signals.send("onError", "error while load fundamental data<br/>" + d.msg)
            } catch (g) {
                enyo.Signals.send("onError", "failed while load fundamental data<br/>" + g)
            }
        });
        d.error(this, function () {
            enyo.Signals.send("onError", "cannot load fundamental data")
        });
        d.go()
    },
    onPrior: function () {
        return this.doMove({
            idx: 2
        }),
            !0
    },
    onNext: function () {
        return this.doMove({
            idx: 1
        }),
            !0
    },
    itemSelected: function (b) {
        this.cat = b.getValue();
        this.filterChanged()
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.acid.setValues(e)
    },
    components: [{
        name: "m",
        kind: "FittableColumns",
        classes: "pnl bg-bar grid-container",
        components: [{
            name: "acid",
            onInputChanged: "inputChanged",
            onValueSelected: "stockChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 10em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "h",
                content: "0%",
                classes: "orangeround box"
            }, {
                name: "stock",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "BBNI",
                style: "text-transform: uppercase;",
                onchange: "stockChanged"
            }]
        }, {
            style: "width:.5em;"
        }, {
            kind: "onyx.custom.SelectDecorator",
            classes: "white bg-bar",
            style: "min-width:3em;height:2.35em;",
            components: [{
                name: "per",
                kind: "Select",
                onchange: "itemSelected",
                components: []
            }]
        }, {
            style: "width:.5em;"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe",
            style: "height:2.35em;"
        }, {
            name: "n",
            fit: !0,
            content: "&nbsp;",
            classes: "white texts",
            allowHtml: !0,
            style: "padding-top:.5em;"
        }, {
            name: "btnp",
            kind: "onyx.Button",
            content: "<Profile",
            ontap: "onPrior",
            style: "height:2.35em;"
        }, {
            style: "width:.5em;"
        }, {
            name: "btnn",
            kind: "onyx.Button",
            content: "Comparison>",
            ontap: "onNext",
            style: "height:2.35em;"
        }]
    }, {
        name: "sr",
        kind: "xtable2",
        fit: !0,
        classes: "f16  bold",
        header: [{
            content: "Desc",
            classes: "grid20 left"
        }, {
            content: "Curr",
            classes: "grid16 right"
        }, {
            content: "Hist(1)",
            classes: "grid16 right"
        }, {
            content: "Hist(2)",
            classes: "grid16 right"
        }, {
            content: "Hist(3)",
            classes: "grid16 right"
        }, {
            content: "Hist(4)",
            classes: "grid16 right"
        }],
        datas: [],
        rows: {
            name: "item",
            kind: "zaisan.rowFD"
        }
    }],
    refreshMe: function () {
        return this.filterChanged(),
            !0
    }
});
enyo.kind({
    name: "zaisan.rowFD",
    layoutKind: "FittableRowsLayout",
    classes: "rows grid-container",
    components: [{
        name: "fields",
        kind: "FittableColumns",
        classes: "small",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid20 texts"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid16 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid16 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid16 right"
        }, {
            name: "e",
            allowHtml: !0,
            classes: "grid16 right"
        }, {
            name: "f",
            allowHtml: !0,
            classes: "grid16 right"
        }]
    }],
    applyColor: function (b, d, e) {
        e.getItem().removeClass("abuabu");
        e.getItem().removeClass("white");
        e.getItem().removeClass("mySelected");
        e.getItem().removeClass("myEven");
        e.getItem().removeClass("myOdd");
        d = e.getDb()[b][0] == 0;
        d ? e.getItem().addClass("white mySelected") : e.getItem().addClass(b % 2 == 0 ? "myEven abuabu" : "myOdd abuabu")
    },
    update: function (b) {
        this.$.fields.removeClass("green");
        this.$.fields.removeClass("red");
        this.$.a.setContent(b[0] == 0 ? b[3] : "&nbsp;&nbsp;&nbsp;" + b[3]);
        b[0] == 0 && b[9] != 0 ? (this.$.b.setContent("&nbsp;"),
            this.$.c.setContent("&nbsp;"),
            this.$.d.setContent("&nbsp;"),
            this.$.e.setContent("&nbsp;"),
            this.$.f.setContent("&nbsp;")) : b[3] != "YEAR" ? (this.$.b.setContent(money2(b[4])),
                this.$.c.setContent(money2(b[5])),
                this.$.d.setContent(money2(b[6])),
                this.$.e.setContent(money2(b[7])),
                this.$.f.setContent(money2(b[8])),
                changeColor(this.$.b, b[4], 0),
                changeColor(this.$.c, b[5], 0),
                changeColor(this.$.d, b[6], 0),
                changeColor(this.$.e, b[7], 0),
                changeColor(this.$.f, b[8], 0)) : (this.$.b.setContent(b[4]),
                    this.$.c.setContent(b[5]),
                    this.$.d.setContent(b[6]),
                    this.$.e.setContent(b[7]),
                    this.$.f.setContent(b[8]))
    }
});
enyo.kind({
    name: "zaisan.pnlfundcompare",
    classes: "enyo-unselectable enyo-fit onyx rw",
    kind: "FittableRows",
    cat: "12M",
    create: function () {
        this.inherited(arguments);
        try {
            if (masters.period.length == 0)
                this.$.per.createComponents([{
                    content: "none",
                    kode: "none",
                    active: !0
                }], {
                    owner: this.$.per
                });
            else
                for (var b = 0; b < masters.period.length; b++)
                    this.$.per.createComponents([{
                        content: masters.period[b],
                        kode: masters.period[b],
                        active: b == 0 ? !0 : !1
                    }], {
                        owner: this.$.per
                    })
        } catch (d) {
            this.$.per.createComponents([{
                content: "12M",
                kode: "12M",
                active: !0
            }], {
                owner: this.$.per
            })
        }
        this.$.per.reflow();
        this.refresh = !0;
        b = dbs.get(Const._def_quote, "BBNI").split(".")[0];
        this.$.stock.setValue(b.toUpperCase());
        dbs.set(Const._def_quote, b);
        b = {};
        b.refresMe = enyo.bind(this, this.refreshMe);
        b.getComp = enyo.bind(this, this.getComp);
        bridge.addObj("pnlfundcompare", b)
    },
    getComp: function (b) {
        return this.$[b]
    },
    events: {
        onRowSelect: "",
        onMove: ""
    },
    handlers: {
        onTransitionFinish: "viewChanged"
    },
    viewChanged: function () {
        return !0
    },
    changeStock: function (b) {
        this.$.stock.setValue(b.toUpperCase());
        this.stockChanged()
    },
    stockChanged: function (b, d) {
        var e = this.$.stock.getValue().toUpperCase().trim();
        e != "" && (Router.send("onChangeQuote", e),
            this.filterChanged(b, d))
    },
    filterChanged: function (b) {
        this.$.sr.removeAll();
        this.$.sr.refreshList();
        var b = this.$.stock.getValue().toUpperCase().trim()
            , b = b == "" ? "-" : b
            , d = this.$.stock2.getValue().toUpperCase().trim()
            , d = d == "" ? "-" : d
            , e = this.$.stock3.getValue().toUpperCase().trim()
            , e = e == "" ? "-" : e
            , f = this.$.stock4.getValue().toUpperCase().trim()
            , f = f == "" ? "-" : f
            , g = this.$.stock5.getValue().toUpperCase().trim()
            , b = new enyo.JsonpRequest({
                url: Const._url + Const._urldata + "?q=feed|FD5|" + this.cat + "|" + b + "|" + d + "|" + e + "|" + f + "|" + (g == "" ? "-" : g),
                callbackName: "c"
            });
        b.response(this, function (b, d) {
            try {
                d.status == "1" ? (this.$.sr.addAll(d.data),
                    this.$.sr.refreshList()) : enyo.Signals.send("onError", "error while load fundamental data<br/>" + d.msg)
            } catch (e) {
                enyo.Signals.send("onError", "failed while load fundamental data<br/>" + e)
            }
        });
        b.error(this, function () {
            enyo.Signals.send("onError", "cannot load fundamental data")
        });
        b.go()
    },
    onPrior: function () {
        return this.doMove({
            idx: 0
        }),
            !0
    },
    onNext: function () {
        return this.doMove({
            idx: 2
        }),
            !0
    },
    itemSelected: function (b) {
        this.cat = b.getValue();
        this.filterChanged()
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        b.setValues(e)
    },
    components: [{
        name: "m",
        kind: "FittableColumns",
        classes: "pnl bg-bar grid100",
        components: [{
            name: "acid",
            onInputChanged: "inputChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 4em;;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "BBNI",
                style: "text-transform: uppercase;"
            }]
        }, {
            style: "width:.5em;"
        }, {
            name: "acid2",
            onInputChanged: "inputChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 4em;;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock2",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;"
            }]
        }, {
            style: "width:.5em;"
        }, {
            name: "acid3",
            onInputChanged: "inputChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 4em;;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock3",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;"
            }]
        }, {
            style: "width:.5em;"
        }, {
            name: "acid4",
            onInputChanged: "inputChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 4em;;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock4",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;"
            }]
        }, {
            style: "width:.5em;"
        }, {
            name: "acid5",
            onInputChanged: "inputChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 4em;;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock5",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;"
            }]
        }, {
            style: "width:.5em;"
        }, {
            kind: "onyx.custom.SelectDecorator",
            classes: "white bg-bar",
            style: "min-width:3em;height:2.35em;",
            components: [{
                name: "per",
                kind: "Select",
                onchange: "itemSelected",
                components: []
            }]
        }, {
            style: "width:.5em;"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe",
            style: "height:2.35em;"
        }, {
            fit: !0
        }, {
            name: "btnp",
            kind: "onyx.Button",
            content: "<Fundamental",
            ontap: "onPrior",
            style: "height:2.35em;"
        }, {
            style: "width:.5em;"
        }, {
            name: "btnn",
            kind: "onyx.Button",
            content: "Profile>",
            ontap: "onNext",
            style: "height:2.35em;"
        }]
    }, {
        name: "sr",
        kind: "xtable",
        fit: !0,
        classes: "f16 bold",
        header: [{
            content: "Desc",
            classes: "grid20 left"
        }, {
            content: "Stock1",
            classes: "grid16 right"
        }, {
            content: "Stock2",
            classes: "grid16 right"
        }, {
            content: "Stock3",
            classes: "grid16 right"
        }, {
            content: "Stock4",
            classes: "grid16 right"
        }, {
            content: "Stock5",
            classes: "grid16 right"
        }],
        datas: [],
        rows: {
            name: "item",
            kind: "zaisan.rowFD"
        }
    }],
    refreshMe: function () {
        return this.filterChanged(),
            !0
    }
});
enyo.kind({
    name: "zaisan.pnlprofile",
    classes: "enyo-unselectable enyo-fit onyx bg-normal",
    kind: "FittableRows",
    style: "color:#000;",
    create: function () {
        this.inherited(arguments);
        var b = dbs.get(Const._def_quote, "BBNI").split(".")[0];
        this.$.stock.setValue(b.toUpperCase());
        this.stock = b.toLowerCase();
        this.emiten = "";
        dbs.set(Const._def_quote, b);
        enyo.bind(this.refreshMe);
        enyo.bind(this, this.getComp);
        bridge.addObj("pnlprofile", this);
        this.changeStock(b)
    },
    getComp: function (b) {
        return this.$[b]
    },
    events: {
        onRowSelect: "",
        onMove: ""
    },
    handlers: {
        onRowSelect: "showDetail"
    },
    onPrior: function () {
        return this.doMove({
            idx: 1
        }),
            !0
    },
    onNext: function () {
        return this.doMove({
            idx: 0
        }),
            !0
    },
    showDetail: function () {
        return !0
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.acid.setValues(e)
    },
    components: [{
        name: "m",
        kind: "FittableColumns",
        classes: "pnl bg-bar grid100",
        components: [{
            name: "acid",
            onInputChanged: "inputChanged",
            onValueSelected: "stockChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 10em;height:2em;",
            alwaysLooksFocused: !1,
            classes: "enyo-selectable",
            components: [{
                name: "stock",
                selectOnFocus: !0,
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "BBNI",
                style: "text-transform: uppercase;",
                onchange: "stockChanged"
            }]
        }, {
            style: "width:.5em;"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe",
            style: "height:2.35em;"
        }, {
            fit: !0
        }, {
            name: "btnp",
            kind: "onyx.Button",
            content: "<Comparison",
            ontap: "onPrior",
            style: "height:2.35em;"
        }, {
            style: "width:.5em;"
        }, {
            name: "btnn",
            kind: "onyx.Button",
            content: "Fundamental>",
            ontap: "onNext",
            style: "height:2.35em;"
        }]
    }, {
        kind: "FittableRows",
        fit: !0,
        components: [{
            kind: "Scroller",
            touch: !0,
            classes: "enyo-fit",
            fit: !0,
            horizontal: "hidden",
            components: [{
                name: "pr",
                style: "padding:.5em;",
                allowHtml: !0,
                content: ""
            }]
        }]
    }],
    stockChanged: function () {
        var b = this.$.stock.getValue().toUpperCase().trim();
        b != "" && (Router.send("onChangeQuote", b),
            this.stock = b.toLowerCase(),
            this.fetch(),
            bridge.getObj("pnlfundamental").changeStock(b))
    },
    changeStock: function (b) {
        this.$.stock.setValue(b.toUpperCase());
        this.stock = b.toLowerCase();
        this.fetch()
    },
    filterchanged: function () {
        var b = this.$.stock.getValue().toUpperCase().trim()
            , d = dbs.get(Const._def_quote, b);
        b != "" && b != d && (this.$.stock.setValue(d.toUpperCase()),
            b = d);
        this.stock = b.toLowerCase()
    },
    refreshMe: function () {
        this.filterchanged();
        this.fetch()
    },
    fetch: function () {
        var b = new enyo.JsonpRequest({
            url: Const._emiten,
            callbackName: "callback"
        });
        b.go({
            stock: this.stock
        });
        b.response(this, "processResponse");
        b.error(this, "processError")
    },
    fetch2: function () {
        var b = new enyo.Ajax({
            handleAs: "text",
            url: "emiten/" + this.stock + ".htm"
        });
        b.go();
        b.response(this, "processResponse");
        b.error(this, "processError")
    },
    processResponse: function (b, d) {
        this.emiten = d[0];
        this.changeEmiten()
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        setTimeout(enyo.bind(this, this.changeEmiten, !1), 100)
    },
    changeEmiten: function () {
        var b = this.emiten;
        b = b.replace(/772/gi, Math.max(500, this.getBounds().width - 20));
        b = b.replace(/html/gi, "span");
        b = b.replace(/body/gi, "span");
        b = b.replace(/12px/gi, "14px");
        b = b.replace(/9px/gi, "12px");
        b = b.replace(/\ufffd\ufffd\ufffd/gi, "");
        this.$.pr.setContent(b)
    },
    processError: function () {
        this.$.pr.setContent("not available")
    }
});
enyo.kind({
    name: "zaisan.pnlscreener",
    classes: "enyo-unselectable enyo-fit onyx rw defaultcolor",
    kind: "FittableRows",
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.componentsT, {
            owner: this
        });
        this.$.gl.setDisabled(!0);
        var b = {};
        b.getComp = enyo.bind(this, this.getComp);
        bridge.addObj("pnlscreener", b)
    },
    getComp: function (b) {
        return this.$[b]
    },
    showDetail: function () {
        var b = this.$.wl.getSelected();
        return b && this.linkTo && bridge.getObj(this.linkTo).updateMe(b[0]),
            !0
    },
    componentsT: [{
        kind: "Panels",
        name: "gp",
        fit: !0,
        draggable: !1,
        classes: "grid100",
        components: [{
            kind: "FittableColumns",
            fit: !0,
            refresh: !0,
            classes: "grid100",
            components: [{
                kind: "FittableRows",
                style: "width:60%; border-right: 1px solid #e5e5e5;",
                components: [{
                    kind: "FittableColumns",
                    classes: "pnl bg-bar white",
                    components: [{
                        content: "CRITERIA"
                    }, {
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "SEARCH",
                        ontap: "refreshMe"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "pnl f16 bg-normal2",
                    fit: !0,
                    components: [{
                        kind: "FittableRows",
                        style: "width:48%;",
                        components: [{
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Industry",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "industry",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "Agriculture",
                                        value: 1
                                    }, {
                                        content: "Mining",
                                        value: 2
                                    }, {
                                        content: "Basic Industry",
                                        value: 3
                                    }, {
                                        content: "Miscellaneous",
                                        value: 4
                                    }, {
                                        content: "Consumer Goods",
                                        value: 5
                                    }, {
                                        content: "Property",
                                        value: 6
                                    }, {
                                        content: "Infrastruture",
                                        value: 7
                                    }, {
                                        content: "Finance",
                                        value: 8
                                    }, {
                                        content: "Trade",
                                        value: 9
                                    }, {
                                        content: "Others",
                                        value: 10
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "LastPrice",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "price",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<=50",
                                        value: 0
                                    }, {
                                        content: "50-200",
                                        value: 1
                                    }, {
                                        content: "200-500",
                                        value: 2
                                    }, {
                                        content: "500-2,000",
                                        value: 3
                                    }, {
                                        content: "2,000-5,000",
                                        value: 4
                                    }, {
                                        content: ">-5,000",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Market cap",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "marketcap",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<=IDR 100B",
                                        value: 0
                                    }, {
                                        content: "IDR 100B-IDR 500B",
                                        value: 1
                                    }, {
                                        content: "IDR 500B-IDR 10T",
                                        value: 2
                                    }, {
                                        content: "IDR 10T-IDR 50T",
                                        value: 3
                                    }, {
                                        content: "IDR 50T-IDR 100T",
                                        value: 4
                                    }, {
                                        content: ">=IDR 100T",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Gain/loss",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "gainloss",
                                    kind: "Select",
                                    onchange: "selectChangedGL",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "Gain",
                                        value: 0
                                    }, {
                                        content: "Loss",
                                        value: 1
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "&nbsp;",
                                allowHtml: !0,
                                classes: "small grid40"
                            }, {
                                name: "gl",
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "gainloss2",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "This session",
                                        value: 0,
                                        active: !0
                                    }, {
                                        content: "Last 5 IDX days",
                                        value: 1
                                    }, {
                                        content: "Last month",
                                        value: 2
                                    }, {
                                        content: "Last 6 months",
                                        value: 3
                                    }, {
                                        content: "1 year",
                                        value: 4
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "NI Growth",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "nigrowth",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<=10%",
                                        value: 0
                                    }, {
                                        content: "10%-20%",
                                        value: 1
                                    }, {
                                        content: "20%-30%",
                                        value: 2
                                    }, {
                                        content: "30%-50%",
                                        value: 3
                                    }, {
                                        content: "50%-100%",
                                        value: 4
                                    }, {
                                        content: ">=100%",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Total asset",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "asset",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<=IDR 5T",
                                        value: 0
                                    }, {
                                        content: "IDR 5T - 10T",
                                        value: 1
                                    }, {
                                        content: "IDR 10T - 30T",
                                        value: 2
                                    }, {
                                        content: "IDR 30T - 60T",
                                        value: 3
                                    }, {
                                        content: "IDR 60T - 100T",
                                        value: 4
                                    }, {
                                        content: ">=IDR 100T",
                                        value: 5
                                    }]
                                }]
                            }]
                        }]
                    }, {
                        style: "width:2%"
                    }, {
                        kind: "FittableRows",
                        fit: !0,
                        components: [{
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "PER",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "per",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 5x",
                                        value: 0
                                    }, {
                                        content: "5x - 10x",
                                        value: 1
                                    }, {
                                        content: "10x - 15x",
                                        value: 2
                                    }, {
                                        content: "15x - 20x",
                                        value: 3
                                    }, {
                                        content: "20x - 50x",
                                        value: 4
                                    }, {
                                        content: ">=50x",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "PBV",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "pbv",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 5x",
                                        value: 0
                                    }, {
                                        content: "5x - 10x",
                                        value: 1
                                    }, {
                                        content: "10x - 15x",
                                        value: 2
                                    }, {
                                        content: "15x - 20x",
                                        value: 3
                                    }, {
                                        content: "20x - 50x",
                                        value: 4
                                    }, {
                                        content: ">=50x",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "EPS",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "eps",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= IDR 50",
                                        value: 0
                                    }, {
                                        content: "IDR 50 - IDR 100",
                                        value: 1
                                    }, {
                                        content: "IDR 100 - IDR 500",
                                        value: 2
                                    }, {
                                        content: "IDR 500 - IDR 1,000",
                                        value: 3
                                    }, {
                                        content: "IDR 1,000 - IDR 5,000",
                                        value: 4
                                    }, {
                                        content: ">= IDR 5,000",
                                        value: 5
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "GPM",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "gpm",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 5%",
                                        value: 0
                                    }, {
                                        content: "5% - 10%",
                                        value: 1
                                    }, {
                                        content: "10% - 15%",
                                        value: 2
                                    }, {
                                        content: "15% - 20%",
                                        value: 3
                                    }, {
                                        content: "20% - 25%",
                                        value: 4
                                    }, {
                                        content: "25% - 30%",
                                        value: 5
                                    }, {
                                        content: "30% - 35%",
                                        value: 6
                                    }, {
                                        content: "35% - 40%",
                                        value: 7
                                    }, {
                                        content: "40% - 50%",
                                        value: 8
                                    }, {
                                        content: ">=50%",
                                        value: 9
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "OPM",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "opm",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 5%",
                                        value: 0
                                    }, {
                                        content: "5% - 10%",
                                        value: 1
                                    }, {
                                        content: "10% - 15%",
                                        value: 2
                                    }, {
                                        content: "15% - 20%",
                                        value: 3
                                    }, {
                                        content: "20% - 25%",
                                        value: 4
                                    }, {
                                        content: "25% - 30%",
                                        value: 5
                                    }, {
                                        content: "30% - 35%",
                                        value: 6
                                    }, {
                                        content: "35% - 40%",
                                        value: 7
                                    }, {
                                        content: "40% - 50%",
                                        value: 8
                                    }, {
                                        content: ">=50%",
                                        value: 9
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "DER",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "der",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 100",
                                        value: 0
                                    }, {
                                        content: ">100",
                                        value: 1
                                    }]
                                }]
                            }]
                        }, {
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Curr Ratio",
                                classes: "small grid40"
                            }, {
                                kind: "onyx.custom.SelectDecorator",
                                classes: "grid60",
                                components: [{
                                    name: "ratio",
                                    kind: "Select",
                                    onchange: "selectChanged",
                                    components: [{
                                        content: "All",
                                        value: "%",
                                        active: !0
                                    }, {
                                        content: "<= 1",
                                        value: 0
                                    }, {
                                        content: "1 - 2",
                                        value: 1
                                    }, {
                                        content: "2 - 3",
                                        value: 2
                                    }, {
                                        content: ">=3",
                                        value: 3
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }, {
                kind: "FittableRows",
                fit: !0,
                components: [{
                    kind: "FittableColumns",
                    classes: "pnl bg-bar white",
                    components: [{
                        content: "RESULT"
                    }]
                }, {
                    name: "wl",
                    kind: "xtable2",
                    fit: !0,
                    classes: "f16 bold defaultcolor grid100",
                    header: [{
                        content: "Stock",
                        style: "width: 20%;"
                    }, {
                        content: "Prev",
                        fit: !0,
                        style: "width:20%;text-align: right;"
                    }, {
                        content: "Last",
                        style: "width:20%;text-align:right;"
                    }, {
                        content: "YTD%",
                        style: "width: 20%;text-align:right;"
                    }, {
                        content: "Target",
                        style: "width: 20%;text-align:right;"
                    }],
                    datas: [],
                    rows: {
                        name: "item",
                        kind: "zaisan.rowScreener"
                    }
                }]
            }]
        }]
    }],
    selectChangedGL: function () {
        this.$.gl.setDisabled(this.$.gainloss.getValue() == "%")
    },
    refreshMe: function () {
        this.$.wl.removeAll();
        this.$.wl.refreshList();
        var b = this.$.industry.getValue() + "|" + this.$.price.getValue() + "|" + this.$.marketcap.getValue() + "|" + this.$.gainloss.getValue() + "|" + (this.$.gainloss.getValue() == "%" ? "%" : this.$.gainloss2.getValue()) + "|" + this.$.nigrowth.getValue() + "|" + this.$.asset.getValue() + "|" + this.$.per.getValue() + "|" + this.$.pbv.getValue() + "|" + this.$.eps.getValue() + "|" + this.$.gpm.getValue() + "|" + this.$.opm.getValue() + "|" + this.$.der.getValue() + "|" + this.$.ratio.getValue();
        b == "%|%|%|%|%|%|%|%|%|%|%|%|%|%" ? enyo.Signals.send("onError", "please select one of the criteria") : (bridge.getObj("clientengine").showLoading("processing stock screener, please wait.."),
            b = new enyo.JsonpRequest({
                url: Const._url + Const._urldata + "?q=feed|SCR|" + b,
                callbackName: "c"
            }),
            b.response(this, "processResponse"),
            b.error(this, "processError"),
            b.go());
        return !0
    },
    processResponse: function (b, d) {
        if (d.status == "1") {
            for (var e = 0; e < d.data.length; e++) {
                var f = d.data[e];
                this.$.wl.onlyAdd([f[0], f[1], f[2], f[3], f[13]])
            }
            this.$.wl.refreshList();
            bridge.getObj("clientengine").hideLoading()
        } else
            bridge.getObj("clientengine").hideLoading(),
                enyo.Signals.send("onError", "cannot load data from server<br/>" + d.msg);
        this.$.wl.refreshList()
    },
    processError: function () {
        bridge.getObj("clientengine").hideLoading();
        enyo.Signals.send("onError", "cannot load data from server")
    }
});
enyo.kind({
    name: "zaisan.rowScreener",
    layoutKind: "FittableRowsLayout",
    classes: "rows small grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid20 left"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "e",
            allowHtml: !0,
            classes: "grid20 right smallest"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(b[0]);
        this.$.b.setContent(numformat(b[1]));
        changeColor(this.$.c, b[2], b[1]);
        this.$.c.setContent(numformat(b[2]));
        changeColor(this.$.d, b[3], 0);
        this.$.d.setContent(numformat2(b[3]));
        this.$.e.setContent(b[4] && b[4] > 0 ? numformat2(b[4]) : "-")
    }
});
enyo.kind({
    name: "zaisan.pnlwatchlist",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    dirty: !0,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.thread = new core.Thread(enyo.bind(this, this.updateMe), 1E3);
        var b = {};
        b.getComp = enyo.bind(this, this.getComp);
        b.setDirty = enyo.bind(this, this.setDirty);
        b.loadFromDb = enyo.bind(this, this.loadFromDb);
        bridge.addObj("pnlwatchlist", b)
    },
    getComp: function (b) {
        return this.$[b]
    },
    showDetail: function (b, d) {
        if (this.$.gp.index == 0) {
            var e = this.$.wl.getSelected();
            e && (this.$.field1.setValue(e[0]),
                this.$.field2.setValue(e[9]),
                e[9].trim() != "" && (this.$.pop.setContent(e[15].split(" ")[0] + " | " + e[0] + "<br/><br/>" + e[9]),
                    this.$.pop.showAtEvent(d.sumberevent),
                    enyo.job("hideAlert", enyo.bind(this, "hideAlert"), 5E3)));
            e && this.linkTo && bridge.getObj(this.linkTo).updateMe(e[0])
        }
        return !0
    },
    hideAlert: function () {
        this.$.pop.hide()
    },
    setDirty: function (b) {
        this.dirty = b
    },
    isDirty: function () {
        return this.dirty
    },
    updateMe: function () {
        if (this.dirty) {
            this.setDirty(!1);
            var b = this.$.wl.getDb();
            if (b.length > 0)
                for (var d, e = 0; e < b.length; e++) {
                    var f = b[e];
                    d = Store.ss[f[0] + "RG"];
                    if (d != null) {
                        f[1] = d[5];
                        f[2] = d[8];
                        f[3] = d[9];
                        f[4] = d[20];
                        f[5] = d[6];
                        f[6] = d[7];
                        f[7] = d[16];
                        f[8] = d[18];
                        var g = Store.stock[f[0]];
                        g ? f[10] = d[8] == 0 ? "-" : (d[8] - g[19]) / g[19] * 100 : f[10] = "-";
                        f[11] = d[15];
                        f[12] = d[10];
                        f[13] = d[11];
                        f[14] = d[12];
                        this.$.wl.getList().renderRow(e)
                    }
                }
        }
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        b.setValues(e)
    },
    viewStatistic: function () {
        this.$.st.removeAll();
        this.$.st.refreshList();
        for (var b = this.$.wl.getDb(), d = 0, e = "", f = "10", g = {}, i, j; j = b[d]; d++)
            if (e = Store.stock[j[0]],
                f = e ? e[14] : "10",
                i = g[f],
                i) {
                i[4].push(j[10] == "-" ? 0 : j[10]);
                i[1] += 1;
                i[2] = +money2(i[1] / b.length * 100);
                for (var k = 0, l = 0; j = i[4][k]; k++)
                    l += j;
                i[3] = l / i[1]
            } else
                g[f] = [f, 1, +money2(1 / b.length * 100), j[10], [j[10]]];
        for (key in g)
            this.$.st.onlyAdd(g[key]);
        this.$.st.refreshList();
        this.createChart()
    },
    createChart: function () {
        for (var b = [], d = this.$.st.getDb(), e = 0; e < d.length; e++)
            b.push([Store.stock.getSecDesc(d[e][0]), d[e][2]]);
        b.length > 0 ? (b = JSON.stringify(b),
            this.$.iframe.setSrc(Const._urlpiechart + "?v=1.0&width=" + (this.$.iframe.getBounds().width - 30) + "&height=" + (this.$.iframe.getBounds().height - 30) + "&data=" + b)) : this.$.iframe.setSrc("")
    },
    chart: function () {
        this.$.gp.setIndex(1);
        this.viewStatistic()
    },
    goback: function () {
        this.$.gp.setIndex(0)
    },
    components: [{
        kind: "Panels",
        name: "gp",
        fit: !0,
        draggable: !1,
        classes: "small grid-container",
        components: [{
            kind: "FittableRows",
            fit: !0,
            classes: "grid100",
            components: [{
                kind: "FittableColumns",
                classes: "pnl bg-bar grid100",
                components: [{
                    name: "b0",
                    kind: "onyx.Button",
                    content: "statistic",
                    ontap: "chart",
                    style: "height:2.5em;"
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    name: "entry1",
                    onInputChanged: "inputChanged",
                    kind: "xinput",
                    layoutKind: "FittableColumnsLayout",
                    style: "width: 6em;height:2.25em;",
                    alwaysLooksFocused: !1,
                    classes: "enyo-selectable",
                    components: [{
                        name: "field1",
                        selectOnFocus: !0,
                        kind: "onyx.Input",
                        fit: !0,
                        placeholder: "stock",
                        style: "text-transform: uppercase;"
                    }]
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    name: "entry2",
                    kind: "onyx.InputDecorator",
                    alwaysLooksFocused: !1,
                    classes: "enyo-selectable",
                    fit: !0,
                    style: "height:2.25em;",
                    components: [{
                        name: "field2",
                        kind: "onyx.Input",
                        style: "width:100%;",
                        placeholder: "NOTES"
                    }]
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    name: "b1",
                    kind: "onyx.Button",
                    content: "Add/Update",
                    ontap: "add",
                    style: "height:2.5em;"
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    name: "b2",
                    kind: "onyx.Button",
                    content: "Remove",
                    ontap: "clear",
                    style: "height:2.5em;"
                }]
            }, {
                name: "wl",
                kind: "xtable",
                fit: !0,
                classes: "small bold",
                datas: [],
                header: [{
                    content: "Code",
                    style: "width: 10%;"
                }, {
                    content: "Last/Prev",
                    fit: !0,
                    style: "width:18%;text-align: right;"
                }, {
                    content: "Day Change",
                    style: "width:18%;text-align:right;"
                }, {
                    content: "Hi/lo Day",
                    style: "width: 18%;text-align:right;"
                }, {
                    content: "%YTD",
                    style: "width: 18%;text-align:right;"
                }, {
                    content: "Notes",
                    style: "width: 18%;text-align:left;margin-left:1em;"
                }],
                rows: {
                    name: "item",
                    kind: "zaisan.rowWl"
                }
            }]
        }, {
            kind: "FittableColumns",
            fit: !0,
            components: [{
                kind: "FittableRows",
                classes: "grid60 bg-normal",
                components: [{
                    kind: "FittableColumns",
                    classes: "pnl bg-bar white",
                    components: [{
                        kind: "onyx.Button",
                        content: "Back",
                        ontap: "goback"
                    }, {
                        fit: !0
                    }]
                }, {
                    name: "iframe",
                    tag: "iframe",
                    fit: !0,
                    classes: "pnl bg-normal2 enyo-fill",
                    style: "border: none;"
                }]
            }, {
                name: "st",
                kind: "xtable",
                fit: !0,
                classes: "small bold",
                datas: [],
                header: [{
                    content: "Sector",
                    style: "width: 45%;"
                }, {
                    content: "Share%",
                    fit: !0,
                    style: "width:25%;text-align: right;"
                }, {
                    content: "YTD%",
                    style: "width:30%;text-align:right;"
                }],
                rows: {
                    name: "item",
                    kind: "zaisan.rowWlSt"
                }
            }]
        }]
    }, {
        name: "pop",
        allowHtml: !0,
        kind: "onyx.Popup",
        centered: !0,
        floating: !0,
        allowHtml: !0,
        classes: "bold shadow",
        style: "padding:2em;max-width:20em;"
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () {
        this.realtime = !0;
        this.dirty = !0;
        this.loadFromDb();
        this.updateMe();
        this.thread.start()
    },
    onLogoutOK: function () {
        this.realtime = !1;
        this.thread.stop();
        this.$.wl.removeAll();
        this.$.wl.refreshList()
    },
    add: function () {
        var b = this.$.field1.getValue().toUpperCase().trim();
        return b = Store.stock[b],
            b ? (this.insertToDb(b[2], this.$.field2.getValue().trim()),
                !0) : (enyo.Signals.send("onError", "please enter valid stock"),
                    !0)
    },
    clear: function () {
        var b = this.$.wl.getSelected();
        b && this.delFromDb(b)
    },
    genDateFormatted: function () {
        var b = bridge.getObj("clientengine").genTime()
            , d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , b = b.getDate() + "";
        return d + "-" + (e.length == 1 ? "0" + e : e) + "-" + (b.length == 1 ? "0" + b : b)
    },
    insertToDb: function (b, d) {
        var e = Const._url + Const._urlsubmit + "?q=SSQ|" + bridge.getObj("userid") + "|" + b + "|" + d + "|i"
            , e = new enyo.JsonpRequest({
                url: e,
                callbackName: "c"
            });
        e.response(this, function (e, g) {
            try {
                g.status != "1" ? enyo.Signals.send("onError", "saving data on server failed<br/>" + g.msg + "<br/>please relogin") : (this.$.wl.updateItem([b, 0, 0, 0, 0, 0, 0, 0, 0, d, "-", 0, 0, 0, 0, this.genDateFormatted()]),
                    this.setDirty(!0),
                    this.$.field1.setValue(""),
                    this.$.field2.setValue(""),
                    this.updateMe(),
                    bridge.getObj("pnlnotes").loadFromDb())
            } catch (i) {
                enyo.Signals.send("onError", "invalid response on save data<br/>" + i)
            }
        });
        e.error(this, function () {
            enyo.Signals.send("onError", "error while sending save request")
        });
        e.go()
    },
    delFromDb: function (b) {
        b = Const._url + Const._urlsubmit + "?q=SSQ|" + bridge.getObj("userid") + "|" + b[0] + "||d";
        b = new enyo.JsonpRequest({
            url: b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                e.status != "1" ? enyo.Signals.send("onError", "delete data on server failed<br/>" + e.msg + "<br/>please relogin") : (this.$.wl.removeSelected(),
                    this.$.field1.setValue(""),
                    this.$.field2.setValue(""),
                    bridge.getObj("pnlnotes").loadFromDb())
            } catch (f) {
                enyo.Signals.send("onError", "invalid response on delete data<br/>" + f)
            }
        });
        b.error(this, function () {
            enyo.Signals.send("onError", "error while sending delete request")
        });
        b.go()
    },
    loadFromDb: function () {
        this.$.wl.removeAll();
        this.$.wl.refreshList();
        var b = Const._url + Const._urldata + "?q=feed|SLU|" + bridge.getObj("userid")
            , b = new enyo.JsonpRequest({
                url: b,
                callbackName: "c"
            });
        b.response(this, function (b, e) {
            try {
                if (e.status == "1") {
                    for (var f = e.data, g = 0; g < f.length; g++)
                        Store.stock[f[g][1]] && this.$.wl.updateItem([f[g][1], 0, 0, 0, 0, 0, 0, 0, 0, f[g][2], "-", 0, 0, 0, 0, f[g][3]]);
                    this.dirty = !0;
                    this.updateMe()
                } else
                    enyo.Signals.send("onError", "failed to load watchlist data from server<br/>" + e.msg + "<br/>please relogin")
            } catch (i) {
                enyo.Signals.send("onError", "failed to load watchlist data from server")
            }
        });
        b.error(this, function () {
            enyo.Signals.send("onError", "cannot load watchlist data from server")
        });
        b.go()
    }
});
enyo.kind({
    name: "zaisan.rowWl",
    layoutKind: "FittableRowsLayout",
    classes: "rows small",
    selectMe: function (b, d) {
        d.notes = !0
    },
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 10%;text-align: left;",
            components: [{
                name: "a1",
                allowHtml: !0
            }, {
                name: "a2",
                allowHtml: !0
            }]
        }, {
            name: "b",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 18%;text-align: right;",
            components: [{
                name: "b1",
                allowHtml: !0
            }, {
                name: "b2",
                allowHtml: !0
            }]
        }, {
            name: "c",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 18%;text-align: right;",
            components: [{
                name: "c1",
                allowHtml: !0
            }, {
                name: "c2",
                allowHtml: !0
            }]
        }, {
            name: "d",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 18%;text-align: right;",
            components: [{
                name: "d1",
                allowHtml: !0
            }, {
                name: "d2",
                allowHtml: !0
            }]
        }, {
            name: "e",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 18%;text-align: right;",
            components: [{
                name: "e1",
                allowHtml: !0
            }, {
                kind: "FittableColumns",
                style: "width: 100%;text-align: right;",
                components: [{
                    name: "e2",
                    classes: "upimg",
                    style: "width:15px;height: 1.2em;"
                }, {
                    content: "&nbsp;",
                    allowHtml: !0,
                    style: "width:1em;"
                }]
            }]
        }, {
            name: "f",
            kind: "FittableRows",
            allowHtml: !0,
            style: "width: 18%;text-align: left;",
            components: [{
                name: "f1",
                allowHtml: !0,
                classes: "texts"
            }]
        }]
    }],
    update: function (b) {
        this.$.a1.setContent(b[0]);
        this.$.b1.setContent(money(b[2]));
        this.$.b2.setContent(money(b[1]));
        this.$.c1.setContent(money(b[3]));
        this.$.c2.setContent(money2(b[4]) + "%");
        this.$.d1.setContent(money(b[5]));
        this.$.d2.setContent(money(b[6]));
        this.$.e1.setContent(b[10] == "-" ? "" : money2(b[10]) + "&nbsp;&nbsp;&nbsp;");
        this.$.f1.setContent(b[9]);
        changeColor(this.$.c, b[3], 0);
        changeColor(this.$.e, b[10], 0);
        changeImg(this.$.e2, b[10] != "-" ? b[10] : 0, 0)
    }
});
enyo.kind({
    name: "zaisan.rowWlSt",
    layoutKind: "FittableRowsLayout",
    classes: "rows",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            style: "width: 45%;text-align: left;",
            classes: "small"
        }, {
            name: "b",
            allowHtml: !0,
            style: "width: 25%;text-align: right;",
            classes: "small"
        }, {
            name: "c",
            allowHtml: !0,
            style: "width: 30%;text-align: right;",
            classes: "small"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(Store.stock.getSecDesc(b[0]));
        this.$.b.setContent(money2(b[2]));
        this.$.c.setContent(money2(b[3]));
        this.$.a.setAttribute("class", "small");
        this.$.a.addClass(Store.stock.getSecColorCode(b[0]));
        this.$.c.setAttribute("class", "");
        this.$.c.addClass(b[3] > 0 ? "green" : b[3] < 0 ? "red" : "orange")
    }
});
enyo.kind({
    name: "zaisan.pnlstocksummary",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    cat: 0,
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.createComponents(this.componentsT, {
            owner: this
        });
        enyo.bind(this, this.refreshMe);
        enyo.bind(this, this.getComp);
        this.$.wl.setSort(0);
        this.$.wl.setSorttype(1);
        this.$.wl.setMaster(this);
        bridge.addObj("pnlstocksummary", this)
    },
    genDateFormatted: function (b) {
        var d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , b = b.getDate() + "";
        return d + "/" + (e.length == 1 ? "0" + e : e) + "/" + (b.length == 1 ? "0" + b : b)
    },
    getDateBefore: function (b) {
        for (var d = bridge.getObj("clientengine").genTime(), e = "", f = 0; f < b - 1;)
            d.setDate(d.getDate() - 1),
                e = this.genDateFormatted(d),
                !Store.holiday[e] && d.getDay() != 0 && d.getDay() != 6 && f++;
        return this.genDateFormatted(d)
    },
    generateFilteredData: function (b) {
        for (var b = RegExp(b + "$", "i"), d = [], e = 0, f; f = this.$.wl.getDb()[e]; e++)
            f[2 - (f.length < 32 ? 2 : 0)].match(b) && f[3 - (f.length < 32 ? 2 : 0)] == "RG" && (f.dbIndex = e,
                d.push(f));
        return d
    },
    refreshFilter: function () {
        this.$.wl.filterList(this.$.stock.getValue())
    },
    rendered: function (b) {
        this.inherited(arguments)
    },
    getComp: function (b) {
        return this.$[b]
    },
    componentsT: [{
        kind: "FittableColumns",
        classes: "pnl bg-bar grid100",
        components: [{
            name: "f",
            kind: "onyx.custom.SelectDecorator",
            style: "width:12em;height:2.35em;",
            classes: "white bg-bar",
            components: [{
                name: "d",
                kind: "Select",
                onchange: "selectChanged",
                components: [{
                    name: "e",
                    content: "Today",
                    kode: 0,
                    active: !0
                }, {
                    content: "Last 5 days",
                    kode: 1
                }, {
                    content: "Last 20 days",
                    kode: 2
                }, {
                    content: "Last 60 days",
                    kode: 3
                }]
            }]
        }, {
            content: "",
            fit: !0
        }, {
            name: "acid",
            classes: "enyo-selectable",
            onInputChanged: "inputChanged",
            onValueSelected: "filterChanged",
            kind: "xinput",
            layoutKind: "FittableColumnsLayout",
            style: "width: 10em;",
            alwaysLooksFocused: !1,
            components: [{
                name: "stock",
                kind: "onyx.Input",
                value: "",
                fit: !0,
                value: "",
                style: "text-transform: uppercase;",
                selectOnFocus: !0,
                onchange: "filterChanged"
            }, {
                name: "clear",
                kind: "onyx.Button",
                content: "All",
                ontap: "filterCleared"
            }]
        }, {
            style: "width:0.5em;"
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe",
            style: "height:2.35em;"
        }]
    }, {
        name: "wl",
        kind: "xtable2",
        fit: !0,
        datas: [],
        header: [{
            content: "Code",
            classes: "grid15"
        }, {
            content: "&nbsp;",
            allowHtml: !0,
            classes: "grid5"
        }, {
            content: "Vol",
            classes: "grid25 right"
        }, {
            content: "Value",
            classes: "grid25 right"
        }, {
            content: "Avg Buy Price",
            classes: "grid15 right"
        }, {
            content: "Avg Sell Price",
            classes: "grid15 right"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowSS"
        }
    }, {
        kind: "Broadcast",
        onLoginOK: "onLogon",
        onLogoutOK: "onLogout"
    }],
    onLogon: function () {
        this.realtime = !0;
        this.refreshMe()
    },
    onLogout: function () {
        this.realtime = !1
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        this.$.acid.setValues(e)
    },
    updateMe: function () {
        this.$.stock.setValue(dbs.get(Const._def_quote, "").split(".")[0].toUpperCase());
        this.filterChanged()
    },
    showDetail: function () {
        enyo.job(null, enyo.bind(this, "doShowDetail"), 50)
    },
    doShowDetail: function () {
        var b = this.$.wl.getSelected()
            , d = ""
            , e = "";
        if (b && this.linkTo) {
            var f = b.length < 32 ? 2 : 0;
            this.cat == 0 ? d = e = this.genDateFormatted(bridge.getObj("clientengine").genTime()) : this.cat == 1 ? (d = this.getDateBefore(5),
                e = this.genDateFormatted(bridge.getObj("clientengine").genTime())) : this.cat == 2 ? (d = this.getDateBefore(20),
                    e = this.genDateFormatted(bridge.getObj("clientengine").genTime())) : (d = this.getDateBefore(60),
                        e = this.genDateFormatted(bridge.getObj("clientengine").genTime()));
            bridge.getObj("pnlstockdetail").show(b[2 - f], d, e, this.cat);
            this.linkTo && bridge.getObj(this.linkTo).updateMe(b[2 - f])
        }
        return !0
    },
    refreshMe: function () {
        this.$.wl.filterList("xxx");
        this.$.wl.removeAll();
        this.$.wl.refreshList();
        this.cat == 0 ? (this.$.wl.setSort(2),
            this.module || (this.module = new mod.stocktrade(this)),
            this.module.filter = "RG",
            this.module.doRestart()) : this.cat == 1 ? (this.$.wl.setSort(0),
                this.module2 || (this.module2 = new mod.stocktradehis(this)),
                this.module2.filter = "STH#" + this.getDateBefore(5) + "#" + this.genDateFormatted(bridge.getObj("clientengine").genTime()),
                this.module2.doRestart()) : this.cat == 2 ? (this.$.wl.setSort(0),
                    this.module2 || (this.module2 = new mod.stocktradehis(this)),
                    this.module2.filter = "STH#" + this.getDateBefore(20) + "#" + this.genDateFormatted(bridge.getObj("clientengine").genTime()),
                    this.module2.doRestart()) : (this.$.wl.setSort(0),
                        this.module2 || (this.module2 = new mod.stocktradehis(this)),
                        this.module2.filter = "STH#" + this.getDateBefore(60) + "#" + this.genDateFormatted(bridge.getObj("clientengine").genTime()),
                        this.module2.doRestart())
    },
    filterChanged: function () {
        this.realtime && this.refreshMe()
    },
    filterCleared: function () {
        this.$.stock.setValue("");
        this.filterChanged()
    },
    selectChanged: function (b, d) {
        this.cat = d.originator.selected;
        this.filterChanged()
    }
});
enyo.kind({
    name: "zaisan.rowSS",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "code",
            classes: "grid12"
        }, {
            name: "type",
            allowHtml: !0,
            classes: "grid8 right",
            content: "Total<br/>Foreign</br>Domestic"
        }, {
            name: "vol",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "val",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "avgb",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "avgs",
            allowHtml: !0,
            classes: "grid15 right"
        }]
    }],
    update: function (b) {
        if (b != null) {
            var d = b.length < 32 ? 2 : 0
                , e = b[4 - d] * 2
                , f = b[5 - d] * 2;
            this.$.code.setContent(b[2 - d]);
            this.$.vol.setContent(money(b[4 - d]) + "<br/>" + money2(b[20 - d] * 100 / e) + "%<br/>" + money2(b[8 - d] * 100 / e) + "%");
            this.$.val.setContent(money(b[5 - d]) + "<br/>" + money2(b[21 - d] * 100 / f) + "%<br/>" + money2(b[9 - d] * 100 / f) + "%");
            this.$.avgb.setContent(money2(b[7 - d]) + "<br/>" + money2(b[27 - d]) + "<br/>" + money2(b[15 - d]));
            this.$.avgs.setContent(money2(b[7 - d]) + "<br/>" + money2(b[31 - d]) + "<br/>" + money2(b[19 - d]))
        }
    }
});
enyo.kind({
    name: "zaisan.pnlstockdetail",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:80%; width:80%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal",
    scrim: !0,
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.sr.setSort(33);
        this.$.sr.setSorttype(0);
        var b = {};
        b.generateFilteredData = enyo.bind(this, this.generateFilteredData1);
        this.$.sr.setMaster(b);
        this.$.sr2.setSort(37);
        this.$.sr2.setSorttype(0);
        b = {};
        b.generateFilteredData = enyo.bind(this, this.generateFilteredData2);
        this.$.sr2.setMaster(b);
        this.$.sr3.setSort(21);
        this.$.sr3.setSorttype(0);
        b = {};
        b.generateFilteredData = enyo.bind(this, this.generateFilteredData3);
        this.$.sr3.setMaster(b);
        this.$.sr4.setSort(25);
        this.$.sr4.setSorttype(0);
        b = {};
        b.generateFilteredData = enyo.bind(this, this.generateFilteredData4);
        this.$.sr4.setMaster(b);
        bridge.addObj("pnlstockdetail", this)
    },
    generateFilteredData1: function () {
        for (var b = [], d = 0, e = 0, f; f = this.$.sr.getDb()[e]; e++)
            f[33] > 0 && d < 5 && (f.dbIndex = e,
                d++,
                b.push(f));
        return b
    },
    generateFilteredData2: function () {
        for (var b = [], d = 0, e = 0, f; f = this.$.sr2.getDb()[e]; e++)
            f[37] > 0 && d < 5 && (f.dbIndex = e,
                d++,
                b.push(f));
        return b
    },
    generateFilteredData3: function () {
        for (var b = [], d = 0, e = 0, f; f = this.$.sr3.getDb()[e]; e++)
            f[21] > 0 && d < 5 && (f.dbIndex = e,
                d++,
                b.push(f));
        return b
    },
    generateFilteredData4: function () {
        for (var b = [], d = 0, e = 0, f; f = this.$.sr4.getDb()[e]; e++)
            f[25] > 0 && d < 5 && (f.dbIndex = e,
                d++,
                b.push(f));
        return b
    },
    showDetail: function () {
        return !0
    },
    dateToStr: function (b) {
        try {
            var d = b.getMonth() + 1 + ""
                , d = d.length == 1 ? "0" + d : d
                , e = b.getDate() + "";
            return e = e.length == 1 ? "0" + e : e,
                b.getFullYear() + "/" + d + "/" + e
        } catch (f) {
            return ""
        }
    },
    filterChanged: function (b, d, e) {
        this.$.sr.removeAll();
        this.$.sr.refreshList();
        this.$.sr2.removeAll();
        this.$.sr2.refreshList();
        this.$.sr3.removeAll();
        this.$.sr3.refreshList();
        this.$.sr4.removeAll();
        this.$.sr4.refreshList();
        this.$.sr.filterList("x");
        this.$.sr2.filterList("x");
        this.$.sr3.filterList("x");
        this.$.sr4.filterList("x");
        var f = this.dateToStr(bridge.getObj("clientengine").genTime());
        f == d && f == d ? (this.module || (this.module = new mod.brokerbystock(this.$.sr, this.$.sr2, this.$.sr3, this.$.sr4)),
            this.module.filter = b + "#RG",
            this.module.doRestart()) : this.getHistory(Const._url + Const._urldata + "?q=feed|BBS|" + b + "|RG|" + d + "|" + e)
    },
    getHistory: function (b) {
        bridge.getObj("clientengine").showLoading("please wait...");
        b = new enyo.JsonpRequest({
            url: b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                if (e.status == "1") {
                    for (var f = 0; f < e.data.length; f++) {
                        var g = e.data[f];
                        g[0] = g[2];
                        var i = "-"
                            , j = "-";
                        g.length > 41 && (i = g[41],
                            j = g[42],
                            g.pop(),
                            g.pop());
                        g.push(g[9] / Const.lotSize - g[13] / Const.lotSize);
                        g.push(g[10] - g[14]);
                        g.push(g[21] / Const.lotSize - g[25] / Const.lotSize);
                        g.push(g[22] - g[26]);
                        g.push(g[33] / Const.lotSize - g[37] / Const.lotSize);
                        g.push(g[34] - g[38]);
                        g.push(i);
                        g.push(j);
                        this.$.sr.onlyAdd(g);
                        this.$.sr2.onlyAdd(g);
                        this.$.sr3.onlyAdd(g);
                        this.$.sr4.onlyAdd(g)
                    }
                    this.$.sr.refreshList();
                    this.$.sr2.refreshList();
                    this.$.sr3.refreshList();
                    this.$.sr4.refreshList()
                } else
                    enyo.Signals.send("onError", "failed, load data from server<br/>" + e.msg)
            } catch (k) {
                enyo.Signals.send("onError", "failed, load data from server<br/>" + k)
            }
            bridge.getObj("clientengine").hideLoading()
        });
        b.error(this, function (b, e) {
            enyo.Signals.send("onError", "failed, load data from server<br/>" + e);
            bridge.getObj("clientengine").hideLoading()
        });
        b.go()
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tit",
                content: "Top 5 Broker By Stock"
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            content: "Top 5 Foreign",
            classes: "medium center bg-selected pnl"
        }, {
            kind: "FittableColumns",
            style: "height:40%",
            components: [{
                kind: "FittableRows",
                classes: "grid50",
                components: [{
                    content: "Top 5 Buyer",
                    classes: "bg-red pnl center"
                }, {
                    name: "sr",
                    kind: "xtable2",
                    fit: !0,
                    header: [{
                        content: "Code",
                        classes: "grid35"
                    }, {
                        content: "Lot",
                        classes: "grid20 right"
                    }, {
                        content: "Val",
                        classes: "grid25 right"
                    }, {
                        content: "Avg",
                        classes: "grid20 right"
                    }],
                    rows: {
                        name: "item",
                        kind: "zaisan.rowBBS5",
                        type: 0
                    }
                }]
            }, {
                kind: "FittableRows",
                classes: "grid50",
                components: [{
                    content: "Top 5 Seller",
                    classes: "bg-green pnl center"
                }, {
                    name: "sr2",
                    kind: "xtable2",
                    fit: !0,
                    classes: "bg-normal2",
                    header: [{
                        content: "Code",
                        classes: "grid35"
                    }, {
                        content: "Lot",
                        classes: "grid20 right"
                    }, {
                        content: "Val",
                        classes: "grid25 right"
                    }, {
                        content: "Avg",
                        classes: "grid20 right"
                    }],
                    rows: {
                        name: "item",
                        kind: "zaisan.rowBBS5",
                        type: 1
                    }
                }]
            }]
        }, {
            content: "Top 5 Domestic",
            classes: "medium center bg-selected pnl"
        }, {
            kind: "FittableColumns",
            fit: !0,
            components: [{
                kind: "FittableRows",
                classes: "grid50",
                components: [{
                    content: "Top 5 Buyer",
                    classes: "bg-red pnl center"
                }, {
                    name: "sr3",
                    kind: "xtable2",
                    fit: !0,
                    header: [{
                        content: "Code",
                        classes: "grid35"
                    }, {
                        content: "Lot",
                        classes: "grid20 right"
                    }, {
                        content: "Val",
                        classes: "grid25 right"
                    }, {
                        content: "Avg",
                        classes: "grid20 right"
                    }],
                    rows: {
                        name: "item",
                        kind: "zaisan.rowBBS5",
                        type: 2
                    }
                }]
            }, {
                kind: "FittableRows",
                classes: "grid50",
                components: [{
                    content: "Top 5 Seller",
                    classes: "bg-green pnl center"
                }, {
                    name: "sr4",
                    kind: "xtable2",
                    fit: !0,
                    classes: "bg-normal2",
                    header: [{
                        content: "Code",
                        classes: "grid35"
                    }, {
                        content: "Lot",
                        classes: "grid20 right"
                    }, {
                        content: "Val",
                        classes: "grid25 right"
                    }, {
                        content: "Avg",
                        classes: "grid20 right"
                    }],
                    rows: {
                        name: "item",
                        kind: "zaisan.rowBBS5",
                        type: 3
                    }
                }]
            }]
        }, {
            kind: "Broadcast",
            onLoginOK: "onLoginOK",
            onLogoutOK: "onLogoutOK"
        }]
    }],
    onLoginOK: function () {
        this.realtime = !0
    },
    onLogoutOK: function () {
        this.realtime = !1;
        this.module && this.module.doStop();
        this.close()
    },
    show: function (b, d, e, f) {
        this.inherited(arguments);
        f == 0 ? this.$.tit.setContent("Top 5 Broker by Stock " + b + " - Today") : f == 1 ? this.$.tit.setContent("Top 5 Broker by Stock " + b + " - Last 5 days") : f == 2 ? this.$.tit.setContent("Top 5 Broker by Stock " + b + " - Last 20 days") : this.$.tit.setContent("Top 5 Broker by Stock " + b + " - Last 60 days");
        this.$.t.reflow();
        this.filterChanged(b, d, e)
    },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    }
});
enyo.kind({
    name: "zaisan.rowBBS5",
    layoutKind: "FittableRowsLayout",
    classes: "rows small bold grid-container",
    type: 0,
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid35 left"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid20 right"
        }]
    }],
    applyColor: function (b, d, e) {
        e.getItem().removeClass("mySelected");
        e.getItem().removeClass("bg-normal2");
        d ? e.getItem().addClass("mySelected") : e.getItem().addClass(this.type == 0 || this.type == 2 ? "bg-normal" : "bg-normal2")
    },
    update: function (b) {
        var d = Store.broker[b[2]];
        this.$.a.setContent(b[2] + (d ? " - " + d[3] : ""));
        this.type == 0 ? (this.$.b.setContent(money(b[33] / Const.lotSize)),
            this.$.c.setContent(money(b[34])),
            this.$.d.setContent(money(b[36]))) : this.type == 1 ? (this.$.b.setContent(money(b[37] / Const.lotSize)),
                this.$.c.setContent(money(b[38])),
                this.$.d.setContent(money(b[40]))) : this.type == 2 ? (this.$.b.setContent(money(b[21] / Const.lotSize)),
                    this.$.c.setContent(money(b[22])),
                    this.$.d.setContent(money(b[24]))) : (this.$.b.setContent(money(b[25] / Const.lotSize)),
                        this.$.c.setContent(money(b[26])),
                        this.$.d.setContent(money(b[28])))
    }
});
enyo.kind({
    name: "zaisan.pnlgrouprank",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    onTab: function (b, d) {
        return this.cmd != d.cmd && (this.cmd = d.cmd,
            this.$.pnl.setIndex(this.cmd)),
            !0
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            name: "selector",
            kind: "zaisan.tab",
            onTriggered: "onTab",
            components: [{
                cmd: 0,
                content: "Stock Ranking",
                active: !0
            }, {
                cmd: 1,
                content: "Broker Ranking"
            }]
        }]
    }, {
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        arrangerKind: "CarouselArranger",
        components: [{
            kind: "zaisan.pnlstockrank",
            classes: "enyo-fit",
            unique: "dash-pnlsrank",
            linkTo: "dash-ob"
        }, {
            kind: "zaisan.pnlbrokerrank",
            classes: "enyo-fit"
        }]
    }]
});
enyo.kind({
    name: "zaisan.pnlgroupdashboard2",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    onLoginOK: function () {
        this.$.pnl.setIndex(1)
    },
    onLogoutOK: function () {
        this.$.pnl.setIndex(0)
    },
    components: [{
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        components: [{
            kind: "FittableColumns",
            components: [{
                kind: "zaisan.faq",
                style: "width:49.5%;min-width:260px;"
            }, {
                style: "width:1%"
            }, {
                kind: "zaisan.calendar",
                style: "width:49.5%;min-width:260px;"
            }]
        }, {
            kind: "zaisan.pnlgroupwatchlist"
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.pnlgroupwatchlist",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    cmd: 0,
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    onTab: function (b, d) {
        return this.cmd != d.cmd && (this.cmd = d.cmd,
            this.$.pnl.setIndex(this.cmd)),
            !0
    },
    onHeatmap: function () {
        return bridge.getObj("pnlheatmap").show(),
            !0
    },
    onTradeWatch: function () {
        return bridge.getObj("pnltradewatch").show(),
            !0
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            name: "selector",
            kind: "zaisan.tab",
            onTriggered: "onTab",
            components: [{
                cmd: 0,
                content: "Watchlist",
                active: !0
            }, {
                cmd: 1,
                content: "Stock Summary"
            }, {
                cmd: 2,
                content: "Market Summary"
            }]
        }, {
            fit: !0
        }, {
            name: "selector2",
            kind: "zaisan.tab",
            grouped: !1,
            onTriggered: "onHeatmap",
            components: [{
                cmd: 5,
                content: "Heatmap",
                sec: "0111"
            }]
        }, {
            style: "width:.5em;"
        }, {
            name: "selector3",
            kind: "zaisan.tab",
            grouped: !1,
            onTriggered: "onTradeWatch",
            components: [{
                cmd: 5,
                content: "Trade Watch",
                sec: "0111"
            }]
        }]
    }, {
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        arrangerKind: "CarouselArranger",
        components: [{
            kind: "zaisan.pnlwatchlist",
            classes: "enyo-fit",
            linkTo: "dash-ob"
        }, {
            kind: "zaisan.pnlstocksummary",
            classes: "enyo-fit",
            linkTo: "dash-ob"
        }, {
            kind: "zaisan.pnlmarket",
            classes: "enyo-fit"
        }]
    }]
});
enyo.kind({
    name: "zaisan.pnlgroupdashboard",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    cmd: 0,
    handlers: {
        onMove: "changeFundamental"
    },
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    onTab: function (b, d) {
        return this.cmd != d.cmd && (this.cmd = d.cmd,
            this.$.pnl.setIndex(this.cmd)),
            !0
    },
    onChart: function () {
        return bridge.getObj("pnlchart").show(),
            !0
    },
    changeFundamental: function (b, d) {
        return this.$.fund.setIndex(d.idx),
            !0
    },
    onLoginOK: function () { },
    onLogoutOK: function () {
        this.$.selector.resetTo(0);
        this.$.pnl.setIndex(0)
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            name: "selector",
            kind: "zaisan.tab",
            onTriggered: "onTab",
            components: [{
                cmd: 0,
                content: "News",
                active: !0,
                unique: "dash-pnlnews",
                sec: "1111"
            }, {
                cmd: 1,
                content: "Research",
                unique: "dash-pnlresearch",
                sec: "1111"
            }, {
                cmd: 2,
                content: "Fundamental",
                disabled: !1,
                sec: "0111"
            }, {
                cmd: 3,
                content: "Screener",
                disabled: !1,
                sec: "0111"
            }]
        }, {
            fit: !0
        }, {
            name: "selector2",
            kind: "zaisan.tab",
            grouped: !1,
            onTriggered: "onChart",
            components: [{
                cmd: 5,
                content: "Chart",
                disabled: !1,
                sec: "0111"
            }]
        }]
    }, {
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        arrangerKind: "CarouselArranger",
        components: [{
            kind: "zaisan.pnlnews",
            classes: "enyo-fit",
            unique: "dash-pnlnews"
        }, {
            kind: "zaisan.pnlresearch",
            classes: "enyo-fit",
            unique: "dash-pnlresearch"
        }, {
            name: "fund",
            kind: "Panels",
            draggable: !1,
            arrangerKind: "CarouselArranger",
            classes: "enyo-fit",
            components: [{
                kind: "zaisan.pnlfundamental"
            }, {
                kind: "zaisan.pnlfundcompare"
            }, {
                kind: "zaisan.pnlprofile"
            }]
        }, {
            kind: "zaisan.pnlscreener",
            linkTo: "dash-ob"
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.pnlgroupaccount",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    cmd: 2,
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow();
        this.$.selector.resetTo(3);
        this.$.pnl.setIndex(2)
    },
    onTab: function (b, d) {
        return this.cmd != d.cmd && (this.cmd = d.cmd,
            this.$.pnl.setIndex(this.cmd)),
            !0
    },
    onTrdLoginOK: function () {
        this.cmd = 0;
        this.$.selector.resetTo(0);
        this.$.pnl.setIndex(0)
    },
    onTrdLogoutOK: function () {
        this.cmd = 2;
        this.$.selector.resetTo(3);
        this.$.pnl.setIndex(2)
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            name: "selector",
            kind: "zaisan.tab",
            onTriggered: "onTab",
            components: [{
                cmd: 0,
                content: "Portfolio",
                sec: "0001"
            }, {
                cmd: 1,
                content: "Order Status",
                sec: "0001"
            }, {
                cmd: 5,
                content: "Auto Order",
                sec: "0001"
            }, {
                cmd: 2,
                content: "News",
                active: !0,
                unique: "acc-pnlnews"
            }, {
                cmd: 3,
                content: "Research",
                unique: "acc-pnlresearch"
            }, {
                cmd: 4,
                content: "Cash Withdraw",
                sec: "0001"
            }, {
                cmd: 6,
                content: "HMETD List",
                sec: "0001"
            }]
        }]
    }, {
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        arrangerKind: "CarouselArranger",
        components: [{
            kind: "zaisan.pnlportfolio",
            classes: "enyo-fit",
            linkTo: "acc-ob"
        }, {
            kind: "zaisan.pnlorder",
            classes: "enyo-fit",
            linkTo: "acc-ob"
        }, {
            kind: "zaisan.pnlnews",
            classes: "enyo-fit"
        }, {
            kind: "zaisan.pnlresearch",
            classes: "enyo-fit"
        }, {
            kind: "zaisan.pnlcash",
            classes: "enyo-fit"
        }, {
            kind: "zaisan.pnlauto",
            classes: "enyo-fit",
            linkTo: "acc-ob"
        }, {
            kind: "zaisan.pnlhmetd",
            classes: "enyo-fit"
        }]
    }, {
        kind: "Broadcast",
        onLogoutOK: "onTrdLogoutOK",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.pnlgroupaccount2",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    cmd: 0,
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    onTab: function (b, d) {
        return this.cmd != d.cmd && (this.cmd = d.cmd,
            this.$.pnl2.setIndex(this.cmd)),
            !0
    },
    onTrdLoginOK: function () {
        this.$.pnl.setIndex(1)
    },
    onTrdLogoutOK: function () {
        this.$.pnl.setIndex(0)
    },
    doLogin: function () {
        Router.send("onShowBuy")
    },
    onDoUpdate: function () {
        this.$.pnl2.getActive().doUpdate("REFRESH")
    },
    components: [{
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        components: [{
            kind: "FittableRows",
            classes: "rw",
            components: [{
                style: "height:45%;"
            }, {
                classes: "enyo-stretch box centered",
                components: [{
                    content: "PF (please&nbsp;",
                    allowHtml: !0
                }, {
                    kind: "onyx.Button",
                    content: "Login Trading",
                    ontap: "doLogin",
                    style: "height:2.5em;vertical-align:middle;"
                }, {
                    content: "&nbsp;)",
                    allowHtml: !0
                }]
            }, {
                fit: !0
            }]
        }, {
            kind: "FittableRows",
            components: [{
                name: "top",
                kind: "FittableColumns",
                components: [{
                    name: "selector",
                    kind: "zaisan.tab",
                    onTriggered: "onTab",
                    components: [{
                        cmd: 0,
                        content: "Allocation",
                        active: !0
                    }, {
                        cmd: 1,
                        content: "Comparative Return"
                    }]
                }, {
                    fit: !0
                }, {
                    name: "selector2",
                    kind: "zaisan.tab",
                    grouped: !1,
                    onTriggered: "onDoUpdate",
                    components: [{
                        cmd: 2,
                        content: "Refresh"
                    }]
                }]
            }, {
                name: "pnl2",
                kind: "Panels",
                draggable: !1,
                fit: !0,
                arrangerKind: "CarouselArranger",
                components: [{
                    kind: "zaisan.pnlpfallocation",
                    classes: "enyo-fit"
                }, {
                    kind: "zaisan.pnlpfcomparison",
                    classes: "enyo-fit"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onLogoutOK: "onTrdLogoutOK",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.pnlmarket",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlmarket", this);
        this.$.sr.updateItem([0, "", "Board"]);
        this.$.sr.updateItem([4, "", "Type"])
    },
    rendered: function (b) {
        this.inherited(arguments)
    },
    getComp: function (b) {
        return this.$[b]
    },
    showDetail: function () {
        return !0
    },
    actived: function () { },
    deactived: function () { },
    components: [{
        kind: "Panels",
        name: "gp",
        animate: !1,
        fit: !0,
        draggable: !1,
        arrangerKind: "CardSlideInArranger",
        classes: "grid100",
        components: [{
            name: "sr",
            kind: "xtable",
            fit: !0,
            classes: "small",
            header: [{
                content: "Code",
                classes: "grid15"
            }, {
                content: "Lot",
                classes: "grid15 right"
            }, {
                content: "Val",
                classes: "grid15 right"
            }, {
                content: "Frq",
                classes: "grid15 right"
            }, {
                content: "F.Net.Lot",
                classes: "grid15 right"
            }, {
                content: "F.Net.Val",
                classes: "grid15 right"
            }, {
                content: "F.Net.Frq",
                classes: "grid10 right"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowMrz"
            }
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () {
        this.realtime = !0;
        this.actived()
    },
    onLogoutOK: function () {
        this.realtime = !1;
        this.deactived()
    }
});
enyo.kind({
    name: "zaisan.rowMrz",
    layoutKind: "FittableRowsLayout",
    classes: "rows smallest bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            clases: "grid15 texts"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "f1",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "f2",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "f3",
            allowHtml: !0,
            classes: "grid10 right"
        }]
    }],
    applyColor: function (b, d, e) {
        e.getItem().removeClass("mySelected");
        e.getItem().removeClass("bg-normal");
        b = e.getDb()[b];
        b[0] == 0 || b[0] == 4 || b[0] == 9 ? e.getItem().addClass("bg-normal2") : d ? e.getItem().addClass("mySelected") : e.getItem().addClass("bg-normal")
    },
    update: function (b) {
        b[0] == 0 || b[0] == 4 ? (this.$.a.setContent(b[2]),
            this.$.b.setContent(""),
            this.$.c.setContent(""),
            this.$.d.setContent(""),
            this.$.f1.setContent(""),
            this.$.f2.setContent(""),
            this.$.f3.setContent("")) : (this.$.a.setContent(b[2]),
                this.$.b.setContent(money(b[3] / Const.lotSize)),
                this.$.c.setContent(money(b[4])),
                this.$.d.setContent(money(b[5])),
                changeColor(this.$.f1, b[28], 0),
                changeColor(this.$.f2, b[29], 0),
                this.$.f1.setContent(money(b[28])),
                this.$.f2.setContent(money(b[29])),
                this.$.f3.setContent(money(b[20] - b[23])));
        this.$.a.addClass("grid15")
    }
});
mod.market = function (b) {
    var d = new core.Module([Const._topic + Const._market, Const._market, {}, "", "MK", Store.market, !0, !1]);
    return d.map = {
        ALL: "Total",
        RG: "&nbsp;&nbsp;&nbsp;Regular",
        TN: "&nbsp;&nbsp;&nbsp;Cash Market",
        O: "&nbsp;&nbsp;&nbsp;Stock",
        NG: "&nbsp;&nbsp;&nbsp;Negotiated",
        W: "&nbsp;&nbsp;&nbsp;Warrant",
        R: "&nbsp;&nbsp;&nbsp;Right",
        M: "&nbsp;&nbsp;&nbsp;Mutual Fund"
    },
        d.map2 = {
            ALL: 9,
            BOARD: 0,
            RG: 1,
            NG: 2,
            TN: 3,
            TYPE: 4,
            O: 5,
            W: 6,
            R: 7,
            M: 8
        },
        d.getKeys = function (b) {
            return b[2]
        }
        ,
        d.onMessageSplit = function (e) {
            try {
                var f = d.getKeys(e);
                e[0] = d.map2[f];
                e[2] = d.map[f];
                e.push(0);
                e.push(0);
                e.push(e[9] / Const.lotSize - e[12] / Const.lotSize);
                e.push(e[10] - e[13]);
                e.push(e[18] / Const.lotSize - e[21] / Const.lotSize);
                e.push(e[19] - e[22]);
                d.store[f] = e;
                d.setDirty(!0);
                b.updateItem(e)
            } catch (g) { }
        }
        ,
        d
}
    ;
enyo.kind({
    name: "zaisan.pnltradewatch",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:90%; width:80%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-normal",
    scrim: !0,
    realtime: !1,
    siap: !1,
    fromShow: !1,
    myX: 0,
    myY: 0,
    create: function () {
        this.inherited(arguments);
        this.$.tl.getList().setHorizontal("hidden");
        this.$.tl.getList().setVertical("hidden");
        try {
            var b = dbs.get(Const._def_trade, "");
            b != "" ? (b = JSON.parse(b),
                this.$.stock.setValue(b.stock.join(",")),
                this.$.lot.setSelected(b.lot),
                this.$.f.$.innerText.setContent(this.$.lot.controls[b.lot].content)) : (this.$.lot.setSelected(4),
                    this.$.f.$.innerText.setContent(this.$.lot.controls[4].content))
        } catch (d) { }
        bridge.addObj("pnltradewatch", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "Trade Watch",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "rb",
                kind: "onyx.Button",
                content: "BUY",
                ontap: "onBuy",
                classes: "bg-red white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "rs",
                kind: "onyx.Button",
                content: "SELL",
                ontap: "onSell",
                classes: "bg-green white bold"
            }, {
                style: "width:.5em;"
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                kind: "FittableColumns",
                classes: "pnl bg-bar medium2",
                components: [{
                    name: "f",
                    kind: "onyx.custom.SelectDecorator",
                    style: "width:10em;height:2.35em;",
                    classes: "white bold bg-bar",
                    components: [{
                        name: "lot",
                        kind: "Select",
                        onchange: "filterChanged",
                        components: [{
                            content: "lot >   5",
                            kode: 5,
                            num: 1
                        }, {
                            content: "lot >  10",
                            kode: 10,
                            num: 2
                        }, {
                            content: "lot >  50",
                            kode: 50,
                            num: 3
                        }, {
                            content: "lot > 100",
                            kode: 100,
                            num: 4
                        }, {
                            content: "all   lot",
                            kode: 0,
                            num: 5
                        }]
                    }]
                }, {
                    style: "width:.5em;"
                }, {
                    kind: "onyx.InputDecorator",
                    layoutKind: "FittableColumnsLayout",
                    fit: !0,
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "stock",
                        selectOnFocus: !0,
                        kind: "onyx.Input",
                        classes: "enyo-selectable",
                        value: "",
                        fit: !0,
                        style: "text-transform: uppercase;",
                        onchange: "filterChanged"
                    }, {
                        name: "clear",
                        kind: "onyx.Button",
                        content: "clear",
                        ontap: "filterCleared"
                    }]
                }]
            }, {
                name: "tl",
                kind: "xtable",
                fit: !0,
                datas: [["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0], ["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0]],
                header: [{
                    content: "Time",
                    classes: "grid10"
                }, {
                    content: "Stock",
                    classes: "grid20"
                }, {
                    content: "Last",
                    classes: "grid20 right"
                }, {
                    content: "+/-",
                    classes: "grid20 right"
                }, {
                    content: "Lot",
                    classes: "grid15 right"
                }, {
                    content: "B/S",
                    classes: "grid15 right"
                }],
                rows: {
                    name: "item",
                    kind: "zaisan.rowTw"
                }
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }],
    onLoginOK: function () { },
    onLogoutOK: function () {
        this.close()
    },
    show: function (b) {
        this.inherited(arguments);
        this.module || (this.module = new mod.trade(this.$.tl));
        this.filterChanged()
    },
    close: function () {
        this.hide();
        this.module && this.module.doStop();
        this.$.tl.removeAll();
        for (var b = 0; b < 20; b++)
            this.$.tl.getDb().push(["", "", "0", "", "", "", 0, 0, "", "", "", "", 0, "", 0, "", 0, 0, 0]);
        return this.$.tl.refreshList(),
            this.fromShow = !0,
            !0
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100);
        this.fromShow = !1
    },
    rendered: function () {
        this.inherited(arguments)
    },
    urlChanged: function () { },
    changeQuote: function () { },
    onBuy: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowBuy")
    },
    onSell: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowSell")
    },
    filterCleared: function () {
        this.$.stock.setValue("");
        this.filterChanged()
    },
    filterChanged: function (b) {
        if (this.module) {
            for (var b = this.$.stock.getValue().toUpperCase().split(","), d = "", e = 0; e < b.length; e++) {
                var f = b[e].trim();
                f != "" && (d = d + "'" + f + "',")
            }
            d != "" && (d = d.substring(0, d.length - 1));
            e = this.$.lot.components[this.$.lot.getSelected()].kode;
            e = e != 0 ? "lot > " + e + "" : "";
            f = "";
            d != "" ? (f = "stock in (" + d + ") ",
                e != "" && (f += " and " + e),
                this.module.selector = {
                    selector: f
                }) : e != "" ? this.module.selector = {
                    selector: e
                } : this.module.selector = {};
            this.module.doRestart();
            b = {
                stock: b,
                lot: this.$.lot.getSelected()
            };
            dbs.set(Const._def_trade, JSON.stringify(b))
        }
    }
});
enyo.kind({
    name: "zaisan.rowTw",
    layoutKind: "FittableRowsLayout",
    classes: "rows medium2 bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a1",
            allowHtml: !0,
            classes: "grid10"
        }, {
            name: "a2",
            allowHtml: !0,
            classes: "grid20"
        }, {
            name: "last",
            kind: "FittableColumns",
            classes: "grid20 right",
            components: [{
                name: "b",
                classes: "right grid75",
                allowHtml: !0
            }, {
                classes: "grid5",
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "c",
                classes: "grid20",
                style: "height: 1.2em;",
                allowHtml: !0
            }]
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "e1",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            kind: "FittableColumns",
            classes: "grid15 right",
            components: [{
                name: "e21",
                allowHtml: !0
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "e22",
                allowHtml: !0
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "e23",
                allowHtml: !0
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "e24",
                allowHtml: !0
            }]
        }]
    }],
    update: function (b) {
        this.$.c.setAttribute("class", "");
        if (b[2] != "0") {
            this.$.a1.setContent(b[2][0] + b[2][1] + ":" + b[2][2] + b[2][3] + ":" + b[2][4] + b[2][5]);
            this.$.a2.setContent(b[3] + "." + b[4]);
            this.$.b.setContent(money(b[6]));
            this.$.d.setContent(money(b[17]) + " (" + money2(b[18]) + "%)");
            this.$.e1.setContent(money(b[7]));
            this.$.e21.setContent(b[9]);
            this.$.e22.setContent(b[8]);
            this.$.e23.setContent(b[10]);
            this.$.e24.setContent(b[11]);
            var d = b[17];
            changeColor(this.$.d, d, 0);
            changeImg(this.$.c, d, 0);
            changeColor(this.$.b, d, 0);
            this.$.e1.addClass(b[6] == b[14] ? "biru" : "orange");
            this.$.e21.addClass(b[9] == "F" ? "yellow" : "ungu-muda");
            this.$.e24.addClass(b[11] == "F" ? "yellow" : "ungu-muda");
            this.$.e22.addClass(broker.getColor(b[8]));
            this.$.e23.addClass(broker.getColor(b[10]))
        } else
            this.$.a1.setContent("&nbsp;"),
                this.$.a2.setContent("&nbsp;"),
                this.$.b.setContent("&nbsp;"),
                this.$.d.setContent("&nbsp;"),
                this.$.e1.setContent("&nbsp;"),
                this.$.e21.setContent("&nbsp;"),
                this.$.e22.setContent("&nbsp;"),
                this.$.e23.setContent("&nbsp;"),
                this.$.e24.setContent("&nbsp;")
    }
});
enyo.kind({
    name: "zaisan.pnlportfolio",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    handlers: {
        onChgid: "idChangedEvent",
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.wl.setSort(0);
        this.$.wl.setSorttype(1);
        this.$.wl.setMaster(this);
        bridge.addObj("pf", this)
    },
    showDetail: function () {
        var b = this.$.wl.getSelected();
        return b && this.linkTo && bridge.getObj(this.linkTo).updateMe(b[7]),
            !0
    },
    idChangedEvent: function (b, d) {
        return d && setTimeout(enyo.bind(this, this.refreshPFView, !1), 500),
            !0
    },
    doclear: function () {
        this.$.wl.filterList("xxx");
        bridge.getObj("pnlcompare").doUpdate("");
        bridge.getObj("pnlpfalloc").doUpdate();
        bridge.getObj("pnlnews").lockBy("xxx");
        bridge.getObj("pnlresearch").lockBy("xxx");
        this.$.pfcasht0.setContent("-");
        this.$.pfstockvalue.setContent("-");
        this.$.pftl.setContent("-");
        this.$.pfcasht3.setContent("-");
        this.$.pfasset.setContent("-");
        this.$.pfratio.setContent("-")
    },
    getComp: function (b) {
        return this.$[b]
    },
    onTrdLogoutOK: function () {
        bridge.getObj("pnlnews").unlock();
        bridge.getObj("pnlresearch").unlock()
    },
    refreshPFView: function () {
        var b = this.$.tradingid.$.field.getValue().toUpperCase();
        if (b) {
            this.$.wl.filterList("xxx");
            this.$.wl.filterList(b);
            bridge.getObj("pnlcompare").doUpdate(b);
            bridge.getObj("pnlpfalloc").doUpdate();
            for (var d = this.$.wl.getFiltered(), e = "", f = 0; f < d.length; f++)
                e += d[f][7],
                    f != d.length - 1 && (e += ",");
            e = e == "" ? "xxx" : e;
            bridge.getObj("pnlnews").lockBy(e);
            bridge.getObj("pnlresearch").lockBy(e);
            this.refreshData(b)
        } else
            this.doclear()
    },
    refreshData: function (b) {
        var d = Store.ACC[b];
        d != null ? Store.CUS[d[2]] != null ? (this.$.pftl.setContent(numformat(d[6])),
            this.$.pfcasht0.setContent(numformat(d[12])),
            b = this.calcPF(b),
            this.$.pfstockvalue.setContent(numformat(b)),
            this.$.pfasset.setContent(numformat(d[12] + b)),
            this.$.pfratio.setContent(numformat2(d[8] <= 0 ? 0 : d[8] / d[14] * 100)),
            this.$.pfcasht3.setContent(numformat(d[12] - d[17] + d[20] - d[18] + d[21] - d[19] + d[22]))) : this.doclear() : this.doclear()
    },
    onTrdLoginOK: function () {
        var b = Store.ID[0];
        b ? (this.$.tradingid.$.field.setValue(b),
            this.refreshPFView()) : this.doclear()
    },
    generateFilteredData: function (b) {
        for (var b = RegExp(b + "$", "i"), d = [], e = 0, f; f = this.$.wl.getDb()[e]; e++)
            f[1].match(b) && f[9] > 0 && (f.dbIndex = e,
                d.push(f));
        return d
    },
    refreshHeader: function () {
        this.refreshData(this.$.tradingid.$.field.getValue().toUpperCase())
    },
    calcPF: function (b) {
        for (var b = RegExp("^" + b, "i"), d = 0, e = 0, f; f = bridge.getObj("pf").getComp("wl").getDb()[e]; e++)
            f[1].match(b) && (d += f[15]);
        return d
    },
    doRefresh: function () {
        var b = this.$.tradingid.$.field.getValue().toUpperCase();
        acc = Store.ACC[b];
        acc && (bridge.getObj("clientengine").refreshPF(acc[1], "%"),
            bridge.getObj("clientengine").refreshACC(b, acc[1]))
    },
    components: [{
        kind: "FittableRows",
        classes: "pnl bg-bar white",
        components: [{
            kind: "FittableColumns",
            style: "height:2.5em;",
            classes: "rows",
            components: [{
                kind: "FittableColumns",
                style: "width:14.5%",
                components: [{
                    content: "TradingId",
                    style: "width:50%;"
                }, {
                    kind: "onyx.Button",
                    content: "refresh",
                    classes: "right",
                    ontap: "doRefresh"
                }]
            }, {
                style: "width:1%"
            }, {
                content: "Cash",
                style: "width:10%"
            }, {
                name: "pfcasht0",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }, {
                content: "Stock Value",
                style: "width:10%"
            }, {
                name: "pfstockvalue",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }, {
                content: "Trading Limit",
                style: "width:12%"
            }, {
                name: "pftl",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }]
        }, {
            kind: "FittableColumns",
            style: "height:2.5em;",
            classes: "rows",
            components: [{
                name: "tradingid",
                kind: "onyx.ddID",
                cls: "label-item-dd enyo-selectable",
                style: "width:14.5%;"
            }, {
                style: "width:1%"
            }, {
                content: "Cash T+2",
                style: "width:10%"
            }, {
                name: "pfcasht3",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }, {
                content: "Total Asset",
                style: "width:10%"
            }, {
                name: "pfasset",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }, {
                content: "Ratio",
                style: "width:12%"
            }, {
                name: "pfratio",
                content: "0",
                style: "width:12.5%",
                classes: "right"
            }, {
                style: "width:1%"
            }]
        }]
    }, {
        name: "wl",
        kind: "xtable2",
        fit: !0,
        classes: "small",
        header: [{
            content: "Code",
            classes: "grid-10 left"
        }, {
            content: "CurrLot",
            classes: "grid-10 right"
        }, {
            content: "RemainLot",
            classes: "grid-10 right"
        }, {
            content: "Avg",
            classes: "grid-10 right"
        }, {
            content: "Last",
            classes: "grid-10 right"
        }, {
            content: "Change",
            classes: "grid-20 right"
        }, {
            content: "Value",
            classes: "grid-20 right"
        }, {
            content: "Day Change",
            classes: "grid-10 right"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowPF"
        }
    }, {
        kind: "Broadcast",
        onLogoutOK: "onTrdLogoutOK",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowPF",
    layoutKind: "FittableRowsLayout",
    classes: "rows f16 bold",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            style: "width: 10%;text-align: left;",
            classes: "texts"
        }, {
            name: "b",
            allowHtml: !0,
            style: "width: 10%;text-align: right;"
        }, {
            name: "c",
            allowHtml: !0,
            style: "width: 10%;text-align: right;"
        }, {
            name: "d",
            allowHtml: !0,
            style: "width: 10%;text-align: right;"
        }, {
            name: "e",
            allowHtml: !0,
            style: "width: 10%;text-align: right;"
        }, {
            name: "f",
            allowHtml: !0,
            style: "width: 20%;text-align: right;"
        }, {
            name: "g",
            allowHtml: !0,
            style: "width: 20%;text-align: right;"
        }, {
            name: "h",
            allowHtml: !0,
            style: "width: 10%;text-align: right;"
        }]
    }, {
        kind: "FittableColumns",
        components: [{
            name: "a1",
            allowHtml: !0,
            style: "width: 50%;text-align: left;",
            classes: "texts"
        }, {
            name: "f1",
            kind: "FittableColumns",
            style: "width: 20%;text-align: right;",
            components: [{
                name: "f11",
                classes: "upimg",
                style: "width:15px;height: 1.2em;"
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "f12",
                style: "width:4em;"
            }]
        }, {
            name: "g1",
            allowHtml: !0,
            style: "width: 20%;text-align: right;"
        }, {
            name: "h1",
            kind: "FittableColumns",
            style: "width: 10%;text-align: right;",
            components: [{
                name: "h11",
                classes: "upimg",
                style: "width:15px;height: 1.2em;"
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "h12",
                style: "width:3em;"
            }]
        }]
    }],
    update: function (b) {
        var d = Store.SEC[b[7]];
        this.$.a.setContent(b[7]);
        this.$.a1.setContent(d ? d[1] : "");
        this.$.b.setContent(numformat(b[9]));
        this.$.c.setContent(numformat(b[8]));
        this.$.d.setContent(numformat(b[12]));
        this.$.e.setContent(numformat2(b[11]));
        this.$.f.setContent(numformat(b[13]));
        d = (b[11] - b[12]) / b[12] * 100;
        changeImg(this.$.f11, d, 0);
        this.$.f12.setContent(numformat2(d) + "%");
        changeColor(this.$.f, d, 0);
        changeColor(this.$.f12, d, 0);
        this.$.g.setContent(numformat2(b[15]));
        b[34] != "-" ? (d = (b[11] - b[34]) / b[34] * 100,
            this.$.h.setContent(numformat2(b[11] - b[34])),
            this.$.h12.setContent(numformat2(d) + "%"),
            changeImg(this.$.h11, d, 0),
            changeColor(this.$.h, d, 0),
            changeColor(this.$.h12, d, 0)) : (this.$.h.setContent("-"),
                this.$.h1.setContent("-"))
    }
});
enyo.kind({
    name: "zaisan.pnlorder",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.wl.setSort(2);
        this.$.wl.setSorttype(0);
        this.$.wl.setMaster(this);
        bridge.addObj("orderlst", this)
    },
    showDetail: function () {
        var b = this.$.wl.getSelected();
        return b && this.linkTo && bridge.getObj(this.linkTo).updateMe(b[3]),
            !0
    },
    getComp: function (b) {
        return this.$[b]
    },
    doRefresh: function () {
        bridge.getObj("trd") ? bridge.getObj("clientengine").refreshORD() : bridge.getObj("clientengine").showTrdLogin()
    },
    searchInputChange: function (b) {
        enyo.job("pnlorder-job", enyo.bind(this, "filterList", b.getValue()), 200)
    },
    filterList: function (b) {
        this.$.wl.filterList(b)
    },
    onOK: function () {
        return this.$.confirm.hide(),
            this.$.confirm.action == "withdraw" ? Router.send("onWithdraw", this.$.confirm.order.param) : this.$.confirm.action == "delete" ? Router.send("onDeleteTemporary", this.$.confirm.order.param) : this.$.confirm.action == "send" && Router.send("onSendTemporary", this.$.confirm.order.param),
            !0
    },
    onCancel: function () {
        return this.$.confirm.hide(),
            !0
    },
    onDetail: function () {
        var b = this.$.wl.getSelected();
        b != null ? bridge.getObj("tradelst").show(b[2] + ", " + b[1] + " " + (b[4] == "1" ? "Buy" : "Sell") + " " + b[3] + " " + b[12], b[12]) : enyo.Signals.send("onError", "please select order first")
    },
    onAmend: function (b) {
        var d = this.$.wl.getSelected();
        d != null && (b = d[8],
            b == "0" || b == "1" ? Router.send("onShowAmend", d) : enyo.Signals.send("onError", "selected order cannot be amend"));
        return !0
    },
    onWithdraw: function (b, d) {
        var e = this.$.wl.getSelected();
        if (e != null)
            b = e[8],
                b == "0" || b == "1" ? (d.param = e,
                    d.cmd = "cancelorder",
                    this.$.info.setContent("are you sure want to withdraw this order?"),
                    this.$.confirm.order = d,
                    this.$.confirm.action = "withdraw",
                    this.$.confirm.show()) : enyo.Signals.send("onError", "selected order cannot be withdraw");
        return !0
    },
    onDelete: function (b, d) {
        var e = this.$.wl.getSelected();
        if (e != null)
            b = e[8],
                b == "T" || b == "8" ? (d.param = e,
                    d.cmd = "deleteorder",
                    this.$.info.setContent("are you sure want to delete this order?"),
                    this.$.confirm.order = d,
                    this.$.confirm.action = "delete",
                    this.$.confirm.show()) : enyo.Signals.send("onError", "please select Temporary Order");
        return !0
    },
    onSend: function (b, d) {
        var e = this.$.wl.getSelected();
        if (e != null)
            b = e[8],
                b == "T" ? (d.param = e,
                    d.cmd = "sendorder",
                    this.$.info.setContent("are you sure want to send this order?"),
                    this.$.confirm.order = d,
                    this.$.confirm.action = "send",
                    this.$.confirm.show()) : enyo.Signals.send("onError", "please select Temporary Order");
        return !0
    },
    generateFilteredData: function (b) {
        for (var b = RegExp("^" + b, "i"), d = [], e = 0, f; f = this.$.wl.getDb()[e]; e++)
            if (f[1].match(b) || f[3].match(b))
                f.dbIndex = e,
                    d.push(f);
        return d
    },
    onRefresh: function () {
        bridge.getObj("clientengine").refreshORD()
    },
    components: [{
        kind: "FittableColumns",
        classes: "pnl bg-bar",
        components: [{
            kind: "onyx.InputDecorator",
            alwaysLooksFocused: !1,
            components: [{
                kind: "onyx.Input",
                placeholder: "Search...",
                selectOnFocus: !0,
                oninput: "searchInputChange",
                classes: "enyo-selectable"
            }, {
                kind: "Image",
                src: "assets/search-input-search.png",
                style: "width: 20px;"
            }]
        }, {
            fit: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Amend",
            classes: "",
            ontap: "onAmend"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Withdraw",
            classes: "",
            ontap: "onWithdraw"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Delete",
            ontap: "onDelete"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Send",
            ontap: "onSend"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Detail",
            ontap: "onDetail"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Refresh",
            ontap: "onRefresh"
        }]
    }, {
        name: "wl",
        kind: "xtable2",
        fit: !0,
        classes: "small",
        header: [{
            content: "OrderTime",
            classes: "grid10"
        }, {
            content: "Code",
            classes: "grid10"
        }, {
            content: "Type",
            classes: "grid5"
        }, {
            content: "Price/Lot",
            classes: "grid15 right"
        }, {
            content: "Value",
            classes: "grid20 right"
        }, {
            content: "Status",
            classes: "grid15 right"
        }, {
            content: "Done/Remain",
            classes: "grid10 right"
        }, {
            content: "OrdID/ExchID/Auto",
            classes: "grid15 right"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowOLR"
        }
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        style: "position:fixed;  padding: 2em;",
        floating: !0,
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:20em;",
            components: [{
                name: "info",
                allowHtml: !0,
                content: ""
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }, {
        kind: "zaisan.pnltrade"
    }]
});
enyo.kind({
    name: "zaisan.rowOLR",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        name: "field1",
        components: [{
            name: "a1",
            allowHtml: !0,
            classes: "grid10"
        }, {
            name: "b1",
            allowHtml: !0,
            classes: "grid10"
        }, {
            name: "c1",
            allowHtml: !0,
            classes: "grid5"
        }, {
            name: "d1",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "e1",
            allowHtml: !0,
            classes: "grid20 right"
        }, {
            name: "f1",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "g1",
            allowHtml: !0,
            classes: "grid10 right"
        }, {
            name: "h1",
            allowHtml: !0,
            classes: "grid15 right"
        }]
    }, {
        kind: "FittableColumns",
        name: "field2",
        components: [{
            name: "a2",
            allowHtml: !0,
            classes: "grid10"
        }, {
            name: "b2",
            allowHtml: !0,
            classes: "grid15 texts"
        }, {
            name: "c2",
            allowHtml: !0,
            classes: "grid15 right"
        }, {
            name: "d2",
            allowHtml: !0,
            classes: "grid35 texts defaultcolor"
        }, {
            name: "e2",
            allowHtml: !0,
            classes: "grid10 right"
        }, {
            name: "f2",
            allowHtml: !0,
            classes: "grid15 right"
        }]
    }],
    update: function (b, d, e) {
        this.$.field1.removeClass("green");
        this.$.field1.removeClass("red");
        this.$.field2.removeClass("green");
        this.$.field2.removeClass("red");
        this.$.field1.addClass(b[4] == "1" ? "red" : "green");
        this.$.field2.addClass(b[4] == "1" ? "red" : "green");
        this.$.a1.setContent(b[2]);
        this.$.b1.setContent(b[3]);
        this.$.c1.setContent(b[4] == "1" ? "Buy" : "Sell");
        this.$.d1.setContent(numformat(b[5]));
        this.$.e1.setContent(numformat(b[7]));
        this.$.f1.setContent(Store.status[b[8]]);
        this.$.g1.setContent(numformat(b[10]));
        this.$.h1.setContent(b[12]);
        this.$.a2.setContent(b[1]);
        e = Store.stock[b[3]];
        this.$.b2.setContent(e ? e[3] : "-");
        this.$.c2.setContent(numformat(b[6]));
        this.$.d2.setContent("&nbsp;&nbsp;" + b[13]);
        this.$.e2.setContent(numformat(b[6] - b[10]));
        this.$.f2.setContent(b[11] + "(" + (b[26] == "JSX" ? "No" : "Yes") + ")")
    }
});
enyo.kind({
    name: "zaisan.pnlauto",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.wl.setSort(26);
        this.$.wl.setSorttype(0);
        this.$.wl.setKeys(17);
        this.$.wl.setMaster(this);
        bridge.addObj("autolst", this)
    },
    showDetail: function () {
        var b = this.$.wl.getSelected();
        return b && this.linkTo && bridge.getObj(this.linkTo).updateMe(b[0]),
            !0
    },
    getComp: function (b) {
        return this.$[b]
    },
    doRefresh: function () {
        bridge.getObj("trd") ? bridge.getObj("clientengine").refreshAUTO() : bridge.getObj("clientengine").showTrdLogin()
    },
    searchInputChange: function (b) {
        enyo.job("pnlauto-job", enyo.bind(this, "filterList", b.getValue()), 200)
    },
    filterList: function (b) {
        this.$.wl.filterList(b)
    },
    onOK: function () {
        return this.$.confirm.hide(),
            this.$.confirm.action == "cancel" && Router.send("onAlgoWithdraw", this.$.confirm.order.param),
            !0
    },
    onCancel: function () {
        return this.$.confirm.hide(),
            !0
    },
    onWithdraw: function (b, d) {
        var e = this.$.wl.getSelected();
        if (e != null)
            b = e[6],
                b == "0" ? (d.param = e,
                    d.cmd = "onAlgoWithdraw",
                    this.$.info.setContent("are you sure want to cancel this auto order?"),
                    this.$.confirm.order = d,
                    this.$.confirm.action = "cancel",
                    this.$.confirm.show()) : enyo.Signals.send("onError", "selected auto order cannot be cancel");
        return !0
    },
    generateFilteredData: function (b) {
        for (var b = RegExp("^" + b, "i"), d = [], e = 0, f; f = this.$.wl.getDb()[e]; e++)
            if (f[17].match(b) || f[34].match(b) || f[25].match(b) || f[0].match(b))
                f.dbIndex = e,
                    d.push(f);
        return d
    },
    onRefresh: function () {
        bridge.getObj("clientengine").refreshAUTO()
    },
    components: [{
        kind: "FittableColumns",
        classes: "pnl bg-bar",
        components: [{
            kind: "onyx.InputDecorator",
            alwaysLooksFocused: !1,
            components: [{
                kind: "onyx.Input",
                placeholder: "Search...",
                selectOnFocus: !0,
                oninput: "searchInputChange",
                classes: "enyo-selectable"
            }, {
                kind: "Image",
                src: "assets/search-input-search.png",
                style: "width: 20px;"
            }]
        }, {
            fit: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Cancel",
            classes: "",
            ontap: "onWithdraw"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            style: "height:2.5em;",
            content: "Refresh",
            ontap: "onRefresh"
        }]
    }, {
        name: "wl",
        kind: "xtable2",
        fit: !0,
        classes: "small",
        header: [{
            content: "ID/Time",
            classes: "grid15"
        }, {
            content: "Order",
            classes: "grid70"
        }, {
            content: "Status/OrdID",
            classes: "grid15"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowAUTO"
        }
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        style: "position:fixed;  padding: 2em;",
        floating: !0,
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:20em;",
            components: [{
                name: "info",
                allowHtml: !0,
                content: ""
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }]
});
enyo.kind({
    name: "zaisan.rowAUTO",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        name: "field1",
        components: [{
            name: "a1",
            allowHtml: !0,
            classes: "grid15"
        }, {
            name: "b1",
            allowHtml: !0,
            classes: "grid70"
        }, {
            name: "c1",
            allowHtml: !0,
            classes: "grid15"
        }]
    }, {
        kind: "FittableColumns",
        name: "field2",
        components: [{
            name: "a2",
            allowHtml: !0,
            classes: "grid15"
        }, {
            name: "b2",
            allowHtml: !0,
            classes: "grid70"
        }, {
            name: "c2",
            allowHtml: !0,
            classes: "grid15"
        }]
    }],
    update: function (b) {
        try {
            this.$.field1.removeClass("green"),
                this.$.field1.removeClass("red"),
                this.$.field1.addClass(b[7] == "1" ? "red" : "green"),
                this.$.field2.removeClass("green"),
                this.$.field2.removeClass("red"),
                this.$.field2.addClass(b[7] == "1" ? "red" : "green"),
                this.$.a1.setContent(b[17]),
                this.$.b1.setContent("&nbsp;" + b[34]),
                this.$.c1.setContent(Store.algoStatus[b[6]]),
                this.$.a2.setContent(b[26]),
                this.$.b2.setContent("&nbsp;" + b[33]),
                this.$.c2.setContent(b[25])
        } catch (d) { }
    }
});
enyo.kind({
    name: "zaisan.pnltrade",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:40%; width:50%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal",
    scrim: !1,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        this.$.wl.setSort(24);
        this.$.wl.setSorttype(0);
        this.$.wl.setMaster(this);
        bridge.addObj("tradelst", this)
    },
    getComp: function (b) {
        return this.$[b]
    },
    doRefresh: function () {
        bridge.getObj("clientengine").refreshTRD()
    },
    onTrdLoginOK: function () { },
    onTrdLogoutOK: function () {
        this.close()
    },
    show: function (b, d) {
        this.inherited(arguments);
        this.$.tit2.setContent(b);
        this.$.t.reflow();
        this.filterList(d)
    },
    filterList: function (b) {
        this.$.wl.filterList(b)
    },
    close: function () {
        this.hide()
    },
    generateFilteredData: function (b) {
        for (var b = RegExp("^" + b, "i"), d = [], e = 0, f; f = this.$.wl.getDb()[e]; e++)
            f[12].match(b) && (f.dbIndex = e,
                d.push(f));
        return d
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tit",
                content: "Trade List"
            }, {
                fit: !0
            }, {
                kind: "onyx.Button",
                content: "Refresh",
                ontap: "doRefresh"
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "Close",
                ontap: "close"
            }]
        }, {
            name: "tit2",
            content: "",
            classes: "pnl bold bg-param medium2"
        }, {
            name: "wl",
            kind: "xtable2",
            fit: !0,
            classes: "medium2",
            header: [{
                content: "MatchTime",
                classes: "grid20"
            }, {
                content: "MatchPrice",
                classes: "grid25 right"
            }, {
                content: "MatchLot",
                classes: "grid30 right"
            }, {
                content: "Trd#",
                classes: "grid25 right"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowBSR"
            }
        }, {
            kind: "Broadcast",
            onLogoutOK: "onTrdLogoutOK",
            onTrdLoginOK: "onTrdLoginOK",
            onTrdLogoutOK: "onTrdLogoutOK"
        }]
    }]
});
enyo.kind({
    name: "zaisan.rowBSR",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid20 left"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid25 right"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid30 right"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid25 right"
        }]
    }],
    update: function (b) {
        this.$.a.removeClass("red");
        this.$.a.removeClass("green");
        this.$.b.removeClass("red");
        this.$.b.removeClass("green");
        this.$.c.removeClass("red");
        this.$.c.removeClass("green");
        this.$.d.removeClass("red");
        this.$.d.removeClass("green");
        this.$.a.setContent(b[24]);
        this.$.b.setContent(money(b[5]));
        this.$.c.setContent(money(b[10]));
        this.$.d.setContent(b[46]);
        this.$.a.addClass(b[4] == "1" ? "red" : "green");
        this.$.b.addClass(b[4] == "1" ? "red" : "green");
        this.$.c.addClass(b[4] == "1" ? "red" : "green");
        this.$.d.addClass(b[4] == "1" ? "red" : "green")
    }
});
enyo.kind({
    name: "zaisan.pnlcash",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    ptype: "inhouse",
    bankid: "-",
    bankacc: "-",
    bankname: "-",
    handlers: {
        onChgid: "idChangedEvent"
    },
    create: function () {
        this.inherited(arguments);
        this.$.ls.setSort(0);
        this.$.ls.setSorttype(2);
        bridge.addObj("cashlist", this)
    },
    validateAmount: function () {
        /\D/g.test(this.$.amount.getValue()) && this.$.amount.setValue(this.$.amount.getValue().replace(/\D/g, ""))
    },
    onPrior: function () {
        return this.$.ls.onPrior(),
            !0
    },
    onNext: function () {
        return this.$.ls.onNext(),
            !0
    },
    onTrdLoginOK: function () {
        this.refreshMe()
    },
    onTrdLogoutOK: function () {
        this.module && this.module.doStop();
        this.moduleb && this.moduleb.exit();
        this.module2 && this.module2.exit()
    },
    refreshMe: function () {
        this.module || (this.module = new mod.cashlist(this.$.ls));
        this.module.filter = "DWLIST#" + bridge.getObj("userid");
        this.module.doRestart()
    },
    cancel: function () {
        var b = this.$.ls.getSelected();
        if (b)
            if (b[9] == "RQ") {
                this.moduleb || (this.moduleb = new mod.cashcancel(this),
                    this.moduleb.doStart());
                var d = "DWCANCEL#";
                d = d + b[0] + "#";
                d += bridge.getObj("userid");
                this.moduleb.doQuery(d)
            } else
                enyo.Signals.send("onError", "cannot cancel this transaction");
        else
            enyo.Signals.send("onError", "Please select transaction first")
    },
    typeChanged: function (b, d) {
        d.originator.getActive() && (this.ptype = d.originator.kode)
    },
    onNo: function () {
        this.clearInput()
    },
    onYes: function () {
        var b = [];
        b.push(this.$.id.$.field.getValue().toUpperCase());
        b.push(this.ptype);
        b.push(this.$.amount.getValue());
        b.push(this.$.agree.getValue());
        b.push(this.bankid);
        b.push(this.bankacc);
        b.push(this.bankname);
        this.onValidate(b) && (cryptoMD5.en(this.$.pin.getValue()) == bridge.getObj("pin") ? (this.$.confirm.param = b,
            this.$.confirm.show()) : enyo.Signals.send("onError", "invalid PIN"))
    },
    idChangedEvent: function (b, d) {
        if (d) {
            var e = Store.ACC[d.datas];
            if (e != null)
                try {
                    this.$.cash.setContent(numformat(e[32]))
                } catch (f) {
                    this.$.cash.setContent(numformat(0))
                }
            else
                this.$.cash.setContent(0);
            e = e != null ? Store.CUS[e[2]] : null;
            e != null ? (this.$.to.setContent(e[15] + "-" + e[16] + "-" + e[14]),
                this.bankid = e[14],
                this.bankacc = e[15],
                this.bankname = e[16]) : (this.$.to.setContent("-"),
                    this.bankid = "-",
                    this.bankacc = "-",
                    this.bankname = "-")
        }
        return !0
    },
    clearInput: function () {
        this.$.id.$.field.setValue("");
        this.$.cash.setContent("");
        this.$.to.setContent("");
        this.$.amount.setValue("");
        this.$.t1.setActive(!0);
        this.$.agree.setValue(!1);
        this.$.pin.setValue("");
        this.ptype = "inhouse"
    },
    onOK: function () {
        this.$.confirm.hide();
        this.module2 || (this.module2 = new mod.cashentry(this),
            this.module2.doStart());
        var b = "DWWITHDRAW#"
            , d = this.$.confirm.param;
        b = b + d[0] + "|" + d[1] + "#";
        b = b + this.bankid + "#";
        b = b + this.bankacc + "#";
        b = b + this.bankname + "#";
        b = b + d[2] + "#";
        b += bridge.getObj("userid");
        this.module2.doQuery(b);
        this.clearInput()
    },
    onCancel: function () {
        this.$.confirm.hide()
    },
    onValidate: function (b) {
        return Store.ACC[b[0]] && b[2] > 0 ? b[3] ? !0 : (enyo.Signals.send("onError", "please select the check box"),
            !1) : (enyo.Signals.send("onError", "please enter valid request"),
                !1)
    },
    components: [{
        kind: "FittableColumns",
        classes: "rows2 f16 bold bg-bar white",
        style: "height:11.5em;",
        components: [{
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Trading ID",
                    style: "width:40%"
                }, {
                    name: "id",
                    kind: "onyx.ddID",
                    classes: "enyo-selectable",
                    style: "width:60%;height:2.25em;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Available Cash",
                    style: "width:40%"
                }, {
                    name: "cash",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:60%;"
                }]
            }, {
                kind: "FittableColumns",
                style: "height:4.5em;",
                classes: "btm-spacer",
                components: [{
                    content: "Transfer To",
                    style: "width:40%"
                }, {
                    name: "to",
                    content: "",
                    style: "width:60%;",
                    classes: "staticbox"
                }]
            }]
        }, {
            classes: "grid-5 mobile-grid-5"
        }, {
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Amount",
                    style: "width:30%"
                }, {
                    name: "entry1",
                    kind: "onyx.InputDecorator",
                    style: "width:70%",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "amount",
                        kind: "onyx.Input",
                        placeholder: "",
                        classes: "enyo-selectable right grid-100",
                        onkeyup: "validateAmount"
                    }]
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "PIN",
                    style: "width:30%"
                }, {
                    name: "entry2",
                    kind: "onyx.InputDecorator",
                    style: "width:70%",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "pin",
                        kind: "onyx.Input",
                        type: "password",
                        placeholder: "",
                        classes: "enyo-selectable grid-100"
                    }]
                }]
            }, {
                name: "type",
                kind: "onyx.RadioGroup",
                onActivate: "typeChanged",
                classes: "right",
                components: [{
                    name: "t1",
                    content: "Inhouse",
                    active: !0,
                    kode: "inhouse"
                }, {
                    name: "t2",
                    content: "Kliring",
                    kode: "kliring"
                }, {
                    name: "t3",
                    content: "RTGS",
                    kode: "rtgs"
                }]
            }]
        }, {
            classes: "grid-5 mobile-grid-5"
        }, {
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    name: "agree",
                    kind: "onyx.Checkbox",
                    style: "width:20%;height:2.5em;"
                }, {
                    allowHtml: !0,
                    fit: !0,
                    content: "<span class='tiny'>Saya menyetujui prosedur penarikan dana dari BNIS<br/><i>i agree with terms and conditional of cash withdraw BNIS</i></span>"
                }]
            }, {
                kind: "FittableColumns",
                components: [{
                    fit: !0
                }, {
                    kind: "onyx.Button",
                    content: "Send",
                    ontap: "onYes"
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    kind: "onyx.Button",
                    content: "Clear",
                    ontap: "onNo"
                }]
            }]
        }]
    }, {
        kind: "FittableColumns",
        classes: "pnl bg-param",
        components: [{
            fit: !0
        }, {
            kind: "onyx.Button",
            content: "Cancel Request",
            ontap: "cancel"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: "<",
            ontap: "onPrior"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: ">",
            ontap: "onNext"
        }]
    }, {
        name: "ls",
        kind: "xtable2",
        fit: !0,
        classes: "small bold",
        horz: "scroll",
        header: [{
            content: "Id",
            style: "width:8rem;text-align: left;"
        }, {
            content: "Type",
            style: "width:4rem;text-align: left;"
        }, {
            content: "CustId",
            style: "width:6rem;text-align:left;"
        }, {
            content: "Name",
            style: "width: 8rem;text-align:left;"
        }, {
            content: "Req.Date",
            style: "width: 10rem;text-align:left;"
        }, {
            content: "Transf.Date",
            style: "width: 6rem;text-align:left;"
        }, {
            content: "Amount",
            style: "width: 8rem;text-align:right;"
        }, {
            allowHtml: !0,
            content: "&nbsp;Cust.Bank",
            style: "width: 16rem;text-align:left;"
        }, {
            content: "status",
            style: "width: 6rem;text-align:left;"
        }, {
            content: "Info",
            style: "width: 8rem;text-align:left;"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowCWL"
        }
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed;  padding: 1em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:20em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to send this request?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowCWL",
    layoutKind: "FittableRowsLayout",
    classes: "rows small f14 bold",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }, {
            name: "b",
            allowHtml: !0,
            style: "width: 4rem;text-align: left;"
        }, {
            name: "c",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "d",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;",
            classes: "texts"
        }, {
            name: "e",
            allowHtml: !0,
            style: "width: 10rem;text-align: left;"
        }, {
            name: "e1",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "f",
            allowHtml: !0,
            style: "width: 8rem;text-align: right;"
        }, {
            name: "g",
            allowHtml: !0,
            style: "width: 16rem;text-align: left;",
            classes: "texts"
        }, {
            name: "i",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "j",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(b[0]);
        this.$.b.setContent(b[1]);
        this.$.c.setContent(b[2]);
        this.$.d.setContent(b[3]);
        this.$.e.setContent(b[11]);
        this.$.e1.setContent(b[4]);
        this.$.f.setContent(numformat(b[5]));
        this.$.g.setContent("&nbsp;&nbsp;&nbsp;&nbsp;" + b[6]);
        this.$.i.setContent(b[10]);
        this.$.j.setContent(b[17])
    }
});
enyo.kind({
    name: "zaisan.pnlhmetd",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    handlers: {
        onChgid: "idChangedEvent",
        onChgstock: "stockChanged"
    },
    create: function () {
        this.inherited(arguments);
        this.$.ls.setSort(0);
        this.$.ls.setSorttype(2);
        bridge.addObj("hmetdlist", this)
    },
    validateAmount: function () {
        /\D/g.test(this.$.fexercisevol.getValue()) && this.$.fexercisevol.setValue(this.$.fexercisevol.getValue().replace(/\D/g, ""));
        this.$.fexercisevalue.setContent(this.$.fexercisevol.getValue() * this.$.fexerciseprice.getContent())
    },
    onPrior: function () {
        return this.$.ls.onPrior(),
            !0
    },
    onNext: function () {
        return this.$.ls.onNext(),
            !0
    },
    onTrdLoginOK: function () {
        this.refreshMe()
    },
    onTrdLogoutOK: function () {
        this.module && this.module.doStop();
        this.moduleb && this.moduleb.exit();
        this.module2 && this.module2.exit();
        this.module3 && this.module3.exit()
    },
    refreshMe: function () {
        this.module || (this.module = new mod.hmetdlist(this.$.ls));
        this.module.filter = "HMETDLIST#" + bridge.getObj("userid");
        this.module.doRestart()
    },
    cancel: function () {
        var b = this.$.ls.getSelected();
        if (b)
            if (b[8] == "0") {
                this.moduleb || (this.moduleb = new mod.hmetdcancel(this),
                    this.moduleb.doStart());
                var d = "HMETDCANCEL#";
                d = d + b[0] + "#";
                d += bridge.getObj("userid");
                this.moduleb.doQuery(d)
            } else
                enyo.Signals.send("onError", "cannot cancel this transaction");
        else
            enyo.Signals.send("onError", "Please select transaction first")
    },
    typeChanged: function (b, d) {
        d.originator.getActive() && (this.ptype = d.originator.kode)
    },
    onNo: function () {
        this.clearInput()
    },
    getInfo: function () {
        var b = this.$.fid.$.field.getValue().toUpperCase()
            , d = this.$.fstock.$.field.getValue().toUpperCase();
        if (b != "" && d != "") {
            this.module3 || (this.module3 = new mod.hmetdinfo(this),
                this.module3.doStart());
            var e = "HMETDINFO#";
            e = e + b + "#" + d + "#";
            e += bridge.getObj("userid");
            this.module3.doQuery(e)
        } else
            this.clearInfo()
    },
    updateInfo: function (b) {
        this.$.fcash.setContent(b[2]);
        this.$.fcasht3.setContent(b[3]);
        this.$.fcurrentvol.setContent(b[5]);
        this.$.fremainvol.setContent(b[6]);
        this.$.fexerciseprice.setContent(b[7])
    },
    onYes: function () {
        var b = [];
        b.push(this.$.fid.$.field.getValue().toUpperCase());
        b.push(this.$.fstock.$.field.getValue().toUpperCase());
        b.push(this.$.fexercisevol.getValue());
        b.push(this.$.fagree.getValue());
        this.onValidate(b) && (cryptoMD5.en(this.$.fpin.getValue()) == bridge.getObj("pin") ? (this.$.confirm.param = b,
            this.$.confirm.show()) : enyo.Signals.send("onError", "invalid PIN"))
    },
    idChangedEvent: function (b, d) {
        d && (Store.ACC[d.datas] != null ? this.getInfo() : this.clearInfo());
        return !0
    },
    stockChanged: function (b, d) {
        d && (Store.SEC[d.datas] != null ? this.getInfo() : this.clearInfo());
        return !0
    },
    clearInfo: function () {
        this.$.fcash.setContent("");
        this.$.fcasht3.setContent("");
        this.$.fcurrentvol.setContent("");
        this.$.fremainvol.setContent("");
        this.$.fexerciseprice.setContent("");
        this.$.fexercisevol.setValue("");
        this.$.fexercisevalue.setContent("")
    },
    clearInput: function () {
        this.$.fid.$.field.setValue("");
        this.$.fstock.$.field.setValue("");
        this.$.fagree.setActive(!0);
        this.$.fagree.setValue(!1);
        this.$.fpin.setValue("");
        this.clearInfo()
    },
    onOK: function () {
        this.$.confirm.hide();
        this.module2 || (this.module2 = new mod.hmetdentry(this),
            this.module2.doStart());
        var b = "HMETDENTRY#"
            , d = this.$.confirm.param;
        b = b + d[0] + "#" + d[1] + "#";
        b = b + d[2] + "#";
        b += bridge.getObj("userid");
        this.module2.doQuery(b);
        this.clearInput()
    },
    onCancel: function () {
        this.$.confirm.hide()
    },
    onValidate: function (b) {
        return Store.ACC[b[0]] && Store.SEC[b[1]] && b[2] > 0 ? b[3] ? !0 : (enyo.Signals.send("onError", "please select the check box"),
            !1) : (enyo.Signals.send("onError", "please enter valid request"),
                !1)
    },
    components: [{
        kind: "FittableColumns",
        classes: "rows2 f16 bold bg-bar white",
        style: "height:12em;",
        components: [{
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Trading ID",
                    style: "width:40%"
                }, {
                    name: "fid",
                    kind: "onyx.ddID",
                    classes: "enyo-selectable",
                    style: "width:60%;height:2.25em;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Cash",
                    style: "width:40%"
                }, {
                    name: "fcash",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:60%;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Cash T+2",
                    style: "width:40%"
                }, {
                    name: "fcasht3",
                    content: "",
                    style: "width:60%;",
                    classes: "right staticbox"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Stock",
                    style: "width:40%"
                }, {
                    name: "fstock",
                    kind: "onyx.ddStock",
                    classes: "enyo-selectable",
                    style: "width:60%;height:2.25em;"
                }]
            }]
        }, {
            classes: "grid-5 mobile-grid-5"
        }, {
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Current Vol",
                    style: "width:30%"
                }, {
                    name: "fcurrentvol",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:70%;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Remain Vol",
                    style: "width:30%"
                }, {
                    name: "fremainvol",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:70%;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Exercise Price",
                    style: "width:30%"
                }, {
                    name: "fexerciseprice",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:70%;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Exercise Vol",
                    style: "width:30%"
                }, {
                    name: "entry1",
                    kind: "onyx.InputDecorator",
                    style: "width:70%",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "fexercisevol",
                        kind: "onyx.Input",
                        placeholder: "",
                        classes: "enyo-selectable right grid-100",
                        onkeyup: "validateAmount"
                    }]
                }]
            }]
        }, {
            classes: "grid-5 mobile-grid-5"
        }, {
            kind: "FittableRows",
            classes: "grid-30 mobile-grid-30",
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "Exercise Value",
                    style: "width:30%"
                }, {
                    name: "fexercisevalue",
                    content: "0",
                    classes: "right staticbox",
                    style: "width:70%;"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "PIN",
                    style: "width:30%"
                }, {
                    name: "entry2",
                    kind: "onyx.InputDecorator",
                    style: "width:70%",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "fpin",
                        kind: "onyx.Input",
                        type: "password",
                        placeholder: "",
                        classes: "enyo-selectable grid-100"
                    }]
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    name: "fagree",
                    kind: "onyx.Checkbox",
                    style: "width:20%;height:2.5em;"
                }, {
                    allowHtml: !0,
                    fit: !0,
                    content: "<span class='tiny'>Saya menyetujui prosedur pelaksanaan HMETD pada PT BNI Sekuritas</span>"
                }]
            }, {
                kind: "FittableColumns",
                components: [{
                    fit: !0
                }, {
                    kind: "onyx.Button",
                    content: "Send",
                    ontap: "onYes"
                }, {
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    kind: "onyx.Button",
                    content: "Clear",
                    ontap: "onNo"
                }]
            }]
        }]
    }, {
        kind: "FittableColumns",
        classes: "pnl bg-param",
        components: [{
            fit: !0
        }, {
            kind: "onyx.Button",
            content: "Cancel Request",
            ontap: "cancel"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: "Refresh",
            ontap: "refreshMe"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: "<",
            ontap: "onPrior"
        }, {
            content: "&nbsp;",
            allowHtml: !0
        }, {
            kind: "onyx.Button",
            content: ">",
            ontap: "onNext"
        }]
    }, {
        name: "ls",
        kind: "xtable2",
        fit: !0,
        classes: "small bold",
        horz: "scroll",
        header: [{
            content: "Id",
            style: "width:8rem;text-align: left;"
        }, {
            content: "Stock",
            style: "width:6rem;text-align: left;"
        }, {
            content: "Stock.Name",
            style: "width:10rem;text-align:left;"
        }, {
            content: "TradingId",
            style: "width: 6rem;text-align:left;"
        }, {
            content: "Trans.Date",
            style: "width: 6rem;text-align:left;"
        }, {
            content: "Volume",
            style: "width: 6rem;text-align:right;"
        }, {
            content: "Lot",
            style: "width: 6rem;text-align:right;"
        }, {
            content: "Value",
            style: "width: 8rem;text-align:right;"
        }, {
            allowHtml: !0,
            content: "&nbsp;&nbsp;&nbsp;&nbsp;Status",
            style: "width: 8rem;text-align:left;"
        }, {
            content: "Entry.By",
            style: "width: 8rem;text-align:left;"
        }, {
            content: "Entry.Date",
            style: "width: 8rem;text-align:left;"
        }],
        rows: {
            name: "item",
            kind: "zaisan.rowHL"
        }
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed;  padding: 1em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:20em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to send this request?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowHL",
    layoutKind: "FittableRowsLayout",
    classes: "rows small f14 bold",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }, {
            name: "b",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "c",
            allowHtml: !0,
            style: "width: 10rem;text-align: left;"
        }, {
            name: "d",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "e",
            allowHtml: !0,
            style: "width: 6rem;text-align: left;"
        }, {
            name: "e1",
            allowHtml: !0,
            style: "width: 6rem;text-align: right;"
        }, {
            name: "f",
            allowHtml: !0,
            style: "width: 6rem;text-align: right;"
        }, {
            name: "g",
            allowHtml: !0,
            style: "width: 8rem;text-align: right;"
        }, {
            name: "i",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }, {
            name: "j",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }, {
            name: "k",
            allowHtml: !0,
            style: "width: 8rem;text-align: left;"
        }]
    }],
    update: function (b) {
        try {
            this.$.a.setContent(b[0]),
                this.$.b.setContent(b[1]),
                this.$.c.setContent(b[2]),
                this.$.d.setContent(b[3]),
                this.$.e.setContent(b[4]),
                this.$.e1.setContent(numformat(b[5])),
                this.$.f.setContent(numformat(b[6])),
                this.$.g.setContent(numformat(b[7])),
                this.$.i.setContent("&nbsp;&nbsp;&nbsp;&nbsp;" + Store.hmetdStatus[b[8]]),
                this.$.j.setContent(b[9]),
                this.$.k.setContent(b[10])
        } catch (d) { }
    }
});
enyo.kind({
    name: "zaisan.pnlpfallocation",
    classes: "enyo-unselectable onyx rw",
    kind: "FittableRows",
    realtime: !1,
    siap: !1,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlpfalloc", this)
    },
    doUpdate: function () {
        this.siap = !0;
        this.$.st.removeAll();
        this.$.st.refreshList();
        if (bridge.getObj("pf")) {
            for (var b = bridge.getObj("pf").getComp("wl").getFiltered(), d = 0, e = "", f = "10", g = {}, i, j = 0, k = 0, l; l = b[d]; d++)
                j += l[15],
                    k += l[16];
            for (d = 0; l = b[d]; d++)
                e = Store.stock[l[7]],
                    f = e ? e[14] : "10",
                    i = g[f],
                    i ? (i[1] += l[15],
                        i[2] = +money2(i[1] / j * 100),
                        i[4] += l[13],
                        i[3] = +money2(i[4] / k * 100)) : g[f] = [f, l[15], +money2(l[15] / j * 100), +money2(l[13] / k * 100), l[13]];
            g.TOTAL = ["TOTAL", 100, 100, +money2((j - k) / k * 100), 0];
            for (key in g)
                this.$.st.onlyAdd(g[key]);
            this.$.st.refreshList();
            setTimeout(enyo.bind(this, this.createChart, !1), 500)
        }
    },
    createChart: function () {
        if (this.siap) {
            for (var b = [], d = this.$.st.getDb(), e = 0; e < d.length; e++)
                d[e][0] != "TOTAL" && b.push([Store.stock.getSecDesc(d[e][0]), d[e][2]]);
            b.length > 0 ? (b = JSON.stringify(b),
                this.$.iframe.setSrc(Const._urlpiechart + "?v=1.0&width=" + (this.$.iframe.getBounds().width - 30) + "&height=" + (this.$.iframe.getBounds().height - 30) + "&data=" + b)) : this.$.iframe.setSrc("")
        }
    },
    onLogoutOK: function () {
        this.siap = !1
    },
    components: [{
        kind: "FittableColumns",
        fit: !0,
        components: [{
            kind: "FittableRows",
            classes: "grid-60 mobile-grid-60 bg-normal",
            components: [{
                name: "iframe",
                tag: "iframe",
                fit: !0,
                classes: "pnl bg-normal2 enyo-fill",
                style: "border: none;"
            }]
        }, {
            name: "st",
            kind: "xtable",
            fit: !0,
            classes: "small bold",
            datas: [],
            header: [{
                content: "Sector",
                style: "width: 45%;"
            }, {
                content: "Value%",
                fit: !0,
                style: "width:25%;text-align: right;"
            }, {
                content: "Gain/loss%",
                style: "width:30%;text-align:right;"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowPFSt"
            }
        }]
    }, {
        kind: "Broadcast",
        onLogoutOK: "onLogoutOK",
        onTrdLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowPFSt",
    layoutKind: "FittableRowsLayout",
    classes: "f16 bold rows",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            style: "width: 45%;text-align: left;"
        }, {
            name: "b",
            allowHtml: !0,
            style: "width: 25%;text-align: right;"
        }, {
            name: "c",
            allowHtml: !0,
            style: "width: 30%;text-align: right;"
        }]
    }],
    update: function (b) {
        b[0] == "TOTAL" ? this.$.a.setContent(b[0]) : this.$.a.setContent(Store.stock.getSecDesc(b[0]));
        this.$.b.setContent(money2(b[2]));
        this.$.c.setContent(money2(b[3]));
        this.$.a.setAttribute("class", "small");
        this.$.a.addClass(Store.stock.getSecColorCode(b[0]));
        this.$.c.setAttribute("class", "");
        this.$.c.addClass(b[3] > 0 ? "green" : b[3] < 0 ? "red" : "orange")
    }
});
enyo.kind({
    name: "zaisan.pnlpfcomparison",
    classes: "enyo-unselectable onyx rw bg-normal",
    kind: "FittableRows",
    realtime: !1,
    acc: "",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlcompare", this)
    },
    resizeHandler: function () {
        setTimeout(enyo.bind(this, this.urlChanged, !1), 100)
    },
    doUpdate: function (b) {
        b == "REFRESH" || (this.acc = b);
        setTimeout(enyo.bind(this, this.urlChanged, !1), 100)
    },
    genDateFormatted: function (b) {
        var d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , b = b.getDate() + "";
        return d + "/" + (e.length == 1 ? "0" + e : e) + "/" + (b.length == 1 ? "0" + b : b)
    },
    urlChanged: function () {
        if (this.acc != "") {
            var b = new Date;
            b.setYear(b.getFullYear() - 1);
            var b = this.genDateFormatted(b)
                , d = this.genDateFormatted(new Date)
                , b = Const._urlchartcompare + "?v=1.0&width=" + (this.getBounds().width - 20) + "&height=" + (this.getBounds().height - 20) + "&cc=" + this.acc + "&pf=" + b + "&pt=" + d;
            console.log(b);
            this.$.iframe.setSrc("");
            this.$.iframe.setSrc(b)
        } else
            this.$.iframe.setSrc("")
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "iframe",
            tag: "iframe",
            classes: "enyo-fill",
            style: "border: none;"
        }]
    }]
});
enyo.kind({
    name: "zaisan.pnlannouncement",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    onLoginOK: function () {
        this.refreshMe()
    },
    refreshMe: function () {
        this.$.news.removeAll();
        this.$.news.refreshList();
        var b = new enyo.JsonpRequest({
            url: Const._url + Const._urldata + "?q=feed|CNS|%",
            callbackName: "c"
        });
        b.response(this, "processResponse");
        b.error(this, "processError");
        b.go()
    },
    processResponse: function (b, d) {
        try {
            if (d.status == "1") {
                for (var e = [], f = 0; f < d.data.length; f++) {
                    var g = d.data[f];
                    e.push([g[1] + " - " + g[2], g[5]])
                }
                this.$.news.addAll(e)
            } else
                enyo.Signals.send("onError", "cannot load news from server<br/>please relogin")
        } catch (i) { }
    },
    processError: function () {
        enyo.Signals.send("onError", "cannot load news from server")
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Announcement",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        kind: "FittableRows",
        classes: "bg-normal",
        fit: !0,
        components: [{
            kind: "FittableColumns",
            classes: "pnl bg-bar",
            components: [{
                fit: !0
            }, {
                kind: "onyx.Button",
                content: "Refresh",
                ontap: "refreshMe"
            }]
        }, {
            name: "news",
            kind: "xtable",
            fit: !0,
            classes: "grid-100 mobile-grid-100",
            rows: {
                name: "item",
                kind: "zaisan.rowANO"
            }
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK"
    }]
});
enyo.kind({
    name: "zaisan.rowANO",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold",
    components: [{
        name: "title",
        allowHtml: !0
    }],
    update: function (b) {
        this.getCol1().setContent("<a class='defaultcolor' href='" + b[1] + "' target='_blank'>" + b[0] + "</a>")
    },
    getCol1: function () {
        return this.$.title
    },
    applyColor: function () { }
});
enyo.kind({
    name: "zaisan.pnlnotes",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    ptype: "w",
    seq: 1,
    form: "a",
    handlers: {
        onRowSelect: "showDetail"
    },
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow();
        bridge.addObj("pnlnotes", this);
        this.$.pnlentry.setShowing(!1);
        this.$.mains.reflow()
    },
    showDetail: function (b, d) {
        var e = this.$.news.getSelected();
        if (e && e[1].trim() != "") {
            var f = Store.stock[e[0]];
            this.$.pop.setContent(e[2].split(" ")[0] + " | " + (f ? e[0] : "OTHERS") + "<br/><br/>" + e[1]);
            this.$.pop.showAtEvent(d.sumberevent);
            enyo.job("hideAlert", enyo.bind(this, "hideAlert"), 5E3)
        }
        return !0
    },
    hideAlert: function () {
        this.$.pop.hide()
    },
    onLoginOK: function () {
        this.loadFromDb()
    },
    onLogoutOK: function () {
        this.$.news.removeAll();
        this.$.news.refreshList()
    },
    add: function () {
        var b = this.$.field1.getValue().toUpperCase().trim()
            , d = this.$.field2.getValue().trim()
            , e = Store.stock[b];
        return d != "" ? this.form == "a" ? b == "" && this.ptype == "o" ? (b = "_" + bridge.getObj("clientengine").genTime().getTime() + "" + this.seq++,
            this.insertToDb(b, d)) : e && e != "" && this.ptype == "w" ? this.insertToDb(b, d) : enyo.Signals.send("onError", "please enter valid stock") : this.insertToDb(b, d) : enyo.Signals.send("onError", "please enter valid notes"),
            !0
    },
    clear: function () {
        var b = this.$.news.getSelected();
        b && this.delFromDb(b)
    },
    genDateFormatted: function () {
        var b = bridge.getObj("clientengine").genTime()
            , d = b.getFullYear() + ""
            , e = b.getMonth() + 1 + ""
            , b = b.getDate() + "";
        return d + "-" + (e.length == 1 ? "0" + e : e) + "-" + (b.length == 1 ? "0" + b : b)
    },
    insertToDb: function (b, d) {
        var e = Const._url + Const._urlsubmit + "?q=SSQ|" + bridge.getObj("userid") + "|" + b + "|" + d + "|i"
            , e = new enyo.JsonpRequest({
                url: e,
                callbackName: "c"
            });
        e.response(this, function (e, g) {
            try {
                g.status != "1" ? enyo.Signals.send("onError", "saving data on server failed<br/>" + g.msg + "<br/>please relogin") : (this.$.news.updateItem([b, d, this.genDateFormatted()]),
                    this.$.field1.setValue(""),
                    this.$.field2.setValue(""),
                    this.$.pnlparam.setShowing(!0),
                    this.$.pnlentry.setShowing(!1),
                    this.$.mains.reflow(),
                    bridge.getObj("pnlwatchlist").loadFromDb())
            } catch (i) {
                enyo.Signals.send("onError", "invalid response on save data<br/>" + i)
            }
        });
        e.error(this, function () {
            enyo.Signals.send("onError", "error while sending save request")
        });
        e.go()
    },
    delFromDb: function (b) {
        b = Const._url + Const._urlsubmit + "?q=SSQ|" + bridge.getObj("userid") + "|" + b[0] + "||d";
        b = new enyo.JsonpRequest({
            url: b,
            callbackName: "c"
        });
        b.response(this, function (b, e) {
            try {
                e.status != "1" ? enyo.Signals.send("onError", "delete data on server failed<br/>" + e.msg + "<br/>please relogin") : (this.$.news.removeSelected(),
                    this.$.field1.setValue(""),
                    this.$.field2.setValue(""),
                    bridge.getObj("pnlwatchlist").loadFromDb())
            } catch (f) {
                enyo.Signals.send("onError", "invalid response on delete data<br/>" + f)
            }
        });
        b.error(this, function () {
            enyo.Signals.send("onError", "error while sending delete request")
        });
        b.go()
    },
    loadFromDb: function () {
        this.$.news.removeAll();
        this.$.news.refreshList();
        var b = Const._url + Const._urldata + "?q=feed|SLU|" + bridge.getObj("userid")
            , b = new enyo.JsonpRequest({
                url: b,
                callbackName: "c"
            });
        b.response(this, function (b, e) {
            try {
                if (e.status == "1")
                    for (var f = e.data, g = 0; g < f.length; g++)
                        this.$.news.updateItem([f[g][1], f[g][2], f[g][3]]);
                else
                    enyo.Signals.send("onError", "failed to load watchlist data from server<br/>" + e.msg + "<br/>please relogin")
            } catch (i) {
                enyo.Signals.send("onError", "failed to load watchlist data from server")
            }
        });
        b.error(this, function () {
            enyo.Signals.send("onError", "cannot load watchlist data from server")
        });
        b.go()
    },
    inputChanged: function (b, d) {
        var e = [];
        if (d.value !== "") {
            d.value = d.value.toUpperCase();
            for (var f = 0, g; g = Store.stocklist[f]; f++)
                g.indexOf(d.value) === 0 && e.push(g)
        }
        b.setValues(e)
    },
    typeChanged: function (b, d) {
        d.originator.getActive() && (this.ptype = d.originator.kode,
            this.$.field1.setValue(""),
            this.ptype == "w" ? (this.$.entry1.setShowing(!0),
                this.$.entry2.removeClass("grid100"),
                this.$.entry2.addClass("grid67"),
                this.$.spacer.setShowing(!0)) : (this.$.entry1.setShowing(!1),
                    this.$.entry2.removeClass("grid67"),
                    this.$.entry2.addClass("grid100"),
                    this.$.spacer.setShowing(!1)))
    },
    showAdd: function () {
        this.$.pnlparam.setShowing(!1);
        this.$.pnlentry.setShowing(!0);
        this.$.type.setShowing(!0);
        this.$.type.setActive(this.$.type.controls[0]);
        this.$.entry1.setShowing(!0);
        this.$.b1.setContent("Add");
        this.$.entry2.removeClass("grid100");
        this.$.entry2.addClass("grid67");
        this.$.spacer.setShowing(!0);
        this.$.pnlentry.reflow();
        this.$.mains.reflow();
        this.form = "a"
    },
    doEdit: function () {
        var b = this.$.news.getSelected();
        b ? (this.$.pnlparam.setShowing(!1),
            this.$.pnlentry.setShowing(!0),
            this.$.type.setShowing(!1),
            this.$.b1.setContent("Edit"),
            this.$.entry1.setShowing(!1),
            this.$.entry2.removeClass("grid67"),
            this.$.entry2.addClass("grid100"),
            this.$.spacer.setShowing(!1),
            this.$.pnlentry.reflow(),
            this.$.mains.reflow(),
            this.$.field1.setValue(b[0]),
            this.$.field2.setValue(b[1]),
            this.$.mains.reflow(),
            this.form = "e") : enyo.Signals.send("onError", "please select row to edit")
    },
    onCancel: function () {
        this.$.pnlparam.setShowing(!0);
        this.$.pnlentry.setShowing(!1);
        this.$.field1.setValue("");
        this.$.field2.setValue("");
        this.$.mains.reflow()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Notes",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        name: "mains",
        kind: "FittableRows",
        classes: "bg-normal",
        fit: !0,
        components: [{
            name: "pnlparam",
            kind: "FittableColumns",
            classes: "pnl bg-bar",
            components: [{
                fit: !0
            }, {
                name: "ab1",
                kind: "onyx.Button",
                content: "Add",
                ontap: "showAdd",
                style: "height:2.35em;"
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "ab2",
                kind: "onyx.Button",
                content: "Edit",
                ontap: "doEdit",
                style: "height:2.35em;"
            }, {
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "ab3",
                kind: "onyx.Button",
                content: "Remove",
                ontap: "clear",
                style: "height:2.35em;"
            }]
        }, {
            name: "pnlentry",
            kind: "FittableRows",
            classes: "pnl bg-bar",
            components: [{
                name: "test",
                kind: "FittableColumns",
                classes: "grid100",
                components: [{
                    name: "entry1",
                    onInputChanged: "inputChanged",
                    kind: "xinput",
                    layoutKind: "FittableColumnsLayout",
                    style: "height:2.25em;",
                    alwaysLooksFocused: !1,
                    classes: "grid31 enyo-selectable",
                    components: [{
                        name: "field1",
                        selectOnFocus: !0,
                        kind: "onyx.Input",
                        fit: !0,
                        placeholder: "stock",
                        style: "text-transform: uppercase;"
                    }]
                }, {
                    name: "spacer",
                    classes: "grid2",
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    name: "entry2",
                    kind: "onyx.InputDecorator",
                    alwaysLooksFocused: !1,
                    classes: "enyo-selectable",
                    classes: "grid67",
                    style: "height:2.25em;",
                    components: [{
                        name: "field2",
                        kind: "onyx.Input",
                        style: "width:100%;",
                        placeholder: "Notes"
                    }]
                }]
            }, {
                style: "height:.5em;",
                content: "&nbsp;",
                allowHtml: !0
            }, {
                name: "test2",
                kind: "FittableColumns",
                classes: "grid100",
                components: [{
                    classes: "grid23",
                    name: "b1",
                    kind: "onyx.Button",
                    content: "Add",
                    ontap: "add",
                    style: "height:2.35em;"
                }, {
                    classes: "grid2",
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    classes: "grid25",
                    name: "b2",
                    kind: "onyx.Button",
                    content: "Cancel",
                    ontap: "onCancel",
                    style: "height:2.35em;"
                }, {
                    classes: "grid5",
                    content: "&nbsp;",
                    allowHtml: !0
                }, {
                    classes: "grid45 right",
                    name: "type",
                    kind: "onyx.RadioGroup",
                    onActivate: "typeChanged",
                    components: [{
                        name: "t1",
                        content: "watchlist",
                        active: !0,
                        kode: "w",
                        style: "height:2.35em"
                    }, {
                        name: "t2",
                        content: "others",
                        kode: "o",
                        style: "height:2.35em"
                    }]
                }]
            }]
        }, {
            name: "news",
            kind: "xtable",
            fit: !0,
            datas: [],
            classes: "grid100",
            rows: {
                name: "item",
                kind: "zaisan.rowNT"
            }
        }]
    }, {
        name: "pop",
        allowHtml: !0,
        kind: "onyx.Popup",
        centered: !0,
        floating: !0,
        allowHtml: !0,
        classes: "bold shadow",
        style: "padding:2em;max-width:20em;"
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.rowNT",
    layoutKind: "FittableRowsLayout",
    classes: "rows f14 bold",
    components: [{
        name: "title",
        allowHtml: !0,
        classes: "texts"
    }],
    update: function (b) {
        Store.stock[b[0]] ? this.getCol1().setContent(b[2].split(" ")[0] + " | " + b[0] + " | " + b[1]) : this.getCol1().setContent(b[2].split(" ")[0] + " | OTHERS | " + b[1])
    },
    getCol1: function () {
        return this.$.title
    }
});
enyo.kind({
    name: "zaisan.pnlreport",
    kind: "FittableRows",
    classes: "enyo-unselectable",
    create: function () {
        this.inherited(arguments);
        this.$.top.reflow()
    },
    dateToStr: function (b) {
        try {
            var d = b.getMonth() + 1 + ""
                , d = d.length == 1 ? "0" + d : d
                , e = b.getDate() + "";
            return e = e.length == 1 ? "0" + e : e,
                b.getFullYear() + "/" + d + "/" + e
        } catch (f) {
            return ""
        }
    },
    strToDate: function (b) {
        try {
            var d, e, f, g;
            return g = b.split("/"),
                f = g[0],
                e = g[1],
                d = g[2],
                new Date(f, e - 1, d, 0, 0, 0)
        } catch (i) {
            return null
        }
    },
    daysBetween: function (b, d) {
        return (d.getTime() - b.getTime()) / 864E5
    },
    onTrdLoginOK: function () {
        this.$.pnl.setIndex(1);
        var b = bridge.getObj("clientengine").genTime();
        this.$.from.setValue(this.dateToStr(new Date(b.setDate(b.getDate() - 7))));
        this.$.to.setValue(this.dateToStr(new Date(bridge.getObj("clientengine").genTime())));
        (b = Store.ID[0]) && this.$.tradingid.$.field.setValue(b)
    },
    onTrdLogoutOK: function () {
        this.$.pnl.setIndex(0)
    },
    viewTrade: function () {
        return this.loadReport("0|" + this.$.tradingid.$.field.getValue() + "|%"),
            !0
    },
    viewCash: function () {
        return this.loadReport("1|" + this.$.tradingid.$.field.getValue()),
            !0
    },
    viewActivity: function () {
        return this.loadReport("2|" + this.$.tradingid.$.field.getValue()),
            !0
    },
    loadReport: function (b) {
        try {
            var d = this.strToDate(this.$.from.getValue())
                , e = this.strToDate(this.$.to.getValue());
            this.$.tradingid.$.field.getValue().trim() == "" ? enyo.Signals.send("onError", "please input tradingid") : d == null || e == null || d.toString().toLowerCase() == "invalid date" || e.toString().toLowerCase() == "invalid date" ? enyo.Signals.send("onError", "please input valid date range<br/>use format YYYY/MM/DD") : d.getTime() > e.getTime() ? enyo.Signals.send("onError", "please input valid date range<br/>use format YYYY/MM/DD") : 100 < this.daysBetween(d, e) ? enyo.Signals.send("onError", "Date range cannot be greater than 100 days") : (this.$.from.setValue(this.dateToStr(d)),
                this.$.to.setValue(this.dateToStr(e)),
                d = Const._url + Const._urlreport + "?q=" + b + "|" + this.dateToStr(d) + "|" + this.dateToStr(e),
                window.open(d, "report"))
        } catch (f) {
            enyo.Signals.send("onError", "please input valid date range<br/>use format YYYY/MM/DD")
        }
    },
    doLogin: function () {
        Router.send("onShowBuy")
    },
    doChange: function () {
        window.open("./doc/formperubahanperorangan.pdf", "report")
    },
    viewCustinfo: function () {
        bridge.getObj("pnlcustinfo").show()
    },
    components: [{
        name: "top",
        kind: "FittableColumns",
        components: [{
            kind: "zaisan.tabbutton",
            content: "Report",
            active: !0
        }, {
            fit: !0
        }]
    }, {
        name: "pnl",
        kind: "Panels",
        draggable: !1,
        fit: !0,
        classes: "rw",
        components: [{
            kind: "FittableRows",
            components: [{
                style: "height:45%;"
            }, {
                classes: "enyo-stretch box centered",
                components: [{
                    content: "REPORT (please&nbsp;",
                    allowHtml: !0
                }, {
                    kind: "onyx.Button",
                    content: "Login Trading",
                    ontap: "doLogin",
                    style: "height:2.5em;vertical-align:middle;"
                }, {
                    content: "&nbsp;)",
                    allowHtml: !0
                }]
            }, {
                fit: !0
            }]
        }, {
            kind: "FittableRows",
            classes: "rows2 f16 bold",
            fit: !0,
            components: [{
                kind: "FittableColumns",
                classes: "btm-spacer",
                style: "height:2.3em;",
                components: [{
                    content: "TradingId",
                    classes: "grid30"
                }, {
                    name: "tradingid",
                    kind: "onyx.ddID",
                    cls: "label-item-dd",
                    classes: "grid70 enyo-selectable"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "From",
                    classes: "grid30"
                }, {
                    name: "entry1",
                    kind: "onyx.InputDecorator",
                    classes: "grid70",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "from",
                        kind: "onyx.Input",
                        placeholder: "",
                        classes: "enyo-selectable grid100"
                    }]
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    content: "To",
                    classes: "grid30"
                }, {
                    name: "entry2",
                    kind: "onyx.InputDecorator",
                    classes: "grid70",
                    alwaysLooksFocused: !1,
                    components: [{
                        name: "to",
                        kind: "onyx.Input",
                        placeholder: "",
                        classes: "enyo-selectable grid100"
                    }]
                }]
            }, {
                fit: !0
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    kind: "onyx.Button",
                    content: "Client Activity",
                    ontap: "viewActivity",
                    classes: "grid100"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    kind: "onyx.Button",
                    content: "History Cash",
                    ontap: "viewCash",
                    classes: "grid49"
                }, {
                    classes: "grid2"
                }, {
                    kind: "onyx.Button",
                    content: "History Trade",
                    ontap: "viewTrade",
                    classes: "grid49"
                }]
            }, {
                kind: "FittableColumns",
                classes: "btm-spacer",
                components: [{
                    kind: "onyx.Button",
                    content: "Customer Info",
                    ontap: "viewCustinfo",
                    classes: "grid49"
                }, {
                    classes: "grid2"
                }, {
                    kind: "onyx.Button",
                    content: "Change",
                    ontap: "doChange",
                    classes: "grid49"
                }]
            }]
        }]
    }, {
        kind: "Broadcast",
        onLogoutOK: "onTrdLogoutOK",
        onTrdLoginOK: "onTrdLoginOK",
        onTrdLogoutOK: "onTrdLogoutOK"
    }]
});
enyo.kind({
    name: "zaisan.pnlentryorder",
    kind: "enyo.Slideable",
    style: "overflow: hidden;position:fixed",
    classes: "f16 bold",
    max: 230,
    value: 230,
    unit: "%",
    events: {
        onRowSelect: "",
        onChgstock: "",
        onChgid: ""
    },
    handlers: {
        onChgstock: "stockChanged",
        onChgid: "idChangedEvent"
    },
    create: function () {
        this.inherited(arguments);
        this.$.iprice.afterValidate = enyo.bind(this, this.calc);
        this.$.ilot.afterValidate = enyo.bind(this, this.calc);
        this.pboard = "RG";
        this.ptype = "1";
        this.bos = "B";
        this.ptemp = !1;
        bridge.addObj("bos", this)
    },
    changeTitle: function (b) {
        this.$.gh.setContent(b);
        this.bos = b[0];
        this.$.istock.$.input.$.field.setValue(dbs.get(Const._def_quote, "BBNI").split(".")[0]);
        this.$.gh.removeClass("green-box");
        this.$.gh.removeClass("red-box");
        this.$.gh.addClass(this.bos == "B" ? "red-box" : "green-box");
        (b = Store.ACC[bridge.getObj("userid")]) && (this.$.itrdid.$.input.$.field.setValue(bridge.getObj("userid")),
            this.$.itl.setValue(numformat(b[6])),
            this.idChangedEvent(null, {
                datas: bridge.getObj("userid")
            }))
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            fit: !0,
            style: "position: relative;",
            components: [{
                name: "entry",
                kind: "Scroller",
                classes: "enyo-fit",
                components: [{
                    kind: "onyx.Groupbox",
                    classes: "settings",
                    components: [{
                        name: "gh",
                        kind: "onyx.GroupboxHeader",
                        content: "Entry Order",
                        classes: "pnl bold medium2"
                    }, {
                        name: "x",
                        kind: "FittableColumns",
                        classes: "row2 white small",
                        components: [{
                            name: "x1",
                            allowHtml: !0,
                            content: "Cash",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "x2",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }, {
                            name: "x3",
                            allowHtml: !0,
                            content: "Outs.",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "x4",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }]
                    }, {
                        name: "y",
                        kind: "FittableColumns",
                        classes: "row2 white small",
                        components: [{
                            name: "y1",
                            allowHtml: !0,
                            content: "Ratio",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "y2",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }, {
                            name: "y3",
                            allowHtml: !0,
                            content: "Fee",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "y4",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }]
                    }, {
                        name: "istock",
                        kind: "LabeledItem",
                        style: "height:2em;",
                        label: "Stock",
                        defaultKind: "onyx.ddStock",
                        cls: "label-item-dd"
                    }, {
                        name: "iprice",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "Price",
                        type: "number"
                    }, {
                        name: "ilot",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "Lot",
                        type: "number"
                    }, {
                        name: "itrdid",
                        kind: "LabeledItem",
                        style: "height:2em;",
                        label: "TrdId",
                        defaultKind: "onyx.ddID",
                        cls: "label-item-dd"
                    }, {
                        name: "pin",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "PIN",
                        type: "password"
                    }, {
                        name: "itl",
                        kind: "LabeledItem",
                        label: "TL",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        name: "ival",
                        kind: "LabeledItem",
                        label: "Net Value",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        kind: "FittableColumns",
                        components: [{
                            name: "iboard",
                            kind: "onyx.RadioGroup",
                            onActivate: "boardChanged",
                            components: [{
                                name: "irg",
                                content: "Regular",
                                active: !0,
                                kode: "RG"
                            }, {
                                name: "itn",
                                content: "Tunai",
                                kode: "TN"
                            }]
                        }, {
                            fit: !0
                        }, {
                            name: "itype",
                            kind: "onyx.RadioGroup",
                            onActivate: "typeChanged",
                            components: [{
                                name: "iday",
                                content: "Day",
                                active: !0,
                                kode: "1"
                            }, {
                                name: "ises",
                                content: "Session",
                                kode: "2"
                            }]
                        }]
                    }, {
                        name: "itemp",
                        style: "height:2.5em;",
                        style1: "height:2.5em;",
                        kind: "LabeledItem",
                        label: "Temporary",
                        defaultKind: "onyx.Checkbox"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "settings medium",
                    components: [{
                        kind: "onyx.Button",
                        content: "Max",
                        ontap: "onCalMax"
                    }, {
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "Send",
                        ontap: "onEnter"
                    }, {
                        style: "width:.01em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Cancel",
                        ontap: "toggle"
                    }]
                }, {
                    kind: "FittableRows",
                    allowHtml: !0,
                    content: "&nbsp;&nbsp;"
                }]
            }]
        }]
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed;  padding: 2em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:18em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to send this order?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }],
    calc: function () {
        try {
            var b = this.$.iprice.getValue()
                , d = this.$.ilot.getValue()
                , e = b * d * Const.lotSize
                , f = Store.ACC[this.$.itrdid.$.input.$.field.getValue()];
            f ? (b = 0,
                this.bos == "B" ? (b = f[27],
                    e += b * e / 100) : (b = f[28],
                        e -= b * e / 100),
                this.$.ival.setValue(numformat(e))) : this.$.ival.setValue("")
        } catch (g) {
            this.$.ival.setValue("0")
        }
    },
    boardChanged: function (b, d) {
        d.originator.getActive() && (this.pboard = d.originator.kode,
            this.pboard == "TN" ? (this.$.iday.setActive(!1),
                this.$.ises.setActive(!0)) : (this.$.iday.setActive(!0),
                    this.$.ises.setActive(!1)))
    },
    typeChanged: function (b, d) {
        d.originator.getActive() && (this.ptype = d.originator.kode)
    },
    stockChanged: function (b, d) {
        return d.datas && (d.datas.indexOf("-R") >= 0 ? (this.$.irg.setActive(!1),
            this.$.iday.setActive(!1),
            this.$.itn.setActive(!0),
            this.$.ises.setActive(!0)) : (this.$.itn.setActive(!1),
                this.$.ises.setActive(!1),
                this.$.irg.setActive(!0),
                this.$.iday.setActive(!0)),
            Router.send("onChangeQuote", d.datas),
            bridge.getObj("acc-ob").updateMe(d.datas)),
            !0
    },
    idChangedEvent: function (b, d) {
        if (d) {
            var e = Store.ACC[d.datas];
            if (e != null) {
                this.$.itl.setValue(numformat(e[6]));
                this.$.x2.setContent(numformat(e[12]));
                this.$.x4.setContent(numformat(e[8]));
                var f = this.calcPF(d.datas);
                this.$.y2.setContent(numformat2(e[8] <= 0 ? 0 : e[8] / f * 100) + "%");
                this.$.y4.setContent((this.bos == "B" ? e[27] : e[28]) + "%")
            } else
                this.$.itl.setValue(0),
                    this.$.x2.setContent("0"),
                    this.$.x4.setContent("0"),
                    this.$.y2.setContent("0"),
                    this.$.y4.setContent("0")
        }
        return !0
    },
    calcPF: function (b) {
        for (var b = RegExp("^" + b, "i"), d = 0, e = 0, f; f = bridge.getObj("pf").getComp("wl").getDb()[e]; e++)
            f[1].match(b) && (d = d + f[15] + f[18]);
        return d
    },
    close: function () {
        this.animateToMax()
    },
    open: function () {
        this.animateToMin();
        this.$.istock.$.input.$.field.focus()
    },
    clearinput: function () {
        this.$.istock.$.input.$.field.setValue("");
        this.$.iprice.setValue("");
        this.$.ilot.setValue("");
        this.$.itrdid.$.input.$.field.setValue("");
        this.$.itl.setValue("");
        this.$.ival.setValue("");
        this.$.irg.setActive(!0);
        this.$.iday.setActive(!0);
        this.$.itemp.setValue(!1);
        this.pboard = "RG";
        this.ptype = "1";
        this.$.pin.setValue("");
        this.$.x2.setContent("0");
        this.$.x4.setContent("0");
        this.$.y2.setContent("0");
        this.$.y4.setContent("0")
    },
    onValidate: function (b) {
        if (Store.SEC[b[0]] && b[1] > 0 && b[2] > 0 && Store.ACC[b[3]]) {
            var d = Store.PRO[bridge.getObj("userid")];
            if (d[7] == "1")
                if (b[1] * b[2] * Const.lotSize <= d[5])
                    if ((d = Store.SEB[b[0] + b[4]]) && d[3] == "1") {
                        if (this.bos != "B")
                            return !0;
                        d = Store.ACC[b[3]];
                        if (!d)
                            return !1;
                        b = Store.ASE[d[4] + b[0]];
                        if (b != null && b[2] != "0")
                            return !0;
                        d[4] == "70" ? enyo.Signals.send("onError", isTablet() ? "transaksi anda ditolak<br/>karena terindikasi riba" : "transaksi anda ditolak<br/>karena terindikasi riba") : enyo.Signals.send("onError", isTablet() ? "cannot buying this stock<br/>for current acc type" : "cannot buying this stock<br/>for current acc type")
                    } else
                        enyo.Signals.send("onError", isTablet() ? "cannot trading this stock<br/>on board:" + this.pboard : "cannot trading<br/>this stock<br/>on board:" + this.pboard);
                else
                    enyo.Signals.send("onError", isTablet() ? "trading limit exceeded<br>max:" + d[5] : "trading limit exceeded<br>max:" + d[5]);
            else
                enyo.Signals.send("onError", isTablet() ? "trading aborted, status user is inactive" : "trading aborted<br/>user is inactive");
            return !1
        }
        return enyo.Signals.send("onError", isTablet() ? "please enter valid order" : "please<br/>enter valid order"),
            !1
    },
    onCalMax: function () {
        if (this.bos == "B")
            try {
                var b = Store.ACC[this.$.itrdid.$.input.$.field.getValue()]
                    , d = 0
                    , e = 0
                    , f = this.$.iprice.getValue();
                b && f != "" ? (d = b[6],
                    e = b[27],
                    this.$.ilot.setValue(Math.floor(d / (f * Const.lotSize * (1 + e / 100)))),
                    this.calc()) : this.$.ilot.setValue("")
            } catch (g) {
                this.$.ilot.setValue("")
            }
        else
            b = this.$.itrdid.$.input.$.field.getValue() + this.$.istock.$.input.$.field.getValue(),
                (b = bridge.getObj("pf").getComp("wl").getByKey(b)) ? (this.pboard == "RG" ? this.$.ilot.setValue(Math.floor(b[8])) : this.$.ilot.setValue(Math.floor(b[10])),
                    this.calc()) : this.$.ilot.setValue("");
        return !0
    },
    onEnter: function (b, d) {
        if (cryptoMD5.en(this.$.pin.getValue()) != bridge.getObj("pin"))
            return enyo.Signals.send("onError", "invalid PIN"),
                !0;
        var e = [];
        e.push(this.$.istock.$.input.$.field.getValue().toUpperCase());
        e.push(this.$.iprice.getValue());
        e.push(this.$.ilot.getValue());
        e.push(this.$.itrdid.$.input.$.field.getValue().toUpperCase());
        e.push(this.pboard);
        e.push(this.ptype);
        e.push(this.$.itemp.getValue());
        e.push(this.bos == "B" ? "1" : "2");
        if (!this.onValidate(e))
            return !0;
        d.param = e;
        d.cmd = "createorder";
        this.$.confirm.order = d;
        this.$.confirm.show()
    },
    onOK: function () {
        this.$.confirm.hide();
        Router.send("onOrder", this.$.confirm.order.param);
        this.clearinput();
        this.close()
    },
    onCancel: function () {
        this.$.confirm.hide()
    },
    toggle: function () {
        this.isAtMin() ? this.animateToMax() : this.animateToMin()
    }
});
enyo.kind({
    name: "zaisan.pnlentryalgo",
    kind: "enyo.Slideable",
    style: "overflow: hidden;position:fixed",
    classes: "f16 bold",
    max: 230,
    value: 230,
    unit: "%",
    events: {
        onRowSelect: "",
        onChgstock: "",
        onChgid: ""
    },
    handlers: {
        onChgstock: "stockChanged",
        onChgid: "idChangedEvent"
    },
    create: function () {
        this.inherited(arguments);
        this.$.iprice.afterValidate = enyo.bind(this, this.calc);
        this.$.ilot.afterValidate = enyo.bind(this, this.calc);
        this.pboard = "RG";
        this.ptype = "1";
        this.pbookingtype = 0;
        this.pbos = "1";
        this.ptemp = !1;
        this.gain = !0;
        bridge.addObj("algo", this)
    },
    changeTitle: function (b) {
        this.$.gh.setContent(b);
        this.$.istock.$.input.$.field.setValue(dbs.get(Const._def_quote, "BBNI").split(".")[0]);
        this.$.gh.removeClass("green-box");
        this.$.gh.removeClass("red-box");
        this.$.gh.addClass(this.pbos == "1" ? "red-box" : "green-box");
        (b = Store.ACC[bridge.getObj("userid")]) && (this.$.itrdid.$.input.$.field.setValue(bridge.getObj("userid")),
            this.$.itl.setContent(numformat(b[6])),
            this.idChangedEvent(null, {
                datas: bridge.getObj("userid")
            }))
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            fit: !0,
            style: "position: relative;",
            components: [{
                name: "entry",
                kind: "Scroller",
                classes: "enyo-fit",
                components: [{
                    kind: "onyx.Groupbox",
                    classes: "settings",
                    components: [{
                        name: "gh",
                        kind: "onyx.GroupboxHeader",
                        content: "Entry Auto Order",
                        classes: "pnl bold medium2 bg-blue white"
                    }, {
                        name: "x",
                        kind: "FittableColumns",
                        classes: "row2 white small",
                        components: [{
                            name: "x1",
                            allowHtml: !0,
                            content: "Cash",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "x2",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }, {
                            name: "x3",
                            allowHtml: !0,
                            content: "TL",
                            classes: "bold box",
                            style: "width:17%;"
                        }, {
                            name: "itl",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box",
                            content: "0",
                            style: "width:30%;text-align: right;"
                        }]
                    }, {
                        content: "If the following condition are match:"
                    }, {
                        name: "itrdid",
                        kind: "LabeledItem",
                        style: "height:2em;",
                        label: "TrdId",
                        defaultKind: "onyx.ddID",
                        cls: "label-item-dd"
                    }, {
                        name: "istock",
                        kind: "LabeledItem",
                        style: "height:2em;",
                        label: "Stock",
                        defaultKind: "onyx.ddStock",
                        cls: "label-item-dd"
                    }, {
                        kind: "FittableColumns",
                        components: [{
                            content: "Condition"
                        }, {
                            fit: !0
                        }, {
                            name: "ibookingtype",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;float:right;width:60%;",
                            classes: "",
                            components: [{
                                name: "d",
                                kind: "Select",
                                onchange: "selectChanged",
                                components: [{
                                    name: "e",
                                    content: "Booking By Price",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "Booking By GainLoss",
                                    kode: 1
                                }, {
                                    content: "Booking By Time",
                                    kode: 2
                                }]
                            }]
                        }]
                    }, {
                        name: "opt1",
                        kind: "FittableColumns",
                        classes: "grid100",
                        components: [{
                            name: "option1",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid40",
                            components: [{
                                name: "option1d",
                                kind: "Select",
                                onchange: "option1Changed",
                                components: [{
                                    name: "option1e",
                                    content: "Last Price",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "Bid Price",
                                    kode: 1
                                }, {
                                    content: "Offer Price",
                                    kode: 2
                                }]
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            name: "option1Op",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid18",
                            components: [{
                                name: "option1Opd",
                                kind: "Select",
                                onchange: "option1OpChanged",
                                components: [{
                                    name: "option1Ope",
                                    content: "=",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "<=",
                                    kode: 1
                                }, {
                                    content: ">=",
                                    kode: 2
                                }]
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            kind: "onyx.InputDecorator",
                            classes: "enyo-selectable grid36",
                            style: "height:2em;",
                            alwaysLooksFocused: !1,
                            components: [{
                                kind: "onyx.Input",
                                name: "option1Price",
                                selectOnFocus: !0,
                                classes: "enyo-selectable grid100 right",
                                onkeyup: "testNumber"
                            }]
                        }]
                    }, {
                        name: "opt2",
                        kind: "FittableColumns",
                        classes: "grid100",
                        components: [{
                            name: "option2",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid30",
                            components: [{
                                name: "option2d",
                                kind: "Select",
                                onchange: "option2Changed",
                                components: [{
                                    name: "option2e",
                                    content: "%Unreal - Gain",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "%Unreal - Loss",
                                    kode: 1
                                }]
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            name: "option2Op",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid20",
                            components: [{
                                name: "option2Opd",
                                kind: "Select",
                                onchange: "option2OpChanged",
                                components: [{
                                    name: "option2Ope",
                                    content: ">=",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "<=",
                                    kode: 1
                                }, {
                                    content: "=",
                                    kode: 2
                                }]
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            kind: "onyx.InputDecorator",
                            classes: "enyo-selectable",
                            style: "height:2em;",
                            alwaysLooksFocused: !1,
                            classes: "grid20",
                            components: [{
                                kind: "onyx.Input",
                                name: "option2Price",
                                selectOnFocus: !0,
                                classes: "enyo-selectable grid100 right",
                                onkeypress: "testNumber2",
                                onkeyup: "testNumber3",
                                onchange: "inputChange"
                            }]
                        }, {
                            name: "option2info",
                            allowHtml: !0,
                            tag: "span",
                            classes: "box right grid24",
                            content: "0",
                            style: "text-align: right;"
                        }]
                    }, {
                        name: "opt3",
                        kind: "FittableColumns",
                        classes: "grid100",
                        components: [{
                            name: "option3",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid40",
                            components: [{
                                name: "option3d",
                                kind: "Select",
                                onchange: "option3Changed",
                                components: [{
                                    name: "option3e",
                                    content: "Custom (HH24:mi:ss)",
                                    kode: 0,
                                    active: !0
                                }, {
                                    content: "Pre-Opening",
                                    kode: 1
                                }, {
                                    content: "Session 1",
                                    kode: 2
                                }, {
                                    content: "Session 2",
                                    kode: 3
                                }]
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            name: "option3T",
                            kind: "onyx.InputDecorator",
                            classes: "enyo-selectable grid20",
                            style: "height:2em;",
                            alwaysLooksFocused: !1,
                            components: [{
                                kind: "onyx.Input",
                                name: "option3Time",
                                selectOnFocus: !0,
                                classes: "enyo-selectable grid100 right"
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            name: "option3Op",
                            kind: "onyx.custom.SelectDecorator",
                            style: "height:2.35em;",
                            classes: "grid35",
                            components: [{
                                name: "option3Opd",
                                kind: "Select",
                                onchange: "option3OpChanged",
                                components: [{
                                    name: "option3Ope",
                                    content: "Use Best Price",
                                    kode: 1,
                                    active: !0
                                }, {
                                    content: "Use Entry Price",
                                    kode: 0
                                }]
                            }]
                        }]
                    }, {
                        kind: "FittableColumns",
                        components: [{
                            content: "Then send my order:"
                        }, {
                            fit: !0
                        }, {
                            name: "ibos",
                            kind: "onyx.RadioGroup",
                            onActivate: "bosChanged",
                            components: [{
                                name: "ibuy",
                                content: "BUY",
                                active: !0,
                                kode: "1"
                            }, {
                                name: "isell",
                                content: "SELL",
                                kode: "2"
                            }]
                        }]
                    }, {
                        name: "iprice",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "Price",
                        type: "number"
                    }, {
                        name: "ilot",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "Lot",
                        type: "number"
                    }, {
                        name: "pin",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "PIN",
                        type: "password"
                    }, {
                        name: "ival",
                        kind: "LabeledItem",
                        label: "Net Value",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        kind: "FittableColumns",
                        components: [{
                            name: "iboard",
                            kind: "onyx.RadioGroup",
                            onActivate: "boardChanged",
                            components: [{
                                name: "irg",
                                content: "Regular",
                                active: !0,
                                kode: "RG"
                            }, {
                                name: "itn",
                                content: "Tunai",
                                kode: "TN"
                            }]
                        }, {
                            fit: !0
                        }, {
                            name: "itype",
                            kind: "onyx.RadioGroup",
                            onActivate: "typeChanged",
                            components: [{
                                name: "iday",
                                content: "Day",
                                active: !0,
                                kode: "1"
                            }, {
                                name: "ises",
                                content: "Session",
                                kode: "2"
                            }]
                        }]
                    }, {
                        kind: "FittableColumns",
                        classes: "btm-spacer",
                        components: [{
                            content: "From-to",
                            classes: "grid40"
                        }, {
                            name: "entry1",
                            kind: "onyx.InputDecorator",
                            classes: "grid29",
                            alwaysLooksFocused: !1,
                            components: [{
                                name: "from",
                                kind: "onyx.Input",
                                placeholder: "",
                                classes: "enyo-selectable grid100"
                            }]
                        }, {
                            content: "&nbsp;",
                            allowHtml: !0,
                            classes: "grid2"
                        }, {
                            name: "entry2",
                            kind: "onyx.InputDecorator",
                            classes: "grid29",
                            alwaysLooksFocused: !1,
                            components: [{
                                name: "to",
                                kind: "onyx.Input",
                                placeholder: "",
                                classes: "enyo-selectable grid100"
                            }]
                        }]
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "settings medium",
                    components: [{
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "Send As Order",
                        ontap: "onEnter"
                    }, {
                        style: "width:.01em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Send As Alert",
                        ontap: "onEnterAlert"
                    }, {
                        style: "width:.01em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Cancel",
                        ontap: "toggle"
                    }]
                }, {
                    kind: "FittableRows",
                    allowHtml: !0,
                    content: "&nbsp;&nbsp;"
                }]
            }]
        }]
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed;  padding: 2em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:18em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to send this auto order?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }, {
        name: "confirm2",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed;  padding: 2em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:43em;",
            components: [{
                name: "disclaimer",
                allowHtml: !0,
                content: ""
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn2",
                    kind: "onyx.Button",
                    content: "Setuju(Agree)",
                    ontap: "onAgree"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn2",
                    kind: "onyx.Button",
                    content: "Tidak Setuju(Disagree)",
                    ontap: "onDisagree"
                }]
            }]
        }]
    }],
    testNumber: function () {
        /\D/g.test(this.$.option1Price.getValue()) && this.$.option1Price.setValue(this.$.option1Price.getValue().replace(/\D/g, ""));
        this.$.iprice.setValue(this.$.option1Price.getValue())
    },
    testNumber3: function () {
        this.calculateGL()
    },
    inputChange: function () {
        this.$.option2Price.getValue().endsWith(".") && this.$.option2Price.setValue(this.$.option2Price.getValue().substring(0, this.$.option2Price.getValue().length - 1));
        this.calculateGL()
    },
    testNumber2: function (b, d) {
        var e = d.which || d.charCode || d.keyCode;
        if (e == 46) {
            if (this.$.option2Price.getValue().split(".").length == 2)
                return d.preventDefault(),
                    !1
        } else if (e != 8 && e != 9 && e != 13 && e != 37 && e != 46) {
            if (e < 48 || e > 57)
                return d.preventDefault(),
                    !1;
            if (this.$.option2Price.getValue().split(".").length == 2 && this.$.option2Price.getValue().split(".")[1].length == 2)
                return d.preventDefault(),
                    !1
        }
        return !0
    },
    getFraksi: function (b, d) {
        return d ? b < 200 ? 1 : b >= 200 && b < 500 ? 2 : b >= 500 && b < 2E3 ? 5 : b >= 2E3 && b < 5E3 ? 10 : 25 : b <= 200 ? 1 : b > 200 && b <= 500 ? 2 : b > 500 && b <= 2E3 ? 5 : b > 2E3 && b <= 5E3 ? 10 : 25
    },
    calculateGL: function () {
        if (this.pbookingtype == 1) {
            var b = this.$.option2Price.getValue()
                , d = 0
                , e = 0
                , f = this.$.itrdid.$.input.$.field.getValue() + this.$.istock.$.input.$.field.getValue()
                , f = f.toUpperCase();
            (f = bridge.getObj("pf").getComp("wl").getByKey(f)) && (d = f[12]);
            this.pbos == "1" ? (d = Store.ss[this.$.istock.$.input.$.field.getValue() + "RG"],
                d != null ? this.gain ? e = Math.ceil(d[5] + d[5] * b / 100) : e = Math.ceil(d[5] - d[5] * b / 100) : e = 0) : this.gain ? e = Math.ceil(d + d * b / 100) : e = Math.ceil(d - d * b / 100);
            this.$.option2info.setContent(e);
            e == 0 ? this.$.iprice.setValue("") : (b = e,
                d = b % this.getFraksi(e, !0),
                d != 0 && (b -= d,
                    e = this.getFraksi(e, !0),
                    b += this.pbos == "1" ? 0 : e),
                this.$.iprice.setValue(b))
        }
    },
    checkTime: function () {
        var b = this.$.option3Time.getValue().split(":");
        b[0].length == 1 && b.length == 3 && this.$.option3Time.setValue("0" + this.$.option3Time.getValue())
    },
    replaceTime: function (b) {
        var d = b.split(":");
        return d[0].length == 1 && d.length == 3 ? (this.$.option3Time.setValue("0" + b),
            d[0] = "0" + d[0],
            "0" + b) : b
    },
    testTime: function (b) {
        var d = b.split(":");
        return d[0].length == 1 && d.length == 3 && (this.$.option3Time.setValue("0" + b),
            d[0] = "0" + d[0]),
            d.length != 3 || d[0].length != 2 || d[1].length != 2 || d[2].length != 2 ? !1 : +d[0] > 23 || +d[1] > 59 || +d[2] > 59 ? !1 : !0
    },
    option1Changed: function () { },
    option2Changed: function (b, d) {
        this.gain = d.originator.selected == 0;
        this.calculateGL()
    },
    option3Changed: function (b, d) {
        var e = d.originator.selected;
        e == 0 ? (this.$.option3T.show(),
            this.$.option3Op.show()) : e == 1 ? (this.$.option3T.hide(),
                this.$.option3Op.hide(),
                this.$.option3Opd.setSelected(1),
                this.$.option3Op.$.innerText.setContent("Use Entry Price"),
                this.$.iprice.setValue(""),
                this.$.iprice.show()) : (this.$.option3T.hide(),
                    this.$.option3Op.show())
    },
    option3OpChanged: function (b, d) {
        d.originator.selected == 0 ? (this.$.iprice.setValue(""),
            this.$.iprice.hide()) : this.$.iprice.show()
    },
    resetOption1: function () {
        this.$.option1d.setSelected(this.$.option1e.kode);
        this.$.option1.$.innerText.setContent(this.$.option1e.content);
        this.$.option1Opd.setSelected(this.$.option1Ope.kode);
        this.$.option1Op.$.innerText.setContent(this.$.option1Ope.content);
        this.$.option1Price.setValue("")
    },
    resetOption2: function () {
        this.$.option2d.setSelected(this.$.option2e.kode);
        this.$.option2.$.innerText.setContent(this.$.option2e.content);
        this.$.option2Opd.setSelected(this.$.option2Ope.kode);
        this.$.option2Op.$.innerText.setContent(this.$.option2Ope.content);
        this.$.option2Price.setValue("");
        this.$.option2info.setContent("")
    },
    resetOption3: function () {
        this.$.option3d.setSelected(this.$.option3e.kode);
        this.$.option3.$.innerText.setContent(this.$.option3e.content);
        this.$.option3Time.setValue("");
        this.$.option3T.show();
        this.$.option3Opd.setSelected(0);
        this.$.option3Op.$.innerText.setContent(this.$.option3Ope.content);
        this.$.option3Op.show();
        this.$.iprice.setValue("");
        this.$.iprice.hide()
    },
    selectChanged: function (b, d) {
        this.pbookingtype = d.originator.selected;
        this.$.iprice.show();
        this.pbookingtype == 0 ? (this.resetOption1(),
            this.$.opt1.show(),
            this.$.opt2.hide(),
            this.$.opt3.hide(),
            this.$.ibuy.setActive(!0),
            this.$.isell.setActive(!1),
            this.$.option3Opd.setSelected(1),
            this.$.option3Op.$.innerText.setContent("Use Entry Price")) : this.pbookingtype == 1 ? (this.resetOption2(),
                this.$.opt1.hide(),
                this.$.opt2.show(),
                this.$.opt3.hide(),
                this.$.ibuy.setActive(!1),
                this.$.isell.setActive(!0),
                this.$.option3Opd.setSelected(1),
                this.$.option3Op.$.innerText.setContent("Use Entry Price")) : this.pbookingtype == 2 && (this.resetOption3(),
                    this.$.opt1.hide(),
                    this.$.opt2.hide(),
                    this.$.opt3.show(),
                    this.$.ibuy.setActive(!0),
                    this.$.isell.setActive(!1))
    },
    calc: function () {
        try {
            var b = this.$.iprice.getValue()
                , d = this.$.ilot.getValue()
                , e = b * d * Const.lotSize
                , f = Store.ACC[this.$.itrdid.$.input.$.field.getValue()];
            f ? (b = 0,
                this.pbos == "1" ? (b = f[27],
                    e += b * e / 100) : (b = f[28],
                        e -= b * e / 100),
                this.$.ival.setValue(numformat(e))) : this.$.ival.setValue("")
        } catch (g) {
            this.$.ival.setValue("0")
        }
    },
    boardChanged: function (b, d) {
        d.originator.getActive() && (this.pboard = d.originator.kode,
            this.pboard == "TN" ? (this.$.iday.setActive(!1),
                this.$.ises.setActive(!0)) : (this.$.iday.setActive(!0),
                    this.$.ises.setActive(!1)))
    },
    typeChanged: function (b, d) {
        d.originator.getActive() && (this.ptype = d.originator.kode)
    },
    bosChanged: function (b, d) {
        d.originator.getActive() && (this.pbos = d.originator.kode,
            this.calculateGL())
    },
    stockChanged: function (b, d) {
        return d.datas && (d.datas.indexOf("-R") >= 0 ? (this.$.irg.setActive(!1),
            this.$.iday.setActive(!1),
            this.$.itn.setActive(!0),
            this.$.ises.setActive(!0)) : (this.$.itn.setActive(!1),
                this.$.ises.setActive(!1),
                this.$.irg.setActive(!0),
                this.$.iday.setActive(!0)),
            Router.send("onChangeQuote", d.datas),
            bridge.getObj("acc-ob").updateMe(d.datas),
            this.calculateGL()),
            !0
    },
    idChangedEvent: function (b, d) {
        if (d) {
            var e = Store.ACC[d.datas];
            e != null ? (this.$.itl.setContent(numformat(e[6])),
                this.$.x2.setContent(numformat(e[12]))) : (this.$.itl.setContent(0),
                    this.$.x2.setContent("0"));
            this.calculateGL()
        }
        return !0
    },
    calcPF: function (b) {
        for (var b = RegExp("^" + b, "i"), d = 0, e = 0, f; f = bridge.getObj("pf").getComp("wl").getDb()[e]; e++)
            f[1].match(b) && (d = d + f[15] + f[18]);
        return d
    },
    close: function () {
        this.animateToMax();
        this.clearinput()
    },
    open: function () {
        this.animateToMin();
        this.$.opt1.show();
        this.$.opt2.hide();
        this.$.opt3.hide();
        this.$.istock.$.input.$.field.focus();
        this.clearinput();
        this.resetOption1();
        var b = "";
        b += "Disclaimer Automatic Order BNI Sekuritas<br/><br/>";
        b += "Saya menyatakan, bahwa saya memahami dan menerima :<br/><br/>";
        b += "1.\tKriteria order yang tertera dalam fasilitas tersebut, termasuk ketentuan mengenai<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;Order berdasarkan Price dan %Unrealized Gain/Loss akan melakukan pengecekan<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;kriteria pada pukul 09.00 WIB,sedangkan instruksi transaksi yang timbul berdasarkan<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;Time tetap mengacu pada antrian transaksi Bursa Efek Indonesia dan proses pembentukan<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;harga pada saat pra-pembukaan yang dapat mempengaruhi instruksi transaksi.<br/>";
        b += "2.\tPotensi risiko yang timbul , termasuk risiko karena kegagalan koneksi serta kecepatan<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;transmisi transaksi.<br/>";
        b += "3.  Tidak akan menyalahgunakan fasilitas tersebut untuk melakukan praktek manipulasi pasar,<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;pencucian uang dan sarana pendanaan terorisme serta bertanggung jawab atas seluruh<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;penyelesaian transaksi yang terjadi.<br/>";
        b += "4.\tBahwa BNI Sekuritas tidak menjamin/menggaransi transaksi Order akan selalu match,<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;oleh sebab itu membebaskan BNI Sekuritas dari segala kerugian yang mungkin timbul.<br/>";
        b += "5.\tBahwa tidak akan menuntut dalam bentuk apapun dalam hal ini BNI Sekuritas<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;melakukan intervensi secara sepihak dan tanpa pemberitahuan terlebih dahulu<br/>";
        b += "&nbsp;&nbsp;&nbsp;&nbsp;apabila terjadi erroneous.<br/>";
        this.$.disclaimer.setContent(b);
        this.$.confirm2.show()
    },
    clearinput: function () {
        this.$.iprice.show();
        this.$.istock.$.input.$.field.setValue("");
        this.$.iprice.setValue("");
        this.$.ilot.setValue("");
        this.$.itrdid.$.input.$.field.setValue("");
        this.$.itl.setContent("");
        this.$.ival.setValue("");
        this.$.irg.setActive(!0);
        this.$.iday.setActive(!0);
        this.$.ibuy.setActive(!0);
        this.pboard = "RG";
        this.ptype = "1";
        this.pbos = "1";
        this.gain = !0;
        this.pbookingtype = 0;
        this.$.pin.setValue("");
        this.$.x2.setContent("0");
        this.$.d.setSelected(this.$.e.kode);
        this.$.ibookingtype.$.innerText.setContent(this.$.e.content);
        this.$.option3Opd.setSelected(1);
        this.$.option3Op.$.innerText.setContent("Use Entry Price");
        var b = bridge.getObj("clientengine").genTime();
        this.$.from.setValue(this.dateToStr(b));
        this.$.to.setValue(this.dateToStr(b));
        (b = Store.ACC[bridge.getObj("userid")]) && (this.$.itrdid.$.input.$.field.setValue(bridge.getObj("userid")),
            this.$.itl.setContent(numformat(b[6])),
            this.idChangedEvent(null, {
                datas: bridge.getObj("userid")
            }))
    },
    dateToStr: function (b) {
        try {
            var d = b.getMonth() + 1 + ""
                , d = d.length == 1 ? "0" + d : d
                , e = b.getDate() + "";
            return e = e.length == 1 ? "0" + e : e,
                e + "/" + d + "/" + b.getFullYear()
        } catch (f) {
            return ""
        }
    },
    strToDate: function (b) {
        try {
            var d, e, f, g;
            return g = b.split("/"),
                f = g[2],
                e = g[1],
                d = g[0],
                new Date(f, e - 1, d, 0, 0, 0)
        } catch (i) {
            return null
        }
    },
    formatDate: function (b) {
        try {
            var d = b.getMonth() + 1 + ""
                , d = d.length == 1 ? "0" + d : d
                , e = b.getDate() + "";
            return e = e.length == 1 ? "0" + e : e,
                b.getFullYear() + d + e
        } catch (f) {
            return ""
        }
    },
    daysBetween: function (b, d) {
        return (d.getTime() - b.getTime()) / 864E5
    },
    onValidate: function (b) {
        if (cryptoMD5.en(this.$.pin.getValue()) != bridge.getObj("pin"))
            return enyo.Signals.send("onError", "invalid PIN"),
                !1;
        if (!Store.SEC[b[1]] && b[1] == "")
            return enyo.Signals.send("onError", isTablet() ? "please enter valid stock" : "please<br/>enter valid stock"),
                !1;
        var d = Store.SEB[b[1] + b[9]];
        if (!d || d[3] != "1")
            return enyo.Signals.send("onError", isTablet() ? "cannot trading this stock for current board" : "cannot trading this stock<br/> for current board"),
                !1;
        if (b[2] == 0) {
            if (b[3][2] == "" || b[3][2] <= 0)
                return enyo.Signals.send("onError", isTablet() ? "price condition must be greater then zero" : "price condition<br/> must be greater then zero"),
                    !1
        } else if (b[2] == 1) {
            if (b[4][2] == "" || b[4][2] <= 0)
                return enyo.Signals.send("onError", isTablet() ? "condition% must be greater then zero" : "condition%<br/> must be greater then zero"),
                    !1
        } else if (b[5][0] == 0) {
            b[5][1] = this.replaceTime(b[5][1]);
            if (!this.testTime(b[5][1]))
                return enyo.Signals.send("onError", isTablet() ? "invalid format timer, please use HH:mm:ss" : "invalid format timer,<br/> please use HH:mm:ss"),
                    !1;
            var e = b[5][1].replace(":", "").replace(":", "");
            if (+e <= 9E4)
                return enyo.Signals.send("onError", isTablet() ? "invalid format timer, must be greater than 09:00:00" : "invalid format timer,<br/> must be greater than 09:00:00"),
                    this.$.option3Time.setValue("09:00:01"),
                    !1
        } else if (b[5][0] == 1 && Store.SEC[b[1]][5] == 0)
            return enyo.Signals.send("onError", isTablet() ? b[1] + " not Pre-opening stock" : b[1] + " not Pre-opening stock"),
                this.$.option3d.setSelected("2"),
                this.$.option3.$.innerText.setContent("Session 1"),
                !1;
        if (b[6] == "1") {
            d = Store.ACC[b[0]];
            if (!d)
                return enyo.Signals.send("onError", isTablet() ? "please enter valid Account" : "please<br/> enter valid Account"),
                    !1;
            var f = Store.ASE[d[4] + b[1]];
            if (f == null)
                return d[4] == "70" ? (enyo.Signals.send("onError", isTablet() ? "transaksi anda ditolak<br/>karena terindikasi riba" : "transaksi anda ditolak<br/>karena terindikasi riba"),
                    !1) : (enyo.Signals.send("onError", isTablet() ? "cannot buying this stock<br/>for current acc type" : "cannot buying this stock<br/>for current acc type"),
                        !1);
            if (f[2] == "0")
                return d[4] == "70" ? (enyo.Signals.send("onError", isTablet() ? "transaksi anda ditolak<br/>karena terindikasi riba" : "transaksi anda ditolak<br/>karena terindikasi riba"),
                    !1) : (enyo.Signals.send("onError", isTablet() ? "cannot buying this stock<br/>for current acc type" : "cannot buying this stock<br/>for current acc type"),
                        !1)
        }
        if (b[2] == 2)
            if (b[5][0] == 1) {
                if (b[7] == "" || b[7] <= 0)
                    return enyo.Signals.send("onError", isTablet() ? "price must be greater than zero" : "price must be greater than zero"),
                        !1
            } else {
                if (b[5][2] == 1 && (b[7] == "" || b[7] <= 0))
                    return enyo.Signals.send("onError", isTablet() ? "price must be greater than zero" : "price must be greater than zero"),
                        !1
            }
        else if (b[7] == "" || b[7] <= 0)
            return enyo.Signals.send("onError", isTablet() ? "price must be greater than zero" : "price must be greater than zero"),
                !1;
        if (b[8] == "" || b[8] <= 0)
            return enyo.Signals.send("onError", isTablet() ? "lot must be greater than zero" : "lot must be greater than zero"),
                !1;
        d = Store.PRO[bridge.getObj("userid")];
        if (d[7] != "1")
            return enyo.Signals.send("onError", isTablet() ? "trading aborted, status user is inactive" : "trading aborted<br/>user is inactive"),
                !1;
        if (b[7] * b[8] * Const.lotSize > d[5])
            return enyo.Signals.send("onError", isTablet() ? "trading limit exceeded<br>max:" + d[5] : "trading limit exceeded<br>max:" + d[5]),
                !1;
        try {
            var g = this.strToDate(this.dateToStr(bridge.getObj("clientengine").genTime()))
                , i = this.strToDate(this.$.from.getValue())
                , e = this.strToDate(this.$.to.getValue());
            if (i == null || e == null || i.toString().toLowerCase() == "invalid date" || e.toString().toLowerCase() == "invalid date")
                return enyo.Signals.send("onError", "Invalid date parameter"),
                    !1;
            if (i.getTime() > e.getTime())
                return enyo.Signals.send("onError", "Invalid date parameter"),
                    !1;
            if (30 < this.daysBetween(i, e))
                return enyo.Signals.send("onError", "GTC range cannot be greater than 30 days"),
                    !1;
            if (i < g)
                return enyo.Signals.send("onError", "Invalid date parameter"),
                    !1
        } catch (j) {
            return enyo.Signals.send("onError", "Invalid date parameter"),
                !1
        }
        return !0
    },
    onEnter: function () {
        this.onEnterAction(0)
    },
    onEnterAction: function (b) {
        var d = [];
        this.checkTime();
        d.push(this.$.itrdid.$.input.$.field.getValue().toUpperCase());
        d.push(this.$.istock.$.input.$.field.getValue().toUpperCase());
        d.push(this.$.d.selected);
        d.push([this.$.option1d.selected, this.$.option1Opd.selected, this.$.option1Price.getValue()]);
        var e = this.$.option2Opd.selected;
        d.push([this.$.option2d.selected, e == 0 ? 2 : e == 1 ? 1 : 0, this.$.option2Price.getValue()]);
        d.push([this.$.option3d.selected, this.$.option3Time.getValue(), this.$.option3Opd.selected]);
        d.push(this.pbos);
        d.push(this.$.iprice.getValue());
        d.push(this.$.ilot.getValue());
        d.push(this.pboard);
        d.push(this.ptype);
        d.push(b);
        d.push(this.formatDate(this.strToDate(this.$.from.getValue())));
        d.push(this.formatDate(this.strToDate(this.$.to.getValue())));
        e = "";
        e = e + this.$.itrdid.$.input.$.field.getValue().toUpperCase() + "-";
        e = e + this.$.istock.$.input.$.field.getValue().toUpperCase() + ", ";
        this.$.d.selected == 0 ? (e = e + "If " + this.$.option1d.components[this.$.option1d.selected].content,
            e += this.$.option1Opd.components[this.$.option1Opd.selected].content,
            e = e + this.$.option1Price.getValue() + " ") : this.$.d.selected == 1 ? (e = e + "If " + this.$.option2d.components[this.$.option2d.selected].content,
                e += this.$.option2Opd.components[this.$.option2Opd.selected].content,
                e = e + this.$.option2Price.getValue() + "%(@" + this.$.option2info.content + ")") : this.$.option3d.selected == 0 ? e = e + "If time=" + this.$.option3Time.getValue() + " " : e = e + "If " + this.$.option3d.components[this.$.option3d.selected].content + " ";
        e = e + "Then send " + (b == 0 ? "order " : "alert ");
        e += this.pbos == 1 ? "Buy " : "Sell ";
        e = e + this.$.ilot.getValue() + " lot@" + (this.$.iprice.getValue() == 0 ? "bestprice" : this.$.iprice.getValue());
        e = e + " (" + this.pboard + "-" + (this.ptype == 1 ? "Day" : "Session") + ")";
        e = e + " valid(" + this.$.from.getValue() + "-" + this.$.to.getValue() + ")";
        console.log(e);
        d.push(e);
        if (!this.onValidate(d))
            return !0;
        b = {};
        b.param = d;
        b.cmd = "createorder";
        this.$.confirm.order = b;
        this.$.confirm.show()
    },
    onEnterAlert: function () {
        this.onEnterAction(1)
    },
    onOK: function () {
        this.$.confirm.hide();
        Router.send("onAlgoOrder", this.$.confirm.order.param);
        this.clearinput();
        this.close()
    },
    onAgree: function () {
        this.$.confirm2.hide()
    },
    onDisagree: function () {
        this.$.confirm2.hide();
        this.close()
    },
    onCancel: function () {
        this.$.confirm.hide()
    },
    toggle: function () {
        this.isAtMin() ? this.animateToMax() : this.animateToMin()
    }
});
enyo.kind({
    name: "zaisan.pnlchangeorder",
    kind: "enyo.Slideable",
    style: "overflow: hidden;position:fixed",
    classes: "f16 bold",
    max: 230,
    value: 230,
    unit: "%",
    events: {
        onRowSelect: ""
    },
    create: function () {
        this.inherited(arguments);
        this.$.iprice.afterValidate = enyo.bind(this, this.calc);
        this.$.ilot.afterValidate = enyo.bind(this, this.calc);
        this.order = null;
        bridge.addObj("amd", this)
    },
    changeTitle: function (b) {
        this.order = b;
        this.$.gh.setContent(b[4] == "1" ? "Amend Buy" : "Amend Sell");
        this.$.istock.setValue(b[3] + "/" + b[1]);
        this.$.ioldprice.setValue(numformat(b[5]) + "/" + numformat(b[6]));
        this.$.ioldval.setValue(numformat(b[7]));
        this.$.iprice.setValue(b[5]);
        this.$.ilot.setValue(b[6]);
        this.$.ival.setValue(numformat(b[7]));
        var d = Store.ACC[b[1]];
        d ? this.$.itl.setValue(numformat(d[6])) : this.$.itl.setValue(0);
        this.$.gh.removeClass("green-box");
        this.$.gh.removeClass("red-box");
        this.$.gh.addClass(b[4] == "1" ? "red-box" : "green-box");
        d = [];
        d.from = "wlv";
        d.datas = b[3];
        d.dlg = !0;
        this.doRowSelect(d)
    },
    components: [{
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            fit: !0,
            style: "position: relative;",
            components: [{
                name: "entry",
                kind: "Scroller",
                classes: "enyo-fit",
                components: [{
                    kind: "onyx.Groupbox",
                    classes: "settings",
                    components: [{
                        name: "gh",
                        kind: "onyx.GroupboxHeader",
                        content: "Amend Order",
                        classes: "pnl bold medium2"
                    }, {
                        name: "istock",
                        kind: "LabeledItem",
                        label: "Stock/TrdId",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        name: "ioldprice",
                        kind: "LabeledItem",
                        label: "Price/Lot",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        name: "ioldval",
                        kind: "LabeledItem",
                        label: "Value",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        name: "itl",
                        kind: "LabeledItem",
                        label: "TL",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }, {
                        name: "iprice",
                        kind: "LabeledItem2",
                        label: "New Price",
                        type: "number",
                        style: "height:2em;"
                    }, {
                        name: "ilot",
                        kind: "LabeledItem2",
                        label: "New Lot",
                        type: "number",
                        style: "height:2em;"
                    }, {
                        name: "pin",
                        kind: "LabeledItem2",
                        label: "PIN",
                        type: "password",
                        style: "height:2em;"
                    }, {
                        name: "ival",
                        kind: "LabeledItem",
                        label: "New Value",
                        defaultKind: "Control",
                        cls: "label-input-width right"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "settings medium",
                    components: [{
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "Send",
                        ontap: "onEnter"
                    }, {
                        style: "width:.02em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Cancel",
                        ontap: "toggle"
                    }]
                }, {
                    kind: "FittableRows",
                    allowHtml: !0,
                    content: "&nbsp;&nbsp;"
                }]
            }]
        }]
    }, {
        name: "confirm",
        kind: "onyx.Popup",
        centered: !0,
        autoDismiss: !1,
        modal: !0,
        floating: !0,
        style: "position:fixed; padding: 2em;",
        classes: "bold shadow",
        scrim: !1,
        components: [{
            kind: "FittableRows",
            style: "width:18em;",
            components: [{
                name: "ii2",
                allowHtml: !0,
                content: "are you sure to amend this order?"
            }, {
                kind: "FittableColumns",
                style: "height:1.5em;",
                classes: "medium2",
                components: [{
                    fit: !0
                }, {
                    style: "width:.5em;"
                }, {
                    name: "trdLoginBtn",
                    kind: "onyx.Button",
                    content: "ok",
                    ontap: "onOK"
                }, {
                    style: "width:.2em;"
                }, {
                    name: "trdCancelBtn",
                    kind: "onyx.Button",
                    content: "cancel",
                    ontap: "onCancel"
                }]
            }]
        }]
    }],
    stockChanged: function () {
        var b = {};
        b.datas = o[3];
        b.from = "wlv";
        this.doRowSelect(b)
    },
    close: function () {
        this.animateToMax()
    },
    open: function () {
        this.animateToMin();
        this.$.iprice.focus()
    },
    clearinput: function () {
        this.$.pin.setValue("")
    },
    onValidate: function (b) {
        if (b[1] > 0 && b[2] > 0) {
            var d = b[0][8];
            if (d != "1" && d != "0")
                return enyo.Signals.send("onError", isTablet() ? "cannot amend this order<br/>status has been changed" : "cannot amend this order<br/>order status has been changed"),
                    !1;
            if (this.order[5] == b[1] && this.order[6] == b[2])
                return enyo.Signals.send("onError", isTablet() ? "invalid input" : "invalid input"),
                    !1;
            if (b[2] > this.order[6])
                return enyo.Signals.send("onError", isTablet() ? "invalid input for qty" : "invalid input for qty"),
                    !1;
            if (b[2] <= this.order[10])
                return enyo.Signals.send("onError", isTablet() ? "invalid input for qty" : "invalid input for qty"),
                    !1;
            d = Store.PRO[bridge.getObj("userid")];
            return d[7] == "0" ? (enyo.Signals.send("onError", isTablet() ? "user is inactive" : "user is inactive"),
                !1) : b[1] * b[2] * Const.lotSize > d[5] ? (enyo.Signals.send("onError", isTablet() ? "trading limit exceeded<br>max:" + d[5] : "trading limit exceeded<br>max:" + d[5]),
                    !1) : !0
        }
        return enyo.Signals.send("onError", isTablet() ? "invalid input" : "invalid input"),
            !1
    },
    calc: function () {
        try {
            var b = this.$.iprice.getValue()
                , d = this.$.ilot.getValue();
            this.$.ival.setValue(numformat(b * d * Const.lotSize))
        } catch (e) {
            this.$.ival.setValue("0")
        }
    },
    onEnter: function (b, d) {
        if (cryptoMD5.en(this.$.pin.getValue()) != bridge.getObj("pin"))
            return enyo.Signals.send("onError", "invalid PIN"),
                !0;
        var e = [];
        e.push(this.order);
        e.push(this.$.iprice.getValue() * 1);
        e.push(this.$.ilot.getValue() * 1);
        if (!this.onValidate(e))
            return !0;
        d.param = e;
        d.cmd = "replaceorder";
        this.$.confirm.order = d;
        this.$.confirm.show()
    },
    onOK: function () {
        this.$.confirm.hide();
        Router.send("onAmend", this.$.confirm.order.param);
        this.clearinput();
        this.close()
    },
    onCancel: function () {
        this.$.confirm.hide()
    },
    toggle: function () {
        this.isAtMin() ? this.animateToMax() : (this.animateToMin(),
            this.$.iprice.focus())
    }
});
enyo.kind({
    name: "zaisan.pnllock",
    kind: "onyx.Popup",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "bold white bg-bar pnl pullout-lock",
    scrim: !0,
    param: [],
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnllock", this)
    },
    components: [{
        kind: "FittableRows",
        components: [{
            name: "ii",
            allowHtml: !0,
            content: ""
        }, {
            kind: "FittableColumns",
            style: "height:1.5em;",
            classes: "medium2",
            components: [{
                name: "entry2",
                kind: "onyx.InputDecorator",
                fit: !0,
                alwaysLooksFocused: !0,
                components: [{
                    name: "i",
                    kind: "onyx.Input",
                    type: "password",
                    placeholder: "Password",
                    classes: "enyo-selectable",
                    onchange: "onUnl"
                }]
            }, {
                style: "width:.5em;"
            }, {
                kind: "onyx.Button",
                content: "unlock",
                ontap: "onUnl"
            }]
        }]
    }],
    reset: function () {
        this.$.i.setValue("")
    },
    show: function (b) {
        this.param = b;
        this.$.ii.setContent("this application has been locked,<br/>only " + this.param[0].toUpperCase() + " can unlock the application<br/><br/>");
        this.reset();
        this.inherited(arguments);
        this.$.i.focus()
    },
    hide: function () {
        this.reset();
        this.inherited(arguments)
    },
    onUnl: function () {
        this.$.i.getValue() == this.param[1] ? (this.hide(),
            document.activeElement.blur()) : enyo.Signals.send("onError", "invalid password");
        this.$.i.setValue("")
    }
});
enyo.kind({
    name: "zaisan.pnlregis",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:80%; width:800px;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-normal",
    scrim: !0,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        var b = {};
        b.show = enyo.bind(this, this.show);
        b.close = enyo.bind(this, this.close);
        bridge.addObj("pnlregis", b)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "Registration",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill",
                style: "border: none;background-color: #FFFFFF;"
            }]
        }]
    }, {
        style: "height:.5em;"
    }],
    show: function () {
        this.inherited(arguments);
        this.refreshMe()
    },
    refreshMe: function () {
        this.$.iframe.setSrc(Const._urlregonline)
    },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    }
});
enyo.kind({
    name: "zaisan.pnltrial",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:80%; width:800px;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-normal",
    scrim: !0,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        var b = {};
        b.show = enyo.bind(this, this.show);
        b.close = enyo.bind(this, this.close);
        bridge.addObj("pnltrial", b)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "Free Trial",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill",
                style: "border: none;background-color: #FFFFFF;"
            }]
        }]
    }, {
        style: "height:.5em;"
    }],
    show: function () {
        this.inherited(arguments);
        this.refreshMe()
    },
    refreshMe: function () {
        this.$.iframe.setSrc(Const._urlfreetrial)
    },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    }
});
enyo.kind({
    name: "zaisan.pnlpromo",
    kind: "onyx.Popup",
    style: "position:fixed; padding: 1em; height:90%; width:90%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable onyx rows bg-normal",
    scrim: !0,
    realtime: !1,
    siap: !1,
    fromShow: !1,
    myX: 0,
    myY: 0,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlpromo", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "PROMO",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                name: "iframe",
                tag: "iframe",
                classes: "enyo-fill",
                style: "border: none;"
            }]
        }]
    }, {
        kind: "Broadcast",
        onLoginOK: "onLoginOK",
        onLogoutOK: "onLogoutOK"
    }, {
        style: "height:.5em;"
    }],
    onLoginOK: function () { },
    onLogoutOK: function () {
        this.close()
    },
    show: function (b) {
        this.inherited(arguments);
        this.siap ? (this.fromShow = !1,
            this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100)) : (this.siap = !0,
                this.urlChanged())
    },
    close: function (b, d) {
        this.hide();
        this.fromShow = !0;
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    },
    resizeHandler: function (b, d) {
        this.inherited(arguments);
        this.fromShow || setTimeout(enyo.bind(this, this.urlChanged, !1), 100);
        this.fromShow = !1
    },
    rendered: function () {
        this.inherited(arguments)
    },
    urlChanged: function () {
        if (Math.abs(this.myX - this.getBounds().width) > 4 || Math.abs(this.myY - this.getBounds().height))
            this.myX = this.getBounds().width,
                this.myY = this.getBounds().height,
                this.$.iframe.setSrc(Const._urlpromo + "?v=1.0&width=" + (this.getBounds().width - 30) + "&height=" + (this.getBounds().height - 70))
    },
    changeQuote: function () {
        var b = localStorage.getItem("__H.rymnz_v1.0__cc.StockChooser.selectedStock");
        (b != null || b != "") && Store.stock[b] && Router.send("onChangeQuote", b)
    },
    onBuy: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowBuy")
    },
    onSell: function () {
        this.changeQuote();
        this.close();
        Router.send("onShowSell")
    }
});
enyo.kind({
    name: "zaisan.pnldisclaimer",
    kind: "onyx.Popup",
    style: "padding: 1em; position:fixed; height:80%; width:80%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal defaultcolor",
    scrim: !0,
    realtime: !1,
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnldisclaimer", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark medium2 bold white line",
            components: [{
                name: "tcontent",
                content: "Disclaimer",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            fit: !0,
            components: [{
                kind: "Scroller",
                touch: !0,
                classes: "enyo-fit",
                fit: !0,
                components: [{
                    classes: "header",
                    name: "pr",
                    style: "padding:1em;",
                    allowHtml: !0,
                    content: "<div><b>Disclaimer</b><br/><br/></div><div>Terms of use<br/><div><div>By accessing this site, you agree to the following terms of use relating to this site and any material in it.</div> <div>Ownership of site and intellectual property rights </div><div>This site is owned and maintained by BNI Sekuritas ('BNI Sekuritas'). BNI Sekuritas is the organisation and trade name used by Bank BNI 46 and certain of its subsidiaries for the conduct of international corporate, securities and investment business. Unless otherwise indicated, all intellectual property rights (including copyright and database rights) in trademarks, service marks, logos, and all other material displayed at this site belong to BNI Sekuritas. BNI Sekuritas reserves all rights with respect thereto and will enforce such rights to the full extent of the law. Nothing at this site constitutes a licence or right to use any image, trademark, service mark, logo, or any other material displayed at the site by any person. Material may not be reproduced, distributed or published by any person for any purpose without the prior written consent of BNI Sekuritas. No act of downloading or otherwise copying from this site will transfer title to any software or material at this site to any person. Anything transmitted to this site becomes the property of BNI Sekuritas, may be used for BNI Sekuritas for any lawful purpose, and may be disclosed by BNI Sekuritas as it deems appropriate, including to any legal or regulatory authority. You are responsible for complying with any laws and regulations which apply to you.</div><div><br/><br/>Worldwide Dealing Restrictions<br/></div><div>Investment in any financial instrument, transaction, product or service referred to at this site may involve significant risk, may not be available in or appropriate for use in all jurisdictions, and may not be suitable for all investors. The value of, or income from, any financial instruments referred to at this site may fluctuate and/or be affected by changes in exchange rates. Past performance is not indicative of future results. Investors should make their own investment decisions without relying on material at this site. Only investors with sufficient knowledge and experience in financial and business matters to evaluate the relevant merits and risks should consider any investment discussed at this site.</div><div>No offer for financial instruments -- no reliance -- disclaimer and disclosure of interest None of the materials at this site constitute an offer or solicitation for the purchase or sale of any financial instrument. In particular, any prices or valuations displayed at this site are indicative only and do not constitute an offer by BNI Sekuritas to buy or sell any financial instrument at such price. While reasonable care has been taken to ensure that the information contained herein is not untrue at the time it was published, BNI Sekuritas makes no representation as to its accuracy or completeness. The materials at this site are subject to change without notice. BNI Sekuritas and any of its officers or employees may, to the extent permitted by law, have a position or otherwise be interested (including purchasing or selling to its clients on a principal basis) in any transactions, in any investments (including derivatives) directly or indirectly mentioned at this site. BNI Sekuritas may perform investment banking or other services (including acting as adviser, manager or lender) for, or solicit investment banking or other business from, any company mentioned at this site.</div><div><br/><br/>Linked Sites<br/></div><div>BNI Sekuritas has not reviewed any of the sites linked to this site, and is not responsible for the content of off-site pages or any other site linked or linking to this site.</div><div><br/><br/>No Warranty<br/></div><div>No warranty is given in respect of material provided at this site. BNI Sekuritas accepts no responsibility for, and makes no warranties that, functions contained at this site will be uninterrupted or error-free, or that errors will be corrected. Neither BNI Sekuritas nor any of its officers and employees accepts any liability for any direct or consequential loss arising from any use of this site or its contents, including any harm or defects caused to your computer as a result of access and use of the server that makes this site available. Applicable Law These terms of use are to be construed in accordance with the laws of Republic of Indonesia.</div><div><br/><br/>Data Bursa Efek Indonesia<br/></div><div>BNI Sekuritas telah mendapatkan persetujuan dari PT Bursa Efek Indonesia (BEI) untuk menampilkan data BEI berupa data Index secara real time, Top Active, Top Gainers, Top Losers, Top Frequency, Top Value dan Top Volume secara tertunda (delayed) selama 10 (sepuluh) menit pada website BNI Sekuritas.</div>"
                }]
            }]
        }]
    }, {
        style: "height:.5em;"
    }],
    show: function (b) {
        this.inherited(arguments);
        this.refreshMe()
    },
    refreshMe: function () { },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    }
});
enyo.kind({
    name: "zaisan.pnlchgpwd",
    kind: "enyo.Slideable",
    style: "overflow: hidden;position:fixed",
    max: 100,
    value: 100,
    unit: "%",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlchgpwd", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            fit: !0,
            style: "position: relative;",
            components: [{
                name: "entry",
                kind: "Scroller",
                classes: "enyo-fit",
                components: [{
                    kind: "onyx.Groupbox",
                    classes: "settings",
                    components: [{
                        kind: "onyx.GroupboxHeader",
                        content: "Change Password",
                        classes: "pnl bold"
                    }, {
                        name: "user",
                        kind: "LabeledItem",
                        label: "Userid",
                        defaultKind: "Control",
                        cls: "label-input-width"
                    }, {
                        name: "passold",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "pass",
                        type: "password"
                    }, {
                        name: "passnew1",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "new pass",
                        type: "password"
                    }, {
                        name: "passnew2",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "retype",
                        type: "password"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "settings",
                    components: [{
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "Change",
                        ontap: "onEnter"
                    }, {
                        style: "width:.01em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Cancel",
                        ontap: "toggle"
                    }]
                }]
            }]
        }]
    }],
    onEnter: function () {
        var b = bridge.getObj("userid")
            , d = this.$.passold.getValue()
            , e = this.$.passnew1.getValue()
            , f = this.$.passnew2.getValue();
        b == "" || d == "" || e == "" || f == "" ? enyo.Signals.send("onError", isTablet() ? "please enter valid entry" : "please<br/>enter valid entry") : e.length < 6 ? enyo.Signals.send("onError", "new PASS length must be greater than 6") : cryptoMD5.en(d) != bridge.getObj("pass") ? enyo.Signals.send("onError", "invalid password") : e != f || void 0 == e ? enyo.Signals.send("onError", "invalid new password") : (this.toggle(),
            Router.send("onChgPwd", [b, d, e]))
    },
    close: function () {
        this.animateToMax()
    },
    toggle: function () {
        this.isAtMax() ? (this.$.user.setValue(bridge.getObj("userid")),
            this.animateToMin(),
            this.$.passold.focus()) : (this.animateToMax(),
                this.$.user.setValue(bridge.getObj("userid")),
                this.$.passold.setValue(""),
                this.$.passnew1.setValue(""),
                this.$.passnew2.setValue(""),
                this.$.passold.focus())
    }
});
enyo.kind({
    name: "zaisan.pnlpin",
    kind: "onyx.Popup",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "bold  white bg-bar pnl pullout-lock",
    scrim: !0,
    userid: "",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlpin", this)
    },
    components: [{
        kind: "FittableRows",
        style: "width:22em;",
        components: [{
            name: "ii2",
            allowHtml: !0,
            content: ""
        }, {
            kind: "FittableColumns",
            style: "height:1.5em;",
            classes: "medium2",
            components: [{
                name: "entry2",
                kind: "onyx.InputDecorator",
                fit: !0,
                alwaysLooksFocused: !0,
                components: [{
                    name: "i2",
                    kind: "onyx.Input",
                    type: "password",
                    placeholder: "PIN",
                    classes: "enyo-selectable"
                }]
            }, {
                style: "width:.5em;"
            }, {
                name: "trdLoginBtn",
                kind: "onyx.Button",
                content: "Login",
                ontap: "onOK"
            }, {
                style: "width:.2em;"
            }, {
                name: "trdCancelBtn",
                kind: "onyx.Button",
                content: "Cancel",
                ontap: "hide"
            }]
        }]
    }],
    reset: function () {
        this.$.i2.setValue("");
        this.$.i2.setDisabled(!1);
        this.$.trdLoginBtn.setDisabled(!1);
        this.$.trdCancelBtn.setDisabled(!1)
    },
    onError: function () {
        this.$.ii2.setContent("invalid PIN number, try again");
        this.reset()
    },
    setStatus: function (b) {
        this.$.ii2.setContent(b)
    },
    show: function (b) {
        this.userid = b;
        this.$.ii2.setContent(b.toUpperCase() + ", please enter your PIN<br/>");
        this.reset();
        this.inherited(arguments);
        this.$.i2.focus()
    },
    hide: function (b, d) {
        this.reset();
        this.inherited(arguments);
        try {
            d.preventDefault()
        } catch (e) { }
    },
    onOK: function () {
        this.$.i2.getValue() == "" ? enyo.Signals.send("onError", "please enter valid PIN") : (this.$.ii2.setContent("please wait..."),
            this.$.i2.setDisabled(!0),
            this.$.trdLoginBtn.setDisabled(!0),
            this.$.trdCancelBtn.setDisabled(!0),
            Router.send("onTrdLogin", [this.userid.toUpperCase(), cryptoMD5.en(this.$.i2.getValue())]))
    }
});
enyo.kind({
    name: "zaisan.pnlchgpin",
    kind: "enyo.Slideable",
    style: "overflow: hidden;position:fixed",
    max: 100,
    value: 100,
    unit: "%",
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlchgpin", this)
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            fit: !0,
            style: "position: relative;",
            components: [{
                name: "entry",
                kind: "Scroller",
                classes: "enyo-fit",
                components: [{
                    kind: "onyx.Groupbox",
                    classes: "settings",
                    components: [{
                        kind: "onyx.GroupboxHeader",
                        content: "Change PIN",
                        classes: "pnl bold"
                    }, {
                        name: "user",
                        kind: "LabeledItem",
                        label: "Userid",
                        defaultKind: "Control",
                        cls: "label-input-width"
                    }, {
                        name: "passold",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "pass",
                        type: "password"
                    }, {
                        name: "passnew1",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "new pass",
                        type: "password"
                    }, {
                        name: "passnew2",
                        kind: "LabeledItem2",
                        style: "height:2em;",
                        label: "retype",
                        type: "password"
                    }]
                }, {
                    kind: "FittableColumns",
                    classes: "settings",
                    components: [{
                        fit: !0
                    }, {
                        kind: "onyx.Button",
                        content: "Change",
                        ontap: "onEnter"
                    }, {
                        style: "width:.01em;"
                    }, {
                        kind: "onyx.Button",
                        content: "Cancel",
                        ontap: "onClose"
                    }]
                }]
            }]
        }]
    }],
    onEnter: function () {
        var b = bridge.getObj("userid")
            , d = this.$.passold.getValue()
            , e = this.$.passnew1.getValue()
            , f = this.$.passnew2.getValue();
        b == "" || d == "" || e == "" || f == "" ? enyo.Signals.send("onError", isTablet() ? "please enter valid entry" : "please<br/>enter valid entry") : e.length < 6 ? enyo.Signals.send("onError", "new PIN length must be greater than 6") : this.isvalidpass(e) ? cryptoMD5.en(d) != bridge.getObj("pin") ? enyo.Signals.send("onError", "invalid PIN") : e != f || void 0 == e ? enyo.Signals.send("onError", "invalid new PIN") : (this.toggle(),
            Router.send("onChgPIN", [bridge.getObj("userid"), d, e, f])) : enyo.Signals.send("onError", "Rejected, please combine your PIN with letters and numbers")
    },
    isvalidpass: function (b) {
        var d = /.*[a-zA-Z].*/;
        return /.*[0-9].*/.test(b) && d.test(b)
    },
    close: function () {
        this.animateToMax()
    },
    onClose: function (b, d) {
        try {
            bridge.getObj("98") == "1" ? enyo.Signals.send("onError", "you should change your PIN") : this.toggle()
        } catch (e) {
            this.animateToMin()
        }
        try {
            d.preventDefault()
        } catch (f) { }
    },
    showMe: function () {
        this.$.user.setValue(bridge.getObj("userid"));
        this.$.passold.setValue("");
        this.$.passnew1.setValue("");
        this.$.passnew2.setValue("");
        this.$.passold.focus();
        this.animateToMin()
    },
    toggle: function () {
        this.isAtMin() ? this.animateToMax() : this.animateToMin()
    },
    setUser: function (b) {
        this.$.user.setValue(b)
    }
});
enyo.kind({
    name: "zaisan.pnlcustinfo",
    kind: "onyx.Popup",
    style: "padding: 1em; position:fixed; height:90%; width:90%;",
    centered: !0,
    autoDismiss: !1,
    modal: !0,
    floating: !0,
    classes: "enyo-unselectable bg-normal defaultcolor normal",
    scrim: !0,
    realtime: !1,
    handlers: {
        onChgCus: "cusChangedEvent"
    },
    create: function () {
        this.inherited(arguments);
        bridge.addObj("pnlcustinfo", this)
    },
    show: function (b) {
        this.inherited(arguments);
        this.refreshMe()
    },
    refreshMe: function () {
        var b = Store.IDCUS[0];
        b ? (this.$.id.$.field.setValue(b),
            this.cusChangedEvent(this, {
                datas: b
            })) : this.reset()
    },
    close: function (b, d) {
        this.hide();
        if (d)
            try {
                d.preventDefault()
            } catch (e) { }
    },
    updateHeader: function (b) {
        this.$.name.setValue(b[1]);
        this.$.sid.setValue(b[2]);
        this.$.sex.setValue(b[3]);
        this.$.mstatus.setValue(b[4]);
        this.$.pdbirth.setValue(b[5] + "-" + b[6]);
        this.$.mname.setValue(b[7]);
        this.$.idtype.setValue(b[8] + "-" + b[9]);
        this.$.idexpdate.setValue(b[10]);
        this.$.religion.setValue(b[11]);
        this.$.npwp.setValue(b[12]);
        this.$.jobtype.setValue(b[13]);
        this.$.wplace.setValue(b[14]);
        this.$.pos.setValue(b[15]);
        this.$.spousename.setValue(b[16]);
        this.$.spousephone.setValue(b[17]);
        this.$.itype.setValue(b[18]);
        this.$.ctype.setValue(b[19] + "-" + b[20]);
        this.$.kpei.setValue(b[21]);
        this.$.lobusiness.setValue(b[22]);
        this.$.sbusiness.setValue(b[23]);
        this.$.bkpm.setValue(b[24] + "-" + b[25]);
        this.$.tax.setValue(b[26]);
        this.$.cform.setValue(b[27]);
        this.$.cdate.setValue(b[28]);
        this.$.cno.setValue(b[29]);
        this.$.dpower.setValue(b[30]);
        this.$.mbtn.setValue(b[31]);
        this.$.cperson.setValue(b[32]);
        this.$.street.setValue(b[33]);
        this.$.housing.setValue(b[34]);
        this.$.village.setValue(b[35]);
        this.$.subdistrict.setValue(b[36]);
        this.$.city.setValue(b[37]);
        this.$.province.setValue(b[38]);
        this.$.bank.setValue(b[39]);
        this.$.bankno.setValue(b[40]);
        this.$.bankname.setValue(b[41]);
        this.$.country.setValue(b[42]);
        this.$.zipcode.setValue(b[43]);
        this.$.fax.setValue(b[44]);
        this.$.phone.setValue(b[45]);
        this.$.mphone.setValue(b[46]);
        this.$.email.setValue(b[47]);
        for (key in Store.ACC)
            Store.ACC[key][2] == b[0] && this.$.ls.addItem(Store.ACC[key])
    },
    reset: function () {
        this.$.name.setValue("-");
        this.$.sid.setValue("-");
        this.$.sex.setValue("-");
        this.$.mstatus.setValue("-");
        this.$.pdbirth.setValue("-");
        this.$.mname.setValue("-");
        this.$.idtype.setValue("-");
        this.$.idexpdate.setValue("-");
        this.$.religion.setValue("-");
        this.$.npwp.setValue("-");
        this.$.jobtype.setValue("-");
        this.$.wplace.setValue("-");
        this.$.pos.setValue("-");
        this.$.spousename.setValue("-");
        this.$.spousephone.setValue("-");
        this.$.itype.setValue("-");
        this.$.ctype.setValue("-");
        this.$.kpei.setValue("-");
        this.$.lobusiness.setValue("-");
        this.$.sbusiness.setValue("-");
        this.$.bkpm.setValue("-");
        this.$.tax.setValue("-");
        this.$.cform.setValue("-");
        this.$.cdate.setValue("-");
        this.$.cno.setValue("-");
        this.$.dpower.setValue("-");
        this.$.mbtn.setValue("-");
        this.$.cperson.setValue("-");
        this.$.street.setValue("-");
        this.$.housing.setValue("-");
        this.$.village.setValue("-");
        this.$.subdistrict.setValue("-");
        this.$.city.setValue("-");
        this.$.province.setValue("-");
        this.$.country.setValue("-");
        this.$.zipcode.setValue("-");
        this.$.fax.setValue("-");
        this.$.phone.setValue("-");
        this.$.mphone.setValue("-");
        this.$.email.setValue("-");
        this.$.bank.setValue("-");
        this.$.bankno.setValue("-");
        this.$.bankname.setValue("-");
        this.$.ls.removeAll();
        this.$.ls.refreshList()
    },
    queryData: function (b) {
        this.mod || (this.mod = new mod.custinfo(this));
        this.mod.filter = "CI#" + b;
        this.mod.doRestart()
    },
    cusChangedEvent: function (b, d) {
        d && (Store.CUS[d.datas] ? (this.reset(),
            this.queryData(d.datas)) : this.reset());
        return !0
    },
    components: [{
        name: "n",
        kind: "FittableRows",
        classes: "enyo-fit",
        components: [{
            name: "t",
            kind: "FittableColumns",
            classes: "rows2 bg-dark bold white line",
            components: [{
                name: "tcontent",
                content: "Customer Info",
                classes: "texts",
                fit: !0
            }, {
                fit: !0
            }, {
                name: "r",
                kind: "onyx.Button",
                content: "close",
                ontap: "close"
            }]
        }, {
            kind: "FittableRows",
            classes: "small pnl bg-normal2",
            fit: !0,
            components: [{
                kind: "Scroller",
                touch: !0,
                classes: "enyo-fit",
                fit: !0,
                components: [{
                    kind: "FittableColumns",
                    fit: !0,
                    components: [{
                        kind: "FittableRows",
                        classes: "grid33 pnl",
                        components: [{
                            kind: "FittableColumns",
                            classes: "btm-spacer",
                            components: [{
                                content: "Cust ID",
                                classes: "grid30"
                            }, {
                                name: "id",
                                kind: "onyx.ddCUS",
                                classes: "enyo-selectable grid70",
                                style: "height:2.25em;"
                            }]
                        }, {
                            kind: "staticfield",
                            name: "name",
                            label: "Name",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "sid",
                            label: "SID",
                            value: "-"
                        }, {
                            content: "Personal",
                            classes: "medium2 line grid100 btm-spacer"
                        }, {
                            kind: "staticfield",
                            name: "sex",
                            label: "Sex",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "mstatus",
                            label: "Marital status",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "pdbirth",
                            label: "Place/Date birth",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "mname",
                            label: "Mother's name",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "idtype",
                            label: "ID Type/No",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "idexpdate",
                            label: "Expire date",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "religion",
                            label: "Religion",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "npwp",
                            label: "NPWP",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "jobtype",
                            label: "Job type",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "wplace",
                            label: "Working place",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "pos",
                            label: "Position",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "spousename",
                            label: "Spouse's name",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "spousephone",
                            label: "Spouse's phone",
                            value: "-"
                        }]
                    }, {
                        kind: "FittableRows",
                        classes: "grid33 pnl",
                        components: [{
                            kind: "staticfield",
                            name: "itype",
                            label: "Investor type",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "ctype",
                            label: "Customer type",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "kpei",
                            label: "Sub Acc KPEI",
                            value: "-"
                        }, {
                            content: "Business",
                            classes: "medium2 line grid100 btm-spacer"
                        }, {
                            kind: "staticfield",
                            name: "lobusiness",
                            label: "Line of business",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "sbusiness",
                            label: "Status (is PMA)",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "bkpm",
                            label: "BKPM No & Date",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "tax",
                            label: "Tax No",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "cform",
                            label: "Company Form",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "cdate",
                            label: "Date of establishment",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "cno",
                            label: "Deed of establishment No",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "dpower",
                            label: "Date of power of attorney",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "mbtn",
                            label: "Made before the notary",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "cperson",
                            label: "Contact person",
                            value: "-"
                        }]
                    }, {
                        kind: "FittableRows",
                        classes: "grid33 pnl",
                        components: [{
                            content: "Contact",
                            classes: "medium2 line grid100 btm-spacer"
                        }, {
                            kind: "staticfield",
                            name: "street",
                            label: "Street name",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "housing",
                            label: "RT/RW/Housing",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "village",
                            label: "Village",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "subdistrict",
                            label: "Sub district",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "city",
                            label: "City",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "province",
                            label: "Province",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "country",
                            label: "Country",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "zipcode",
                            label: "Zip code",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "fax",
                            label: "Fax",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "phone",
                            label: "Phone",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "mphone",
                            label: "Mobile phone",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "email",
                            label: "Email",
                            value: "-"
                        }, {
                            content: "Bank Information",
                            classes: "medium2 line grid100 btm-spacer"
                        }, {
                            kind: "staticfield",
                            name: "bank",
                            label: "Bank",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "bankno",
                            label: "No",
                            value: "-"
                        }, {
                            kind: "staticfield",
                            name: "bankname",
                            label: "Name",
                            value: "-"
                        }]
                    }]
                }]
            }]
        }, {
            name: "ls",
            kind: "xtable",
            classes: "h-20 small bold",
            horz: "scroll",
            header: [{
                content: "TradingId",
                classes: "grid10"
            }, {
                content: "AccountId",
                classes: "grid10"
            }, {
                content: "AccType",
                classes: "grid10"
            }, {
                content: "Status",
                classes: "grid10"
            }, {
                content: "#Inv",
                classes: "grid10"
            }, {
                content: "#KSEI",
                classes: "grid10"
            }, {
                content: "RegisDate",
                classes: "grid10"
            }, {
                content: "Branch",
                classes: "grid15"
            }, {
                content: "Sales",
                classes: "grid15"
            }],
            rows: {
                name: "item",
                kind: "zaisan.rowCUSTI"
            }
        }]
    }, {
        kind: "Broadcast",
        onTrdLogoutOK: "onLogoutOK"
    }],
    onLogoutOK: function () {
        this.close()
    }
});
enyo.kind({
    name: "zaisan.rowCUSTI",
    layoutKind: "FittableRowsLayout",
    classes: "rows small f14 bold grid-container",
    components: [{
        kind: "FittableColumns",
        components: [{
            name: "a",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "b",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "c",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "d",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "e",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "f",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "g",
            allowHtml: !0,
            classes: "grid10 texts"
        }, {
            name: "i",
            allowHtml: !0,
            classes: "grid15 texts"
        }, {
            name: "j",
            allowHtml: !0,
            classes: "grid15 texts"
        }]
    }],
    update: function (b) {
        this.$.a.setContent(b[0]);
        this.$.b.setContent(b[1]);
        this.$.c.setContent(b[4]);
        this.$.d.setContent(b[15]);
        this.$.e.setContent(b[25] == "" ? "&nbsp;" : b[25]);
        this.$.f.setContent(b[26] == "" ? "&nbsp;" : b[26]);
        this.$.g.setContent(b[29]);
        this.$.i.setContent(b[30]);
        this.$.j.setContent(b[31])
    }
});
mod.brank = function (b) {
    var d = new core.Module([Const._topic + Const._brokerrank, Const._brokerrank, {
        selector: "field= 'VOL'"
    }, "VAL", "TB", Store.topbroker, !0, !1]);
    return d.getKeys = function (b) {
        return b[0]
    }
        ,
        d.onMessageSplit = function (d) {
            d = d[3];
            if (b.getDb().length == 20)
                for (var f = 0; f < d.length; f++)
                    b.updateRow(d[f], f);
            else
                b.removeAll(),
                    b.addAll(d)
        }
        ,
        d
}
    ;
mod.brokerbystock = function (b, d, e, f) {
    var g = new core.Module([Const._topic + Const._bbs, Const._bbs, {}, "BBNI#RG", "BBS", Store.bbs, !0, !0]);
    return g.getKeys = function (b) {
        return b[2]
    }
        ,
        g.onData = function (i) {
            try {
                var j = g.getKeys(i);
                i[0] = j;
                i.push(i[9] / Const.lotSize - i[13] / Const.lotSize);
                i.push(i[10] - i[14]);
                i.push(i[21] / Const.lotSize - i[25] / Const.lotSize);
                i.push(i[22] - i[26]);
                i.push(i[33] / Const.lotSize - i[37] / Const.lotSize);
                i.push(i[34] - i[38]);
                i.push("xx");
                i.push("xx");
                b && b.onlyAdd(i);
                d && d.onlyAdd(i);
                e && e.onlyAdd(i);
                f && f.onlyAdd(i)
            } catch (k) { }
        }
        ,
        g.begin = function () {
            b && b.refreshList();
            d && d.refreshList();
            e && e.refreshList();
            f && f.refreshList()
        }
        ,
        g
}
    ;
mod.stock = function () {
    var b = new core.Module([Const._topic + Const._stock, Const._stock, {}, "", "ST", Store.stock, !0, !1]);
    return b.getKeys = function (b) {
        return b[2]
    }
        ,
        b.onMessageSplit = function (d) {
            try {
                var e = b.getKeys(d)
                    , f = b.store[e];
                f ? (f[12] = d[12],
                    f[13] = d[13],
                    f[14] = d[14],
                    f[15] = d[15],
                    f[16] = d[16],
                    f[17] = d[17]) : (d.push(0),
                        d.push(0),
                        d.push(0),
                        b.store[e] = d);
                b.setDirty(!0);
                Store.stocklist.indexOf(e) == -1 && Store.stocklist.push(e)
            } catch (g) { }
        }
        ,
        b.dirtyOn = function () {
            Store.stocklist.sort()
        }
        ,
        b
}
    ;
mod.broker = function () {
    var b = new core.Module([Const._topic + Const._broker, Const._broker, {}, "", "BR", Store.broker, !0, !1]);
    return b.getKeys = function (b) {
        return b[2]
    }
        ,
        b.onMessageSplit = function (d) {
            try {
                var e = b.getKeys(d);
                b.store[e] = d;
                b.setDirty(!0);
                Store.brokerlist.push(e)
            } catch (f) { }
        }
        ,
        b.dirtyOn = function () {
            Store.brokerlist.sort()
        }
        ,
        b
}
    ;
mod.stockbybroker = function (b, d, e) {
    var f = new core.Module([Const._topic + Const._sbb, Const._sbb, {}, "NI#RG", "SBB", Store.sbb, !0, !0]);
    return f.kode = "VAL",
        f.temp = [],
        f.getKeys = function (b) {
            return b[2]
        }
        ,
        f.onData = function (g) {
            var i = f.getKeys(g);
            g[0] = i;
            g.push(g[9] / Const.lotSize - g[13] / Const.lotSize);
            g.push(g[10] - g[14]);
            g.push(g[21] / Const.lotSize - g[25] / Const.lotSize);
            g.push(g[22] - g[26]);
            g.push(g[33] / Const.lotSize - g[37] / Const.lotSize);
            g.push(g[34] - g[38]);
            d ? (b.onlyAdd(g),
                d.onlyAdd(g),
                e.onlyAdd(g)) : f.temp.push([g[0], g[5] / Const.lotSize, g[6], g[7]])
        }
        ,
        f.begin = function () {
            if (d)
                b.refreshList(),
                    d.refreshList(),
                    e.refreshList();
            else {
                var g = f.temp.slice(0)
                    , i = f.kode == "VOL" ? 1 : f.kode == "VAL" ? 2 : 3;
                g.sort(function (b, d) {
                    return (b[i] - d[i]) * -1
                });
                g = g.slice(0, 5);
                b.addAll(g);
                b.refreshList()
            }
        }
        ,
        f
}
    ;
mod.info = function () {
    var b = new core.Module([Const._topic + Const._info, Const._info, {}, "", Const._info, Store.info, !0, !1]);
    return b.getKeys = function (b) {
        return b[2] + b[3]
    }
        ,
        b.onMessageSplit = function (d) {
            try {
                b.store[0] = d,
                    b.store[1] = !0
            } catch (e) { }
        }
        ,
        b
}
    ;
mod.ss = function (b) {
    var d = new core.Module([Const._topic + Const._ss, Const._ss, {}, "RG", "SS", Store.ss, !0, !1]);
    return d.getKeys = function (b) {
        return b[2] + b[3]
    }
        ,
        d.onMessageSplit = function (b) {
            try {
                if (b[3] == "RG") {
                    var f = d.getKeys(b);
                    Store.ss[f] = b;
                    d.setDirty(!0);
                    for (var g = bridge.getObj("pf").getComp("wl").getDb(), f = 0, i; i = g[f]; f++)
                        i[7] == b[2] && (i[11] = b[8] == 0 ? b[5] : b[8],
                            i[15] = i[11] * i[9] * Const.lotSize,
                            i[13] = i[15] - i[16],
                            i[14] = i[13] / i[16] * 100,
                            b[6] != 0 && (i[32] == "-" ? i[32] = b[6] : b[6] > i[32] && (i[32] = b[6])),
                            b[7] != 0 && (i[33] == "-" ? i[33] = b[7] : b[7] < i[33] && (i[33] = b[7])),
                            i[34] = b[5],
                            bridge.getObj("pf").getComp("wl").updateItem(i))
                }
            } catch (j) { }
        }
        ,
        d.dirtyOn = function () {
            b && b.setDirty(!0)
        }
        ,
        d
}
    ;
mod.trade = function (b) {
    var d = new core.Module([Const._topic + Const._trade, Const._trade, {}, "", "TR", [], !1, !1]);
    return d.getKeys = function (b) {
        return b[3]
    }
        ,
        d.run = function () {
            if (d.queue.length > 0) {
                var b = d.queue.splice(0, d.queue.length);
                d.process(b)
            }
        }
        ,
        d.stopThread(),
        d.startThread(),
        d.process = function (d) {
            fields = d.length > 20 ? d.splice(-20) : d.splice(0, d.length);
            for (d = []; fields.length > 0;) {
                var f = fields.shift();
                if (bridge.getObj("type") == "Syariah") {
                    var g = Store.stock[f[3]];
                    g != null && g[15].indexOf("T") > -1 && d.push(f)
                } else
                    d.push(f)
            }
            if (d.length > 0) {
                f = d.length * -1;
                for (b.getDb().splice(f); d.length > 0;)
                    b.getDb().unshift(d.shift());
                for (d = 0; d < 20; d++)
                    b.getList().renderRow(d)
            }
        }
        ,
        d
}
    ;
mod.cashcancel = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "cshc", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (d) {
            d = d.bucket[Const._body];
            d[8].length ? d[8][2] == 1 ? (enyo.Signals.send("onError", "Process done"),
                b.refreshMe()) : enyo.Signals.send("onError", "Failed<br/>" + d[8][3]) : enyo.Signals.send("onError", "invalid response, please try again")
        }
        ,
        d.onData = function () { }
        ,
        d.doQuery = function (b) {
            d.filter = b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.cashentry = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "cshw", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (d) {
            d = d.bucket[Const._body];
            d[8].length ? d[8][4] == 1 ? (enyo.Signals.send("onError", d[8][5]),
                b.refreshMe()) : enyo.Signals.send("onError", "Failed<br/>" + d[8][5]) : enyo.Signals.send("onError", "invalid response, please try again")
        }
        ,
        d.onData = function () { }
        ,
        d.doQuery = function (b) {
            d.filter = b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.cashlist = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "DWLIST#?", Const._trading + "HCL", [], !0, !0]);
    return d.subscribe = function () {
        b.removeAll();
        b.refreshList();
        var e = Array(8);
        e[0] = 11;
        e[1] = d.session;
        e[2] = "" == d.unique ? d.module : d.unique;
        e[3] = d.module;
        e[4] = d.singleReply;
        e[5] = d.seqno;
        e[6] = d.filter;
        e[7] = d.page;
        var f = {};
        f[Const._body] = e;
        f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
        stomp.send(Const._queue + Const._trdquery, f)
    }
        ,
        d.begin = function () {
            d.idsub = null;
            setTimeout(function () {
                b.refreshList();
                b.getList().select(0);
                b.onSelect({}, {
                    index: 0
                })
            })
        }
        ,
        d.onData = function (d) {
            d[1] == "WD" && b.onlyAdd(d)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.onMessageSplit = function () { }
        ,
        d
}
    ;
mod.hmetdcancel = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "hmetdc", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (d) {
            d = d.bucket[Const._body];
            d[8].length ? d[8][1] == 1 ? (enyo.Signals.send("onError", "Process done"),
                b.refreshMe()) : enyo.Signals.send("onError", "Failed<br/>" + d[8][2]) : enyo.Signals.send("onError", "invalid response, please try again")
        }
        ,
        d.onData = function () { }
        ,
        d.doQuery = function (b) {
            d.filter = b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.hmetdinfo = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "hmetdi", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (d) {
            d = d.bucket[Const._body];
            try {
                d[8].length ? b.updateInfo(d[8]) : enyo.Signals.send("onError", "invalid response, please try again")
            } catch (f) { }
        }
        ,
        d.onData = function () { }
        ,
        d.doQuery = function (b) {
            d.filter = b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.hmetdentry = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "hmetde", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (d) {
            d = d.bucket[Const._body];
            console.log("result", d);
            d[8].length ? d[8][1] == 1 ? (enyo.Signals.send("onError", "request saved"),
                b.refreshMe()) : enyo.Signals.send("onError", "Failed<br/>" + d[8][2]) : enyo.Signals.send("onError", "invalid response, please try again")
        }
        ,
        d.onData = function () { }
        ,
        d.doQuery = function (b) {
            d.filter = b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.hmetdlist = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "HMTEDLIST#?", Const._trading + "hmetdl", [], !0, !0]);
    return d.subscribe = function () {
        b.removeAll();
        b.refreshList();
        var e = Array(8);
        e[0] = 11;
        e[1] = d.session;
        e[2] = "" == d.unique ? d.module : d.unique;
        e[3] = d.module;
        e[4] = d.singleReply;
        e[5] = d.seqno;
        e[6] = d.filter;
        e[7] = d.page;
        var f = {};
        f[Const._body] = e;
        f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
        stomp.send(Const._queue + Const._trdquery, f)
    }
        ,
        d.begin = function () {
            d.idsub = null;
            setTimeout(function () {
                b.refreshList();
                b.getList().select(0);
                b.onSelect({}, {
                    index: 0
                })
            })
        }
        ,
        d.onData = function (d) {
            b.onlyAdd(d)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.onMessageSplit = function () { }
        ,
        d
}
    ;
mod.custinfo = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "CI#?", Const._trading + "CI", [], !0, !0]);
    return d.subscribe = function () {
        b.reset();
        var e = Array(8);
        e[0] = 11;
        e[1] = d.session;
        e[2] = "" == d.unique ? d.module : d.unique;
        e[3] = d.module;
        e[4] = d.singleReply;
        e[5] = d.seqno;
        e[6] = d.filter;
        e[7] = d.page;
        var f = {};
        f[Const._body] = e;
        f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
        stomp.send(Const._queue + Const._trdquery, f)
    }
        ,
        d.begin = function () {
            d.idsub = null
        }
        ,
        d.onData = function (d) {
            b.updateHeader(d)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.onMessageSplit = function () { }
        ,
        d
}
    ;
mod.stocktrade = function (b) {
    var d = new core.Module([Const._topic + Const._ts, Const._ts, {}, "STH#f#t", "STH", Store.bbs, !0, !0]);
    return d.getKeys = function (b) {
        return b[2]
    }
        ,
        d.onData = function (d) {
            try {
                b.$.wl.onlyAdd(d)
            } catch (f) { }
        }
        ,
        d.begin = function () {
            b.refreshFilter()
        }
        ,
        d
}
    ;
mod.stocktradehis = function (b) {
    var d = new core.Module([Const._topic + Const._ts, Const._ts, {}, "BBS#BBNI#RG", "TS", Store.bbs, !0, !0]);
    return d.subscribe = function () {
        var b = Array(8);
        b[0] = 11;
        b[1] = d.session;
        b[2] = "" == d.unique ? d.module : d.unique;
        b[3] = d.module;
        b[4] = d.singleReply;
        b[5] = d.seqno;
        b[6] = d.filter;
        b[7] = d.page;
        var f = {};
        f[Const._body] = b;
        f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
        stomp.send(Const._queue + Const._query, f)
    }
        ,
        d.getKeys = function (b) {
            return b[2]
        }
        ,
        d.onData = function (d) {
            try {
                b.$.wl.onlyAdd(d)
            } catch (f) {
                console.log(f)
            }
        }
        ,
        d.begin = function () {
            b.refreshFilter()
        }
        ,
        d
}
    ;
mod.holiday = function () {
    var b = new core.Module([Const._topic + Const._hol, Const._hol, {}, "HOL#2009/01/01#2014/01/01", "holiday", Store.holiday, !0, !0]);
    return b.subscribe = function () {
        var d = Array(8);
        d[0] = 11;
        d[1] = b.session;
        d[2] = "" == b.unique ? b.module : b.unique;
        d[3] = b.module;
        d[4] = b.singleReply;
        d[5] = b.seqno;
        d[6] = b.filter;
        d[7] = b.page;
        var e = {};
        e[Const._body] = d;
        e[Const._replyto] = Const._topic + b.session + "." + ("" == b.unique ? b.module : b.unique);
        stomp.send(Const._queue + Const._query, e)
    }
        ,
        b.getKeys = function (b) {
            return b[0]
        }
        ,
        b.onData = function (b) {
            try {
                var e = this.getKeys(b);
                Store.holiday[e] = b
            } catch (f) {
                console.log(f)
            }
        }
        ,
        b.begin = function () { }
        ,
        b
}
    ;
mod.indices = function () {
    var b = new core.Module([Const._topic + Const._idx, Const._idx, {}, "", "GI", Store.idx, !0, !1]);
    return b.getKeys = function (b) {
        return b[3]
    }
        ,
        b.onMessageSplit = function (d) {
            try {
                var e = b.getKeys(d);
                d[0] = e;
                b.store[e] = d;
                b.setDirty(!0)
            } catch (f) { }
        }
        ,
        b
}
    ;
mod.acc = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "ACCi", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (b) {
            b = b.bucket[Const._body];
            b[7] != 0 && d.onData(b[8])
        }
        ,
        d.onData = function (d) {
            Store.ACC[d[0]] = d;
            b.refreshACCView()
        }
        ,
        d.doQuery = function (b) {
            d.filter = "ACC#" + bridge.getObj("userid") + "#" + b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.ordlst = function () {
    var b = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "ordlst", [], !0, !0]);
    return b.permanent = !0,
        b.temp = [],
        b.subscribe = function () {
            var d = Array(8);
            d[0] = 11;
            d[1] = b.session;
            d[2] = "" == b.unique ? b.module : b.unique;
            d[3] = b.module;
            d[4] = b.singleReply;
            d[5] = b.seqno;
            d[6] = b.filter;
            d[7] = b.page;
            var e = {};
            e[Const._body] = d;
            e[Const._replyto] = Const._topic + b.session + "." + ("" == b.unique ? b.module : b.unique);
            stomp.send(Const._queue + Const._trdquery, e)
        }
        ,
        b.getKeys = function (b) {
            return b[0]
        }
        ,
        b.reply = function (d) {
            var d = d.bucket[Const._body]
                , e = d[7];
            if (e != 0) {
                var f = d[6];
                f == 1 && (b.temp = []);
                b.onData(d[8]);
                f == e && b.begin()
            }
        }
        ,
        b.onData = function (d) {
            d.splice(0, 0, d[11]);
            b.temp.push(d)
        }
        ,
        b.doQuery = function () {
            b.filter = "ORD#" + bridge.getObj("userid") + "#%#%";
            b.subscribe()
        }
        ,
        b.begin = function () {
            bridge.getObj("orderlst").getComp("wl").removeAll();
            for (var d = 0; d < b.temp.length; d++)
                bridge.getObj("orderlst").getComp("wl").addItem(b.temp[d]);
            bridge.getObj("orderlst").getComp("wl").refreshList()
        }
        ,
        b
}
    ;
mod.pf = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "PFOi", [], !0, !0]);
    return d.permanent = !0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.reply = function (b) {
            try {
                var f = b.bucket[Const._body];
                f[7] != 0 && d.onData(f[8])
            } catch (g) { }
        }
        ,
        d.onData = function (d) {
            try {
                d.splice(0, 0, d[0] + d[6]);
                try {
                    var f = Store.stock[d[7]];
                    f ? (d.push(f[19]),
                        d.push(f[20]),
                        d.push(f[21])) : (d[31].push("-"),
                            d[32].push("-"),
                            d[33].push("-"));
                    var g = Store.ss[d[7] + "RG"];
                    g ? (d[11] = g[8] == 0 ? g[5] : g[8],
                        d[15] = d[11] * d[9] * Const.lotSize,
                        d[13] = d[15] - d[16],
                        d[14] = d[13] / d[16] * 100,
                        d.push(g[5]),
                        g[6] != 0 && (d[32] == "-" ? d[32] = g[6] : g[6] > d[32] && (d[32] = g[6])),
                        g[7] != 0 && (d[33] == "-" ? d[33] = g[7] : g[7] < d[33] && (d[33] = g[7]))) : d.push("-")
                } catch (i) {
                    console.log(i)
                }
                var j = bridge.getObj("pf").getComp("wl").getByKey(d[0]);
                if (j == null)
                    bridge.getObj("pf").getComp("wl").addItem(d),
                        b.refreshPFView();
                else {
                    for (var k = j[9] <= 0 || d[9] <= 0, f = 0; f < j.length; f++)
                        j[f] = d[f];
                    bridge.getObj("pf").getComp("wl").updateItem(j);
                    k ? b.refreshPFView() : b.refreshHeader()
                }
            } catch (l) {
                console.log(l)
            }
        }
        ,
        d.doQuery = function (b) {
            d.filter = "PFO#" + bridge.getObj("userid") + "#" + b;
            d.subscribe()
        }
        ,
        d.begin = function () { }
        ,
        d
}
    ;
mod.trading = function (b) {
    var d = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading, [], !0, !0]);
    return d.QUERY_EVENT = "SEC,OST,ATY,SEB,ASE,DWCOMPBANK,DWSTATUS,PRO,UMN,UGR,CUS,ACC,PFO,ORD,TRD,ALGO".split(","),
        d.QUERY_FILTER = ",,,,,,,,,,,#%#%,#%#%,#%#%,#%#%,".split(","),
        d.QUERY_USER = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        d.QUERY_STATUS = "stock,order status,acc type,stock board,stock account,bank,dwstatus,profile,user menu,user group,customer,account,portfolio,order,trade,auto order".split(","),
        d.counter = 0,
        d.subscribe = function () {
            var b = Array(8);
            b[0] = 11;
            b[1] = d.session;
            b[2] = "" == d.unique ? d.module : d.unique;
            b[3] = d.module;
            b[4] = d.singleReply;
            b[5] = d.seqno;
            b[6] = d.filter;
            b[7] = d.page;
            var f = {};
            f[Const._body] = b;
            f[Const._replyto] = Const._topic + d.session + "." + ("" == d.unique ? d.module : d.unique);
            stomp.send(Const._queue + Const._trdquery, f)
        }
        ,
        d.getKeys = function (b) {
            return b[0]
        }
        ,
        d.onData = function (b) {
            try {
                if (d.counter == 0)
                    Store.SEC[b[0]] = b;
                else if (d.counter == 1)
                    Store.OST[b[0]] = b;
                else if (d.counter == 2)
                    Store.ATY[b[0]] = b;
                else if (d.counter == 3)
                    Store.SEB[b[0] + b[1]] = b;
                else if (d.counter == 4)
                    Store.ASE[b[0] + b[1]] = b;
                else if (d.counter == 5)
                    Store.DWC[b[0] + b[1]] = b;
                else if (d.counter == 6)
                    Store.DWS[b[0]] = b;
                else if (d.counter == 7)
                    Store.PRO[b[0]] = b;
                else if (d.counter == 8)
                    Store.UMN[b[1]] = b;
                else if (d.counter == 9)
                    Store.UGR[b[0]] = b;
                else if (d.counter == 10)
                    Store.CUS[b[0]] = b,
                        Store.IDCUS.push(b[0]);
                else if (d.counter == 11)
                    Store.ACC[b[0]] = b,
                        Store.ID.push(b[0]);
                else if (d.counter == 12) {
                    if (b.splice(0, 0, b[0] + b[6]),
                        b[9] > 0) {
                        try {
                            var f = Store.stock[b[7]];
                            f ? (b.push(f[19]),
                                b.push(f[20]),
                                b.push(f[21])) : (b[31].push("-"),
                                    b[32].push("-"),
                                    b[33].push("-"));
                            var g = Store.ss[b[7] + "RG"];
                            g ? (b[11] = g[8] == 0 ? g[5] : g[8],
                                b[15] = b[11] * b[9] * Const.lotSize,
                                b[13] = b[15] - b[16],
                                b[14] = b[13] / b[16] * 100,
                                b.push(g[5]),
                                g[6] != 0 && (b[32] == "-" ? b[32] = g[6] : g[6] > b[32] && (b[32] = g[6])),
                                g[7] != 0 && (b[33] == "-" ? b[33] = g[7] : g[7] < b[33] && (b[33] = g[7]))) : b.push("-")
                        } catch (i) { }
                        try {
                            bridge.getObj("pf").getComp("wl").addItem(b)
                        } catch (j) {
                            console.log("failed to insert pf into view")
                        }
                    }
                } else if (d.counter == 13) {
                    b.splice(0, 0, b[11]);
                    try {
                        bridge.getObj("orderlst").getComp("wl").addItem(b)
                    } catch (k) {
                        console.log("failed to insert order into view")
                    }
                } else if (d.counter == 14) {
                    b.splice(0, 0, b[8] + b[9]);
                    f = [];
                    f.push(b[0]);
                    f.push(b[1]);
                    f.push(b[2]);
                    f.push(b[3]);
                    f.push(b[4]);
                    f.push(b[5]);
                    f.push(b[6]);
                    f.push(b[7]);
                    f.push("2");
                    f.push(0);
                    f.push(b[6]);
                    f.push(b[8]);
                    f.push(b[9]);
                    f.push("");
                    f.push("");
                    f.push(b[11]);
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push(b[21]);
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push(b[13]);
                    f.push(b[14]);
                    f.push(b[15]);
                    f.push(b[16]);
                    f.push(b[6] * Const.lotSize);
                    f.push(0);
                    f.push(b[6] * Const.lotSize);
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push("");
                    f.push(b[20]);
                    f.push("");
                    f.push(b[10]);
                    f.push(b[19]);
                    try {
                        bridge.getObj("tradelst").getComp("wl").addItem(f)
                    } catch (l) {
                        console.log("failed to insert matchlist into view")
                    }
                } else if (d.counter == 15)
                    try {
                        bridge.getObj("autolst").getComp("wl").addItem(b)
                    } catch (m) {
                        console.log("failed to insert auto order into view")
                    }
            } catch (w) {
                console.log("oops,", w)
            }
        }
        ,
        d.doQuery = function () {
            bridge.getObj("orderlst").getComp("wl").removeAll();
            bridge.getObj("orderlst").getComp("wl").refreshList();
            bridge.getObj("tradelst").getComp("wl").removeAll();
            bridge.getObj("tradelst").getComp("wl").refreshList();
            bridge.getObj("pf").getComp("wl").removeAll();
            bridge.getObj("pf").getComp("wl").refreshList();
            d.counter = 0;
            d.filter = d.QUERY_EVENT[d.counter] + (d.QUERY_USER[d.counter] == 1 ? "#" + bridge.getObj("userid") : "") + d.QUERY_FILTER[d.counter];
            b.trdStatus("loading " + d.QUERY_STATUS[d.counter] + "...");
            d.doRestart()
        }
        ,
        d.begin = function () {
            d.counter++;
            d.counter >= d.QUERY_EVENT.length ? d.counter == d.QUERY_EVENT.length && (b.trdReady(),
                bridge.getObj("pf").refreshPFView()) : (d.filter = d.QUERY_EVENT[d.counter] + (d.QUERY_USER[d.counter] == 1 ? "#" + bridge.getObj("userid") : "") + d.QUERY_FILTER[d.counter],
                    b.trdStatus("loading " + d.QUERY_STATUS[d.counter] + "..."),
                    d.doRestart())
        }
        ,
        d
}
    ;
mod.trdlst = function () {
    var b = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "trdlst", [], !0, !0]);
    return b.permanent = !0,
        b.temp = [],
        b.subscribe = function () {
            var d = Array(8);
            d[0] = 11;
            d[1] = b.session;
            d[2] = "" == b.unique ? b.module : b.unique;
            d[3] = b.module;
            d[4] = b.singleReply;
            d[5] = b.seqno;
            d[6] = b.filter;
            d[7] = b.page;
            var e = {};
            e[Const._body] = d;
            e[Const._replyto] = Const._topic + b.session + "." + ("" == b.unique ? b.module : b.unique);
            stomp.send(Const._queue + Const._trdquery, e)
        }
        ,
        b.getKeys = function (b) {
            return b[0]
        }
        ,
        b.reply = function (d) {
            var d = d.bucket[Const._body]
                , e = d[7];
            if (e != 0) {
                var f = d[6];
                f == 1 && (b.temp = []);
                b.onData(d[8]);
                f == e && b.begin()
            }
        }
        ,
        b.onData = function (d) {
            d.splice(0, 0, d[8] + d[9]);
            var e = [];
            e.push(d[0]);
            e.push(d[1]);
            e.push(d[2]);
            e.push(d[3]);
            e.push(d[4]);
            e.push(d[5]);
            e.push(d[6]);
            e.push(d[7]);
            e.push("2");
            e.push(0);
            e.push(d[6]);
            e.push(d[8]);
            e.push(d[9]);
            e.push("");
            e.push("");
            e.push(d[11]);
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push(d[21]);
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push(d[13]);
            e.push(d[14]);
            e.push(d[15]);
            e.push(d[16]);
            e.push(d[6] * Const.lotSize);
            e.push(0);
            e.push(d[6] * Const.lotSize);
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push("");
            e.push(d[20]);
            e.push("");
            e.push(d[10]);
            e.push(d[19]);
            b.temp.push(e)
        }
        ,
        b.doQuery = function () {
            b.filter = "TRD#" + bridge.getObj("userid") + "#%#%";
            b.subscribe()
        }
        ,
        b.begin = function () {
            bridge.getObj("tradelst").getComp("wl").removeAll();
            for (var d = 0; d < b.temp.length; d++)
                bridge.getObj("tradelst").getComp("wl").addItem(b.temp[d]);
            bridge.getObj("tradelst").getComp("wl").refreshList()
        }
        ,
        b
}
    ;
mod.autolst = function () {
    var b = new core.Module([Const._queue + Const._trdquery, Const._trading, {}, "", Const._trading + "autolst", [], !0, !0]);
    return b.permanent = !0,
        b.temp = [],
        b.subscribe = function () {
            var d = Array(8);
            d[0] = 11;
            d[1] = b.session;
            d[2] = "" == b.unique ? b.module : b.unique;
            d[3] = b.module;
            d[4] = b.singleReply;
            d[5] = b.seqno;
            d[6] = b.filter;
            d[7] = b.page;
            var e = {};
            e[Const._body] = d;
            e[Const._replyto] = Const._topic + b.session + "." + ("" == b.unique ? b.module : b.unique);
            stomp.send(Const._queue + Const._trdquery, e)
        }
        ,
        b.getKeys = function (b) {
            return b[17]
        }
        ,
        b.reply = function (d) {
            var d = d.bucket[Const._body]
                , e = d[7];
            if (e != 0) {
                var f = d[6];
                f == 1 && (b.temp = []);
                b.onData(d[8]);
                f == e && b.begin()
            }
        }
        ,
        b.onData = function (d) {
            d && b.temp.push(d)
        }
        ,
        b.doQuery = function () {
            bridge.getObj("autolst").getComp("wl").removeAll();
            bridge.getObj("autolst").getComp("wl").refreshList();
            b.filter = "ALGO#" + bridge.getObj("userid");
            b.subscribe()
        }
        ,
        b.begin = function () {
            bridge.getObj("autolst").getComp("wl").removeAll();
            for (var d = 0; d < b.temp.length; d++)
                bridge.getObj("autolst").getComp("wl").addItem(b.temp[d]);
            bridge.getObj("autolst").getComp("wl").refreshList()
        }
        ,
        b
}
    ;
function hideAddressBar() {
    window.innerHeight >= window.innerWidth ? $("body").css("min-height", screen.height - 70 + "px") : $("body").css("min-height", screen.width - 50 + "px");
    window.location.hash || setTimeout(function () {
        window.scrollTo(0, 1)
    }, 50)
}
enyo.kind({
    name: "Unsupported",
    kind: "FittableRows",
    classes: "centered",
    allowHtml: !0,
    content: "<span class='medium'>sorry,<br/>your browser does not support<br/><b><span class='orange'>zaisan</span></b> application.</span>"
});
enyo.kind({
    name: "Failed",
    kind: "FittableRows",
    classes: "centered",
    allowHtml: !0,
    content: "<span class='medium'>failed, please check your network</span>"
});
enyo.kind({
    name: "Error",
    kind: "FittableRows",
    classes: "centered",
    allowHtml: !0,
    content: ""
});
enyo.kind({
    name: "Invalid",
    kind: "FittableRows",
    classes: "centered",
    allowHtml: !0,
    content: "<span class='medium'>sorry,<br/>your screen resolution<br/>does not support<br/> <b><span class='orange'>e</span><span class='green'>smart</span></b> application.<br/><br/>but we are working hard<br/>to make it happen,<br/>related updates<br/>are almost there. :)<br/></span>"
});
window.isTablet = function () {
    return !1
}
    ;
window.emptyFn = function () { }
    ;
window.req = function (b, d, e) {
    var f = new XMLHttpRequest;
    e = e || emptyFn;
    b = b + (b.indexOf("?") == -1 ? "?" : "&") + Date.now();
    try {
        f.open("GET", b, !0),
            f.onreadystatechange = function () {
                if (f.readyState == 4) {
                    var b = f.status
                        , g = f.responseText;
                    b >= 200 && b < 300 || b == 304 || b == 0 && g.length > 0 ? d(g) : e()
                }
            }
            ,
            f.send(null)
    } catch (g) {
        e()
    }
}
    ;
window.aURI = window.document.createElement("a");
window.genUri = function (b) {
    return window.aURI.href = b,
        window.aURI.href
}
    ;
window.loadSkin2 = function () {
    bridge.getObj("clientengine").showLoading("loading skin, please wait...");
    req(genUri("cache/zaisan3"), function (b) {
        bridge.getObj("clientengine").hideLoading();
        localStorage["zaisan.skin2"] = b;
        replaceSkin("zaisan.skin2")
    }, function () {
        bridge.getObj("clientengine").hideLoading();
        localStorage["active.skin"] = "zaisan.skin";
        enyo.Signals.send("onError", "failed to load skin<br/>please try again...")
    })
}
    ;
window.changeSkin = function (b, d) {
    if (d || localStorage["active.skin"] != b)
        localStorage["active.skin"] = b,
            localStorage[b] == void 0 || localStorage[b] == "" ? loadSkin2() : replaceSkin(b)
}
    ;
window.replaceSkin = function (b) {
    enyo.dom.byId("skin").remove();
    var d = window.document.createElement("style");
    d.type = "text/css";
    d.textContent = localStorage[b];
    d.id = "skin";
    b = document.createElement("base");
    b.href = "cache/";
    window.document.head.appendChild(b);
    window.document.head.appendChild(d);
    window.document.head.removeChild(b)
}
    ;
window.parseHash = function () {
    return window.location.hash.split("/")
}
    ;
var masters = {}
    , website = {};
enyo.kind({
    name: "Apps",
    masterURL: Const._url + Const._urlaggregate + "?q=MSD",
    masterCONTENT: Const._url + Const._urlwebsite + "?q=WBS2",
    boot: function () {
        if (window.WebSocket) {
            window.onbeforeunload = function () {
                return "are you sure want to leave bions.id?"
            }
                ;
            var b = new enyo.JsonpRequest({
                url: Const._url + Const._urlforumout,
                callbackName: "c"
            });
            b.go();
            b = new enyo.JsonpRequest({
                url: this.masterURL,
                callbackName: "c"
            });
            b.response(this, this.masterLoaded);
            b.error(this, this.failed);
            b.go()
        } else
            this.unsupported()
    },
    masterLoaded: function (b, d) {
        try {
            masters = d.data;
            for (var e = 0; e < masters.stock.length; e++) {
                var f = masters.stock[e][2];
                Store.stock[f] = masters.stock[e];
                masters.stock[e][0] == "ST" && Store.stocklist.indexOf(f) == -1 && Store.stocklist.push(f)
            }
            for (e = 0; e < masters.broker.length; e++)
                f = masters.broker[e][2],
                    Store.broker[f] = masters.broker[e],
                    Store.brokerlist.push(f);
            Store.stocklist.sort();
            Store.brokerlist.sort();
            s = "";
            try {
                s = masters.gbroker[0].split("|")
            } catch (g) {
                s = masters.gbroker.split("|")
            }
            broker[1] = s[0];
            broker[2] = s[1];
            broker[3] = s[2];
            this.loadWebsite()
        } catch (i) {
            this.error(i)
        }
    },
    loadWebsite: function () {
        var b = new enyo.JsonpRequest({
            url: this.masterCONTENT,
            callbackName: "c"
        });
        b.response(this, this.websiteLoaded);
        b.error(this, this.failed);
        b.go()
    },
    websiteLoaded: function (b, d) {
        website = d.data;
        this.startApps()
    },
    startApps: function () {
        (new mainframe).renderInto(document.body);
        new clientengine;
        setTimeout(function () {
            localStorage["active.skin"] == "zaisan.skin2" && window.changeSkin("zaisan.skin2", !0)
        }, 2E3)
    },
    unsupported: function () {
        (new Unsupported).renderInto(document.body)
    },
    failed: function () {
        (new Failed).renderInto(document.body)
    },
    error: function (b) {
        var d = Error();
        d.setContent("<span class='medium'>we are apologize, this should not be happen,<br/>error: " + b + "<br/>please contact helpdesk</span>");
        d.renderInto(document.body)
    }
});
window.processHash = function () {
    var b = parseHash()
        , d = b[0].toLowerCase();
    bridge.getObj("pnlregis").close();
    bridge.getObj("pnltrial").close();
    d == "#regonline" ? bridge.getObj("pnlregis").show() : d == "#freetrial" ? bridge.getObj("pnltrial").show() : d == "#news" ? bridge.getObj("pnlnewspopup").show(b) : d == "#research" && bridge.getObj("pnlnewspopup").show(b)
}
    ;
window.addEventListener("popstate", function () {
    window.processHash()
});
(function () {
    setTimeout(function () {
        (new Apps).boot()
    }, 1E3)
}
)(window);
