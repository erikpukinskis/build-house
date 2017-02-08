var library = require("module-library")(require)

module.exports = library.export(
  "send-instructions",
  ["browser-bridge", "web-element", "./dimension-text", "./doable"],
  function(BrowserBridge, element, dimensionText, doable) {


    function prepareBridge(bridge, save) {

      if (bridge.remember("instruction-page/onCheck")) { return }

      if (save) {
        var onCheck = bridge.defineFunction(
          [save],
          function onCheck(save, id) {

            var el = document.querySelector(".task-"+id)

            var isCompleted = el.classList.contains("task-completed")

            if (isCompleted) { return }

            el.classList.add("task-completed")

            save(id)
          }
        )
      } else {
        var onCheck = bridge.defineFunction(function noop() {})
      }

      bridge.see("instruction-page/onCheck", onCheck)

      bridge.addToHead(
        element.stylesheet(stepTitle, em, checkBox, checkMark, checkMarkChecked, taskTemplate, taskCompleted)
      )

    }


    function instructionPage(steps, materials, bridge, sectionName) {

      var handlers = new Handlers(sectionName, bridge.remember("instruction-page/onCheck"))

      steps.play(handlers)

      var page = element(
        element("h1", sentenceCase(sectionName)+" build instructions"),
        handlers.content
      )

      bridge.send(page)
    }

    instructionPage.prepareBridge = prepareBridge


    // Handlers

    function Handlers(sectionName, onCheck) {
      this.sectionName = sectionName
      this.content = element()
      this.onCheck = onCheck

      if (!this.content) {throw new Error("no content") }
    }

    Handlers.prototype.task = function(id, text) {

      if (!text) {
        throw new Error("task() takes two strings: an identifier and an instruction")
      }
      
      id = "building-house-X-"+id+"-for-"+this.sectionName

      return taskTemplate(
        text,
        id,
        this.onCheck
      )
    }

    Handlers.prototype.step = function(description, results) {
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

      this.content.addChild(stepEl)
    }

    Handlers.prototype.cut = function(scraps, labels) {

      if (!Array.isArray(scraps)) {
        scraps = [scraps]
        labels = [labels]
      } else if (!labels) {
        labels = []
      }

      var tasks = element(".cut_instructions")

      var onCheck = this.onCheck

      scraps.forEach(function(scrap, i) {
        var label = labels[i]
        var el = scrapToTask(scrap, label, onCheck)
        tasks.addChild(el)
      })

      return tasks
    }

    function scrapToTask(scrap, label, onCheck) {
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
        var text = scrap.cut+" cut "+dimensionText(scrap.size)
      }

      text += " from "+material.description
      if (material.number) {
        text += " #"+material.number
      }

      if (label) {
        text += ". Label it "+label.toUpperCase()
      }

      var id = "cut-"+scrap.name+"-from-"+toSlug(material.description)+"-no"+material.number

      return taskTemplate(text, id, onCheck)
    }

    Handlers.prototype.marks = function(scraps, options, side) {

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
    }




    // Templates

    var stepTitle = element.template(
      "h1.step-title",
      function(text) {
        this.addChild(sentenceCase(text))
      }
    )

    var em = element.style(".dimension", {
      "display": "inline",
      "text-decoration": "underline",
      "font-size": "1.2em",
      "line-height": "0.9em",
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
        "vertical-align": "-0.08em",
        "background": "transparent",
        "width": "1.3em",
        "height": "1.3em",
        "margin-right": "0.25em",
        "color": "#dff",
        "padding": "1px 3px 0px 3px",
        "font-size": "1.15em",
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
        "line-height": "1.4em",
      }),
      function(text, id, onCheck) {
        var isCompleted = doable.isCompleted(id)
        if (isCompleted) {
          this.classes.push("task-completed")
        }
        this.addChild(checkBox(isCompleted))
        this.addChild(sentenceCase(text))

        this.classes.push("task-"+id)
        this.onclick(onCheck.withArgs(id).evalable())
      }
    )


    // Helpers

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

    function sentenceCase(text) {
      return text[0].toUpperCase() + text.slice(1)      
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

    return instructionPage
  }
)
