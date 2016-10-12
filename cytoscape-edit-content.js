; (function () {
  'use strict';
  var $ = typeof jQuery === typeof undefined ? null : jQuery;

  var defaults = {
    menuRadius: 100, // the radius of the circular menu in pixels
    selector: 'node', // elements matching this Cytoscape.js selector will trigger editContents
    commands: [ // an array of commands to list in the menu or a function that returns the array
      /*
      { // example command
        fillColor: 'rgba(200, 200, 200, 0.75)', // optional: custom background color for item
        content: 'a command name' // html/text content to be displayed in the menu
        select: function(ele){ // a function to execute when the command is selected
          console.log( ele.id() ) // `ele` holds the reference to the active element
        }
      }
      */
    ], // function( ele ){ return [ /*...*/ ] }, // example function for commands
    fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
    activeFillColor: 'rgba(92, 194, 237, 0.75)', // the colour used to indicate the selected command
    activePadding: 20, // additional size in pixels for the active command
    indicatorSize: 24, // the size in pixels of the pointer to the active command
    separatorWidth: 3, // the empty spacing in pixels between successive commands
    spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
    minSpotlightRadius: 24, // the minimum radius in pixels of the spotlight
    maxSpotlightRadius: 38, // the maximum radius in pixels of the spotlight
    openMenuEvents: 'cxttapstart taphold', // cytoscape events that will open the menu (space separated)
    itemColor: 'black', // the colour of text in the command's content
    itemTextShadowColor: 'black', // the text shadow colour of the command's content
    zIndex: 9999, // the z-index of the ui div
    atMouse: false // draw menu at mouse position
  };
  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape) { return; } // can't register if cytoscape unspecified
    cytoscape('core', 'editContent', function (params) {
      var options = $.extend(true, {}, defaults, params);
      var fn = params;
      var cy = this;
      var $container = $(cy.container());
      var target;

      function getOffset($ele) {
        var offset = $ele.offset();

        offset.left += parseFloat($ele.css('padding-left'));
        offset.left += parseFloat($ele.css('border-left-width'));

        offset.top += parseFloat($ele.css('padding-top'));
        offset.top += parseFloat($ele.css('border-top-width'));

        return offset;
      }

      var data = {
        options: options,
        handlers: []
      };
      var $wrapper = $('<div class="editContent"></div>'); data.$container = $wrapper;
      var $parent = $('<div></div>');
      var $canvas = $('<canvas></canvas>');
      var commands = [];
      var c2d = $canvas[0].getContext('2d');
      var r = options.menuRadius;
      var containerSize = (r + options.activePadding) * 2;
      var activeCommandI = undefined;
      var offset;

      $container.prepend($wrapper);
      $wrapper.append($parent);
      $parent.append($canvas);

      $wrapper.css({
        position: 'absolute',
        zIndex: options.zIndex
      });

      $parent.css({
        width: containerSize + 'px',
        height: containerSize + 'px',
        position: 'absolute',
        zIndex: 1,
        marginLeft: - options.activePadding + 'px',
        marginTop: - options.activePadding + 'px'
      }).hide();

      $canvas[0].width = containerSize;
      $canvas[0].height = containerSize;

      function createMenuItems() {
        $('.editContent-item').remove();
        
        var $item = $('<div class="editContent-item"></div>');
        $item.css({
            color: options.itemColor,
            cursor: 'default',
            display: 'table',
            'text-align': 'center',
            //background: 'red',
            position: 'absolute',
            'text-shadow': '-1px -1px ' + options.itemTextShadowColor + ', 1px -1px ' + options.itemTextShadowColor + ', -1px 1px ' + options.itemTextShadowColor + ', 1px 1px ' + options.itemTextShadowColor,
            left: '50%',
            top: '50%'
          });

          var $content = $('<div class="editContent-content">' + commands[0].content + '</div>');
          $content.css({
            'vertical-align': 'middle',
            'display': 'table-cell'
          });

          $parent.append($item);
          $item.append($content);

      }

      // 
      var ctrx, ctry, rs;

      var bindings = {
        on: function(events, selector, fn){

          var _fn = fn;
          if( selector === 'core'){
            _fn = function( e ){
              if( e.cyTarget === cy ){ // only if event target is directly core
                return fn.apply( this, [ e ] );
              }
            };
          }

          data.handlers.push({
            events: events,
            selector: selector,
            fn: _fn
          });

          if( selector === 'core' ){
            cy.on(events, _fn);
          } else {
            cy.on(events, selector, _fn);
          }

          return this;
        }
      };
      function addEventListeners(){
        var grabbable;
        var inGesture = false;
        var zoomEnabled;
        var panEnabled;

        var restoreZoom = function(){
          if( zoomEnabled ){
            cy.userZoomingEnabled( true );
          }
        };

        var restoreGrab = function(){
          if( grabbable ){
            target.grabify();
          }
        };

        var restorePan = function(){
          if( panEnabled ){
            cy.userPanningEnabled( true );
          }
        };

        bindings
          .on(options.openMenuEvents, options.selector, function(e){
            target = this; // Remember which node the context menu is for
            var ele = this;
            var isCy = this === cy;

            if( typeof options.commands === 'function' ){
              commands = options.commands(target);
            } else {
              commands = options.commands;
            }

            if( !commands || commands.length == 0 ){ return; }

            zoomEnabled = cy.userZoomingEnabled();
            cy.userZoomingEnabled( false );

            panEnabled = cy.userPanningEnabled();
            cy.userPanningEnabled( false );

            grabbable = target.grabbable &&  target.grabbable();
            if( grabbable ){
              target.ungrabify();
            }

            var rp, rw, rh;
            if( !isCy && ele.isNode() && !options.atMouse ){
              rp = ele.renderedPosition();
              rw = ele.renderedWidth();
              rh = ele.renderedHeight();
            } else {
              rp = e.cyRenderedPosition;
              rw = 1;
              rh = 1;
            }

            // offset = getOffset( $container );

            ctrx = rp.x;
            ctry = rp.y;

            createMenuItems();

            $parent.show().css({
              'left': rp.x - r + 'px',
              'top': rp.y - r + 'px'
            });

            activeCommandI = undefined;

            inGesture = true;
          })
        ;
      }

      function removeEventListeners(){
        var handlers = data.handlers;

        for( var i = 0; i < handlers.length; i++ ){
          var h = handlers[i];

          if( h.selector === 'core' ){
            cy.off(h.events, h.fn);
          } else {
            cy.off(h.events, h.selector, h.fn);
          }
        }
      }

      function destroyInstance(){
        redrawing = false;

        removeEventListeners();

        $wrapper.remove();
      }

      addEventListeners();

      return {
        destroy: function(){
          destroyInstance();
        }
      };
      ///
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-edit-content', function () {
      return register;
    });
  }

  if (typeof cytoscape !== typeof undefined && $) { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $);
  }

})();
