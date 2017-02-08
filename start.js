var library = require("module-library")(require)

library.using(
  ["web-host", "./server", "house-plan", "house-panels", "building-materials"],
  function(host, renderIndex, HousePlan, panels, buildingMaterials) {


    host.onSite(function(site, materials) {
      var plan = new HousePlan()

      panels.addTo(plan, "base floor section")
      panels.addTo(plan, "back wall section")
      panels.addTo(plan, "side wall")

      var materials = buildingMaterials.forPlan(plan)

      renderIndex.prepareSite(site, materials)
    })

    host.onRequest(function(getBridge) {
      renderIndex(getBridge())
    })

  }
)
