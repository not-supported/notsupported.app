var urlReferrer = window.location.search.substr(1).split('&');
var urlReferrerParsed = [];

for (var i = 0; i < urlReferrer.length; i++) {
    var exploded = urlReferrer[i].split('=');
    urlReferrerParsed[exploded[0]] = exploded[1];
}

var link = document.referrer || urlReferrerParsed.referrer;

if (link) {
    var referrerLink = document.getElementById('referrer-link');

    referrerLink.innerHTML = 'The link you tried to visit is: <span class="italic">' + link + '</span>';
    referrerLink.style.display = "block";
}
