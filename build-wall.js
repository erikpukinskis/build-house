var library = require("module-library")(require)

module.exports = library.export(
  "build-face-wall",
  ["./steps", "house-plan", "./dimension-text"],
  function(Steps, HousePlan, dimensionText) {

    function buildWall(options, materials) {

      var STUD_WIDTH = HousePlan.parts.stud.WIDTH
      materials.setPrefix(options.name||"undefined")

      var steps = new Steps()
      var studs = materials.list("stud-*")
      var overhangs = HousePlan.helpers.getOverhangs(options)
      var joins = HousePlan.helpers.getJoinGaps(options)
      var spanDimension = options.zSize ? "z" : "x"

      var halfStud = HousePlan.parts.stud.WIDTH/2

      steps.add("cut sheathing", function(cut, task, marks) {
          var sheathing = materials.get("sheathing")

          cut(sheathing, "sheathing")

          var length = Math.abs(sheathing.destination.ySize)
          var isFullLength = length == 96

          if (sheathing.cut == "rip" && !isFullLength) {
            cut({
              cut: "cross",
              size: length,
              slope: sheathing.slope,
              material: {
                description: "the sheathing",
                width: sheathing.size,
              }
            })
          }

          var marks = marks(studs, {
            dimension: spanDimension,
            extra: HousePlan.helpers.getOverhangs(options).left + halfStud,
          })

          task("sheathing-stud-lines", "mark lines "+marks+" from the left")

          var trackFromTop = HousePlan.helpers.sliceToNormal(overhangs.top, options.slope) + joins.top + STUD_WIDTH/2

          var trackFromBottom = overhangs.bottom + STUD_WIDTH/2

          task("sheathing-track-lines", "mark horizontal lines "+dimensionText(trackFromTop)+" from the top and "+dimensionText(trackFromBottom)+" from the bottom")

          task("sheathing-screw-spacing", "cross all lines with a mark approximately every 10 inches")

          // cut notches in the plywood
        }
      )

      steps.add("cut interior", function(cut, task, marks) {
          var interior = materials.get("interior")

          cut(interior)

          var length = Math.abs(interior.destination.ySize)
          var isFullLength = length == 96

          if (interior.cut == "rip" && !isFullLength) {
            cut({
              cut: "cross",
              size: length,
              slope: interior.slope,
              material: {
                description: "the interior",
                width: interior.size,
              }
            })
          }


          var marks = marks(studs, {
            dimension: spanDimension,
            extra: halfStud,
          })

          task("interior-stud-lines", "mark lines "+marks+"from the right")

          var trackFromTop = joins.top + STUD_WIDTH/2

          var trackFromBottom = STUD_WIDTH/2

          task("interiod-track-lines", "mark horizontal lines "+dimensionText(trackFromTop)+" from the top and "+dimensionText(trackFromBottom)+" from the bottom")

          task("interior-screw-spacing", "cross all lines with a mark approximately every 10 inches")
        }
      )

      var LETTERS = ["A", "B", "C", "D", "E", "F"]

      steps.add("cut studs",
        function(cut) {
          cut(studs, LETTERS)
        }
      )

      steps.add("cut track",
        function(cut, task, marks) {

          cut(materials.get("top-track"), "top")

          if (options.slope) {
            // we want the marks to be a little further back so that when we line them up at the end of the flange, they'll hit the web at the right spot
            var extra = -options.slope*STUD_WIDTH
          } else {
            var extra = 0
          }

          var topMarks = marks(
            studs, {
              dimension: spanDimension,
              slope: options.slope,
              extra: extra
            }
          )

          task("mark-top-track", "With the flanges facing towards you, mark the TOP track with a wax pencil at "+topMarks+" from the left, putting an ✗ to the right of each mark")


          cut(materials.get("bottom-track"), "bottom")

          var bottomMarks = marks(
            studs, {
              dimension: spanDimension,
            }
          )

          task("mark-bottom-track", "With the flanges facing away from you, mark the BOTTOM track with a wax pencil at "+bottomMarks+" from the left, putting an ✗ to the right of each mark")


          task("transfer-track-marks", "Transfer the marks to other sides of each piece of track")
        }
      )

      steps.add("lay out framing",
        function(task) {
          var spacing = Math.ceil(options.ySize/12)


          task("lay-out-framing", "Space the two pieces of track <strong>"+spacing+" feet</strong> apart. Set the studs inside the tracks on the X side of each mark. Studs should face in.")
          task("crimp", "At each stud-track intersection, have one person press the stud securely up into the track, while another person crimps the two together.")
          task("flip-framing", "Gently flip the frame over")
          task("crimp-other-side", "Crimp the other side")
        }
      )

      if (joins.right > 0) {

        // we're going to start from the leftmost stud, but since the panel starts off flipped, it will be on the right
        var interiorAlignmentSide = "right"

        var interiorAlignmentInset = halfStud

        var interiorOppositeSide = "left"

        // we don't care exactly what this is, we're just trying to clear the joining stud, so anything over 3/4" should work
        var interiorOppositeInset = 2 + overhangs.left

      } else if (joins.left > 0) {
        var interiorAlignmentSide = "left"
        var interiorAlignmentInset = halfStud
        var interiorOppositeSide = "right"
        var interiorOppositeInset = 2 + overhangs.right
      } else {
        throw new Error("no joins?")
      }

      steps.add("square interior",
        function(task) {
          task("position-interior", "Lay the interior (sanded) plywood on the framing, sanded face up, factory edge roughly lined up with the bottom track. If the plywood is bowed, put something heavy in the middle.") 

          task("square-first-corner", "using a tri-square, align the plywood vertically with the "+interiorAlignmentSide+"most stud and the bottom track")

          task("first-corner-screw", "Put a self-driving screw about "+dimensionText(1/2)+" from the bottom and about "+dimensionText(interiorAlignmentInset)+" from the "+interiorAlignmentSide)

          // http://www.carpentry-tips-and-tricks.com/Carpenter-square.html

          task("square-bottom-side", "Square the bottom "+interiorOppositeSide+" corner the same way, and put a self-driving screw in "+dimensionText(1/2)+" from the bottom and "+dimensionText(interiorOppositeInset)+" from the "+interiorOppositeSide)

          task("square-top-left", "Move the top left corner so that it is square with the stud and use your tri-square to check the top track is "+dimensionText(joins.top)+" from the edge of the plywood at every point.")

          task("screw-top-left", "Put a screw "+dimensionRound(joins.top+5/8)+" from the top and "+dimensionRound(interiorAlignmentInset)+" from the left")

          task("screw-top-left", "Put a screw "+dimensionRound(joins.top+5/8)+" from the top and "+dimensionRound(interiorOppositeInset)+" from the right")

        }
      )

      steps.add("attach interior",
        function(task) {
          task("screw-stud-and-track", "Put a self-driving every 10 inches or so on the stud and track lines")
        }
      )

      steps.add("flipsulate", function(task) {
          task("flip-squared", "Flip the section over")

          task("insulate", "Add insulation between each stud")
        }
      )

      if (joins.right > 0) {

        // Now the panel is flipped, but we want to start squaring from the join side, so alignment still starts from the right
        var sheathingAlignmentSide = "right"

        // again we want to clear the joining stud
        var sheathingAlignmentInset = 2

        var sheathingOppositeSide = "left"

        var sheathingOppositeInset = halfStud + overhangs.left

      } else if (joins.left > 0) {
        var sheathingAlignmentSide = "left"
        var sheathingAlignmentInset = 2
        var sheathingOppositeSide = "right"
        var sheathingOppositeInset = 2 + overhangs.right
      } else {
        throw new Error("no joins?")
      }



      steps.add("align sheathing", function(task) {

          task("lay-sheathing", "Lay the sheathing on the frame, with the factory edge toward the bottom.")

          var bottomOverhang = options.bottomOverhang||0

          var topOverhang = HousePlan.helpers.sliceToNormal(overhangs.top, options.slope) + joins.top

          task("square-sheathing-join-corner", "Align the sheathing so that the bottom edge is uniformly "+dimensionText(bottomOverhang)+" past the framing, and the "+sheathingAlignmentSide+" edge is square with the interior plywood that's face down. Put a screw on the track line "+dimensionText(sheathingAlignmentInset)+" from the "+sheathingAlignmentSide)

          task("square-sheathing-opposite-corner", "Align the top "+sheathingOppositeSide+" corner next, so that the top edge of the plywood extends "+dimensionText(topOverhang)+" past the top track, and the left edge extends "+dimensionText(overhangs[sheathingOppositeSide])+" past the left stud. Put a screw on the track line "+dimensionText(sheathingOppositeInset)+" from the "+sheathingOppositeSide)
        }
      )

      steps.add("attach sheathing",
        function(task) {
          task("attach-sheathing", "Put screws on the stud and track lines every 10 inches as with the interior plywood")
        }
      )

      if (joins.right > 0) {
        steps.add("joining stud",
          function(task, cut) {
            cut(materials.get("joining-stud"))
            task("add-joining-stud", "slide the stud into the right side of the panel, so that "+dimensionText(0.75)+" is sticking out.")
            task("screw-joining-stud", "Add a screw about every 10 inches, "+dimensionText(0.5)+" from the edge")
          }
        )
      }

      return steps
    }

    function dimensionRound(number) {
      var rounded = Math.round(number*2)/2
      return dimensionText(rounded)
    }

    return buildWall
  }
)

