(function (b) {
    var p = null;
    var d = {
        Ia: "jms.queue.admin",
        gb: "jms.topic.admin.",
        cb: "wss",
        Va: "bions.id",
        eb: "/stomp",
        bb: ":8443",
        Ha: "://",
        m: "loginOK",
        h: "loginBAD",
        l: "kill",
        j: "chgpwdOK",
        i: "chgpwdBAD",
        k: "disco",
        lb: "jms.queue.trading",
        mb: "jms.topic.trading.",
        za: "trdLoginOK",
        ya: "trdLoginBAD",
        xa: "trdKill",
        ua: "trdChgpwdOK",
        ta: "trdChgpwdBAD",
        wa: "trdDisco",
        va: "trdData"
    };
    d.ma = function () {
        return d.cb + d.Ha + d.Va + d.bb + d.eb
    }
        ;
    d[d.m] = function (b) {
        d.c[d.m](b)
    }
        ;
    d[d.h] = function (b) {
        d.c[d.h](b)
    }
        ;
    d[d.l] = function () {
        d.c[d.l]()
    }
        ;
    d[d.j] = function () {
        d.c[d.j]()
    }
        ;
    d[d.i] = function () {
        d.c[d.i]()
    }
        ;
    d[d.k] = function () {
        d.c[d.k]()
    }
        ;
    d[d.za] = function (b) {
        d.c[d.za](b)
    }
        ;
    d[d.ya] = function (b) {
        d.c[d.ya](b)
    }
        ;
    d[d.xa] = function () {
        d.c[d.xa]()
    }
        ;
    d[d.ua] = function () {
        d.c[d.ua]()
    }
        ;
    d[d.ta] = function () {
        d.c[d.ta]()
    }
        ;
    d[d.wa] = function () {
        d.c[d.wa]()
    }
        ;
    d[d.va] = function (b) {
        d.c[d.va](b)
    }
        ;
    d.Ma = function (b, e) {
        d.p.open(b, e)
    }
        ;
    d.Na = function () {
        d.p.close()
    }
        ;
    d.La = function (b, e, f) {
        d.p.chgpwd(b, md5.en(e), md5.en(f))
    }
        ;
    d.Pa = function (b, e) {
        d.r.open(b, e)
    }
        ;
    d.Qa = function () {
        d.r.close()
    }
        ;
    d.Oa = function (b, e, f) {
        d.r.chgpwd(b, md5.en(e), md5.en(f))
    }
        ;
    d.ea = function (b) {
        d.r.fix(b)
    }
        ;
    d.fb = function (b) {
        d.c = b
    }
        ;
    d.Ua = function () {
        return d.p.sb()
    }
        ;
    var e = {};
    e.M = function (b, d) {
        e[b] = d
    }
        ;
    e.getObj = function (b) {
        return e[b]
    }
        ;
    d.M = function (b, d) {
        e.M(b, d)
    }
        ;
    d.getObj = function (b) {
        return e.getObj(b)
    }
        ;
    d.p = Feed.engine();
    d.p.init(d.Ia, d.gb, d.ma(), d);
    d.r = Trading.engine();
    d.r.init(d.lb, d.mb, d.ma(), d);
    var f = {};
    f.doLogin = d.Ma;
    f.doLogout = d.Na;
    f.doChgpwd = d.La;
    f.doTrdLogin = d.Pa;
    f.doTrdLogout = d.Qa;
    f.doTrdChgpwd = d.Oa;
    f.sendFix = d.ea;
    f.register = d.fb;
    f.wire = d.Ua;
    f.addObj = d.M;
    f.getObj = d.getObj;
    b.bridge = f
}
)(window);