var library = require("module-library")(require)

module.exports = library.export(
  "send-instructions",
  ["browser-bridge", "web-element", "./dimension-text", "tell-the-universe", "./doable", "house-plan"],
  function(BrowserBridge, element, dimensionText, tellTheUniverse, doable, HousePlan) {

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

    function instructionPage(steps, materials, bridge, server, sectionName) {

      var saveCompletion = doable.complete.defineOn(server, bridge, tellTheUniverse)

      var completeTask = bridge.defineFunction(
        [saveCompletion],
        function completeTask(save, id) {

          var el = document.querySelector(".task-"+id)

          var isCompleted = el.classList.contains("task-completed")

          if (isCompleted) { return }

          el.classList.add("task-completed")

          save(id)
        }
      )

      bridge.addToHead(element.stylesheet(stepTitle, em, checkBox, checkMark, checkMarkChecked, taskTemplate, taskCompleted).html())

      var page

      var handlers = {
        step: function(description, results) {
          var stepEl = element(
            ".step",
            stepTitle(description)
          )

          if (results) {
            results.map(function(el) {
              if (!el.html) { return }
              stepEl.addChild(el)
            })
          }
          page.addChild(stepEl)
        },
        task: task,
        cut: function(scraps, labels) {
          if (!Array.isArray(scraps)) {
            scraps = [scraps]
            labels = [labels]
          } else if (!labels) {
            labels = []
          }
          return element(".cut_instructions", zip(scraps, labels, scrapToTask))
        },
        marks: function(scraps, options, side) {

          if (options.name) {
            throw new Error("boop")
          } else if (side) {
            throw new Error("boop")
          }

          if (!options.dimension) {
            throw new Error("marks needs a dimension along which to mark")
          }

          var offsetProperty = options.dimension+"Pos"

          var extra = options.extra || 0
          var slope = options.slope || 0

          function toAlignment(scrap, i) {
            var fromLeft = extra + scrap.destination[offsetProperty]

            var rise = fromLeft*slope

            var fromEnd = Math.sqrt(
              fromLeft*fromLeft + rise*rise
            )

            var lastOne = (i == scraps.length - 1)

            return dimensionText(fromEnd, {wordBreak: lastOne})
          }

          var marks = enumerate(scraps.map(toAlignment))

          return marks
        },
      }

      function scrapToTask(scrap, label) {
        var material = scrap.material

        if (scrap.tilt) {
          var differential = scrap.material.width*scrap.tilt

          var text = "cut "+dimensionText(scrap.size)+" on a "+dimensionText(differential)+" tilt "

        } else if (scrap.cut == "cross" && scrap.slope) {

          var shortSide = scrap.size - scrap.slope*scrap.material.width

          var wordBreak = scrap.slopeHint ? false : true

          var text = scrap.cut+" cut a diagonal "+dimensionText(scrap.size)+" to "+dimensionText(shortSide, {wordBreak: wordBreak})

          if (scrap.slopeHint) {
            text += ", "+scrap.slopeHint+","
          }
        } else {
          var text = scrap.cut+" cut <strong>"+dimensionText(scrap.size)+"</strong>"
        }

        text += " from "+material.description
        if (material.number) {
          text += " #"+material.number
        }

        if (label) {
          text += ". Label it "+label.toUpperCase()
        }
  
        var id = "cut-"+scrap.name+"-from-"+toSlug(material.description)+"-no"+material.number

        return task(id, text)
      }

      function task(id, text) {
        if (!text) {
          throw new Error("task() takes two strings: an identifier and an instruction")
        }
        
        id = "building-house-X-"+id+"-for-"+sectionName

        return taskTemplate(
          text,
          id,
          completeTask,
          bridge
        )
      }

      return function(request, response) {
        if (!tellTheUniverse.isReady()) {
          throw new Error("server not ready yet")
        }

        page = element()
        steps.play(handlers)
        bridge.sendPage(page)(request, response)
      }
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

    var stepTitle = element.template(
      ".step-title",
      element.style({
        "margin": "34pt 0 12pt 0",
        "font-size": "1.5em",
        "line-height": "1em",
      }),
      function(text) {
        this.addChild(text)
      }
    )

    var em = element.style(".dimension", {
      "display": "inline",
      "font-weight": "bold",
      "font-size": "18pt",
      "line-height": "1em",
    })

    var checkMark = element.template(
      ".check-mark",
      element.style({
        "display": "none"
      }),
      "✗"
    )

    var checkMarkChecked = element.style(".task-completed .check-mark", {
      "display": "block"
    })

    var checkBox = element.template(
      "button.toggle-button",
      element.style({
        "border": "0.1em solid #666",
        "vertical-align": "middle",
        "background": "transparent",
        "width": "1.15em",
        "height": "1.15em",
        "margin-right": "0.5em",
        "color": "#dff",
        "padding": "1px 3px 0px 3px",
        "font-size": "1.15em",
        "line-height": "1em",
        "display": "inline-block",
        "cursor": "pointer",
      }),
      checkMark()
    )

    var taskCompleted = element.template(
      ".task-completed",
      element.style({
        "text-decoration": "line-through"
      })
    )

    var taskTemplate = element.template(
      ".task",
      element.style({
        "margin-bottom": "0.8em",
        "cursor": "pointer",
        "text-indent": "-1.95em",
        "margin-left": "1.95em",
      }),
      function(text, id, complete, bridge) {
        var isCompleted = doable.isCompleted(id)
        if (isCompleted) {
          this.classes.push("task-completed")
        }
        this.addChild(checkBox(isCompleted))
        this.addChild(text)

        this.classes.push("task-"+id)
        this.onclick(complete.withArgs(id).evalable())
      }
    )

    function toSlug(string) {
      return string.toLowerCase().replace(/[^0-9a-z]+/g, "-")
    }

    function zip(a, b, func) {
      var out = []
      for(var i=0; i<a.length; i++) {
        var result = func(a[i], b[i])
        out.push(result)
      }
      return out
    }

    return instructionPage
  }
)
