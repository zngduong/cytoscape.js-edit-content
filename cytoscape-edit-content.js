; (function () {
  'use strict';
  var $ = typeof jQuery === typeof undefined ? null : jQuery;

  var defaults = {
  };
  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape) { return; } // can't register if cytoscape unspecified

    var cy;
    var $cxtMenu;
    var options;
    var eventCyTapStart;
    var active = false;

    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        obj[i] = options[i];
      }

      return obj;
    };

    // Disable right click
    function preventDefaultContextTap() {
      $("#cy-context-edit-content").contextmenu(function () {
        return false;
      });
    }

    

    function createAndAppendCxtMenuComponent() {
      
      $cxtMenu = $('<div id="cy-context-edit-content"></div>');
      $('body').append($cxtMenu);
      console.log('Called create function');
      return $cxtMenu;
    }

    function createAddAppendContentComponents(eles) {
      eles.each(function(i, ele){
        console.log(ele.data('name'));
        createEditContentComponent(ele);
        // appendComponentToCxtMenu($content);
      });
    }

    function createEditContentComponent(ele){
      var $input = undefined;
      if (ele.data('name') != undefined) {
      $input = '<input type="text" name="" value="'+ ele.data('name') +'" size="30" />';
        // $input.focus();
      $('body').keyup(function(e) {
        if(e.keyCode === 13) {
          ele.data('name', $input.val());
        }if (e.keyCode === 27) {
          hideComponent($cxtMenu);
          cy.removeScratch('cxtMenuPosition');
        }
      });
      }else {
        console.log(ele.data('name'));
      }
      appendComponentToCxtMenu($input);
      // return $input; 
    }

    

    // Adjusts context menu if necessary
    function adjustCxtMenu(event) {
      var currentCxtMenuPosition = cy.scratch('cxtMenuPosition');
      
      if( currentCxtMenuPosition != event.cyPosition ) {
        hideMenuItemComponents();
        cy.scratch('cxtMenuPosition', event.cyPosition);
        
        var containerPos = $(cy.container()).position();

        var left = containerPos.left + event.cyRenderedPosition.x;
        var top = containerPos.top + event.cyRenderedPosition.y;
        
        displayComponent($cxtMenu);
        $cxtMenu.css('left', left);
        $cxtMenu.css('top', top);
      }
    }

    function appendComponentToCxtMenu(component) {
      $cxtMenu.append(component);
      // bindMenuItemClickFunction(component);
    }

    

    function bindCyEvents() {
      cy.on('tapstart', eventCyTapStart = function(){
        hideComponent($cxtMenu);
        cy.removeScratch('cxtMenuPosition');
        cy.removeScratch('currentCyEvent');
      });
    }

    function displayComponent($component) {
      $component.css('display', 'block');
    }

    function hideComponent($component) {
      $component.css('display', 'none');
    }

    function hideMenuItemComponents() {
      $cxtMenu.children().css('display', 'none');
    }

    function destroyCxtMenu() {
      if (!active) {
        return;
      }

      removeAndUnbindMenuItems();

      cy.off('tapstart', eventCyTapStart);

      $cxtMenu.remove();
      $cxtMenu = undefined;
      active = false;
    }

    function getInstance(cy) {
      var instance = {
        // Returns whether the extension is active
       isActive: function() {
         return active;
       },
       // Appends given menu item to the menu items list.
       appendMenuItem: function(item) {
         createEditContentComponent();
         return cy;
       },
       // Destroys the extension instance
       destroy: function() {
         destroyCxtMenu();
         return cy;
       }
      };
      
      return instance;
    }


    cytoscape('core', 'editContent', function (opts) {
      cy = this;
      var eles = cy.elements();
      $cxtMenu = createAndAppendCxtMenuComponent();
      
      createAddAppendContentComponents(eles);
      var tappedBefore;
      var tappedTimeout;
      cy.on('tap', function(event) {
        var tappedNow = event.cyTarget;
        if (tappedTimeout && tappedBefore) {
          clearTimeout(tappedTimeout);
        }
        if(tappedBefore === tappedNow) {
          tappedNow.trigger('doubleTap');
          tappedBefore = null;
          cy.scratch('currentCyEvent', event);
          adjustCxtMenu(event);
          displayComponent($cxtMenu);
        } else {
          tappedTimeout = setTimeout(function(){ tappedBefore = null; }, 300);
          tappedBefore = tappedNow;
        }
      });

      // cy.on('doubleTap', 'node', function(event) {
      //     cy.scratch('currentCyEvent', event);
      //     adjustCxtMenu(event);
      //     displayComponent($cxtMenu);
      //   });

        cy.on('doubleTap', eventCyTapStart = function(){
        hideComponent($cxtMenu);
        cy.removeScratch('cxtMenuPosition');
        cy.removeScratch('currentCyEvent');
      });
      

      if (opts !== 'get') {
        // merge the options with default ones
        options = extend(defaults, opts);

        // Clear old context menu if needed
        if (active) {
          destroyCxtMenu();
        }
        active = true;
        
        
        // var selector = 'node';

        // bindCyCxttap($cxtMenu,selector);
        // bindCyEvents();
      }
      return getInstance(this);

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
