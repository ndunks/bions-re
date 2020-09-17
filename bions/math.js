(function() {
    var b = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    Math.uuid = function(d, e) {
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
    Math.jb = function() {
        for (var d = Array(36), e = 0, f, g = 0; g < 36; g++)
            g == 8 || g == 13 || g == 18 || g == 23 ? d[g] = "-" : g == 14 ? d[g] = "4" : (e <= 2 && (e = 33554432 + Math.random() * 16777216 | 0),
            f = e & 15,
            e >>= 4,
            d[g] = b[g == 19 ? f & 3 | 8 : f]);
        return d.join("")
    }
    ;
    Math.ib = function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(b) {
            var e = Math.random() * 16 | 0;
            return (b == "x" ? e : e & 3 | 8).toString(16)
        })
    }
}
)();
