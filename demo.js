var library = require("module-library")(require)

library.using(
  ["web-host", "house-plan", "house-panels", "building-materials", "browser-bridge", "web-element", "./build-floor", "./build-wall", "./instruction-page", "basic-styles", "tell-the-universe", "./doable"],
  function(host, HousePlan, panels, buildingMaterials, BrowserBridge, element, buildFloor, buildWall, instructionPage, basicStyles,tellTheUniverse, doable) {


    // Persistence

    tellTheUniverse = tellTheUniverse
      .called("houses")
      .onLibrary(library)
      .withNames({
        doable: "doable"
      })

    tellTheUniverse.persistToS3({
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: "ezjs"
    })

    tellTheUniverse.loadFromS3(function(){
      console.log("OK! "+doable.count+" tasks done")
    })


    // Setting up routes

    host.onSite(function(site) {
      var plan = new HousePlan()

      panels.addTo(plan, "base floor section")
      panels.addTo(plan, "back wall section")
      panels.addTo(plan, "side wall")

      var materials = buildingMaterials.forPlan(plan)

      prepareSite(site, materials)
    })


    // Handling index requests

    host.onRequest(function(getBridge) {
      renderIndex(getBridge())
    })


    // Helpers
    
    var index = element([
      element("h1", "Instructions")
    ])

    var builderByTag = {
      "base floor section": buildFloor,
      "floor extension": buildFloor,
      "back wall section": buildWall,
      "side wall": buildWall,
      "side wall extension": buildWall
    }

    for(var tag in builderByTag) {
      var link = element("a", tag, {
        href: "/build-section/"+encodeURIComponent(tag)
      })
      index.addChild(
        element("li", link)
      )
    }

    function renderIndex(bridge) {
      basicStyles.addTo(bridge)
      bridge.send(index)
    }

    var baseBridge = new BrowserBridge()
    basicStyles.addTo(baseBridge)

    function prepareSite(site, materials) {

      site.addRoute("get", "/build-section/:tagText", function(request, response) {

        if (!tellTheUniverse.isReady()) {
          response.send("server not ready yet")
          return
        }

        var tag = request.params.tagText

        var bridge = baseBridge.forResponse(response)

        var onComplete = doable.complete.defineOn(site, bridge, tellTheUniverse)

        var options = panels.byTag[tag]

        if (!options) {
          throw new Error("no options for "+tag)
        }

        var builder = builderByTag[tag]

        var steps = builder(options, materials)

        instructionPage.prepareBridge(bridge, onComplete)

        instructionPage(steps, materials, bridge, tag)


      })
    }

  }
)
