(function (b) {
    var p = null;
    var d = {
        f: "session",
        b: "destination",
        d: "replyto",
        a: "body",
        m: "trdLoginOK",
        h: "trdLoginBAD",
        l: "trdKill",
        j: "trdChgpwdOK",
        i: "trdChgpwdBAD",
        k: "trdDisco",
        data: "trdData"
    };
    d.R = function () {
        return d.S()
    }
        ;
    d.S = function () {
        var b = {}
            , e = ""
            , i = ""
            , j = ""
            , k = ""
            , l = !1
            , m = p
            , w = p
            , y = p
            , x = ""
            , z = ""
            , A = p
            , H = []
            , I = [];
        b.da = function () {
            var b = {};
            b[d.f] = e;
            b[d.b] = x;
            b[d.d] = z + e;
            var f = Array(2);
            f[0] = 99;
            f[1] = e;
            b[d.a] = f;
            stomp.send(x, b)
        }
            ;
        b.P = function () {
            H.splice(0, H.length);
            I.splice(0, I.length)
        }
            ;
        b.Ya = function () {
            if (H.length > 0)
                for (var d = H.splice(0, H.length); d.length > 0;)
                    b.Wa(d.shift())
        }
            ;
        b.Za = function () {
            if (I.length > 0)
                for (var d = I.splice(0, I.length); d.length > 0;)
                    b.ab(d.shift())
        }
            ;
        b.ab = function (b) {
            var f = {}
                , j = [];
            j.push(14);
            j.push(e);
            j.push(i);
            j.push(b[0]);
            j.push(b[1]);
            f[d.d] = z + e;
            f[d.a] = j;
            stomp.send(x, f)
        }
            ;
        b.Wa = function (b) {
            b.bucket[d.a][0] == 14 && A[d.data](b)
        }
            ;
        b.V = function (d, e, g, i) {
            b.W(d, e, g, i)
        }
            ;
        b.W = function (d, e, g, i) {
            x = d;
            z = e;
            A = i;
            m = new core.Thread(b.da, 45E3);
            w = new core.Thread(b.Ya, 100);
            y = new core.Thread(b.Za, 100)
        }
            ;
        b.n = function (d, e) {
            b.o(d, e)
        }
            ;
        b.o = function (d, e) {
            i = d;
            j = e;
            b.aa()
        }
            ;
        b.ba = function (e) {
            var g = e.bucket[d.a]
                , i = g[0];
            i == 2 ? (l = !0,
                A[d.m](e),
                m.start(),
                w.start(),
                y.start()) : i == 3 ? A[d.h](g[2]) : i == 4 ? (m.stop(),
                    w.stop(),
                    y.stop(),
                    b.P(),
                    A[d.l](),
                    l = !1) : i == 6 ? (j = g[2],
                        A[d.j]()) : i == 7 ? A[d.i](g[2]) : i != 99 && H.push(e)
        }
            ;
        b.pa = function (e) {
            l ? A[d.k]() : A[d.h](e);
            m.stop();
            w.stop();
            y.stop();
            b.P()
        }
            ;
        b.N = function (d, e, g) {
            b.O(d, e, g)
        }
            ;
        b.O = function (b, f, i) {
            var j = {};
            j[d.d] = z + e;
            var k = [];
            k.push(5);
            k.push(e);
            k.push(b);
            k.push("U1");
            var l = new fixfield("U1");
            l.set("10001", b);
            l.set("10002", f);
            l.set("10003", i);
            k.push(l.toString());
            j[d.a] = k;
            stomp.send(x, j)
        }
            ;
        b.Z = function () {
            b.$()
        }
            ;
        b.$ = function () {
            m.stop();
            w.stop();
            y.stop();
            b.P();
            if (l) {
                stomp.unsub(k);
                var j = {}
                    , D = [];
                D.push(9);
                D.push(e);
                D.push(i);
                D.push("5A");
                var A = new fixfield("5A");
                A.set("58", "request logout");
                D.push(A.toString());
                j[d.d] = z + e;
                j[d.a] = D;
                stomp.send(x, j)
            }
            l = !1;
            e = ""
        }
            ;
        b.X = function () {
            return b.Y()
        }
            ;
        b.Y = function () {
            return l
        }
            ;
        b.T = function () {
            return b.U()
        }
            ;
        b.U = function () {
            return stomp
        }
            ;
        b.ea = function (b) {
            I.push(b)
        }
            ;
        b.aa = function () {
            e = stomp.getSession();
            k = stomp.sub(z + e, {}, b.ba);
            var l = {}
                , m = [];
            m.push(1);
            m.push(e);
            m.push(i);
            m.push("AA");
            var w = new fixfield("AA");
            w.set("108", "45");
            w.set("10001", i);
            w.set("10002", j);
            var y = bridge.getObj("IP");
            w.set("999930", y != p ? y : "0.0.0.0");
            w.set("58", "web|" + BrowserDetect.OS + ", " + BrowserDetect.browser + " - " + BrowserDetect.version);
            m.push(w.toString());
            l[d.d] = z + e;
            l[d.a] = m;
            stomp.send(x, l)
        }
            ;
        var G = {};
        return G.init = b.V,
            G.open = b.n,
            G.fix = b.ea,
            G.chgpwd = b.N,
            G.close = b.Z,
            G.ready = b.X,
            G.wire = b.T,
            G
    }
        ;
    var e = {};
    e.engine = d.R;
    b.Trading = e
}
)(window);