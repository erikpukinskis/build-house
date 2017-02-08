var library = require("module-library")(require)

module.exports = library.export(
  "build-house",
  ["./build-wall", "./build-floor", "./instruction-page"],
  function(buildWall, buildFloor, instructionPage) {

    return {
      buildWall: buildWall,
      buildFloor: buildFloor,
      prepareBridge: instructionPage.prepareBridge,
      instructionPage: instructionPage,
    }

  }
)