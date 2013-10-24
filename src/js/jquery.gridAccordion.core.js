;(function(window, $) {

	"use strict";

	/*
		Static methods for Grid Accordion
	*/
	$.GridAccordion = {

		modules: {},

		addModule: function(name, module, target) {
			if (typeof this.modules[target] === 'undefined')
				this.modules[target] = [];

			this.modules[target].push(name);

			if (target == 'accordion')
				$.extend(GridAccordion.prototype, module);
			else if (target == 'panel')
				$.extend(GridAccordionPanel.prototype, module);
		}
	};

	// namespace
	var NS = $.GridAccordion.namespace = 'GridAccordion';

	var GridAccordion = function(instance, options) {

		// reference to the accordion jQuery object
		this.$accordion = $(instance);

		// reference to the container of the panels
		this.$panelsContainer = null;

		// reference to the container that will mask the panels
		this.$maskContainer = null;

		// holds the options specified when the accordion was instantiated
		this.options = options;

		// holds the final settings of the accordion
		this.settings = {};

		// keep a separate reference of the settings which will not be altered by breakpoints or by other means
		this.originalSettings = {};

		// the index of the currently opened panel (starts with 0)
		this.currentIndex = -1;

		// the index of the current page
		this.currentPage = 0;

		// the size, in pixels, of the accordion
		this.totalSize = 0;

		// the size of the panels' container
		this.totalPanelsSize = 0;

		// the actual size, in pixels, of the opened panel
		this.computedOpenedPanelSize = 0;

		// the actual maximum allowed size, in pixels, of the opened panel
		this.maxComputedOpenedPanelSize = 0;

		// the size, in pixels, of the collapsed panels
		this.collapsedPanelSize = 0;

		// the size, in pixels, of the closed panels
		this.closedPanelSize = 0;

		// the distance, in pixels, between the accordion's panels
		this.computedPanelDistance = 0;

		// array that contains the GridAccordionPanel objects
		this.panels = [];

		// timer used for delaying the opening of the panel on mouse hover
		this.mouseDelayTimer = 0;

		// simple objects to be used for animation
		this.openPanelAnimation = {};
		this.closePanelsAnimation = {};

		// generate a unique ID to be used for event listening
		this.uniqueId = new Date().valueOf();

		// stores size breakpoints in an array for sorting purposes
		this.breakpoints = [];

		// indicates the current size breakpoint
		this.currentBreakpoint = -1;

		// keeps a reference to the previous number of visible panels
		this.previousVisiblePanels = -1;

		// indicates whether the accordion is currently scrolling
		this.isPageScrolling = false;

		// indicates the left or top property based on the orientation of the accordion
		this.positionProperty = 'left';

		// indicates the width or height property based on the orientation of the accordion
		this.sizeProperty = 'width';

		// keeps a reference to the ratio between the size actual size of the accordion and the set size
		this.autoResponsiveRatio = 1;

		// indicates whether the panels will overlap, based on the set panelOverlap property
		// and also based on the computed distance between panels
		this.isOverlapping = false;

		// init the accordion
		this._init();
	};

	GridAccordion.prototype = {

		/*
			The starting place for the accordion
		*/
		_init: function() {
			var that = this;

			this.settings = $.extend({}, this.defaults, this.options);

			// get reference to the panels' container and 
			// create additional mask container, which will mask the panels'container
			this.$maskContainer = $('<div class="ga-mask"></div>').appendTo(this.$accordion);
			this.$panelsContainer = this.$accordion.find('.ga-panels').appendTo(this.$maskContainer);

			// create the 'ga-panels' element if it wasn't created manually
			if (this.$panelsContainer.length === 0)
				this.$panelsContainer = $('<div class="ga-panels"></div>').appendTo(this.$maskContainer);

			// init accordion modules
			var modules = $.GridAccordion.modules.accordion;

			if (typeof modules !== 'undefined')
				for (var i in modules) {
					if (typeof this['init' + modules[i]] !== 'undefined')
						this['init' + modules[i]]();
				}

			// keep a reference of the original settings and use it
			// to restore the settings when the breakpoints are used
			this.originalSettings = $.extend({}, this.settings);

			// set a panel to be opened from the start
			this.currentIndex = this.settings.startPanel;

			if (this.currentIndex != -1)
				this.$accordion.addClass('ga-opened');

			// if a panels was not set to be opened but a page was specified,
			// set that page index to be opened
			if (this.settings.startPage != -1)
				this.currentPage = this.settings.startPage;

			// parse the breakpoints object and store the values into an array
			// sorting them in ascending order based on the specified size
			if (this.settings.breakpoints !== null) {
				for (var sizes in this.settings.breakpoints) {
					this.breakpoints.push({size: parseInt(sizes, 10), properties:this.settings.breakpoints[sizes]});
				}

				this.breakpoints = this.breakpoints.sort(function(a, b) {
					return a.size >= b.size ? 1: -1;
				});
			}

			// prepare request animation frame
			this._prepareRAF();

			// update the accordion
			this.update();

			// if there is a panel opened at start handle that panel as if it was manually opened
			if (this.currentIndex != -1) {
				this.$accordion.find('.ga-panel').eq(this.currentIndex).addClass('ga-opened');

				// fire 'panelOpen' event
				var eventObject = {type: 'panelOpen', index: this.currentIndex, previousIndex: -1};
				this.trigger(eventObject);
				if ($.isFunction(this.settings.panelOpen))
					this.settings.panelOpen.call(this, eventObject);
			}

			// listen for 'mouseenter' events
			this.on('mouseenter.' + NS, function(event) {
				var eventObject = {type: 'accordionMouseOver'};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.accordionMouseOver))
					that.settings.accordionMouseOver.call(that, eventObject);
			});

			// listen for 'mouseleave' events
			this.on('mouseleave.' + NS, function(event) {
				// close the panels
				if (that.settings.closePanelsOnMouseOut === true)
					that.closePanels();

				var eventObject = {type: 'accordionMouseOut'};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.accordionMouseOut))
					that.settings.accordionMouseOut.call(that, eventObject);
			});

			// fire the 'init' event
			this.trigger({type: 'init'});
			if ($.isFunction(this.settings.init))
				this.settings.init.call(this, {type: 'init'});
		},

		/*
			Update the accordion after a property was changed or panels were added/removed
		*/
		update: function() {
			var that = this;

			// add a class to the accordion based on the orientation
			// to be used in CSS
			if (this.settings.orientation == 'horizontal') {
				this.$accordion.removeClass('ga-vertical').addClass('ga-horizontal');
				this.positionProperty = 'left';
				this.sizeProperty = 'width';
			} else if (this.settings.orientation == 'vertical') {
				this.$accordion.removeClass('ga-horizontal').addClass('ga-vertical');
				this.positionProperty = 'top';
				this.sizeProperty = 'height';
			}

			// reset the panels' container position
			this.$panelsContainer.attr('style', '');

			// prepare the accordion for responsiveness
			if (this.settings.responsive === true) {
				// if the accordion is responsive set the width to 100% and use
				// the specified width and height as a max-width and max-height
				this.$accordion.css({width: '100%', height: this.settings.height, maxWidth: this.settings.width, maxHeight: this.settings.height});

				// if an aspect ratio was not specified, set the aspect ratio
				// based on the specified width and height
				if (this.settings.aspectRatio == -1)
					this.settings.aspectRatio = this.settings.width / this.settings.height;

				// resize the accordion when the browser resizes
				$(window).off('resize.' + this.uniqueId + '.' + NS);
				$(window).on('resize.' + this.uniqueId + '.' + NS, function() {
					// resize the accordion when the browser resizes
					that.resize();
				});
			} else {
				this.$accordion.css({width: this.settings.width, height: this.settings.height, maxWidth: '', maxHeight: ''});
				this.$maskContainer.attr('style', '');
			}

			// if the number of visible panels has change, update the current page to reflect
			// the same relative position of the panels
			if (this.settings.visiblePanels == -1) {
				this.currentPage = 0;
			} else if (this.currentIndex != -1) {
				this.currentPage = Math.floor(this.currentIndex / this.settings.visiblePanels);
			} else if (this.settings.visiblePanels != this.previousVisiblePanels && this.previousVisiblePanels !== -1) {
				var correctPage = Math.round((this.currentPage * this.previousVisiblePanels) / this.settings.visiblePanels);

				if (this.currentPage !== correctPage)
					this.currentPage = correctPage;
			}

			// if there is distance between the panels, the panels can't overlap
			if (this.settings.panelDistance > 0 || this.settings.panelOverlap === false) {
				this.isOverlapping = false;
				this.$accordion.removeClass('overlap');
			} else if (this.settings.panelOverlap === true) {
				this.isOverlapping = true;
				this.$accordion.addClass('overlap');
			}

			// clear inline size of the background images because the orientation might have changes
			this.$accordion.find('img.ga-background, img.ga-background-opened').css({'width': '', 'height': ''});

			// update panels
			this._updatePanels();

			// create or update the pagination buttons
			this._updatePaginationButtons();

			// set the size of the accordion
			this.resize();

			// create or remove the shadow
			if (this.settings.shadow === true) {
				this.$accordion.find('.ga-panel').addClass('ga-shadow');
			} else if (this.settings.shadow === false) {
				this.$accordion.find('.ga-shadow').removeClass('ga-shadow');
			}

			// fire the update event
			var eventObject = {type: 'update'};
			that.trigger(eventObject);
			if ($.isFunction(that.settings.update))
				that.settings.update.call(that, eventObject);
		},

		/*
			Create, remove or update panels based on the HTML specified in the accordion
		*/
		_updatePanels: function() {
			var that = this;

			// check if there are removed items in the DOM and remove the from the array of panels
			for (var i = this.panels.length - 1; i >= 0; i--) {
				if (this.$accordion.find('.ga-panel[data-index="' + i + '"]').length === 0) {
					var panel = this.panels[i];

					panel.off('panelMouseOver.' + NS);
					panel.off('panelMouseOut.' + NS);
					panel.off('panelClick.' + NS);
					panel.off('imagesComplete.' + NS);
					panel.destroy();
					this.panels.splice(i, 1);
				}
			}

			// parse the DOM and create uninstantiated panels and reset the indexes
			this.$accordion.find('.ga-panel').each(function(index, element) {
				var panel = $(element);

				if (typeof panel.attr('data-init') === 'undefined') {
					that._createPanel(index, panel);
				} else {
					that.panels[index].setIndex(index);
					that.panels[index].update();
				}
			});
		},

		/*
			Create an individual panel
		*/
		_createPanel: function(index, element) {
			var that = this,
				$element = $(element);

			// create a panel instance and add it to the array of panels
			var panel = new GridAccordionPanel($element, this, index);
			this.panels.splice(index, 0, panel);

			// listen for 'panelMouseOver' events
			panel.on('panelMouseOver.' + NS, function(event) {
				if (that.isPageScrolling === true)
					return;

				if (that.settings.openPanelOn == 'hover') {
					clearTimeout(that.mouseDelayTimer);

					// open the panel, but only after a short delay in order to prevent
					// opening panels that the user doesn't intend
					that.mouseDelayTimer = setTimeout(function() {
						that.openPanel(event.index);
					}, that.settings.mouseDelay);
				}

				var eventObject = {type: 'panelMouseOver', index: index};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.panelMouseOver))
					that.settings.panelMouseOver.call(that, eventObject);
			});

			// listen for 'panelMouseOut' events
			panel.on('panelMouseOut.' + NS, function(event) {
				if (that.isPageScrolling === true)
					return;

				var eventObject = {type: 'panelMouseOut', index: index};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.panelMouseOut))
					that.settings.panelMouseOut.call(that, eventObject);
			});

			// listen for 'panelClick' events
			panel.on('panelClick.' + NS, function(event) {
				if (that.settings.openPanelOn == 'click') {
					// open the panel if it's not already opened
					// and close the panels if the clicked panel is opened
					if (index !== this.currentIndex)
						that.openPanel(event.index);
					else
						that.closePanels();
				}

				var eventObject = {type: 'panelClick', index: index};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.panelClick))
					that.settings.panelClick.call(that, eventObject);
			});

			// listen for 'imagesComplete' events and if the images were loaded in
			// the panel that is currently opened and the size of the panel is different
			// than the currently computed size of the panel, force the re-opening of the panel
			// to the correct size
			panel.on('imagesComplete.' + NS, function(event) {
				if (event.index === that.currentIndex && event.contentSize !== that.computedOpenedPanelSize) {
					that.openPanel(event.index, true);
				}
			});
		},

		/*
			Removes all panels
		*/
		removePanels: function() {
			$.each(this.panels, function(index, element) {
				element.off('panelMouseOver.' + NS);
				element.off('panelMouseOut.' + NS);
				element.off('panelClick.' + NS);
				element.off('imagesComplete.' + NS);

				element.destroy();
			});

			this.panels.length = 0;
		},

		/*
			Called when the accordion needs to resize 
		*/
		resize: function() {
			var that = this;

			// reset the accordion to 100% before calculating the size of the other elements
			if (this.settings.responsive === true)
				this.$accordion.css({width: '100%'});

			// set the height of the accordion based on the aspect ratio
			if (this.settings.aspectRatio != -1)
				this.$accordion.css('height', this.$accordion.innerWidth() / this.settings.aspectRatio);

			// get the total size, in pixels, of the accordion
			if (this.settings.responsiveMode == 'custom' && this.settings.responsive === true) {
				// clear previous styling
				this.$maskContainer.attr('style', '');

				this.totalSize = this.settings.orientation == "horizontal" ? this.$accordion.innerWidth() : this.$accordion.innerHeight();
			} else if (this.settings.responsiveMode == 'auto' && this.settings.responsive === true) {
				// get the accordion's size ratio based on the set size and the actual size
				this.autoResponsiveRatio = this.$accordion.innerWidth() / this.settings.width;

				// scale the mask container based on the current ratio
				this.$maskContainer.css({
					width: this.settings.width,
					height: this.settings.height,
					transform: 'scaleX(' + this.autoResponsiveRatio + ') scaleY(' + this.autoResponsiveRatio + ')',
					transformOrigin: 'top left'
				});
				
				this.totalSize = this.settings.orientation == "horizontal" ? this.$maskContainer.innerWidth() : this.$maskContainer.innerHeight();
			}

			// set the size of the background images explicitly because of a bug?
			// that causes anchors not to adapt their size to the size of the image,
			// when the image size is set in percentages, which causes the total size
			// of the panel to be bigger than it should
			if (this.settings.orientation == 'horizontal')
				this.$accordion.find('img.ga-background, img.ga-background-opened').css('height', this.$panelsContainer.innerHeight());
			else
				this.$accordion.find('img.ga-background, img.ga-background-opened').css('width', this.$panelsContainer.innerWidth());

			// set the initial computedOpenedPanelSize to the value defined in the options
			this.computedOpenedPanelSize = this.settings.openedPanelSize;

			// if the panels are set to open to their maximum size,
			// parse maxComputedOpenedPanelSize and set it to a pixel value
			if (this.settings.openedPanelSize == 'max') {
				// set the initial maxComputedOpenedPanelSize to the value defined in the options
				this.maxComputedOpenedPanelSize = this.settings.maxOpenedPanelSize;

				if (typeof this.maxComputedOpenedPanelSize == 'string') {
					if (this.maxComputedOpenedPanelSize.indexOf('%') != -1) {
						this.maxComputedOpenedPanelSize = this.totalSize * (parseInt(this.maxComputedOpenedPanelSize, 10)/ 100);
					} else if (this.maxComputedOpenedPanelSize.indexOf('px') != -1) {
						this.maxComputedOpenedPanelSize = parseInt(this.maxComputedOpenedPanelSize, 10);
					}
				}
			}

			// parse computedOpenedPanelSize and set it to a pixel value
			if (typeof this.computedOpenedPanelSize == 'string') {
				if (this.computedOpenedPanelSize.indexOf('%') != -1) {
					this.computedOpenedPanelSize = this.totalSize * (parseInt(this.computedOpenedPanelSize, 10)/ 100);
				} else if (this.computedOpenedPanelSize.indexOf('px') != -1) {
					this.computedOpenedPanelSize = parseInt(this.computedOpenedPanelSize, 10);
				} else if (this.computedOpenedPanelSize == 'max') {
					this.computedOpenedPanelSize = this.currentIndex == -1 ? this.totalSize * 0.5 : this.getPanelAt(this.currentIndex).getContentSize();
					
					if (this.computedOpenedPanelSize == 'loading' || this.computedOpenedPanelSize > this.maxComputedOpenedPanelSize)
						this.computedOpenedPanelSize = this.maxComputedOpenedPanelSize;
				}
			}


			// set the initial computedPanelDistance to the value defined in the options
			this.computedPanelDistance = this.settings.panelDistance;

			// parse computedPanelDistance and set it to a pixel value
			if (typeof this.computedPanelDistance == 'string') {
				if (this.computedPanelDistance.indexOf('%') != -1) {
					this.computedPanelDistance = this.totalSize * (parseInt(this.computedPanelDistance, 10)/ 100);
				} else if (this.computedPanelDistance.indexOf('px') != -1) {
					this.computedPanelDistance = parseInt(this.computedPanelDistance, 10);
				}
			}

			// set the size, in pixels, of the collapsed panels
			this.collapsedPanelSize = (this.totalSize - this.computedOpenedPanelSize - (this.getVisiblePanels() - 1) * this.computedPanelDistance) / (this.getVisiblePanels() - 1);

			// set the size, in pixels, of the closed panels
			this.closedPanelSize = (this.totalSize - (this.getVisiblePanels() - 1) * this.computedPanelDistance) / this.getVisiblePanels();

			// round the values
			this.computedOpenedPanelSize = Math.floor(this.computedOpenedPanelSize);
			this.collapsedPanelSize = Math.floor(this.collapsedPanelSize);
			this.closedPanelSize = Math.floor(this.closedPanelSize);

			// get the total size of the panels' container
			this.totalPanelsSize = this.closedPanelSize * this.getTotalPanels() + this.computedPanelDistance * (this.getTotalPanels() - 1);

			this.$panelsContainer.css(this.sizeProperty, this.totalPanelsSize);

			// reset the accordion's size so that the visible panels fit exactly inside if their size and position are rounded
			var roundedSize = this.closedPanelSize * this.getVisiblePanels() + this.computedPanelDistance * (this.getVisiblePanels() - 1);

			if (this.settings.responsiveMode == 'custom' || this.settings.responsive === false) {
				this.$accordion.css(this.sizeProperty, roundedSize);
			} else {
				this.$accordion.css(this.sizeProperty, roundedSize * this.autoResponsiveRatio);
				this.$maskContainer.css(this.sizeProperty, roundedSize);
			}

			// if there are multiple pages, set the correct position of the panels' container
			if (this.settings.visiblePanels != -1) {
				// recalculate the totalSize due to the fact that rounded sizes can cause incorrect positioning
				// since the actual size of all panels from a page might be smaller than the whole width of the accordion
				this.totalSize = this.closedPanelSize * this.settings.visiblePanels + this.computedPanelDistance * (this.settings.visiblePanels - 1);
				
				var cssObj = {},
					targetPosition = - (this.totalSize + this.computedPanelDistance) * this.currentPage;
				
				if (this.currentPage === this.getTotalPages() - 1)
					targetPosition = - (this.closedPanelSize * this.getTotalPanels() + this.computedPanelDistance * (this.getTotalPanels() - 1) - this.totalSize);

				cssObj[this.positionProperty] = targetPosition;
				this.$panelsContainer.css(cssObj);
			}

			// calculate missing panels for the last page of panels
			var missingPanels = (this.currentPage === this.getTotalPages() - 1) && (this.getTotalPanels() % this.settings.visiblePanels) !== 0 ? this.settings.visiblePanels - this.getTotalPanels() % this.settings.visiblePanels : 0;

			// set the position and size of each panel
			$.each(this.panels, function(index, element) {
				// get the position of the panel based on the currently selected index and the panel's index
				var position;

				if (that.currentIndex == -1) {
					position = index * (that.closedPanelSize + that.computedPanelDistance);
				} else if (that.settings.visiblePanels == -1) {
					position = index * (that.collapsedPanelSize + that.computedPanelDistance) + (index > that.currentIndex ? that.computedOpenedPanelSize - that.collapsedPanelSize : 0);
				} else {
					if (that._getPageOfPanel(index) === that.currentPage) {
						position = that.currentPage * (that.totalSize + that.computedPanelDistance) + (index + missingPanels - that.currentPage * that.settings.visiblePanels) * (that.collapsedPanelSize + that.computedPanelDistance) + (index > that.currentIndex ? that.computedOpenedPanelSize - that.collapsedPanelSize : 0);

						if (that.currentPage === that.getTotalPages() - 1 && missingPanels !== 0)
							position -= (that.getTotalPages() - that.getTotalPanels() / that.settings.visiblePanels) * (that.totalSize + that.computedPanelDistance);
					} else {
						position = index * (that.closedPanelSize + that.computedPanelDistance);
					}
				}

				element.setPosition(position);
				
				// get the size of the panel based on the state of the panel (opened, closed or collapsed)
				if (that.isOverlapping === false) {
					var size = (that.currentIndex == -1 || (that.settings.visiblePanels != -1 && that._getPageOfPanel(index) != that.currentPage)) ? (that.closedPanelSize) : (index === that.currentIndex ? that.computedOpenedPanelSize : that.collapsedPanelSize);
					element.setSize(size);
				}
			});

			// check if the current window width is bigger than the biggest breakpoint
			// and if necessary reset the properties to the original settings
			// if the window width is smaller than a certain breakpoint, apply the settings specified
			// for that breakpoint but only after merging them with the original settings
			// in order to make sure that only the specified settings for the breakpoint are applied
			if (this.settings.breakpoints !== null && this.breakpoints.length > 0) {
				if ($(window).width() > this.breakpoints[this.breakpoints.length - 1].size && this.currentBreakpoint != -1) {
					this.currentBreakpoint = -1;
					this._setProperties(this.originalSettings, false);
				} else {
					for (var i = 0, n = this.breakpoints.length; i < n; i++) {
						if ($(window).width() <= this.breakpoints[i].size) {
							if (this.currentBreakpoint !== this.breakpoints[i].size) {

								var eventObject = {type: 'breakpointReach', size: this.breakpoints[i].size, settings: this.breakpoints[i].properties};
								that.trigger(eventObject);
								if ($.isFunction(that.settings.breakpointReach))
									that.settings.breakpointReach.call(that, eventObject);

								this.currentBreakpoint = this.breakpoints[i].size;
								var settings = $.extend({}, this.originalSettings, this.breakpoints[i].properties);
								this._setProperties(settings, false);
							}
							break;
						}
					}
				}
			}
		},

		/*
			Set properties on runtime
		*/
		_setProperties: function(properties, store) {
			// parse the properties passed as an object
			for (var prop in properties) {
				// if the number of visible panels is changed, store a reference of the previous value
				// which will be used to move the panels to the corresponding page
				if (prop == 'visiblePanels' && this.settings.visiblePanels != -1)
					this.previousVisiblePanels = this.settings.visiblePanels;

				this.settings[prop] = properties[prop];

				// alter the original settings as well unless 'false' is passed to the 'store' parameter
				if (store !== false)
					this.originalSettings[prop] = properties[prop];
			}

			this.update();
		},

		/*
			Destroy the Grid Accordion instance
		*/
		destroy: function() {
			// remove the stored reference to this instance
			this.$accordion.removeData('gridAccordion');

			// remove inline style
			this.$accordion.attr('style', '');
			this.$panelsContainer.attr('style', '');

			// detach event handlers
			this.off('mouseenter.' + NS);
			this.off('mouseleave.' + NS);

			$(window).off('resize.' + this.uniqueId + '.' + NS);

			// stop animations
			this._stopPanelsAnimation(this.openPanelAnimation);
			this._stopPanelsAnimation(this.closePanelsAnimation);

			// destroy modules
			var modules = $.GridAccordion.modules.accordion;

			if (typeof modules !== 'undefined')
				for (var i in modules) {
					if (typeof this['destroy' + modules[i]] !== 'undefined')
						this['destroy' + modules[i]]();
				}

			// destroy all panels
			this.removePanels();

			// move the panels from the mask container back in the main accordion container
			this.$panelsContainer.appendTo(this.$accordion);

			// remove elements that were created by the script
			this.$maskContainer.remove();
			this.$accordion.find('.ga-pagination-buttons').remove();
		},

		/*
			Attach an event handler to the accordion
		*/
		on: function(type, callback) {
			return this.$accordion.on(type, callback);
		},

		/*
			Detach an event handler
		*/
		off: function(type) {
			return this.$accordion.off(type);
		},

		/*
			Trigger an event on the accordion
		*/
		trigger: function(data) {
			return this.$accordion.triggerHandler(data);
		},

		/*
			Return the panel at the specified index
		*/
		getPanelAt: function(index) {
			return this.panels[index];
		},

		/*
			Return the index of the currently opened panel
		*/
		getCurrentIndex: function() {
			return this.currentIndex;
		},

		/*
			Return the total amount of panels
		*/
		getTotalPanels: function() {
			return this.panels.length;
		},

		/*
			Open the next panel
		*/
		nextPanel: function() {
			var index = (this.currentIndex >= this.getTotalPanels() - 1) ? 0 : (this.currentIndex + 1);
			this.openPanel(index);
		},

		/*
			Open the previous panel
		*/
		previousPanel: function() {
			var index = this.currentIndex <= 0 ? (this.getTotalPanels() - 1) : (this.currentIndex - 1);
			this.openPanel(index);
		},

		/*
			Animate the panels using request animation frame
		*/
		_animatePanels: function(target, args) {
			var startTime = new Date().valueOf(),
				progress = 0;

			target.isRunning = true;
			target.timer = window.requestAnimationFrame(_animate);

			function _animate() {
				if (progress < 1) {
					// get the progress by calculating the elapsed time
					progress = (new Date().valueOf() - startTime) / args.duration;

					if (progress > 1)
						progress = 1;

					// apply swing easing
					progress = 0.5 - Math.cos(progress * Math.PI) / 2;

					args.step(progress);

					target.timer = window.requestAnimationFrame(_animate);
				} else {
					args.complete();

					target.isRunning = false;
					window.cancelAnimationFrame(target.timer);
				}
			}
		},

		/*
			Stop running panel animations
		*/
		_stopPanelsAnimation: function(target) {
			if (typeof target.isRunning !== 'undefined' && target.isRunning === true) {
				target.isRunning = false;
				window.cancelAnimationFrame(target.timer);
			}
		},

		/*
			Check if window.requestAnimationFrame exists in the browser and if it doesn't, 
			try alternative function names or implement window.requestAnimationFrame using window.setTimeout
		*/
		_prepareRAF: function() {
			if (typeof window.requestAnimationFrame === 'undefined') {
				var vendorPrefixes = ['webkit', 'moz'];

				for(var i = 0; i < vendorPrefixes.length; i++) {
					window.requestAnimationFrame = window[vendorPrefixes[i] + 'RequestAnimationFrame'];
					window.cancelAnimationFrame = window.cancelAnimationFrame || window[vendorPrefixes[i] + 'CancelAnimationFrame'] || window[vendorPrefixes[i] + 'CancelRequestAnimationFrame'];
				}
			}

			// polyfill inspired from Erik Moller
			if (typeof window.requestAnimationFrame === 'undefined') {
				var lastTime = 0;

				window.requestAnimationFrame = function(callback, element) {
					var currentTime = new Date().valueOf(),
						timeToCall = Math.max(0, 16 - (currentTime - lastTime));

					var id = window.setTimeout(function() {
						callback(currentTime + timeToCall);
					}, timeToCall);

					lastTime = currentTime + timeToCall;

					return id;
				};

				window.cancelAnimationFrame = function(id) {
					clearTimeout(id);
				};
			}
		},

		/*
			Open the panel at the specified index
		*/
		openPanel: function(index, force) {
			if (index === this.currentIndex && force !== true)
				return;

			// remove the "closed" class and add the "opened" class, which indicates
			// that the accordion has an opened panel
			if (this.$accordion.hasClass('ga-opened') === false) {
				this.$accordion.removeClass('ga-closed');
				this.$accordion.addClass('ga-opened');
			}

			var previousIndex = this.currentIndex;

			this.currentIndex = index;
			
			// synchronize the page with the selected panel by navigating to the page that
			// contains the panel if necessary.
			// if the last page is already selected and the selected panel is on this last page 
			// don't navigate to a different page no matter what panel is selected and whether
			// the panel actually belongs to the previous page
			if (this.settings.visiblePanels != -1 && !(this.currentPage == this.getTotalPages() - 1 && index >= this.getTotalPanels() - this.settings.visiblePanels)) {
				var page = Math.floor(this.currentIndex / this.settings.visiblePanels);

				if (page !== this.currentPage)
					this.gotoPage(page);

				// reset the current index because when the closePanels was called inside gotoPage the current index became -1
				this.currentIndex = index;
			}

			var that = this,
				targetSize = [],
				targetPosition = [],
				startSize = [],
				startPosition = [],
				animatedPanels = [],
				firstPanel = this._getFirstPanelFromPage(),
				lastPanel = this._getLastPanelFromPage(),
				counter = 0;

			this.$accordion.find('.ga-opened').removeClass('ga-opened');
			this.$accordion.find('.ga-panel').eq(this.currentIndex).addClass('ga-opened');

			// check if the panel needs to open to its maximum size and recalculate
			// the size of the opened panel and the size of the collapsed panel
			if (this.settings.openedPanelSize == 'max') {
				this.computedOpenedPanelSize = this.getPanelAt(this.currentIndex).getContentSize();

				if (this.computedOpenedPanelSize > this.maxComputedOpenedPanelSize)
					this.computedOpenedPanelSize = this.maxComputedOpenedPanelSize;

				this.collapsedPanelSize = (this.totalSize - this.computedOpenedPanelSize - (this.getVisiblePanels() - 1) * this.computedPanelDistance) / (this.getVisiblePanels() - 1);
			}

			// get the starting and target position and size of each panel
			for (var i = firstPanel; i <= lastPanel; i++) {
				var panel = this.getPanelAt(i);
				
				startPosition[i] = panel.getPosition();
				targetPosition[i] = this.currentPage * (this.totalSize + this.computedPanelDistance) + counter * (this.collapsedPanelSize + this.computedPanelDistance) + (i > this.currentIndex ? this.computedOpenedPanelSize - this.collapsedPanelSize : 0);

				// the last page might contain less panels than the set number of visible panels.
				// in this situation, the last page will contain some panels from the previous page
				// and this requires the panels from the last page to be positioned differently than
				// the rest of the panels. this requires some amendments to the position of the last panels
				// by replacing the current page index with a float number: this.getTotalPanels() / this.settings.visiblePanels, 
				// which would represent the actual number of existing pages.
				// here we subtract the float number from the formal number of pages in order to calculate
				// how much length it's necessary to subtract from the initially calculated value
				if (this.settings.visiblePanels != -1 && this.currentPage == this.getTotalPages() - 1)
					targetPosition[i] -= (this.getTotalPages() - this.getTotalPanels() / this.settings.visiblePanels) * (this.totalSize + this.computedPanelDistance);

				// check if the panel's position needs to change
				if (targetPosition[i] !== startPosition[i])
					animatedPanels.push(i);

				if (this.isOverlapping === false) {
					startSize[i] = panel.getSize();
					targetSize[i] = i === this.currentIndex ? this.computedOpenedPanelSize : this.collapsedPanelSize;

					// check if the panel's size needs to change
					if (targetSize[i] !== startSize[i] && $.inArray(i, animatedPanels) == -1)
						animatedPanels.push(i);
				}

				counter++;
			}

			var totalPanels = animatedPanels.length;

			// stop the close panels animation if it's on the same page
			if (this.closePanelsAnimation.page === this.currentPage)
				this._stopPanelsAnimation(this.closePanelsAnimation);

			// stop any running animations
			this._stopPanelsAnimation(this.openPanelAnimation);

			// assign the current page
			this.openPanelAnimation.page = this.currentPage;

			// animate the panels
			this._animatePanels(this.openPanelAnimation, {
				duration: this.settings.openPanelDuration,
				step: function(progress) {
					for (var i = 0; i < totalPanels; i++) {
						var value = animatedPanels[i],
							panel = that.getPanelAt(value);

						panel.setPosition(progress * (targetPosition[value] - startPosition[value]) + startPosition[value]);

						if (that.isOverlapping === false)
							panel.setSize(progress * (targetSize[value] - startSize[value]) + startSize[value]);
					}
				},
				complete: function() {
					// fire 'panelOpenComplete' event
					var eventObject = {type: 'panelOpenComplete', index: that.currentIndex};
					that.trigger(eventObject);
					if ($.isFunction(that.settings.panelOpenComplete))
						that.settings.panelOpenComplete.call(that, eventObject);
				}
			});

			// fire 'panelOpen' event
			var eventObject = {type: 'panelOpen', index: index, previousIndex: previousIndex};
			this.trigger(eventObject);
			if ($.isFunction(this.settings.panelOpen))
				this.settings.panelOpen.call(this, eventObject);
		},

		/*
			Close the panels
		*/
		closePanels: function() {
			var previousIndex = this.currentIndex;

			this.currentIndex = -1;

			// remove the "opened" class and add the "closed" class, which indicates
			// that the accordion is closed
			if (this.$accordion.hasClass('ga-closed') === false) {
				this.$accordion.removeClass('ga-opened');
				this.$accordion.addClass('ga-closed');
			}

			clearTimeout(this.mouseDelayTimer);

			var that = this,
				targetSize = [],
				targetPosition = [],
				startSize = [],
				startPosition = [],
				firstPanel = this._getFirstPanelFromPage(),
				lastPanel = this._getLastPanelFromPage(),
				counter = 0;

			// get the starting and target size and position of each panel
			for (var i = firstPanel; i <= lastPanel; i++) {
				var panel = this.getPanelAt(i);
				
				startPosition[i] = panel.getPosition();
				targetPosition[i] = this.currentPage * (this.totalSize + this.computedPanelDistance) + counter * (this.closedPanelSize + this.computedPanelDistance);
				
				// same calculations as in openPanel
				if (this.settings.visiblePanels != -1 && this.currentPage == this.getTotalPages() - 1)
					targetPosition[i] -= (this.getTotalPages() - this.getTotalPanels() / this.settings.visiblePanels) * (this.totalSize + this.computedPanelDistance);

				if (this.isOverlapping === false) {
					startSize[i] = panel.getSize();
					targetSize[i] = this.closedPanelSize;
				}

				counter++;
			}

			// stop the open panel animation if it's on the same page
			if (this.openPanelAnimation.page === this.currentPage)
				this._stopPanelsAnimation(this.openPanelAnimation);

			// stop any running animations
			this._stopPanelsAnimation(this.closePanelsAnimation);

			// assign the current page
			this.closePanelsAnimation.page = this.currentPage;

			// animate the panels
			this._animatePanels(this.closePanelsAnimation, {
				duration: this.settings.closePanelDuration,
				step: function(progress) {
					for (var i = firstPanel; i <= lastPanel; i++) {
						var panel = that.getPanelAt(i);

						panel.setPosition(progress * (targetPosition[i] - startPosition[i]) + startPosition[i]);

						if (that.isOverlapping === false)
							panel.setSize(progress * (targetSize[i] - startSize[i]) + startSize[i]);
					}
				},
				complete: function() {
					// fire 'panelsCloseComplete' event
					var eventObject = {type: 'panelsCloseComplete', previousIndex: previousIndex};
					that.trigger(eventObject);
					if ($.isFunction(that.settings.panelsCloseComplete))
						that.settings.panelsCloseComplete.call(that, eventObject);
				}
			});

			// fire 'panelsClose' event
			var eventObject = {type: 'panelsClose', previousIndex: previousIndex};
			this.trigger(eventObject);
			if ($.isFunction(this.settings.panelsClose))
				this.settings.panelsClose.call(this, eventObject);
		},

		/*
			Return the number of visible panels
		*/
		getVisiblePanels: function() {
			return this.settings.visiblePanels == -1 ? this.getTotalPanels() : this.settings.visiblePanels;
		},

		/*
			Return the total number of pages
		*/
		getTotalPages: function() {
			if (this.settings.visiblePanels == -1)
				return 1;
			
			return Math.ceil(this.getTotalPanels() / this.settings.visiblePanels);
		},

		/*
			Return the current page
		*/
		getCurrentPage: function() {
			return this.settings.visiblePanels == -1 ? 0 : this.currentPage;
		},

		/*
			Navigate to the indicated page
		*/
		gotoPage: function(index) {
			// close any opened panels before scrolling to a different page
			if (this.currentIndex != -1)
				this.closePanels();

			this.currentPage = index;

			this.isPageScrolling = true;

			var that = this,
				animObj = {},
				targetPosition = - (index * this.totalSize + this.currentPage * this.computedPanelDistance);
			
			if (this.currentPage === this.getTotalPages() - 1)
				targetPosition = - (this.totalPanelsSize - this.totalSize);

			animObj[this.positionProperty] = targetPosition;

			// fire 'pageScroll' event
			var eventObject = {type: 'pageScroll', index: this.currentPage};
			this.trigger(eventObject);
			if ($.isFunction(this.settings.pageScroll))
				this.settings.pageScroll.call(this, eventObject);

			this.$panelsContainer.stop().animate(animObj, this.settings.pageScrollDuration, this.settings.pageScrollEasing, function() {
				that.isPageScrolling = false;

				// fire 'pageScrollComplete' event
				var eventObject = {type: 'pageScrollComplete', index: that.currentPage};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.pageScrollComplete))
					that.settings.pageScrollComplete.call(that, eventObject);
			});
		},

		/*
			Navigate to the next page
		*/
		nextPage: function() {
			var index = (this.currentPage >= this.getTotalPages() - 1) ? 0 : (this.currentPage + 1);
			this.gotoPage(index);
		},

		/*
			Navigate to the previous page
		*/
		previousPage: function() {
			var index = this.currentPage <= 0 ? (this.getTotalPages() - 1) : (this.currentPage - 1);
			this.gotoPage(index);
		},

		/*
			Calculate and return the first panel from the current page
		*/
		_getFirstPanelFromPage: function() {
			if (this.settings.visiblePanels == -1) {
				return 0;
			} else if (this.currentPage == this.getTotalPages() - 1 && this.currentPage !== 0) {
				return this.getTotalPanels() - this.settings.visiblePanels;
			} else {
				return this.currentPage * this.settings.visiblePanels;
			}
		},

		/*
			Calculate and return the last panel from the current page
		*/
		_getLastPanelFromPage: function() {
			if (this.settings.visiblePanels == -1) {
				return this.getTotalPanels() - 1;
			} else if (this.currentPage == this.getTotalPages() - 1) {
				return this.getTotalPanels() - 1;
			} else {
				return (this.currentPage + 1) * this.settings.visiblePanels - 1;
			}
		},

		/*
			Return the page that the specified panel belongs to
		*/
		_getPageOfPanel: function(index) {
			if (this.currentPage == this.getTotalPages() - 1 && index >= this.getTotalPanels() - this.settings.visiblePanels)
				return this.getTotalPages() - 1;

			return Math.floor(index / this.settings.visiblePanels);
		},

		/*
			Create or update the pagination buttons
		*/
		_updatePaginationButtons: function() {
			var paginationButtons = this.$accordion.find('.ga-pagination-buttons'),
				that = this,
				totalPages = this.getTotalPages();

			// remove the buttons if there are no more pages
			if (totalPages <= 1 && paginationButtons.length !== 0) {
				paginationButtons.remove();
				paginationButtons.off('click.' + NS, '.ga-pagination-button');
				this.off('pageScroll.' + NS);
			
			// if there are pages and the buttons were not created yet, create them now
			} else if (totalPages > 1 && paginationButtons.length === 0) {
				// create the buttons' container
				paginationButtons = $('<div class="ga-pagination-buttons"></div>').appendTo(this.$accordion);

				// create the buttons
				for (var i = 0; i < this.getTotalPages(); i++) {
					$('<div class="ga-pagination-button"></div>').appendTo(paginationButtons);
				}

				// listen for button clicks 
				paginationButtons.on('click.' + NS, '.ga-pagination-button', function() {
					that.gotoPage($(this).index());
				});

				// set the initially selected button
				paginationButtons.find('.ga-pagination-button').eq(this.currentPage).addClass('ga-selected');

				// select the corresponding panel when the page changes and change the selected button
				this.on('pageScroll.' + NS, function(event) {
					paginationButtons.find('.ga-selected').removeClass('ga-selected');
					paginationButtons.find('.ga-pagination-button').eq(event.index).addClass('ga-selected');
				});

			// update the buttons if they already exist but their number differs from
			// the number of existing pages
			} else if (totalPages > 1 && paginationButtons.length !== 0) {
				paginationButtons.empty();

				// create the buttons
				for (var j = 0; j < this.getTotalPages(); j++) {
					$('<div class="ga-pagination-button"></div>').appendTo(paginationButtons);
				}

				// change the selected the buttons
				paginationButtons.find('.ga-selected').removeClass('ga-selected');
				paginationButtons.find('.ga-pagination-button').eq(this.currentPage).addClass('ga-selected');
			}
		},

		/*
			The default options of the accordion
		*/
		defaults: {
			width: 800,
			height: 400,
			responsive: true,
			responsiveMode: 'auto',
			aspectRatio: -1,
			orientation: 'horizontal',
			startPanel: -1,
			openedPanelSize: 'max',
			maxOpenedPanelSize: '80%',
			openPanelOn: 'hover',
			closePanelsOnMouseOut: true,
			mouseDelay: 200,
			panelDistance: 0,
			openPanelDuration: 700,
			closePanelDuration: 700,
			pageScrollDuration: 500,
			pageScrollEasing: 'swing',
			breakpoints: null,
			visiblePanels: -1,
			startPage: 0,
			shadow: true,
			panelOverlap: true,
			init: function() {},
			update: function() {},
			accordionMouseOver: function() {},
			accordionMouseOut: function() {},
			panelClick: function() {},
			panelMouseOver: function() {},
			panelMouseOut: function() {},
			panelOpen: function() {},
			panelsClose: function() {},
			pageScroll: function() {},
			panelOpenComplete: function() {},
			panelsCloseComplete: function() {},
			pageScrollComplete: function() {},
			breakpointReach: function() {}
		}
	};

	var GridAccordionPanel = function(panel, accordion, index) {

		// reference to the panel jQuery object
		this.$panel = panel;

		// reference to the accordion object
		this.accordion = accordion;

		// reference to the global settings of the accordion
		this.settings = this.accordion.settings;

		// set a namespace for the panel
		this.panelNS =  'GridAccordionPanel' + index + '.' + NS;

		// set the index of the panel
		this.setIndex(index);

		// init the panel
		this._init();
	};

	GridAccordionPanel.prototype = {

		/*
			The starting point for the panel
		*/
		_init: function() {
			var that = this;

			this.$panel.attr('data-init', true);

			// listen for 'mouseenter' events
			this.on('mouseenter.' + this.panelNS, function() {
				that.trigger({type: 'panelMouseOver.' + NS, index: that.index});
			});

			// listen for 'mouseleave' events
			this.on('mouseleave.' + this.panelNS, function() {
				that.trigger({type: 'panelMouseOut.' + NS, index: that.index});
			});

			// listen for 'click' events
			this.on('click.' + this.panelNS, function() {
				that.trigger({type: 'panelClick.' + NS, index: that.index});
			});

			// set position and size properties
			this.update();

			// init panel modules
			var modules = $.GridAccordion.modules.panel;

			if (typeof modules !== 'undefined')
				for (var i in modules) {
					if (typeof this['init' + modules[i]] !== 'undefined')
						this['init' + modules[i]]();
				}
		},

		/*
			Update the panel
		*/
		update: function() {
			// get the new position and size properties
			this.positionProperty = this.settings.orientation == 'horizontal' ? 'left' : 'top';
			this.sizeProperty = this.settings.orientation == 'horizontal' ? 'width' : 'height';

			// reset the current size and position
			this.$panel.css({top: '', left: '', width: '', height: ''});
		},

		/*
			Destroy the panel
		*/
		destroy: function() {
			// detach all event listeners
			this.off('mouseenter.' + this.panelNS);
			this.off('mouseleave.' + this.panelNS);
			this.off('click.' + this.panelNS);

			// clean the element from attached styles and data
			this.$panel.attr('style', '');
			this.$panel.removeAttr('data-init');
			this.$panel.removeAttr('data-index');

			// destroy panel modules
			var modules = $.GridAccordion.modules.panel;

			if (typeof modules !== 'undefined')
				for (var i in modules) {
					if (typeof this['destroy' + modules[i]] !== 'undefined')
						this['destroy' + modules[i]]();
				}
		},

		/*
			Return the index of the panel
		*/
		getIndex: function() {
			return this.index;
		},

		/*
			Set the index of the panel
		*/
		setIndex: function(index) {
			this.index = index;
			this.$panel.attr('data-index', this.index);
		},

		/*
			Return the position of the panel
		*/
		getPosition: function() {
			return parseInt(this.$panel.css(this.positionProperty), 10);
		},

		/*
			Set the position of the panel
		*/
		setPosition: function(value) {
			this.$panel.css(this.positionProperty, value);
		},

		/*
			Return the size of the panel
		*/
		getSize: function() {
			return parseInt(this.$panel.css(this.sizeProperty), 10);
		},

		/*
			Set the size of the panel
		*/
		setSize: function(value) {
			this.$panel.css(this.sizeProperty, value);
		},

		/*
			Get the real size of the panel's content
		*/
		getContentSize: function() {
			var size,
				that = this;

			// check if there are loading images
			if (this.checkImagesComplete() == 'loading')
				return 'loading';

			if (this.settings.panelOverlap === false || parseInt(this.settings.panelDistance, 10) > 0) {
				// get the current size of the inner content and then temporarily set the panel to a small size
				// in order to accurately calculate the size of the inner content
				var currentSize = this.$panel.css(this.sizeProperty);
				this.$panel.css(this.sizeProperty, 10);
				size = this.sizeProperty == 'width' ? this.$panel[0].scrollWidth : this.$panel[0].scrollHeight;
				this.$panel.css(this.sizeProperty, currentSize);
			} else {
				// workaround for when scrollWidth and scrollHeight return incorrect values
				// this happens in some browsers (Firefox and Opera a.t.m.) unless there is a set width and height for the element
				if (this.sizeProperty == 'width') {
					this.$panel.css({'width': '100px', 'overflow': 'hidden'});
					size = this.$panel[0].scrollWidth;
					this.$panel.css({'width': '', 'overflow': ''});
				} else {
					this.$panel.css({'height': '100px', 'overflow': 'hidden'});
					size = this.$panel[0].scrollHeight;
					this.$panel.css({'height': '', 'overflow': ''});
				}
			}

			return size;
		},

		/*
			Check the status of all images from the panel
		*/
		checkImagesComplete: function() {
			var that = this,
				status = 'complete';

			// check if there is any unloaded image inside the panel
			this.$panel.find('img').each(function(index) {
				var image = $(this)[0];

				if (image.complete === false)
					status = 'loading';
			});

			// continue checking until all images have loaded
			if (status == 'loading') {
				var checkImage = setInterval(function() {
					var isLoaded = true;

					that.$panel.find('img').each(function(index) {
						var image = $(this)[0];

						if (image.complete === false)
							isLoaded = false;
					});

					if (isLoaded === true) {
						clearInterval(checkImage);
						that.trigger({type: 'imagesComplete.' + NS, index: that.index, contentSize: that.getContentSize()});
					}
				}, 100);
			}

			return status;
		},

		/*
			Attach an event handler to the panel
		*/
		on: function(type, callback) {
			return this.$panel.on(type, callback);
		},

		/*
			Detach an event handler to the panel
		*/
		off: function(type) {
			return this.$panel.off(type);
		},

		/*
			Trigger an event on the panel
		*/
		trigger: function(data) {
			return this.$panel.triggerHandler(data);
		}
	};

	window.GridAccordion = GridAccordion;
	window.GridAccordionPanel = GridAccordionPanel;

	$.fn.gridAccordion = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);

		return this.each(function() {
			// instantiate the accordion or alter it
			if (typeof $(this).data('gridAccordion') === 'undefined') {
				var newInstance = new GridAccordion(this, options);

				// store a reference to the instance created
				$(this).data('gridAccordion', newInstance);
			} else if (typeof options !== 'undefined') {
				var	currentInstance = $(this).data('gridAccordion');

				// check the type of argument passed
				if (typeof currentInstance[options] === 'function') {
					currentInstance[options].apply(currentInstance, args);
				} else if (typeof currentInstance.settings[options] !== 'undefined') {
					var obj = {};
					obj[options] = args[0];
					currentInstance._setProperties(obj);
				} else if (typeof options === 'object') {
					currentInstance._setProperties(options);
				} else {
					$.error(options + ' does not exist in gridAccordion.');
				}
			}
		});
	};
	
})(window, jQuery);