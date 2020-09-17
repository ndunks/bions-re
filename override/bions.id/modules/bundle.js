(function () {
    var p = null;
    var d = {
        t: "CONNECT",
        w: "CONNECTED",
        C: "MESSAGE",
        A: "ERROR",
        z: "DISCONNECT",
        H: "SEND",
        I: "SUBSCRIBE",
        J: "UNSUBSCRIBE",
        ha: "subscription",
        rb: "transaction",
        b: "destination",
        Ba: "sub-",
        qb: "message-id",
        f: "session",
        B: "login",
        F: "passcode",
        fa: "message",
        ID: "id",
        G: "selector",
        ga: "replyto",
        a: "body",
        Aa: "connection lost:",
        D: "\n",
        v: 2,
        /** bL: en ( crypt?) */
        encrypt(b) {
            return d.oa(rsa.en(d.L, d.K, b))
        },
        /** Da: rsa */
        rsa(b) {
            return rsa.en(d.L, d.K, b)
        },
        oa(b) {
            var d, e, j = "";
            for (d = 0; d + 3 <= b.length; d += 3)
                e = parseInt(b.substring(d, d + 3), 16),
                    j += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >> 6) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e & 63);
            for (d + 1 == b.length ? (e = parseInt(b.substring(d, d + 1), 16),
                j += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e << 2)) : d + 2 == b.length && (e = parseInt(b.substring(d, d + 2), 16),
                    j += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >> 2) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((e & 3) << 4)); (j.length & 3) > 0;)
                j += "=";
            return j
        },
        qa(b, e, i) {
            return {
                cmd: b,
                bucket: e,
                tail: i,
                Ra: function () {
                    var i = [];
                    return d.t == b ? (d.v = 2,
                        d.u = Math.uuid(16),
                        i.push(0),
                        i.push(e[d.B]),
                        i.push(e[d.F]),
                        i.push(d.v),
                        i.push(d.u),
                        i.push(0),
                        i.push(0)) : d.w == b ? (i.push(1),
                            i.push(e[d.f])) : d.z == b ? i.push(2) : d.A == b ? (i.push(3),
                                i.push(e[d.fa])) : d.I == b ? (i.push(4),
                                    i.push(e[d.b]),
                                    i.push(e[d.ID]),
                                    e[d.G] && i.push(e[d.G])) : d.J == b ? (i.push(5),
                                        i.push(e[d.b]),
                                        i.push(e[d.ID])) : d.H == b ? (i.push(6),
                                            i.push(e[d.b]),
                                            i.push(e[d.ga]),
                                            i.push(e[d.a])) : d.C == b && (i.push(7),
                                                i.push(e[d.b]),
                                                i.push(e[d.b]),
                                                i.push(e[d.a])),
                        b == d.t ? d.oa(rsa.en(d.L, d.K, JSON.stringify(i))) : d.v == 2 ? d.enb64(d.ra(d.u, JSON.stringify(i))) : d.enb64(JSON.stringify(i))
                },
                toString: function () {
                    var i = b + d.D;
                    if (e)
                        for (h in e)
                            e.hasOwnProperty(h) && (i = i + h + ": " + e[h] + d.D);
                    return i += d.D,
                        i
                }
            }
        },
        g: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        u: "",
        L: "d577f81bd8e45d2c8ee74d11c947c0b9107b38464441710b90747919e9eab4c675767f4864582f21d26607fdb99e95be6b89bc2e94cc33164ba4b57a2e7eace87ede90ea32d046790d24644feb20386d7a977ca623d7278cbac20fc886f7093253fe07d9e34a258bab33c2ee03a05b3ae8866924bbf8ab153d86abba36d27ef1",
        K: "10001",
        /** Q: enb64 */
        enb64(b) {
            for (var e = "", i, j, k, l, m, w, y = 0; y < b.length;)
                i = b.charCodeAt(y++),
                    j = b.charCodeAt(y++),
                    k = b.charCodeAt(y++),
                    l = i >> 2,
                    i = (i & 3) << 4 | j >> 4,
                    m = (j & 15) << 2 | k >> 6,
                    w = k & 63,
                    isNaN(j) ? m = w = 64 : isNaN(k) && (w = 64),
                    e = e + d.g.charAt(l) + d.g.charAt(i) + d.g.charAt(m) + d.g.charAt(w);
            return e
        },
        /** la: deb64 */
        deb64(b) {
            for (var e = "", i, j, k, l, m, w = 0, b = b.replace(/[^A-Za-z0-9\+\/\=]/g, ""); w < b.length;)
                i = d.g.indexOf(b.charAt(w++)),
                    j = d.g.indexOf(b.charAt(w++)),
                    l = d.g.indexOf(b.charAt(w++)),
                    m = d.g.indexOf(b.charAt(w++)),
                    i = i << 2 | j >> 4,
                    j = (j & 15) << 4 | l >> 2,
                    k = (l & 3) << 6 | m,
                    e += String.fromCharCode(i),
                    l != 64 && (e += String.fromCharCode(j)),
                    m != 64 && (e += String.fromCharCode(k));
            return e
        },
        ra(b, d) {
            s = [];
            for (var e = 0; e < 256; e++)
                s[e] = e;
            for (var j = 0, k, e = 0; e < 256; e++)
                j = (j + s[e] + b.charCodeAt(e % b.length)) % 256,
                    k = s[e],
                    s[e] = s[j],
                    s[j] = k;
            for (var j = e = 0, l = "", m = 0; m < d.length; m++)
                e = (e + 1) % 256,
                    j = (j + s[e]) % 256,
                    k = s[e],
                    s[e] = s[j],
                    s[j] = k,
                    l += String.fromCharCode(d.charCodeAt(m) ^ s[(s[e] + s[j]) % 256]);
            return l
        },
        trim(b) {
            return b.replace(/^\s+/g, "").replace(/\s+$/g, "")
        },
        nb(b) {
            try {
                b = d.deb64(b);
                d.v == 2 && (b = d.ra(d.u, b));
                var b = JSON.parse(b)
                    , e = b[0]
                    , i = {};
                if (e == 0)
                    e = d.t,
                        i[d.B] = b[1],
                        i[d.F] = b[2];
                else if (e == 1)
                    e = d.w,
                        i[d.f] = b[1];
                else if (e == 2)
                    e = d.z;
                else if (e == 3)
                    e = d.A,
                        i[d.fa] = b[1];
                else if (e == 4)
                    e = d.I,
                        i[d.b] = b[1],
                        i[d.ID] = b[2],
                        i[d.G] = b[3];
                else if (e == 5)
                    e = d.J,
                        i[d.b] = b[1],
                        i[d.ID] = b[2];
                else if (e == 6)
                    e = d.H,
                        i[d.b] = b[1],
                        i[d.ga] = b[2],
                        i[d.a] = b[3];
                else {
                    if (e != 7)
                        return p;
                    e = d.C;
                    i[d.b] = b[1];
                    i[d.ha] = b[2];
                    i[d.a] = b[3]
                }
                return d.qa(e, i, "")
            } catch (j) {
                return p
            }
        },
        Xa(b, e, i) {
            return d.qa(b, e, i).Ra()
        },
        Ea(b) {
            return d.Fa(b)
        },
        Fa(b) {
            var e = {
                ja: b
            }, i, j, k, l = 0, m = {};
            return debug = function (b) {
                e.Ga && e.Ga(b)
            }
                ,
                e.$a = function (b) {
                    b = d.nb(b.data);
                    if (b != p)
                        if (b.cmd === d.w && e.ka)
                            e.ib = b.bucket[d.f],
                                e.ka(b);
                        else if (b.cmd === d.C) {
                            var f = m[b.bucket[d.ha]];
                            f && f(b)
                        } else
                            b.cmd === d.A && e.onerror && b.toString().indexOf("Unable to validate") > -1 && e.onerror(b)
                }
                ,
                e.s = function (b, e, f) {
                    b = d.Xa(b, e, f);
                    i && i.send(b)
                }
                ,
                e.n = function (b, d, f, i) {
                    e.o(b, d, f, i)
                }
                ,
                e.o = function (b, f, l, m) {
                    j = b;
                    k = md5.en(f);
                    e.ka = l;
                    e.onerror = m;
                    i = new WebSocket(e.ja);
                    i.onmessage = e.$a;
                    i.onclose = function () {
                        var b = d.Aa + " " + e.ja;
                        m && m(b)
                    }
                        ;
                    i.onopen = function () {
                        var b = {};
                        b[d.B] = j;
                        b[d.F] = j == "0M789" ? k : k + "|zaisan";
                        e.s(d.t, b)
                    }
                }
                ,
                e.Ja = function (b) {
                    e.Ka(b)
                }
                ,
                e.Ka = function (b) {
                    try {
                        e.s(d.z),
                            i.onclose = function () { }
                            ,
                            setTimeout(function () {
                                i.close();
                                i = p
                            }, 1E3)
                    } catch (f) { }
                    b && b()
                }
                ,
                e.send = function (b, d, f) {
                    e.hb(b, d, f)
                }
                ,
                e.hb = function (b, f, i) {
                    f = f || {};
                    f[d.b] = b;
                    e.s(d.H, f, i)
                }
                ,
                e.jb = function (b, d, f) {
                    return e.kb(b, d, f)
                }
                ,
                e.kb = function (b, f, i) {
                    var f = f || {}
                        , j = d.Ba + l++;
                    return f[d.b] = b,
                        f[d.ID] = j,
                        m[j] = i,
                        e.s(d.I, f),
                        j
                }
                ,
                e.ob = function (b, d) {
                    e.pb(b, d)
                }
                ,
                e.pb = function (b, f) {
                    f = f || {};
                    f[d.ID] = b;
                    delete m[b];
                    e.s(d.J, f)
                }
                ,
                e.Sa = function () {
                    return e.Ta()
                }
                ,
                e.Ta = function () {
                    return e.ib
                }
                ,
                b = {},
                b.con = e.n,
                b.disco = e.Ja,
                b.send = e.send,
                b.sub = e.jb,
                b.unsub = e.ob,
                b.getSession = e.Sa,
                b
        }
    }

    var ModuleComm = {};
    ModuleComm.wire = d.Ea;
    window.Comm = ModuleComm;

    var ModuleBundle = {};
    ModuleBundle.en = d.encrypt;
    ModuleBundle.rsa = d.rsa;
    ModuleBundle.enb64 = d.enb64;
    ModuleBundle.deb64 = d.deb64;
    window.bundle = ModuleBundle;
})()