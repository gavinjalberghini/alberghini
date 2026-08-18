(function () {
  var roots = document.querySelectorAll("[data-model]");
  if (!roots.length) return;

  function load() {
    import("./model.js");
  }

  if (!("IntersectionObserver" in window)) {
    load();
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      load();
    },
    { rootMargin: "200px 0px" }
  );
  io.observe(roots[0]);
})();
