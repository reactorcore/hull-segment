(function(){

  // Create a queue, but don't obliterate an existing one!
  var analytics = window.analytics = window.analytics || [];

  // If the real analytics.js is already on the page return.
  if (analytics.initialize) return;

  // If the snippet was invoked already show an error.
  if (analytics.invoked) {
    if (window.console && console.error) {
      console.error('Segment snippet included twice.');
    }
    return;
  }

  // Invoked flag, to make sure the snippet
  // is never invoked twice.
  analytics.invoked = true;

  // A list of the methods in Analytics.js to stub.
  analytics.methods = ['trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify', 'group', 'track', 'ready', 'alias', 'page', 'once', 'off', 'on'];

  // Define a factory to create stubs. These are placeholders
  // for methods in Analytics.js so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  analytics.factory = function(method){
    return function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };
  };

  // For each of our methods, generate a queueing stub.
  for (var i = 0; i < analytics.methods.length; i++) {
    var key = analytics.methods[i];
    analytics[key] = analytics.factory(key);
  }

  // Define a method to load Analytics.js from our CDN,
  // and that will be sure to only ever load it once.
  analytics.load = function(key){
    // Create an async script element based on your key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';

    // Insert our script next to the first script element.
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
  };

  // Add a version to keep track of what's in the wild.
  analytics.SNIPPET_VERSION = '3.0.1';


  function getProperty(obj,propertyName){
    var property;
    for (var i = 0; i < obj.identities.length; i++) {
      let identity = obj.identities[i];
      if(identity[propertyName]){return identity[propertyName]}
    };
  }

  Hull.onEmbed(function(element, deployment, hull){
    analytics.load(deployment.ship.settings.project_id);
    analytics.page();

    let identify = function(me){
      if(me){
        let email = me.email || getProperty(me, 'email');
        let name = me.name || me.username || getProperty(me, 'name') || getProperty(me, 'username') || email;
        analytics.identify(me.id,me)
      }
    }

    let track = function(payload){
      analytics.track(payload.event,payload.params)
    }

    Hull.on('hull.track',track);
    Hull.on('hull.user.*',identify);
    identify(hull.currentUser());
  });
})()
