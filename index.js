var alexa = require('alexa-app');
var app = new alexa.app('calagator');

app.launch(function(request,response){
  response.say("Hello from Calagator!");
  response.card("Calagator", "This is an example card with Calagator details.");
});

app.intent('numberIntent',
    {
      "slots":{"number":"NUMBER"}
        ,"utterances":[ "say the number {1-100|number}" ]
    },
    function(request,response) {
      var number = request.slot('number');
      response.say("You asked for the number "+number);
    }
);

module.exports = app;
