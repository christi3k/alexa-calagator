var alexa = require('alexa-app');
var app = new alexa.app('calagator');
var calagator = require('./calagator_helper.js');

app.dictionary = {
  "tags":["ruby","php","women in tech","beer","python","programming","functional programming","entrepreneur"],
  "event_names":["events","event","meeting","meetings","gathering","gatherings"]
};

app.launch(function(request,response){
  console.log('launch app');
  // open a user session
  response.session('open_session', 'true');
  response.say('Welcome to Calagator. How can I help?');
  response.card("Calagator", "This is an example card with Calagator details.");
  response.shouldEndSession(false, 'How can I help? For example, ask me what events are happening today, tomorrow, or next week.');
});

app.intent('eventsIntent', 
    {
      "slots":{
        "Date":"AMAZON.DATE", 
        "Tag":"AMAZON.LITERAL"
      },
      "utterances":[ 
        "{what is|what's} {going on|happening} {|Date}",
        "what events are {happening|going on}",
        "{when|what} is the next {tags|Tag} event",
        "{what} {tags|Tag} events are there",
        "{what|when} are the next {tags|Tag} events",
      ]
    },
    function(request,response) {
      console.log('[eventsIntent]');
      var date = request.slot('Date');
      console.log('requesting date: ' + date);
      calagator.get_events(response,date);
      return false;
    }
);


module.exports = app;
