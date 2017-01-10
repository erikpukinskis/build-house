var library = require("module-library")(require)

module.exports = library.export(
  "doable",
  ["make-request"],
  function(makeRequest) {

    var completed = {}

    function doable() {
    }

    doable.complete = function(id) {
      doable.count++
      completed[id] = true
    }

    doable.isCompleted = function(id) {
      return completed[id] || false
    }

    doable.complete.defineOn =
      function(server, bridge, tellTheUniverse) {
        if (!server.__toggleTaskRoute) {
          server.addRoute("post", "/tasks/:id/complete",
            handleRequest)
        }

        var binding = bridge.defineFunction(
          [makeRequest.defineOn(bridge)],
          sendRequest
        )

        function sendRequest(makeRequest, identifier) {
          makeRequest({
            method: "post",
            path: "/tasks/"+identifier+"/complete"
          }, function(resp) {
            console.log("got resp", resp)
          })
        }

        function handleRequest(request, response) {

          doable.complete(request.params.id)

          tellTheUniverse("doable.complete", request.params.id)

          response.json({status: "ok"})
        }

        return binding
      }

    doable.count = 0

    return doable
  }
)