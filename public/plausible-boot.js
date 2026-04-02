/* Loaded in production from main.tsx — keeps index.html minimal for Vite. */
(function () {
  var w = window;
  w.plausible =
    w.plausible ||
    function () {
      (w.plausible.q = w.plausible.q || []).push(arguments);
    };
  w.plausible.init =
    w.plausible.init ||
    function (i) {
      w.plausible.o = i || {};
    };
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://plausible.io/js/pa-ixiUrEdrdTyD2p69GWz-J.js";
  s.onload = function () {
    w.plausible.init();
  };
  document.body.appendChild(s);
})();
