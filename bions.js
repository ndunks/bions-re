const WS = require("ws")
const wss_url = "wss://bions.id:8443/stomp"

const BIONS = {
    CMD_CONNECT: "CONNECT",
    CMD_CONNECTED: "CONNECTED",
    CMD_MESSAGE: "MESSAGE",
    CMD_ERROR: "ERROR",
    CMD_DISCONNECT: "DISCONNECT",
    CMD_SEND: "SEND",
    CMD_SUBSCRIBE: "SUBSCRIBE",
    CMD_UNSUBSCRIBE: "UNSUBSCRIBE",
    txt_subscription: "subscription",
    txt_transaction: "transaction",
    txt_destination: "destination",
    txtSubPrefix: "sub-",
    txt_message_id: "message-id",
    txt_session: "session",
    txt_login: "login",
    txt_passcode: "passcode",
    txt_message: "message",
    ID: "id",
    txt_selector: "selector",
    txt_replyto: "replyto",
    txt_body: "body",
    txt_connection_lost: "connection lost:",
    txt_new_line: "\n",
    version: 2,
    b64Chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    uuid: "",
    publicKey: "d577f81bd8e45d2c8ee74d11c947c0b9107b38464441710b90747919e9eab4c675767f4864582f21d26607fdb99e95be6b89bc2e94cc33164ba4b57a2e7eace87ede90ea32d046790d24644feb20386d7a977ca623d7278cbac20fc886f7093253fe07d9e34a258bab33c2ee03a05b3ae8866924bbf8ab153d86abba36d27ef1",
    publicExponent: "10001",
    /** bL: en ( crypt?) */
    encrypt(b) {
        return BIONS.base64Encode(rsa.en(BIONS.publicKey, BIONS.publicExponent, b))
    },
    /** Da: rsa */
    rsa(b) {
        return rsa.en(BIONS.publicKey, BIONS.publicExponent, b)
    },
    base64Encode(b) {
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
    makeCommand(cmd, bucket, tail) {
        return {
            cmd: cmd,
            bucket: bucket,
            tail: tail,
            encode: function () {
                var msg = [];
                switch (cmd) {
                    case BIONS.CMD_CONNECT:
                        BIONS.version = 2
                        BIONS.uuid = Math.uuid(16)
                        msg.push(0)
                        msg.push(bucket[BIONS.txt_login])
                        msg.push(bucket[BIONS.txt_passcode])
                        msg.push(BIONS.version)
                        msg.push(BIONS.uuid)
                        msg.push(0)
                        msg.push(0)
                        break;
                    case BIONS.CMD_CONNECTED:
                        msg.push(1)
                        msg.push(bucket[BIONS.txt_session])
                        break
                    case BIONS.CMD_DISCONNECT:
                        msg.push(2)
                        break
                    case BIONS.CMD_ERROR:
                        msg.push(3)
                        msg.push(bucket[BIONS.txt_message])
                        break;
                    case BIONS.CMD_SUBSCRIBE:
                        msg.push(4)
                        msg.push(bucket[BIONS.txt_destination])
                        msg.push(bucket[BIONS.ID])
                        if (bucket[BIONS.txt_selector]) {
                            msg.push(bucket[BIONS.txt_selector])
                        }
                        break
                    case BIONS.CMD_UNSUBSCRIBE:
                        msg.push(5)
                        msg.push(bucket[BIONS.txt_destination])
                        msg.push(bucket[BIONS.ID])
                        break
                    case BIONS.CMD_SEND:
                        msg.push(6)
                        msg.push(bucket[BIONS.txt_destination])
                        msg.push(bucket[BIONS.txt_replyto])
                        msg.push(bucket[BIONS.txt_body])
                        break
                    case BIONS.CMD_MESSAGE:
                        msg.push(7)
                        msg.push(bucket[BIONS.txt_destination])
                        msg.push(bucket[BIONS.txt_destination])
                        msg.push(bucket[BIONS.txt_body])
                        break
                    default:
                        console.error("Unhandled command?", cmd)
                        break;
                }

                if (cmd == BIONS.CMD_CONNECT) {
                    return BIONS.base64Encode(
                        rsa.en(BIONS.publicKey, BIONS.publicExponent, JSON.stringify(msg))
                    )
                } else if (BIONS.version == 2) {
                    return BIONS.enb64(BIONS.padding256(BIONS.uuid, JSON.stringify(msg)))
                } else {
                    return BIONS.enb64(JSON.stringify(msg))
                }
            },
            toString: function () {
                var i = cmd + BIONS.txt_new_line;
                if (bucket)
                    for (h in bucket)
                        bucket.hasOwnProperty(h) && (i = i + h + ": " + bucket[h] + BIONS.txt_new_line);
                return i += BIONS.txt_new_line,
                    i
            }
        }
    },
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
                e = e + BIONS.b64Chars.charAt(l) + BIONS.b64Chars.charAt(i) + BIONS.b64Chars.charAt(m) + BIONS.b64Chars.charAt(w);
        return e
    },
    /** la: deb64 */
    deb64(b) {
        for (var e = "", i, j, k, l, m, w = 0, b = b.replace(/[^A-Za-z0-9\+\/\=]/g, ""); w < b.length;)
            i = BIONS.b64Chars.indexOf(b.charAt(w++)),
                j = BIONS.b64Chars.indexOf(b.charAt(w++)),
                l = BIONS.b64Chars.indexOf(b.charAt(w++)),
                m = BIONS.b64Chars.indexOf(b.charAt(w++)),
                i = i << 2 | j >> 4,
                j = (j & 15) << 4 | l >> 2,
                k = (l & 3) << 6 | m,
                e += String.fromCharCode(i),
                l != 64 && (e += String.fromCharCode(j)),
                m != 64 && (e += String.fromCharCode(k));
        return e
    },
    padding256(b, d) {
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
    decodeResponse(b) {
        try {
            b = BIONS.deb64(b);
            BIONS.version == 2 && (b = BIONS.padding256(BIONS.uuid, b));
            var b = JSON.parse(b)
                , e = b[0]
                , i = {};
            if (e == 0)
                e = BIONS.CMD_CONNECT,
                    i[BIONS.txt_login] = b[1],
                    i[BIONS.txt_passcode] = b[2];
            else if (e == 1)
                e = BIONS.CMD_CONNECTED,
                    i[BIONS.txt_session] = b[1];
            else if (e == 2)
                e = BIONS.CMD_DISCONNECT;
            else if (e == 3)
                e = BIONS.CMD_ERROR,
                    i[BIONS.txt_message] = b[1];
            else if (e == 4)
                e = BIONS.CMD_SUBSCRIBE,
                    i[BIONS.txt_destination] = b[1],
                    i[BIONS.ID] = b[2],
                    i[BIONS.txt_selector] = b[3];
            else if (e == 5)
                e = BIONS.CMD_UNSUBSCRIBE,
                    i[BIONS.txt_destination] = b[1],
                    i[BIONS.ID] = b[2];
            else if (e == 6)
                e = BIONS.CMD_SEND,
                    i[BIONS.txt_destination] = b[1],
                    i[BIONS.txt_replyto] = b[2],
                    i[BIONS.txt_body] = b[3];
            else {
                if (e != 7)
                    return null;
                e = BIONS.CMD_MESSAGE;
                i[BIONS.txt_destination] = b[1];
                i[BIONS.txt_subscription] = b[2];
                i[BIONS.txt_body] = b[3]
            }
            return BIONS.makeCommand(e, i, "")
        } catch (j) {
            return null
        }
    },
    encryptData(cmd, bucket, tail) {
        return BIONS.makeCommand(cmd, bucket, tail).encode()
    }
}

function make_uuid(len) {
    var b = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    var f = [], g, base = b.length;
    for (g = 0; g < len; g++)
        f[g] = b[0 | Math.random() * base];
    return f.join("")
}

function checkLoginResponse(b) {
    b = BIONS.decodeResponse(b.data);
    if (b != null)
        if (b.cmd === BIONS.CMD_CONNECTED && wireConn.onLoggedIn)
            wireConn.session_id = b.bucket[BIONS.txt_session],
                wireConn.onLoggedIn(b);
        else if (b.cmd === BIONS.CMD_MESSAGE) {
            var f = m[b.bucket[BIONS.txt_subscription]];
            f && f(b)
        } else
            b.cmd === BIONS.CMD_ERROR && wireConn.onerror && b.toString().indexOf("Unable to validate") > -1 && wireConn.onerror(b)
}
function checkUser(user) {

}

function connect(user, passcode) {
    BIONS.uuid = make_uuid(16);
    return new Promise( (res, rej) => {
        
        const ws = new WS(wss_url);
        ws.onerror = rej;
    })
}