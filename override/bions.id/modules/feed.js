(function (b) {
    var p = null;
    var d = {
        f: "session",
        b: "destination",
        d: "replyto",
        a: "body",
        m: "loginOK",
        h: "loginBAD",
        l: "kill",
        j: "chgpwdOK",
        i: "chgpwdBAD",
        k: "disco"
    };
    d.R = function () {
        return d.S()
    }
        ;
    d.S = function () {
        var e = {}
            , g = ""
            , i = ""
            , j = ""
            , k = ""
            , l = ""
            , m = !1
            , w = p
            , y = ""
            , x = ""
            , z = p;
        e.da = function () {
            var b = {};
            b[d.f] = g;
            b[d.b] = y;
            b[d.d] = x + g;
            var e = Array(2);
            e[0] = 99;
            e[1] = g;
            b[d.a] = e;
            stomp.send(y, b)
        }
            ;
        e.V = function (b, d, g, i) {
            e.W(b, d, g, i)
        }
            ;
        e.W = function (d, g, j, k) {
            y = d;
            x = g;
            i = j;
            z = k;
            b.stomp = Comm.wire(i);
            w = new core.Thread(e.da, 45E3)
        }
            ;
        e.n = function (b, d) {
            e.o(b, d)
        }
            ;
        e.o = function (b, d) {
            j = b;
            k = d;
            stomp.con(j, k, e.aa, e.pa)
        }
            ;
        e.ba = function (b) {
            var e = b.bucket[d.a]
                , f = e[0];
            f == 2 ? (m = !0,
                z[d.m](b),
                w.start()) : f == 3 ? (b = e[2],
                    stomp.disco(),
                    z[d.h](b)) : f == 4 ? (w.stop(),
                        z[d.l](),
                        stomp.disco(),
                        m = !1) : f == 6 ? (k = e[2],
                            z[d.j]()) : f == 7 && z[d.i](e[2])
        }
            ;
        e.pa = function (b) {
            m ? z[d.k]() : z[d.h](b);
            w.stop()
        }
            ;
        e.N = function (b, d, g) {
            e.O(b, d, g)
        }
            ;
        e.O = function (b, e, f) {
            var i = {};
            i[d.d] = x + g;
            var j = [];
            j.push(5);
            j.push(g);
            j.push(b);
            j.push(e);
            j.push(f);
            i[d.a] = j;
            stomp.send(y, i)
        }
            ;
        e.Z = function () {
            e.$()
        }
            ;
        e.$ = function () {
            w.stop();
            if (m) {
                stomp.unsub(l);
                var b = {}
                    , e = [];
                e.push(9);
                e.push(g);
                b[d.d] = x + g;
                b[d.a] = e;
                stomp.send(y, b)
            }
            m = !1;
            setTimeout(function () {
                stomp.disco()
            }, 500);
            g = ""
        }
            ;
        e.X = function () {
            return e.Y()
        }
            ;
        e.Y = function () {
            return m
        }
            ;
        e.T = function () {
            return e.U()
        }
            ;
        e.U = function () {
            return stomp
        }
            ;
        e.aa = function (b) {
            g = b.bucket[d.f];
            l = stomp.sub(x + g, {}, e.ba);
            var b = {}
                , i = [];
            i.push(1);
            i.push(g);
            i.push(j);
            i.push(k);
            var m = bridge.getObj("IP");
            i.push(m != p ? m : "0.0.0.0");
            i.push(mod.version);
            i.push("web|" + BrowserDetect.OS + ", " + BrowserDetect.browser + " - " + BrowserDetect.version);
            b[d.d] = x + g;
            b[d.a] = i;
            stomp.send(y, b)
        }
            ;
        var A = {};
        return A.init = e.V,
            A.open = e.n,
            A.chgpwd = e.N,
            A.close = e.Z,
            A.ready = e.X,
            A.wire = e.T,
            A
    }
        ;
    var e = {};
    e.engine = d.R;
    b.Feed = e
}
)(window);