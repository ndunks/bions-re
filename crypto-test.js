// Math ext Class

//d.Q 
b = atob()
function decrypt(b) {
    var e = "", i, j, k, l, m, w;

    for (y = 0; y < b.length; )
        i = b.charCodeAt(y++);
        j = b.charCodeAt(y++);
        k = b.charCodeAt(y++);
        l = i >> 2;
        i = (i & 3) << 4 | j >> 4;
        m = (j & 15) << 2 | k >> 6;
        w = k & 63;
        isNaN(j) ? m = w = 64 : isNaN(k) && (w = 64);
        e = e + d.g.charAt(l) + d.g.charAt(i) + d.g.charAt(m) + d.g.charAt(w);
    return e
}