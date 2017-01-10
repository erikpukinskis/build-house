var library = require("module-library")(require)

module.exports = library.export(
  "build",
  ["house-plan", "browser-bridge", "web-element", "./build-floor", "./build-wall", "./instruction-page", "basic-styles", "house-panels", "building-materials", "./dasherize"],
  function(HousePlan, BrowserBridge, element, buildFloor, buildWall, instructionPage, basicStyles, panels, buildingMaterials, teensyHouse3, dasherize) {

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

    function boot(site) {

      var baseBridge = new BrowserBridge()
      baseBridge.addToHead(basicStyles)

      site.addRoute(
        "get", "/build-house",
        baseBridge.sendPage(index)
      )

      site.addRoute(
        "get", "/build-section/:tagText",
        function(request, response) {
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

          // should be buildBridge.fork()
          var bridge = baseBridge.copy()

          var handler = instructionPage(steps, materials, bridge, site, tag)

          handler(request, response)
        }
      )
    }

    return boot
  }
)
