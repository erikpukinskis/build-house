var library = require("module-library")(require)

library.using(
  ["web-host", "./render-index"],
  function(host, renderIndex) {

    host.onSite(function(site) {
      renderIndex.prepareSite(site)
    })

    host.onRequest(function(getBridge) {
      renderIndex(getBridge())
    })

  }
)
