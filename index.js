var alexa = require('alexa-app');
var app = new alexa.app('calagator');
var calagator = require('./calagator_helper.js');

app.dictionary = {
  "queries":["ruby","php","women in tech","beer","python","programming","functional programming","entrepreneur"],
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
        "Query":"AMAZON.LITERAL"
      },
      "utterances":[ 
        "{what is|what's} {going on|happening} {|Date}",
        "what events are {happening|going on}",
        "{when|what} is the next {queries|Query} event",
        "{what} {queries|Query} events are there {|Date}",
        "{what|when} are the next {queries|Query} events",
      ]
    },
    function(request,response) {
      console.log('[eventsIntent]');
      calagator.get_events(request,response);
      return false;
    }
);


module.exports = app;
