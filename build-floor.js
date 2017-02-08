var library = require("module-library")(require)

module.exports = library.export(
  "build-floor",
  ["./steps", "house-plan", "./dimension-text"],
  function(Steps, HousePlan, dimensionText) {

    function buildFloor(options, materials) {

      var STUD_WIDTH = HousePlan.parts.stud.WIDTH
      materials.setPrefix(options.name)

      var steps = new Steps()

      var joists = materials.list(
        "joist-*"
      )

      steps.add("cut steel track", function(cut) {
        cut(materials.list(
          "*-front-track",
          "*-back-track"
        ))

      })

      steps.add("cut joists", function(cut) {

        cut(joists)

      })

      steps.add("cut sheathing", function(cut, marks, task) {

        cut(materials.list("sheathing"))

        task("sheathing-lines", "Chalk lines "+marks(joists, options)+" from the right")
      })

      steps.add("cut subfloor", function(cut, marks, task) {

        cut(materials.list("subfloor"))

        task("subfloor-lines", "Chalk  lines "+marks(joists, options)+" from the left")

      })

      steps.add("lay out framing", function(task) {

        var trackLength = dimensionText(materials.list("front-track")[0].size
        )

        task("space-tracks", "Lay out the front and back tracks (should be "+trackLength+" long) "+dimensionText(options.zSize)+" apart.")

        function toLeft(joist) {
          return dimensionText(joist.destination.xPos)
        }

        task("set-joists", "Set the joists in the tracks "+joists.map(toLeft)+" from the right")

        // diagram("bottom", materials.list("front-track", "back-track", "joist-A", "joist-B", "joist-C", "joist-D"))

        task("crimp", "Crimp each stud to both tracks, with one single crimp on the top side of the stud")

        task("shim", "Add shims underneath each of the four corners until the tracks and the outer studs are level")

      })


      steps.add("attach sheathing", function(task) {

        var inverseJoin = {
          left: "right",
          right: "left"
        }[options.join]

        task("lay-sheathing", "Lay the sheathing plywood on top of the framing, so that "+itLinesUp(inverseJoin))

        task("screw-sheathing", "Screw down the sheathing, one screw every 8 inches on the chalk lines")

      })

      function itLinesUp(side) {
        if (side == "left") {
          return "the plywood hangs over 3/4in on the right side"
        } else if (side == "right") {
          return "the plywood hangs over 3/4in on the left side"
        } else {
          return "it lines up exactly with the framing"
        }
      }

      steps.add("flip it", function(task) {
        task("flip", "flip the section over")
      })

      steps.add("add insulation", function(task, cut) {

        task("insulate", "cut and add insulation between the joists")

      })

      steps.add("attach subfloor", function(task) {

        task("lay-subfloor", "Lay the subfloor plywood on top of the framing, so that "+itLinesUp(options.join))

        task("screw-subfloor", "Screw down the subfloor, one screw ever 8 inches on the chalk lines")

      })

      return steps
    }

    function enumerate(items) {
      var enumerated = ""

      for(var i=0; i<items.length; i++) {

        var isFirst = i == 0
        var isLast = !isFirst && i == items.length-1

        if (isLast) {
          enumerated += ", and "
        } else if (!isFirst) {
          enumerated += ", "
        }

        enumerated +=  items[i]
      }

      return enumerated
    }

    return buildFloor
  }
)