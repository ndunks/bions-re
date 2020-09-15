(function () {
    var p = null;
    var d = {
        txtCONNECT: "CONNECT",
        txtCONNECTED: "CONNECTED",
        txtMESSAGE: "MESSAGE",
        txtERROR: "ERROR",
        txtDISCONNECT: "DISCONNECT",
        txtSEND: "SEND",
        txtSUBSCRIBE: "SUBSCRIBE",
        txtUNSUBSCRIBE: "UNSUBSCRIBE",
        txtsubscription: "subscription",
        txttransaction: "transaction",
        txtdestination: "destination",
        txtSubPrefix: "sub-",
        txtmessage_id: "message-id",
        txtsession: "session",
        txtlogin: "login",
        txtpasscode: "passcode",
        txtmessage: "message",
        ID: "id",
        txtselector: "selector",
        txtreplyto: "replyto",
        txtbody: "body",
        txtconnection_lost: "connection lost:",
        txt_new_line: "\n",
        version: 2,
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
        encryptMesage(cmd, bucket, tail) {
            return {
                cmd: cmd,
                bucket: bucket,
                tail: tail,
                Ra: function () {
                    var i = [];
                    return d.txtCONNECT == cmd ? (d.version = 2,
                        d.u = Math.uuid(16),
                        i.push(0),
                        i.push(bucket[d.txtlogin]),
                        i.push(bucket[d.txtpasscode]),
                        i.push(d.version),
                        i.push(d.u),
                        i.push(0),
                        i.push(0)) : d.txtCONNECTED == cmd ? (i.push(1),
                            i.push(bucket[d.txtsession])) : d.txtDISCONNECT == cmd ? i.push(2) : d.txtERROR == cmd ? (i.push(3),
                                i.push(bucket[d.txtmessage])) : d.txtSUBSCRIBE == cmd ? (i.push(4),
                                    i.push(bucket[d.txtdestination]),
                                    i.push(bucket[d.ID]),
                                    bucket[d.txtselector] && i.push(bucket[d.txtselector])) : d.txtUNSUBSCRIBE == cmd ? (i.push(5),
                                        i.push(bucket[d.txtdestination]),
                                        i.push(bucket[d.ID])) : d.txtSEND == cmd ? (i.push(6),
                                            i.push(bucket[d.txtdestination]),
                                            i.push(bucket[d.txtreplyto]),
                                            i.push(bucket[d.txtbody])) : d.txtMESSAGE == cmd && (i.push(7),
                                                i.push(bucket[d.txtdestination]),
                                                i.push(bucket[d.txtdestination]),
                                                i.push(bucket[d.txtbody])),
                        cmd == d.txtCONNECT ? d.oa(rsa.en(d.L, d.K, JSON.stringify(i))) : d.version == 2 ? d.enb64(d.ra(d.u, JSON.stringify(i))) : d.enb64(JSON.stringify(i))
                },
                toString: function () {
                    var i = cmd + d.txt_new_line;
                    if (bucket)
                        for (h in bucket)
                            bucket.hasOwnProperty(h) && (i = i + h + ": " + bucket[h] + d.txt_new_line);
                    return i += d.txt_new_line,
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
                d.version == 2 && (b = d.ra(d.u, b));
                var b = JSON.parse(b)
                    , e = b[0]
                    , i = {};
                if (e == 0)
                    e = d.txtCONNECT,
                        i[d.txtlogin] = b[1],
                        i[d.txtpasscode] = b[2];
                else if (e == 1)
                    e = d.txtCONNECTED,
                        i[d.txtsession] = b[1];
                else if (e == 2)
                    e = d.txtDISCONNECT;
                else if (e == 3)
                    e = d.txtERROR,
                        i[d.txtmessage] = b[1];
                else if (e == 4)
                    e = d.txtSUBSCRIBE,
                        i[d.txtdestination] = b[1],
                        i[d.ID] = b[2],
                        i[d.txtselector] = b[3];
                else if (e == 5)
                    e = d.txtUNSUBSCRIBE,
                        i[d.txtdestination] = b[1],
                        i[d.ID] = b[2];
                else if (e == 6)
                    e = d.txtSEND,
                        i[d.txtdestination] = b[1],
                        i[d.txtreplyto] = b[2],
                        i[d.txtbody] = b[3];
                else {
                    if (e != 7)
                        return p;
                    e = d.txtMESSAGE;
                    i[d.txtdestination] = b[1];
                    i[d.txtsubscription] = b[2];
                    i[d.txtbody] = b[3]
                }
                return d.encryptMesage(e, i, "")
            } catch (j) {
                return p
            }
        },
        encryptData(cmd, bucket, tail) {
            return d.encryptMesage(cmd, bucket, tail).Ra()
        },
        makeWire(b) {
            return d.wireSetup(b)
        },
        wireSetup(b) {
            var i, plainUser, k, l = 0, m = {};
            debug = function (b) {
                wireConn.Ga && wireConn.Ga(b)
            }
            var wireConn = {
                session_id: '',
                onLoggedIn: null,
                ja: b,
                checkLoginResponse(b) {
                    b = d.nb(b.data);
                    if (b != p)
                        if (b.cmd === d.txtCONNECTED && wireConn.onLoggedIn)
                            wireConn.session_id = b.bucket[d.txtsession],
                                wireConn.onLoggedIn(b);
                        else if (b.cmd === d.txtMESSAGE) {
                            var f = m[b.bucket[d.txtsubscription]];
                            f && f(b)
                        } else
                            b.cmd === d.txtERROR && wireConn.onerror && b.toString().indexOf("Unable to validate") > -1 && wireConn.onerror(b)
                },
                encryptAndSend(cmd, bucket, tail) {
                    cmd = d.encryptData(cmd, bucket, tail);
                    i && i.send(cmd)
                },
                connect(user, passcode, onSuccess, onError) {
                    wireConn.initWebSocket(user, passcode, onSuccess, onError)
                },
                initWebSocket(user, passcode, onSuccess, onError) {
                    plainUser = user;
                    k = md5.en(passcode);
                    wireConn.onLoggedIn = onSuccess;
                    wireConn.onerror = onError;
                    i = new WebSocket(wireConn.ja);
                    i.onmessage = wireConn.checkLoginResponse;
                    i.onclose = function () {
                        var b = d.txtconnection_lost + " " + wireConn.ja;
                        onError && onError(b)
                    }
                        ;
                    i.onopen = function () {
                        var loginReq = {};
                        loginReq[d.txtlogin] = plainUser;
                        loginReq[d.txtpasscode] = plainUser == "0M789" ? k : k + "|zaisan";
                        wireConn.encryptAndSend(d.txtCONNECT, loginReq)
                    }
                },
                disconnect(b) {
                    wireConn.close(b)
                },
                close(b) {
                    try {
                        wireConn.encryptAndSend(d.txtDISCONNECT),
                            i.onclose = function () { }
                            ,
                            setTimeout(function () {
                                i.close();
                                i = p
                            }, 1E3)
                    } catch (f) { }
                    b && b()
                },
                send(b, d, f) {
                    wireConn.sendData(b, d, f)
                },
                sendData(b, f, i) {
                    f = f || {};
                    f[d.txtdestination] = b;
                    wireConn.encryptAndSend(d.txtSEND, f, i)
                },
                sub(b, d, f) {
                    return wireConn.kb(b, d, f)
                },
                kb(b, f, i) {
                    var f = f || {}
                        , j = d.txtSubPrefix + l++;
                    return f[d.txtdestination] = b,
                        f[d.ID] = j,
                        m[j] = i,
                        wireConn.encryptAndSend(d.txtSUBSCRIBE, f),
                        j
                },
                ob(b, d) {
                    wireConn.sendUnsubscribe(b, d)
                },
                sendUnsubscribe(b, f) {
                    f = f || {};
                    f[d.ID] = b;
                    delete m[b];
                    wireConn.encryptAndSend(d.txtUNSUBSCRIBE, f)
                },
                getSession() {
                    return wireConn.cur_session_id()
                },
                cur_session_id() {
                    return wireConn.session_id
                }
            };
            b = {
                con: wireConn.connect,
                disco: wireConn.disconnect,
                send: wireConn.send,
                sub: wireConn.sub,
                unsub: wireConn.ob,
                getSession: wireConn.getSession
            }
            return b;
        }
    }

    var ModuleComm = {};
    ModuleComm.wire = d.makeWire;
    window.Comm = ModuleComm;

    var ModuleBundle = {};
    ModuleBundle.en = d.encrypt;
    ModuleBundle.rsa = d.rsa;
    ModuleBundle.enb64 = d.enb64;
    ModuleBundle.deb64 = d.deb64;
    window.bundle = ModuleBundle;
})()