var library = require("module-library")(require)

module.exports = library.export(
  "build",
  ["house-plan", "browser-bridge", "web-element", "./build-floor", "./build-wall", "./instruction-page", "basic-styles", "house-panels", "building-materials", "tell-the-universe", "./doable"],
  function(HousePlan, BrowserBridge, element, buildFloor, buildWall, instructionPage, basicStyles, panels, buildingMaterials,tellTheUniverse, doable) {


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


    var index = element([
      element("h1", "Instructions")
    ])

    var builderByTag = {}
    var optionsByTag = {}

    addPage("base floor section", buildFloor)
    addPage("floor extension", buildFloor)
    addPage("back wall section", buildWall)
    addPage("side wall", buildWall)
    addPage("side wall extension", buildWall)

    function addPage(tag, builder) {

      var link = element("a", tag, {
        href: "/build-section/"+encodeURIComponent(tag)
      })

      index.addChild(
        element("li", link)
      )

      var options = panels.byTag[tag]
      builderByTag[tag] = builder
      optionsByTag[tag] = options
    }

    function renderIndex(bridge) {
      basicStyles.addTo(bridge)
      bridge.send(index)
    }

    var baseBridge = new BrowserBridge()
    basicStyles.addTo(baseBridge)

    function prepareSite(site) {

      site.addRoute("get", "/build-section/:tagText", function(request, response) {

        if (!tellTheUniverse.isReady()) {
          response.send("server not ready yet")
          return
        }

        var tag = request.params.tagText
        var options = optionsByTag[tag]
        var builder = builderByTag[tag]

        if (!options) {
          throw new Error("no options for "+tag)
        }

        var plan = new HousePlan()

        panels.addTo(plan, tag)

        var materials = buildingMaterials.forPlan(plan)

        var steps = builder(options, materials)

        var bridge = baseBridge.forResponse(response)

        var onComplete = doable.complete.defineOn(site, bridge, tellTheUniverse)

        instructionPage.prepareBridge(bridge, onComplete)

        instructionPage(steps, materials, bridge, tag)

      })
    }

    renderIndex.prepareSite = prepareSite

    return renderIndex
  }
)
