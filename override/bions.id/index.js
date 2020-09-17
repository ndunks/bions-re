(function(n) {
    
    function o() {}

    function i(a) {
        m.href = a;
        return m.href
    }

    function j(b, d) {
        g.write(a.nm + b + a.cn + d + a.end)
    }
    function xhrRequest(a, d) {
        var c, f = new XMLHttpRequest;
        c = c || o;
        a = a + (a.indexOf("?") == -1 ? "?" : "&") + Date.now();
        try {
            f.open("GET", a, !0),
            f.onreadystatechange = function() {
                if (f.readyState == 4) {
                    var a = f.status
                      , b = f.responseText;
                    a >= 200 && a < 300 || a == 304 || a == 0 && b.length > 0 ? d(b) : c()
                }
            }
            ,
            f.send(null)
        } catch (e) {
            c()
        }
    }
    function insertCode(b, d, isJSOrLink) {
        if (d == "1")
            try {
                eval(b)
            } catch (f) {}
        else
            d = g.createElement(a.sty),
            d.type = a.cs,
            d.textContent = b,
            d.id = "skin",
            b = document.createElement(a.bs),
            b.href = isJSOrLink + "/",
            l.appendChild(b),
            l.appendChild(d),
            l.removeChild(b)
    }
    var g = n.document
      , l = g.head
      , p = JSON.parse
      , m = g.createElement("a")
      , storage = localStorage
      , a = {
        vp: "viewport",
        vpc: "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no",
        wa: "apple-mobile-web-app-capable",
        fs: "apple-touch-fullscreen",
        y: "no",
        nm: '<meta name="',
        cn: '" content="',
        end: '">',
        jsn: "zaisan",
        sty: "style",
        cs: "text/css",
        bs: "base",
        ev: "zaisan.version",
        ecss: "zaisan.skin",
        ecss2: "zaisan.skin2",
        escrp: "zaisan.code",
        "if": "info",
        ft: "you are the first time using bions application<br/>let's loading the application from the server.<br/>this can take a while, please wait...",
        ud: "found new version. let's updating the application..<br/>this can take a while, please wait...",
        lc: "loading from the cache, please wait..."
    };
    j(a.vp, a.vpc);
    j(a.wa, a.y);
    j(a.fs, a.y);
    xhrRequest(i(a.jsn), function(b) {
        var d = document.getElementById(a["if"])
          , c = p(b)
          , b = storage[a.ev];
        b != c[3] ? (d.innerHTML = b == null ? a.ft : a.ud,
        storage[a.ev] = c[3],
        xhrRequest(i(c[0] + "/" + c[1]), function(b) {
            storage[a.ecss] = b;
            storage[a.ecss2] = "";
            insertCode(b, "0", c[0]);
            xhrRequest(i(c[0] + "/" + c[2]), function(b) {
                storage[a.escrp] = b;
                insertCode(b, "1", c[0])
            })
        })) : (d.innerHTML = a.lc,
        insertCode(storage[a.ecss], "0", c[0]),
        insertCode(storage[a.escrp], "1", c[0]))
    })
}
)(window);