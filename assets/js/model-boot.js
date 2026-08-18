(function () {
  var root = document.querySelector("[data-model]");
  if (!root) return;

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
  io.observe(root);
})();
