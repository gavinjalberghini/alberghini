(function () {
  var body = document.body;
  var year = body.getAttribute("data-year");
  var product = body.getAttribute("data-product") || "GFRC";
  var container = document.querySelector("#unity-container");
  var canvas = document.querySelector("#unity-canvas");
  var loadingBar = document.querySelector("#unity-loading-bar");
  var progressBarFull = document.querySelector("#unity-progress-bar-full");
  var warningBanner = document.querySelector("#unity-warning");
  var fullscreenButton = document.querySelector("[data-game-full]");
  var padStatus = document.querySelector("[data-game-pad]");
  var unityInstance = null;

  function showBanner(msg, type) {
    function update() {
      warningBanner.style.display = warningBanner.children.length ? "block" : "none";
    }
    var div = document.createElement("div");
    div.textContent = msg;
    warningBanner.appendChild(div);
    if (type === "error") {
      div.className = "is-error";
    } else {
      window.setTimeout(function () {
        if (div.parentNode) warningBanner.removeChild(div);
        update();
      }, 5000);
    }
    update();
  }

  function refreshPads() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var connected = false;
    for (var i = 0; i < pads.length; i++) {
      if (pads[i]) connected = true;
    }
    if (!padStatus) return;
    padStatus.hidden = !connected;
  }

  window.addEventListener("gamepadconnected", refreshPads);
  window.addEventListener("gamepaddisconnected", refreshPads);
  window.setInterval(refreshPads, 1000);

  canvas.addEventListener("pointerdown", function () {
    canvas.focus();
  });

  var buildUrl = "Build";
  var loaderUrl = buildUrl + "/" + year + ".loader.js";
  var config = {
    dataUrl: buildUrl + "/" + year + ".data.unityweb",
    frameworkUrl: buildUrl + "/" + year + ".framework.js.unityweb",
    codeUrl: buildUrl + "/" + year + ".wasm.unityweb",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "Grassfield High School STEM Academy",
    productName: product,
    productVersion: "0.1",
    showBanner: showBanner
  };

  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    var meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes";
    document.head.appendChild(meta);
    container.className = "unity-mobile";
    canvas.className = "unity-mobile";
    showBanner("These WebGL builds are meant for a desktop browser.", "warning");
  }

  loadingBar.style.display = "block";

  var script = document.createElement("script");
  script.src = loaderUrl;
  script.onload = function () {
    createUnityInstance(canvas, config, function (progress) {
      progressBarFull.style.width = 100 * progress + "%";
    })
      .then(function (instance) {
        unityInstance = instance;
        loadingBar.style.display = "none";
        canvas.focus();
      })
      .catch(function (message) {
        showBanner(message, "error");
      });
  };
  script.onerror = function () {
    showBanner("Could not load the Unity player. The build may still be publishing.", "error");
  };
  document.body.appendChild(script);

  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", function () {
      if (unityInstance) unityInstance.SetFullscreen(1);
    });
  }
})();
