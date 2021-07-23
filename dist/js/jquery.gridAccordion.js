/*!
* Grid Accordion - v2.8
* Homepage: http://bqworks.net/grid-accordion/
* Author: bqworks
* Author URL: http://bqworks.net/
*/
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

			if (target === 'accordion')
				$.extend(GridAccordion.prototype, module);
			else if (target === 'panel')
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

		// the computed number of columns and rows
		this.columns = 0;
		this.rows = 0;

		// the width and height, in pixels, of the accordion
		this.totalWidth = 0;
		this.totalHeight = 0;

		// the width or height (depending on orientation) of the panels' container
		this.totalPanelsSize = 0;

		// the computed width and height, in pixels, of the opened panel
		this.computedOpenedPanelWidth = 0;
		this.computedOpenedPanelHeight = 0;

		// the computed maximum allowed width and height, in pixels, of the opened panel
		this.maxComputedOpenedPanelWidth= 0;
		this.maxComputedOpenedPanelHeight = 0;

		// the width and height, in pixels, of the collapsed panels
		this.collapsedPanelWidth = 0;
		this.collapsedPanelHeight = 0;

		// the width and height, in pixels, of the closed panels
		this.closedPanelWidth = 0;
		this.closedPanelHeight = 0;

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

		// keeps a reference to the previous number of columns and rows
		this.previousColumns = -1;
		this.previousRows = -1;

		// indicates whether the accordion is currently scrolling
		this.isPageScrolling = false;

		// indicates the left or top property based on the orientation of the accordion
		this.positionProperty = 'left';

		// indicates the width or height property based on the orientation of the accordion
		this.sizeProperty = 'width';

		// keeps a reference to the ratio between the actual size of the accordion and the set size
		this.autoResponsiveRatio = 1;

		// stores all panels that contain images which are in the loading process
		this.loadingPanels = [];

		// initialize the accordion
		this._init();
	};

	GridAccordion.prototype = {

		/*
			The starting place for the accordion
		*/
		_init: function() {
			var that = this;

			this.$accordion.removeClass('ga-no-js');

			// get reference to the panels' container and 
			// create additional mask container, which will mask the panels' container
			this.$maskContainer = $('<div class="ga-mask"></div>').appendTo(this.$accordion);
			this.$panelsContainer = this.$accordion.find('.ga-panels').appendTo(this.$maskContainer);

			// create the 'ga-panels' element if it wasn't created manually
			if (this.$panelsContainer.length === 0)
				this.$panelsContainer = $('<div class="ga-panels"></div>').appendTo(this.$maskContainer);

			// initialize accordion modules
			var modules = $.GridAccordion.modules.accordion;

			// Merge the modules' default settings with the core's default settings
			if (typeof modules !== 'undefined') {
				for (var i = 0; i < modules.length; i++) {
					var defaults = modules[i] + 'Defaults';
					
					if (typeof this[defaults] !== 'undefined') {
						$.extend(this.defaults, this[defaults]);
					} else {
						defaults = modules[i].substring(0, 1).toLowerCase() + modules[i].substring(1) + 'Defaults';

						if (typeof this[defaults] !== 'undefined') {
							$.extend(this.defaults, this[defaults]);
						}
					}
				}
			}

			// Merge the user defined settings with the default settings
			this.settings = $.extend({}, this.defaults, this.options);

			// Initialize the modules
			if (typeof modules !== 'undefined') {
				for (var j = 0; j < modules.length; j++) {
					if (typeof this['init' + modules[j]] !== 'undefined') {
						this['init' + modules[j]]();
					}
				}
			}

			// keep a reference of the original settings and use it
			// to restore the settings when the breakpoints are used
			this.originalSettings = $.extend({}, this.settings);

			if (this.settings.shuffle === true) {
				var shuffledPanels = this.$panelsContainer.find('.ga-panel').sort(function() {
					return 0.5 - Math.random();
				});
				this.$panelsContainer.empty().append(shuffledPanels);
			}
			
			// set a panel to be opened from the start
			this.currentIndex = this.settings.startPanel;

			if (this.currentIndex === -1)
				this.$accordion.addClass('ga-closed');
			else
				this.$accordion.addClass('ga-opened');

			// if a panels was not set to be opened but a page was specified,
			// set that page index to be opened
			if (this.settings.startPage !== -1)
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
			if (this.currentIndex !== -1) {
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
				clearTimeout(that.mouseDelayTimer);

				// close the panels
				if (that.settings.closePanelsOnMouseOut === true)
					that.closePanels();

				var eventObject = {type: 'accordionMouseOut'};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.accordionMouseOut))
					that.settings.accordionMouseOut.call(that, eventObject);
			});

			// resize the accordion when the browser resizes
			$(window).on('resize.' + this.uniqueId + '.' + NS, function() {
				that.resize();
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
			if (this.settings.orientation === 'horizontal') {
				this.$accordion.removeClass('ga-vertical').addClass('ga-horizontal');
				this.positionProperty = 'left';
				this.sizeProperty = 'width';
			} else if (this.settings.orientation === 'vertical') {
				this.$accordion.removeClass('ga-horizontal').addClass('ga-vertical');
				this.positionProperty = 'top';
				this.sizeProperty = 'height';
			}

			// reset the panels' container position
			this.$panelsContainer.attr('style', '');

			// clear inline size of the background images because the orientation might have changes
			this.$accordion.find('img.ga-background, img.ga-background-opened').css({'width': '', 'height': ''});

			// update panels
			this._updatePanels();

			// create or remove the shadow
			if (this.settings.shadow === true) {
				this.$accordion.find('.ga-panel').addClass('ga-shadow');
			} else if (this.settings.shadow === false) {
				this.$accordion.find('.ga-shadow').removeClass('ga-shadow');
			}

			// calculate the actual number of rows and columns
			this.columns = this.settings.columns;
			this.rows = this.settings.rows;

			if (this.settings.columns === -1 && this.settings.rows === -1) {
				this.columns = 4;
				this.rows = 3;
			} else if (this.settings.columns === -1) {
				this.columns = Math.ceil(this.getTotalPanels() / this.settings.rows);
				this.rows = this.settings.rows;
			} else if (this.settings.rows === -1) {
				this.columns = this.settings.columns;
				this.rows = Math.ceil(this.getTotalPanels() / this.settings.columns);
			}

			// if the number of rows or columns has changed, update the current page to reflect
			// the same relative position of the panels
			if (this.settings.columns === -1 || this.settings.rows === -1) {
				this.currentPage = 0;
			} else if (this.currentIndex !== -1) {
				this.currentPage = Math.floor(this.currentIndex / (this.settings.columns * this.settings.rows));
			} else if ((this.settings.columns !== this.previousColumns && this.previousColumns !== -1) || (this.settings.rows !== this.previousRows && this.previousRows !== -1)) {
				var correctPage = Math.min(Math.round((this.currentPage * (this.previousColumns * this.previousRows)) / (this.settings.columns * this.settings.rows)), this.getTotalPages() - 1);

				if (this.currentPage !== correctPage)
					this.currentPage = correctPage;
			}

			// create or update the pagination buttons
			this._updatePaginationButtons();

			// set the size of the accordion
			this.resize();

			// fire the update event
			var eventObject = {type: 'update'};
			that.trigger(eventObject);
			if ($.isFunction(that.settings.update))
				that.settings.update.call(that, eventObject);
		},

		/*
			Called when the accordion needs to resize 
		*/
		resize: function() {
			var that = this;

			this.$maskContainer.attr('style', '');

			// prepare the accordion for responsiveness
			if (this.settings.responsive === true) {
				// if the accordion is responsive set the width to 100% and use
				// the specified width and height as a max-width and max-height
				this.$accordion.css({width: '100%', height: this.settings.height, maxWidth: this.settings.width, maxHeight: this.settings.height});

				// if an aspect ratio was not specified, set the aspect ratio
				// based on the specified width and height
				if (this.settings.aspectRatio === -1)
					this.settings.aspectRatio = this.settings.width / this.settings.height;

				this.$accordion.css('height', this.$accordion.innerWidth() / this.settings.aspectRatio);

				if (this.settings.responsiveMode === 'auto') {
					// get the accordion's size ratio based on the set size and the actual size
					this.autoResponsiveRatio = this.$accordion.innerWidth() / this.settings.width;

					this.$maskContainer.css('width', this.settings.width);

					if ( isNaN( this.settings.height ) )
						this.$maskContainer.css('height', Math.min(this.settings.width / this.settings.aspectRatio, parseInt(this.settings.height, 10) / 100 * $(window).height()));
					else
						this.$maskContainer.css('height', Math.min(this.settings.width / this.settings.aspectRatio, this.settings.height));

					// scale the mask container based on the current ratio
					if ( this.autoResponsiveRatio < 1 ) {
						this.$maskContainer.css({
							'-webkit-transform': 'scaleX(' + this.autoResponsiveRatio + ') scaleY(' + this.autoResponsiveRatio + ')',
							'-ms-transform': 'scaleX(' + this.autoResponsiveRatio + ') scaleY(' + this.autoResponsiveRatio + ')',
							'transform': 'scaleX(' + this.autoResponsiveRatio + ') scaleY(' + this.autoResponsiveRatio + ')',
							'-webkit-transform-origin': 'top left',
							'-ms-transform-origin': 'top left',
							'transform-origin': 'top left'
						});
					} else {
						this.$maskContainer.css({
							'-webkit-transform': '',
							'-ms-transform': '',
							'transform': '',
							'-webkit-transform-origin': '',
							'-ms-transform-origin': '',
							'transform-origin': ''
						});
					}
					
					this.totalWidth = this.$maskContainer.innerWidth();
					this.totalHeight = this.$maskContainer.innerHeight();
				} else {
					this.totalWidth = this.$accordion.innerWidth();
					this.totalHeight = this.$accordion.innerHeight();
				}
			} else {
				this.$accordion.css({width: this.settings.width, height: this.settings.height, maxWidth: '', maxHeight: ''});
				this.totalWidth = this.$accordion.innerWidth();
				this.totalHeight = this.$accordion.innerHeight();
			}

			// reset the list of panels that we are tracking
			this.loadingPanels.length = 0;

			// set the initial computedPanelDistance to the value defined in the options
			this.computedPanelDistance = this.settings.panelDistance;

			// parse computedPanelDistance and set it to a pixel value
			if (typeof this.computedPanelDistance === 'string') {
				if (this.computedPanelDistance.indexOf('%') !== -1) {
					this.computedPanelDistance = this.totalWidth * (parseInt(this.computedPanelDistance, 10)/ 100);
				} else if (this.computedPanelDistance.indexOf('px') !== -1) {
					this.computedPanelDistance = parseInt(this.computedPanelDistance, 10);
				}
			}

			// set the width and height, in pixels, of the closed panels
			this.closedPanelWidth = (this.totalWidth - (this.columns - 1) * this.computedPanelDistance) / this.columns;
			this.closedPanelHeight = (this.totalHeight - (this.rows - 1) * this.computedPanelDistance) / this.rows;

			// set the initial computedOpenedPanelWidth to the value defined in the options
			this.computedOpenedPanelWidth = this.settings.openedPanelWidth;

			// parse maxComputedOpenedPanelWidth and set it to a pixel value
			this.maxComputedOpenedPanelWidth = this.settings.maxOpenedPanelWidth;

			if (typeof this.maxComputedOpenedPanelWidth === 'string') {
				if (this.maxComputedOpenedPanelWidth.indexOf('%') !== -1) {
					this.maxComputedOpenedPanelWidth = this.totalWidth * (parseInt(this.maxComputedOpenedPanelWidth, 10)/ 100);
				} else if (this.maxComputedOpenedPanelWidth.indexOf('px') !== -1) {
					this.maxComputedOpenedPanelWidth = parseInt(this.maxComputedOpenedPanelWidth, 10);
				}
			}

			// set the initial computedOpenedPanelHeight to the value defined in the options
			this.computedOpenedPanelHeight = this.settings.openedPanelHeight;

			// parse maxComputedOpenedPanelHeight and set it to a pixel value
			this.maxComputedOpenedPanelHeight = this.settings.maxOpenedPanelHeight;

			if (typeof this.maxComputedOpenedPanelHeight === 'string') {
				if (this.maxComputedOpenedPanelHeight.indexOf('%') !== -1) {
					this.maxComputedOpenedPanelHeight = this.totalHeight * (parseInt(this.maxComputedOpenedPanelHeight, 10)/ 100);
				} else if (this.maxComputedOpenedPanelHeight.indexOf('px') !== -1) {
					this.maxComputedOpenedPanelHeight = parseInt(this.maxComputedOpenedPanelHeight, 10);
				}
			}

			// parse computedOpenedPanelWidth and set it to a pixel value
			if (typeof this.computedOpenedPanelWidth === 'string') {
				if (this.computedOpenedPanelWidth.indexOf('%') !== -1) {
					this.computedOpenedPanelWidth = this.totalWidth * (parseInt(this.computedOpenedPanelWidth, 10)/ 100);
				} else if (this.computedOpenedPanelWidth.indexOf('px') !== -1) {
					this.computedOpenedPanelWidth = parseInt(this.computedOpenedPanelWidth, 10);
				} else if (this.computedOpenedPanelWidth === 'max' && this.currentIndex !== -1) {
					var openedPanelContentWidth = this.getPanelAt(this.currentIndex).getContentSize();

					if (openedPanelContentWidth === 'loading')
						this.computedOpenedPanelWidth = this.closedPanelWidth;
					else
						this.computedOpenedPanelWidth = Math.min(openedPanelContentWidth.width, this.maxComputedOpenedPanelWidth);
				}
			}

			// parse computedOpenedPanelHeight and set it to a pixel value
			if (typeof this.computedOpenedPanelHeight === 'string') {
				if (this.computedOpenedPanelHeight.indexOf('%') !== -1) {
					this.computedOpenedPanelHeight = this.totalHeight * (parseInt(this.computedOpenedPanelHeight, 10)/ 100);
				} else if (this.computedOpenedPanelHeight.indexOf('px') !== -1) {
					this.computedOpenedPanelHeight = parseInt(this.computedOpenedPanelHeight, 10);
				} else if (this.computedOpenedPanelHeight === 'max' && this.currentIndex !== -1) {
					var openedPanelContentHeight = this.getPanelAt(this.currentIndex).getContentSize();

					if (openedPanelContentHeight === 'loading')
						this.computedOpenedPanelHeight = this.closedPanelHeight;
					else
						this.computedOpenedPanelHeight = Math.min(openedPanelContentHeight.height, this.maxComputedOpenedPanelHeight);
				}
			}

			// calculate the minimum width between the panels opened vertically and the minimum height between the panels opened horizontally
			if (this.settings.openedPanelWidth === 'auto' || this.settings.openedPanelHeight === 'auto') {
				var minSize = this._getMinSize(this._getFirstPanelFromPage(), this._getLastPanelFromPage()),
					maxWidth = minSize.width,
					maxHeight = minSize.height;
					
				if (this.settings.openedPanelWidth === 'auto')
					this.computedOpenedPanelWidth = maxWidth;
				
				if (this.settings.openedPanelHeight === 'auto')
					this.computedOpenedPanelHeight = maxHeight;
			}

			// adjust the maximum width and height of the images
			this.$accordion.find('img.ga-background, img.ga-background-opened').css({'max-width': this.maxComputedOpenedPanelWidth, 'max-height': this.maxComputedOpenedPanelHeight});

			// set the width and height, in pixels, of the collapsed panels
			this.collapsedPanelWidth = (this.totalWidth - this.computedOpenedPanelWidth - (this.columns - 1) * this.computedPanelDistance) / (this.columns - 1);
			this.collapsedPanelHeight = (this.totalHeight - this.computedOpenedPanelHeight - (this.rows - 1) * this.computedPanelDistance) / (this.rows - 1);

			// round the values
			this.computedOpenedPanelWidth = Math.floor(this.computedOpenedPanelWidth);
			this.computedOpenedPanelHeight = Math.floor(this.computedOpenedPanelHeight);
			this.collapsedPanelWidth = Math.floor(this.collapsedPanelWidth);
			this.collapsedPanelHeight = Math.floor(this.collapsedPanelHeight);
			this.closedPanelWidth = Math.floor(this.closedPanelWidth);
			this.closedPanelHeight = Math.floor(this.closedPanelHeight);
 
			// reset the accordion's size so that the panels fit exactly inside if their size and position are rounded
			this.totalWidth = this.closedPanelWidth * this.columns + this.computedPanelDistance * (this.columns - 1);
			this.totalHeight = this.closedPanelHeight * this.rows + this.computedPanelDistance * (this.rows - 1);

			if (this.settings.responsiveMode === 'custom' || this.settings.responsive === false) {
				this.$accordion.css({'width': this.totalWidth, 'height': this.totalHeight});
			} else {
				this.$accordion.css({'width': this.totalWidth * this.autoResponsiveRatio, 'height': this.totalHeight * this.autoResponsiveRatio});
				this.$maskContainer.css({'width': this.totalWidth, 'height': this.totalHeight});
			}

			// get the total width and height of the panels' container
			if (this.settings.orientation === 'horizontal') {
				this.totalPanelsSize = this.totalWidth * this.getTotalPages() + this.computedPanelDistance * (this.getTotalPages() - 1);
				this.$panelsContainer.css('width', this.totalPanelsSize);
			} else {
				this.totalPanelsSize = this.totalHeight * this.getTotalPages() + this.computedPanelDistance * (this.getTotalPages() - 1);
				this.$panelsContainer.css('height', this.totalPanelsSize);
			}

			// if there are multiple pages, set the correct position of the panels' container
			if (this.getTotalPages() > 1) {
				var cssObj = {},
					targetPosition = - ((this.settings.orientation === 'horizontal' ? this.totalWidth : this.totalHeight) + this.computedPanelDistance) * this.currentPage;

				cssObj[this.positionProperty] = targetPosition;
				this.$panelsContainer.css(cssObj);
			}

			// set the position and size of each panel
			$.each(this.panels, function(index, element) {
				var leftPosition, topPosition, width, height, horizontalIndex, verticalIndex;

				// calculate the position of the panels
				if (that.settings.orientation === 'horizontal') {
					horizontalIndex = index % that.columns + (that.columns * Math.floor(index / (that.rows * that.columns)));
					verticalIndex = Math.floor(index / that.columns) - (that.rows * Math.floor(index / (that.rows * that.columns)));

					if (that.currentIndex !== -1 && Math.floor(index / (that.rows * that.columns)) === that.currentPage) {
						leftPosition = that.currentPage * (that.totalWidth + that.computedPanelDistance) +
										(horizontalIndex - (that.currentPage * (that.columns))) * (that.collapsedPanelWidth + that.computedPanelDistance) +
										(index % that.columns > that.currentIndex % that.columns ? that.computedOpenedPanelWidth - that.collapsedPanelWidth : 0);
						
						topPosition = verticalIndex * (that.collapsedPanelHeight + that.computedPanelDistance) +
										(Math.floor(index / that.columns) > Math.floor(that.currentIndex / that.columns) ? that.computedOpenedPanelHeight - that.collapsedPanelHeight : 0);
					} else {
						leftPosition = horizontalIndex * (that.closedPanelWidth + that.computedPanelDistance);
						topPosition = verticalIndex * (that.closedPanelHeight + that.computedPanelDistance);
					}
				} else {
					horizontalIndex = index % that.columns;
					verticalIndex = Math.floor(index / that.columns);

					if (that.currentIndex !== -1 && (Math.floor(index / (that.rows * that.columns)) === that.currentPage)) {
						leftPosition = horizontalIndex * (that.collapsedPanelWidth + that.computedPanelDistance) +
										(index % that.columns > that.currentIndex % that.columns ? that.computedOpenedPanelWidth - that.collapsedPanelWidth : 0);

						topPosition = that.currentPage * (that.totalHeight + that.computedPanelDistance) +
										(verticalIndex - (that.currentPage * that.rows)) * (that.collapsedPanelHeight + that.computedPanelDistance) +
										(Math.floor(index / that.columns) > Math.floor(that.currentIndex / that.columns) ? that.computedOpenedPanelHeight - that.collapsedPanelHeight : 0);
					} else {
						leftPosition = horizontalIndex * (that.closedPanelWidth + that.computedPanelDistance);
						topPosition = verticalIndex * (that.closedPanelHeight + that.computedPanelDistance);
					}
				}

				// calculate the width and height of the panel
				if (that.currentIndex !== -1 && Math.floor(index / (that.rows * that.columns)) === that.currentPage) {
					width = index % that.columns === that.currentIndex % that.columns ? that.computedOpenedPanelWidth : that.collapsedPanelWidth;
					height = Math.floor(index / that.columns) === Math.floor(that.currentIndex / that.columns) ? that.computedOpenedPanelHeight : that.collapsedPanelHeight;
				} else {
					width = that.closedPanelWidth;
					height = that.closedPanelHeight;
				}

				// if panels are set to open to their maximum width or height and the current panel
				// should be opened horizontally or vertically, adjust its position and size,
				// so that it's centered and doesn't open more than its size
				if (Math.floor(index / (that.rows * that.columns)) === that.currentPage &&
					(that.settings.openedPanelWidth === 'max' && index % that.columns === that.currentIndex % that.columns) ||
					(that.settings.openedPanelHeight === 'max' && Math.floor(index / that.columns) === Math.floor(that.currentIndex / that.columns))) {
					
					var contentSize = element.getContentSize();

					if (index % that.columns === that.currentIndex % that.columns) {
						if (contentSize === 'loading' && $.inArray(index, that.loadingPanels) === -1) {
							that.loadingPanels.push(index);
						} else if (contentSize.width < that.computedOpenedPanelWidth) {
							leftPosition += (that.computedOpenedPanelWidth - contentSize.width) / 2;
							width = contentSize.width;
						}
					}

					if (Math.floor(index / that.columns) === Math.floor(that.currentIndex / that.columns)) {
						if (contentSize === 'loading' && $.inArray(index, that.loadingPanels) === -1) {
							that.loadingPanels.push(index);
						} else if (contentSize.height < that.computedOpenedPanelHeight) {
							topPosition += (that.computedOpenedPanelHeight - contentSize.height) / 2;
							height = contentSize.height;
						}
					}
				}

				// set the position of the panel
				element.setPosition(leftPosition, topPosition);

				// set the size of the panel
				element.setSize(width, height);
			});

			// check if the current window width is bigger than the biggest breakpoint
			// and if necessary reset the properties to the original settings
			// if the window width is smaller than a certain breakpoint, apply the settings specified
			// for that breakpoint but only after merging them with the original settings
			// in order to make sure that only the specified settings for the breakpoint are applied
			if (this.settings.breakpoints !== null && this.breakpoints.length > 0) {
				if ($(window).width() > this.breakpoints[this.breakpoints.length - 1].size && this.currentBreakpoint !== -1) {
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

				if (that.settings.openPanelOn === 'hover') {
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
				if (that.$accordion.hasClass('ga-swiping'))
					return;

				if (that.settings.openPanelOn === 'click') {
					// open the panel if it's not already opened
					// and close the panels if the clicked panel is opened
					if (index !== that.currentIndex)
						that.openPanel(event.index);
					else
						that.closePanels();
				}

				var eventObject = {type: 'panelClick', index: index};
				that.trigger(eventObject);
				if ($.isFunction(that.settings.panelClick))
					that.settings.panelClick.call(that, eventObject);
			});

			// disable links if the panel should open on click and it wasn't opened yet
			panel.on('panelMouseDown.' + NS, function(event) {
				$(this).find('a').off('click.disablePanelLink');

				if (index !== that.currentIndex && that.settings.openPanelOn === 'click') {
					$(this).find('a').one('click.disablePanelLink', function(event) {
						event.preventDefault();
					});
				}
			});

			// listen for 'imagesComplete' events and if the images were loaded in
			// a panel that is tracked, remove that panel from the list of loading panels.
			// if the list of loading panels remains empty, re-open the selected panel
			// in order to arrange all panels properly 
			panel.on('imagesComplete.' + NS, function(event) {
				var arrayIndex = $.inArray(event.index, that.loadingPanels);
				
				if (arrayIndex !== -1) {
					that.loadingPanels.splice(arrayIndex, 1);

					if (that.loadingPanels.length === 0)
						that.openPanel(that.currentIndex, true);
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
				for (var i = 0; i < modules.length; i++) {
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
			// contains the panel if necessary
			if (this.settings.columns !== -1 && this.settings.rows !== -1) {
				var page = Math.floor(this.currentIndex / (this.columns * this.rows));

				if (page !== this.currentPage)
					this.gotoPage(page);

				// reset the current index because when the closePanels was called inside gotoPage the current index became -1
				this.currentIndex = index;
			}

			var that = this,
				targetLeft = [],
				targetTop = [],
				targetWidth = [],
				targetHeight = [],
				startLeft = [],
				startTop = [],
				startWidth = [],
				startHeight = [],
				animatedPanels = [],
				firstPanel = this._getFirstPanelFromPage(),
				lastPanel = this._getLastPanelFromPage(),
				counter = 0;

			// reset the list of tracked loading panels
			this.loadingPanels.length = 0;

			this.$accordion.find('.ga-panel.ga-opened').removeClass('ga-opened');
			this.$accordion.find('.ga-panel').eq(this.currentIndex).addClass('ga-opened');

			// check if the panel needs to open to its maximum width and/or height, and recalculate
			// the width and/or height of the opened panel and the size of the collapsed panel
			if (this.settings.openedPanelWidth === 'max') {
				var openedPanelContentWidth = this.getPanelAt(this.currentIndex).getContentSize();

				if (openedPanelContentWidth === 'loading')
					this.computedOpenedPanelWidth = this.closedPanelWidth;
				else
					this.computedOpenedPanelWidth = Math.min(openedPanelContentWidth.width, this.maxComputedOpenedPanelWidth);

				this.collapsedPanelWidth = (this.totalWidth - this.computedOpenedPanelWidth - (this.columns - 1) * this.computedPanelDistance) / (this.columns - 1);
			}

			if (this.settings.openedPanelHeight === 'max') {
				var openedPanelContentHeight = this.getPanelAt(this.currentIndex).getContentSize();

				if (openedPanelContentHeight === 'loading')
					this.computedOpenedPanelHeight = this.closedPanelHeight;
				else
					this.computedOpenedPanelHeight = Math.min(openedPanelContentHeight.height, this.maxComputedOpenedPanelHeight);

				this.collapsedPanelHeight = (this.totalHeight - this.computedOpenedPanelHeight - (this.rows - 1) * this.computedPanelDistance) / (this.rows - 1);
			}

			// calculate the minimum width and height between the panels that need to open vertically, respectively horizontally
			if (this.settings.openedPanelWidth === 'auto' || this.settings.openedPanelHeight === 'auto') {
				var minSize = this._getMinSize(firstPanel, lastPanel),
					maxWidth = minSize.width,
					maxHeight = minSize.height;

				if (this.settings.openedPanelWidth === 'auto') {
					this.computedOpenedPanelWidth = maxWidth;
					this.collapsedPanelWidth = (this.totalWidth - this.computedOpenedPanelWidth - (this.columns - 1) * this.computedPanelDistance) / (this.columns - 1);
				}
				
				if (this.settings.openedPanelHeight === 'auto') {
					this.computedOpenedPanelHeight = maxHeight;
					this.collapsedPanelHeight = (this.totalHeight - this.computedOpenedPanelHeight - (this.rows - 1) * this.computedPanelDistance) / (this.rows - 1);
				}
			}
			
			// get the starting and target position and size of each panel
			for (var i = firstPanel; i <= lastPanel; i++) {
				var panel = this.getPanelAt(i),
					position = panel.getPosition(),
					contentSize = panel.getContentSize();

				startLeft[i] = position.left;
				startTop[i] = position.top;

				if (this.settings.orientation === 'horizontal') {
					targetLeft[i] = this.currentPage * (this.totalWidth + this.computedPanelDistance) +
									(counter % this.columns) * (this.collapsedPanelWidth + this.computedPanelDistance) +
									(i % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0);
					
					targetTop[i] = (Math.floor(counter / this.columns)) * (this.collapsedPanelHeight + this.computedPanelDistance) +
									(Math.floor(i / this.columns) > Math.floor(this.currentIndex / this.columns) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0);
				} else {
					targetLeft[i] = (counter % this.columns) * (this.collapsedPanelWidth + this.computedPanelDistance) +
									(i % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0);

					targetTop[i] = this.currentPage * (this.totalHeight + this.computedPanelDistance) +
									(Math.floor(counter / this.columns)) * (this.collapsedPanelHeight + this.computedPanelDistance) +
									(Math.floor(i / this.columns) > Math.floor(this.currentIndex / this.columns) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0);
				}

				var size = panel.getSize();
				startWidth[i] = size.width;
				startHeight[i] = size.height;
				targetWidth[i] = i % this.columns === this.currentIndex % this.columns ? this.computedOpenedPanelWidth : this.collapsedPanelWidth;
				targetHeight[i] = Math.floor(i / this.columns) === Math.floor(this.currentIndex / this.columns) ? this.computedOpenedPanelHeight : this.collapsedPanelHeight;

				// adjust the left position and width of the vertically opened panels,
				// if they are set to open to their maximum width
				if (this.settings.openedPanelWidth === 'max' && i % this.columns === this.currentIndex % this.columns) {
					if (contentSize === 'loading' && $.inArray(i, this.loadingPanels) === -1) {
						this.loadingPanels.push(i);
					} else if (contentSize.width < this.computedOpenedPanelWidth) {
						targetLeft[i] += (this.computedOpenedPanelWidth - contentSize.width) / 2;
						targetWidth[i] = contentSize.width;
					}
				}

				// adjust the top position and height of the horizontally opened panels,
				// if they are set to open to their maximum height
				if (this.settings.openedPanelHeight === 'max' && Math.floor(i / this.columns) === Math.floor(this.currentIndex / this.columns)) {
					if (contentSize === 'loading' && $.inArray(i, this.loadingPanels) === -1) {
						this.loadingPanels.push(i);
					} else if (contentSize.height < this.computedOpenedPanelHeight) {
						targetTop[i] += (this.computedOpenedPanelHeight - contentSize.height) / 2;
						targetHeight[i] = contentSize.height;
					}
				}

				// check if the panel's position needs to change
				if (targetLeft[i] !== startLeft[i] || targetTop[i] !== startTop[i])
					animatedPanels.push(i);

				// check if the panel's size needs to change
				if ((targetWidth[i] !== startWidth[i] || targetHeight[i] !== startHeight[i]) && $.inArray(i, animatedPanels) === -1)
					animatedPanels.push(i);

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

						panel.setPosition(progress * (targetLeft[value] - startLeft[value]) + startLeft[value], progress * (targetTop[value] - startTop[value]) + startTop[value]);
						panel.setSize(progress * (targetWidth[value] - startWidth[value]) + startWidth[value], progress * (targetHeight[value] - startHeight[value]) + startHeight[value]);
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

			// remove the "opened" class from the previously opened panel
			this.$accordion.find('.ga-panel.ga-opened').removeClass('ga-opened');

			clearTimeout(this.mouseDelayTimer);

			var that = this,
				targetLeft = [],
				targetTop = [],
				targetWidth = [],
				targetHeight = [],
				startLeft = [],
				startTop = [],
				startWidth = [],
				startHeight = [],
				firstPanel = this._getFirstPanelFromPage(),
				lastPanel = this._getLastPanelFromPage(),
				counter = 0;

			// get the starting and target size and position of each panel
			for (var i = firstPanel; i <= lastPanel; i++) {
				var panel = this.getPanelAt(i),
					position = panel.getPosition();
				
				startLeft[i] = position.left;
				startTop[i] = position.top;

				if (this.settings.orientation === 'horizontal') {
					targetLeft[i] = this.currentPage * (this.totalWidth + this.computedPanelDistance) +
									(counter % this.columns) * (this.closedPanelWidth + this.computedPanelDistance);
					
					targetTop[i] = (Math.floor(counter / this.columns)) * (this.closedPanelHeight + this.computedPanelDistance);
				} else {
					targetLeft[i] = (counter % this.columns) * (this.closedPanelWidth + this.computedPanelDistance);

					targetTop[i] = this.currentPage * (this.totalHeight + this.computedPanelDistance) +
									(Math.floor(counter / this.columns)) * (this.closedPanelHeight + this.computedPanelDistance);
				}

				var size = panel.getSize();
				startWidth[i] = size.width;
				startHeight[i] = size.height;
				targetWidth[i] = this.closedPanelWidth;
				targetHeight[i] = this.closedPanelHeight;

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

						panel.setPosition(progress * (targetLeft[i] - startLeft[i]) + startLeft[i], progress * (targetTop[i] - startTop[i]) + startTop[i]);
						panel.setSize(progress * (targetWidth[i] - startWidth[i]) + startWidth[i], progress * (targetHeight[i] - startHeight[i]) + startHeight[i]);
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
			Calculate the minimum width on vertical and minimum height on horizontal
			between the panels included in the specified interval
		*/
		_getMinSize: function(first, last) {
			var maxWidth = this.maxComputedOpenedPanelWidth,
				maxHeight = this.maxComputedOpenedPanelHeight;

			// get the starting and target position and size of each panel
			for (var i = first; i <= last; i++) {
				var panel = this.getPanelAt(i),
					contentSize = panel.getContentSize();

				if (i % this.columns === this.currentIndex % this.columns) {
					if (contentSize === 'loading' && $.inArray(i, this.loadingPanels) === -1) {
						this.loadingPanels.push(i);
						maxWidth = this.closedPanelWidth;
					} else if (contentSize.width < maxWidth) {
						maxWidth = contentSize.width;
					}
				}

				if (Math.floor(i / this.columns) === Math.floor(this.currentIndex / this.columns)) {
					if (contentSize === 'loading' && $.inArray(i, this.loadingPanels) === -1) {
						this.loadingPanels.push(i);
						maxHeight = this.closedPanelHeight;
					} else if (contentSize.height < maxHeight) {
						maxHeight = contentSize.height;
					}
				}
			}

			return {width: maxWidth, height: maxHeight};
		},

		/*
			Return the index of the currently opened panel
		*/
		getCurrentIndex: function() {
			return this.currentIndex;
		},

		/*
			Return the panel at the specified index
		*/
		getPanelAt: function(index) {
			return this.panels[index];
		},

		/*
			Return the total amount of panels
		*/
		getTotalPanels: function() {
			return this.panels.length;
		},

		/*
			Return the total number of pages
		*/
		getTotalPages: function() {
			if (this.settings.columns === -1 || this.settings.rows === -1)
				return 1;

			return Math.ceil(this.getTotalPanels() / (this.columns * this.rows));
		},

		/*
			Return the current page
		*/
		getCurrentPage: function() {
			return this.settings.columns === -1 ? 0 : this.currentPage;
		},

		/*
			Navigate to the indicated page
		*/
		gotoPage: function(index) {
			// close any opened panels before scrolling to a different page
			if (this.currentIndex !== -1)
				this.closePanels();

			this.currentPage = index;
			this.isPageScrolling = true;

			var that = this,
				animObj = {},
				targetPosition = - (index * (this.settings.orientation === 'horizontal' ? this.totalWidth : this.totalHeight) + this.currentPage * this.computedPanelDistance);

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
			if (this.getTotalPages() === 1) {
				return 0;
			} else {
				return this.currentPage * (this.columns * this.rows);
			}
		},

		/*
			Calculate and return the last panel from the current page
		*/
		_getLastPanelFromPage: function() {
			if (this.getTotalPages() === 1) {
				return this.getTotalPanels() - 1;
			} else if (this.currentPage === this.getTotalPages() - 1) {
				return this.getTotalPanels() - 1;
			} else {
				return (this.currentPage + 1) * (this.columns * this.rows) - 1;
			}
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
				
				this.$accordion.removeClass('ga-has-buttons');
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

				this.$accordion.addClass('ga-has-buttons');

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
			Set properties on runtime
		*/
		_setProperties: function(properties, store) {
			// parse the properties passed as an object
			for (var prop in properties) {
				// if the number of rows or columns is changed, store a reference of the previous value
				// which will be used to move the panels to the corresponding page
				if (prop === 'columns' && this.settings.columns !== -1)
					this.previousColumns = this.settings.columns;

				if (prop === 'rows' && this.settings.rows !== -1)
					this.previousRows = this.settings.rows;

				this.settings[prop] = properties[prop];

				// alter the original settings as well unless 'false' is passed to the 'store' parameter
				if (store !== false)
					this.originalSettings[prop] = properties[prop];
			}

			this.update();
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
			rows: 3,
			columns: 4,
			openedPanelWidth: 'max',
			openedPanelHeight: 'max',
			maxOpenedPanelWidth: '70%',
			maxOpenedPanelHeight: '70%',
			openPanelOn: 'hover',
			closePanelsOnMouseOut: true,
			mouseDelay: 200,
			panelDistance: 10,
			openPanelDuration: 700,
			closePanelDuration: 700,
			pageScrollDuration: 500,
			pageScrollEasing: 'swing',
			breakpoints: null,
			startPage: 0,
			shadow: false,
			shuffle: false,
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

		this.isLoading = false;
		this.isLoaded = false;

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

			// listen for 'mousedown' events
			this.on('mousedown.' + this.panelNS, function() {
				that.trigger({type: 'panelMouseDown.' + NS, index: that.index});
			});

			// set position and size properties
			this.update();

			// init panel modules
			var modules = $.GridAccordion.modules.panel;

			if (typeof modules !== 'undefined')
				for (var i = 0; i < modules.length; i++) {
					if (typeof this['init' + modules[i]] !== 'undefined')
						this['init' + modules[i]]();
				}
		},

		/*
			Update the panel
		*/
		update: function() {
			// get the new position and size properties
			this.positionProperty = this.settings.orientation === 'horizontal' ? 'left' : 'top';
			this.sizeProperty = this.settings.orientation === 'horizontal' ? 'width' : 'height';

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
			this.off('mousedown.' + this.panelNS);

			// clean the element from attached styles and data
			this.$panel.attr('style', '');
			this.$panel.removeAttr('data-init');
			this.$panel.removeAttr('data-index');

			// destroy panel modules
			var modules = $.GridAccordion.modules.panel;

			if (typeof modules !== 'undefined')
				for (var i = 0; i < modules.length; i++) {
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
			Return the left and top position of the panel
		*/
		getPosition: function() {
			return {
				'left': parseInt(this.$panel.css('left'), 10),
				'top': parseInt(this.$panel.css('top'), 10)
			};
		},

		/*
			Set the position of the panel
		*/
		setPosition: function(left, top) {
			this.$panel.css({'left': left, 'top': top});
		},

		/*
			Return the width and height of the panel
		*/
		getSize: function() {
			return {
				'width': parseInt(this.$panel.css('width'), 10),
				'height': parseInt(this.$panel.css('height'), 10)
			};
		},

		/*
			Set the size of the panel
		*/
		setSize: function(width, height) {
			this.$panel.css({'width': width, 'height': height});
		},

		/*
			Get the real size of the panel's content
		*/
		getContentSize: function() {
			// check if there are loading images
			if (this.isLoaded === false)
				if (this.checkImagesComplete() === 'loading')
					return 'loading';

			var width = this.$panel[0].scrollWidth,
				height = this.$panel[0].scrollHeight;

			return {width: width, height: height};
		},

		/*
			Check the status of all images from the panel
		*/
		checkImagesComplete: function() {
			if (this.isLoading === true)
				return 'loading';

			var that = this,
				status = 'complete';

			// check if there is any unloaded image inside the panel
			this.$panel.find('img').each(function(index) {
				var image = $(this)[0];

				if (image.complete === false || typeof $(this).attr('data-src') !== 'undefined')
					status = 'loading';
			});

			// continue checking until all images have loaded
			if (status === 'loading') {
				this.isLoading = true;

				var checkImage = setInterval(function() {
					var loaded = true;

					that.$panel.find('img').each(function(index) {
						var image = $(this)[0];

						if (image.complete === false || typeof $(this).attr('data-src') !== 'undefined')
							loaded = false;
					});

					if (loaded === true) {
						that.isLoading = false;
						that.isLoaded = true;
						clearInterval(checkImage);
						that.trigger({type: 'imagesComplete.' + NS, index: that.index});
					}
				}, 100);
			} else {
				this.isLoaded = true;
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

/*
	Autoplay module for Grid Accordion

	Adds autoplay functionality to the accordion
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var Autoplay = {

		autoplayIndex: -1,

		autoplayTimer: null,

		isTimerRunning: false,

		isTimerPaused: false,

		initAutoplay: function() {
			var that = this;

			if (this.settings.autoplay === true)
				this.startAutoplay();

			// start the autoplay timer each time the panel opens
			this.on('panelOpen.Autoplay.' + NS, function(event) {
				that.autoplayIndex = event.index;

				if (that.settings.autoplay === true) {
					// stop previous timers before starting a new one
					if (that.isTimerRunning === true)
						that.stopAutoplay();
					
					if (that.isTimerPaused === false)
						that.startAutoplay();
				}
			});

			// store the index of the previously opened panel
			this.on('panelsClose.Autoplay.' + NS, function(event) {
				if (event.previousIndex !== -1)
					that.autoplayIndex = event.previousIndex;
			});

			// store the index of the first panel from the new page
			this.on('pageScroll.Autoplay.' + NS, function(event) {
				that.autoplayIndex = that._getFirstPanelFromPage() - 1;
			});

			// on accordion hover stop the autoplay if autoplayOnHover is set to pause or stop
			this.on('mouseenter.Autoplay.' + NS, function(event) {
				if (that.settings.autoplay === true && that.isTimerRunning && (that.settings.autoplayOnHover === 'pause' || that.settings.autoplayOnHover === 'stop')) {
					that.stopAutoplay();
					that.isTimerPaused = true;
				}
			});

			// on accordion hover out restart the autoplay
			this.on('mouseleave.Autoplay.' + NS, function(event) {
				if (that.settings.autoplay === true && that.isTimerRunning === false && that.settings.autoplayOnHover !== 'stop') {
					that.startAutoplay();
					that.isTimerPaused = false;
				}
			});
		},

		startAutoplay: function() {
			var that = this;
			this.isTimerRunning = true;

			this.autoplayTimer = setTimeout(function() {
				// check if there is a stored index from which the autoplay needs to continue
				if (that.autoplayIndex !== -1)	{
					that.currentIndex = that.autoplayIndex;
					that.autoplayIndex = -1;
				}

				if (that.settings.autoplayDirection === 'normal') {
					that.nextPanel();
				} else if (that.settings.autoplayDirection === 'backwards') {
					that.previousPanel();
				}
			}, this.settings.autoplayDelay);
		},

		stopAutoplay: function() {
			this.isTimerRunning = false;

			clearTimeout(this.autoplayTimer);
		},

		destroyAutoplay: function() {
			clearTimeout(this.autoplayTimer);

			this.off('panelOpen.Autoplay.' + NS);
			this.off('pageScroll.Autoplay.' + NS);
			this.off('mouseenter.Autoplay.' + NS);
			this.off('mouseleave.Autoplay.' + NS);
		},

		autoplayDefaults: {
			autoplay: true,
			autoplayDelay: 5000,
			autoplayDirection: 'normal',
			autoplayOnHover: 'pause'
		}
	};

	$.GridAccordion.addModule('Autoplay', Autoplay, 'accordion');
	
})(window, jQuery);

/*
	Deep Linking module for Grid Accordion

	Adds the possibility to access the accordion using hyperlinks
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var DeepLinking = {

		initDeepLinking: function() {
			var that = this;

			// ignore the startPanel setting if there is a 
			if (this._parseHash(window.location.hash) !== false)
				this.options.startPanel = -1;

			// parse the initial hash
			this.on('init.DeepLinking.' + NS, function() {
				that._gotoHash(window.location.hash);
			});

			// check when the hash changes
			$(window).on('hashchange.DeepLinking.' + this.uniqueId + '.' + NS, function() {
				that._gotoHash(window.location.hash);
			});
		},

		_parseHash: function(hash) {
			if (hash !== '') {
				// eliminate the # symbol
				hash = hash.substring(1);
				
				// get the specified accordion id and panel id
				var values = hash.split('/'),
					panelId = values.pop(),
					accordionId = hash.slice(0, - panelId.toString().length - 1);

				if (this.$accordion.attr('id') === accordionId)
					return {'accordionID': accordionId, 'panelId': panelId};
			}

			return false;
		},

		_gotoHash: function(hash) {
			var result = this._parseHash(hash);

			if (result === false)
				return;

			var panelId = result.panelId,
				panelIdNumber = parseInt(panelId, 10);

			// check if the specified panel id is a number or string
			if (isNaN(panelIdNumber)) {
				// get the index of the panel based on the specified id
				var panelIndex = this.$accordion.find('.ga-panel#' + panelId).index();

				if (panelIndex !== -1)
					this.openPanel(panelIndex);
			} else {
				this.openPanel(panelIdNumber);
			}

		},

		destroyDeepLinking: function() {
			$(window).off('hashchange.DeepLinking.' + this.uniqueId + '.' + NS);
		}
	};

	$.GridAccordion.addModule('DeepLinking', DeepLinking, 'accordion');
	
})(window, jQuery);

/*
	JSON module for Grid Accordion

	Creates the panels based on JSON data
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var JSON = {

		JSONDataAttributesMap : {
			'width': 'data-width',
			'height': 'data-height',
			'depth': 'data-depth',
			'position': 'data-position',
			'horizontal': 'data-horizontal',
			'vertical': 'data-vertical',
			'showTransition': 'data-show-transition',
			'showOffset': 'data-show-offset',
			'showDelay': 'data-show-delay',
			'showDuration': 'data-show-duration',
			'showEasing': 'data-show-easing',
			'hideTransition': 'data-hide-transition',
			'hideOffset': 'data-',
			'hideDelay': 'data-hide-delay',
			'hideDuration': 'data-hide-duration',
			'hideEasing': 'data-hide-easing'
		},

		initJSON: function() {
			if (this.settings.JSONSource !== null)
				this.updateJSON();
		},

		updateJSON: function() {
			var that = this;

			// clear existing content and data
			this.removePanels();
			this.$panelsContainer.empty();
			this.off('JSONReady.' + NS);

			// parse the JSON data and construct the panels
			this.on('JSONReady.' + NS, function(event) {
				var jsonData = event.jsonData,
					panels = jsonData.accordion.panels;

				// check if lazy loading is enabled
				var lazyLoading = jsonData.accordion.lazyLoading;

				$.each(panels, function(index, value) {
					var panel = value,
						backgroundLink,
						backgroundOpenedLink;

					// create the panel element
					var panelElement = $('<div class="ga-panel"></div>').appendTo(that.$panelsContainer);

					// create the background image and link
					if (typeof panel.backgroundLink !== 'undefined') {
						backgroundLink = $('<a href="' + panel.backgroundLink.address + '"></a>');

						$.each(panel.backgroundLink, function(name, value) {
							if (name !== 'address')
								backgroundLink.attr(name, value);
						});

						backgroundLink.appendTo(panelElement);
					}

					if (typeof panel.background !== 'undefined') {
						var background = $('<img class="ga-background"/>');

						// check if the image will be lazy loaded
						if (typeof lazyLoading !== 'undefined')
							background.attr({'src': lazyLoading, 'data-src': panel.background.source});
						else
							background.attr({'src': panel.background.source});

						// check if a retina image was specified
						if (typeof panel.backgroundRetina !== 'undefined')
							background.attr({'data-retina': panel.backgroundRetina.source});

						$.each(panel.background, function(name, value) {
							if (name !== 'source')
								background.attr(name, value);
						});

						background.appendTo(typeof backgroundLink !== 'undefined' ? backgroundLink : panelElement);
					}

					// create the background image and link for the opened state of the panel
					if (typeof panel.backgroundOpenedLink !== 'undefined') {
						backgroundOpenedLink = $('<a href="' + panel.backgroundOpenedLink.address + '"></a>');

						$.each(panel.backgroundOpenedLink, function(name, value) {
							if (name !== 'address')
								backgroundOpenedLink.attr(name, value);
						});

						backgroundOpenedLink.appendTo(panelElement);
					}

					if (typeof panel.backgroundOpened !== 'undefined') {
						var backgroundOpened = $('<img class="ga-background-opened"/>');

						// check if the image will be lazy loaded
						if (typeof lazyLoading !== 'undefined')
							backgroundOpened.attr({'src': lazyLoading, 'data-src': panel.backgroundOpened.source});
						else
							backgroundOpened.attr({'src': panel.backgroundOpened.source});

						// check if a retina image was specified
						if (typeof panel.backgroundOpenedRetina !== 'undefined')
							backgroundOpened.attr({'data-retina': panel.backgroundOpenedRetina.source});

						$.each(panel.backgroundOpened, function(name, value) {
							if (name !== 'source')
								backgroundOpened.attr(name, value);
						});

						backgroundOpened.appendTo(typeof backgroundOpenedLink !== 'undefined' ? backgroundOpenedLink : panelElement);
					}

					// parse the layers recursively 
					if (typeof panel.layers !== 'undefined')
						that._parseLayers(panel.layers, panelElement);
				});

				that.update();
			});

			this._loadJSON();
		},

		_parseLayers: function(target, parent) {
			var that = this;

			$.each(target, function(index, value) {
				var layer = value,
					classes = '',
					dataAttributes = '';
				
				// parse the data specified for the layer and extract the classes and data attributes
				$.each(layer, function(name, value) {
					if (name === 'style') {
						var classList = value.split(' ');
						
						$.each(classList, function(classIndex, className) {
							classes += ' ga-' + className;
						});
					} else if (name !== 'content' && name !== 'layers'){
						dataAttributes += ' ' + that.JSONDataAttributesMap[name] + '="' + value + '"';
					}
				});

				// create the layer element
				var layerElement = $('<div class="ga-layer' + classes + '"' + dataAttributes + '></div>').appendTo(parent);

				// check if there are inner layers and parse those
				if (typeof value.layers !== 'undefined')
					that._parseLayers(value.layers, layerElement);
				else
					layerElement.html(layer.content);
			});
		},

		_loadJSON: function() {
			var that = this;

			if (this.settings.JSONSource.slice(-5) === '.json') {
				$.getJSON(this.settings.JSONSource, function(result) {
					that.trigger({type: 'JSONReady.' + NS, jsonData: result});
				});
			} else {
				var jsonData = $.parseJSON(this.settings.JSONSource);
				that.trigger({type: 'JSONReady.' + NS, jsonData: jsonData});
			}
		},

		destroyJSON: function() {
			this.off('JSONReady.' + NS);
		},

		JSONDefaults: {
			JSONSource: null
		}
	};

	$.GridAccordion.addModule('JSON', JSON, 'accordion');
	
})(window, jQuery);

/*
	Keyboard module for Grid Accordion

	Adds keyboard navigation support to the accordion
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var Keyboard = {

		initKeyboard: function() {
			var that = this,
				hasFocus = false;

			if (this.settings.keyboard === false)
				return;
			
			this.$accordion.on('focus.Keyboard.' + NS, function() {
				hasFocus = true;
			});

			this.$accordion.on('blur.Keyboard.' + NS, function() {
				hasFocus = false;
			});

			$(document).on('keydown.Keyboard.' + this.uniqueId + '.' + NS, function(event) {
				if (that.settings.keyboardOnlyOnFocus === true && hasFocus === false)
					return;

				if (event.which === 37) {
					if (that.settings.keyboardTarget === 'page')
						that.previousPage();
					else
						that.previousPanel();
				} else if (event.which === 39) {
					if (that.settings.keyboardTarget === 'page')
						that.nextPage();
					else
						that.nextPanel();
				} else if (event.which === 13) {
					var link = that.$accordion.find('.ga-panel').eq(that.currentIndex).children('a');

					if ( link.length !== 0 ) {
						link[0].click();
					}
				}
			});
		},

		destroyKeyboard: function() {
			this.$accordion.off('focus.Keyboard.' + NS);
			this.$accordion.off('blur.Keyboard.' + NS);
			$(document).off('keydown.Keyboard.' + this.uniqueId + '.' + NS);
		},

		keyboardDefaults: {
			keyboard: true,
			keyboardOnlyOnFocus: false,
			keyboardTarget: 'panel'
		}
	};

	$.GridAccordion.addModule('Keyboard', Keyboard, 'accordion');
	
})(window, jQuery);

/*
	Layers module for Grid Accordion

	Adds support for animated and static layers.
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace,

		// detect the current browser name and version
		userAgent = window.navigator.userAgent.toLowerCase(),
		rmsie = /(msie) ([\w.]+)/,
		browserDetect = rmsie.exec(userAgent) || [],
		browserName = browserDetect[1],
		browserVersion = browserDetect[2];

	var Layers = {

		initLayers: function() {
			
			// holds references to the layers
			this.layers = [];

			// reference to the panel object
			var that = this;

			// iterate through the panel's layer jQuery objects
			// and create Layer instances for each object
			this.$panel.find('.ga-layer').each(function() {
				var layer = new Layer($(this));
				that.layers.push(layer);
			});

			// check the index pf the panel against the index of the selected/opened panel
            if (this.index === this.accordion.getCurrentIndex())
                this._handleLayersInOpenedState();
            else
                this._handleLayersInClosedState();

			// listen when a panel is opened and when the panels are closed, and handle 
			// the layer's behavior based on the state of the panel
			this.accordion.on('panelOpen.Layers.' + this.panelNS, function(event) {
				if (event.index === event.previousIndex)
					return;

				if (that.index === event.previousIndex)
					that._handleLayersInClosedState();

				if (that.index === event.index)
					that._handleLayersInOpenedState();
			});

			this.accordion.on('panelsClose.Layers.' + this.panelNS, function(event) {
				if (that.index === event.previousIndex)
					that._handleLayersInClosedState();
			});
		},

		_handleLayersInOpenedState: function() {
			// show 'opened' layers and close 'closed' layers
			$.each(this.layers, function(index, layer) {
				if (layer.visibleOn === 'opened')
					layer.show();

				if (layer.visibleOn === 'closed')
					layer.hide();
			});
		},

		_handleLayersInClosedState: function() {
			// hide 'opened' layers and show 'closed' layers
			$.each(this.layers, function(index, layer) {
				if (layer.visibleOn === 'opened')
					layer.hide();

				if (layer.visibleOn === 'closed')
					layer.show();
			});
		},

		destroyLayers: function() {
			this.accordion.off('panelOpen.Layers.' + this.panelNS);
			this.accordion.off('panelsClose.Layers.' + this.panelNS);

			$.each(this.layers, function(index, layer) {
				layer.destroy();
			});
		}
	};

	var Layer = function(layer) {

		// reference to the layer jQuery object
		this.$layer = layer;

		// indicates when will the layer be visible
		// can be visible when the panel is opened, when the panel is closed or always
		this.visibleOn = 'n/a';

		// indicates whether a layer is currently visible (or hidden)
		this.isVisible = false;

		// indicates whether the layer was styled
		this.styled = false;

		this._init();
	};

	Layer.prototype = {

		_init: function() {
			// hide the layer by default
			this.$layer.css({'display': 'none'});

			if (this.$layer.hasClass('ga-opened')) {
				this.visibleOn = 'opened';
			} else if (this.$layer.hasClass('ga-closed')) {
				this.visibleOn = 'closed';
			} else {
				this.visibleOn = 'always';
				this.show();
			}
		},

		/*
			Set the size and position of the layer
		*/
		_setStyle: function() {
			this.styled = true;

			this.$layer.css({'display': 'block', 'margin': 0});

			// get the data attributes specified in HTML
			this.data = this.$layer.data();
			
			if (typeof this.data.width !== 'undefined')
				this.$layer.css('width', this.data.width);
			
			if (typeof this.data.height !== 'undefined')
				this.$layer.css('height', this.data.height);

			if (typeof this.data.depth !== 'undefined')
				this.$layer.css('z-index', this.data.depth);

			this.position = this.data.position ? (this.data.position).toLowerCase() : 'topleft';
			this.horizontalPosition = this.position.indexOf('right') !== -1 ? 'right' : 'left';
			this.verticalPosition = this.position.indexOf('bottom') !== -1 ? 'bottom' : 'top';

			this._setPosition();
		},

		/*
			Set the position of the layer
		*/
		_setPosition: function() {
			// set the horizontal position of the layer based on the data set
			if (typeof this.data.horizontal !== 'undefined') {
				if (this.data.horizontal === 'center') {
					// prevent content wrapping while setting the width
					if (this.$layer.attr('style').indexOf('width') === -1 && this.$layer.is('img') === false) {
						this.$layer.css('white-space', 'nowrap');
						this.$layer.css('width', this.$layer.outerWidth(true));
					}
					// center horizontally
					this.$layer.css({'marginLeft': 'auto', 'marginRight': 'auto', 'left': 0, 'right': 0});
				} else {
					this.$layer.css(this.horizontalPosition, this.data.horizontal);
				}
			} else {
				this.$layer.css(this.horizontalPosition, 0);
			}

			// set the vertical position of the layer based on the data set
			if (typeof this.data.vertical !== 'undefined') {
				if (this.data.vertical === 'center') {
					// prevent content wrapping while setting the height
					if (this.$layer.attr('style').indexOf('height') === -1 && this.$layer.is('img') === false) {
						this.$layer.css('white-space', 'nowrap');
						this.$layer.css('height', this.$layer.outerHeight(true));
					}
					// center vertically
					this.$layer.css({'marginTop': 'auto', 'marginBottom': 'auto', 'top': 0, 'bottom': 0});
				} else {
					this.$layer.css(this.verticalPosition, this.data.vertical);
				}
			} else {
				this.$layer.css(this.verticalPosition, 0);
			}
		},

		/*
			Show the layer
		*/
		show: function() {
			if (this.isVisible === true)
				return;

			this.isVisible = true;

			if (this.styled === false)
				this._setStyle();

			var that = this,
				offset = typeof this.data.showOffset !== 'undefined' ? this.data.showOffset : 50,
				duration = typeof this.data.showDuration !== 'undefined' ? this.data.showDuration / 1000 : 0.4,
				delay = typeof this.data.showDelay !== 'undefined' ? this.data.showDelay : 10;

			if (this.visibleOn === 'always' || browserName === 'msie' && parseInt(browserVersion, 10) <= 7) {
				this.$layer.css('display', 'block');
			} else if (browserName === 'msie' && parseInt(browserVersion, 10) <= 9) {
				this.$layer.stop()
							.delay(delay)
							.css({'opacity': 0, 'display': 'block'})
							.animate({'opacity': 1}, duration * 1000);
			} else {
				var start = {
						'opacity': 0, 'display': 'block'
					},
					transformValues = '';

				if (this.data.showTransition === 'left')
					transformValues = offset + 'px, 0';
				else if (this.data.showTransition === 'right')
					transformValues = '-' + offset + 'px, 0';
				else if (this.data.showTransition === 'up')
					transformValues = '0, ' + offset + 'px';
				else if (this.data.showTransition === 'down')
					transformValues = '0, -' + offset + 'px';

				start.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(' + transformValues + ', 0)' : 'translate(' + transformValues + ')';
				start['-webkit-transform'] = start['-ms-transform'] = start.transform;

				var target = {
					'opacity': 1,
					'transition': 'all ' + duration + 's'
				};

				if (typeof this.data.showTransition !== 'undefined') {
					target.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(0, 0, 0)' : 'translate(0, 0)';
					target['-webkit-transform'] = target['-ms-transform'] = target.transform;
				}

				// listen when the layer animation is complete
				this.$layer.on('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd', function() {
					that.$layer.off('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd');

					// remove the transition property in order to prevent other animations of the element
					that.$layer.css('transition', '');
					
					// remove transform property to prevent Safari 11 issue where layer text is disappearing after animation
					that.$layer.css('transform', '');
				});

				this.$layer.css(start)
							.delay(delay)
							.queue(function() {
								that.$layer.css(target);
								$(this).dequeue();
							});
			}
		},

		/*
			Hide the layer
		*/
		hide: function() {
			if (this.isVisible === false)
				return;

			this.isVisible = false;

			var that = this,
				offset = typeof this.data.hideOffset !== 'undefined' ? this.data.hideOffset : 50,
				duration = typeof this.data.hideDuration !== 'undefined' ? this.data.hideDuration / 1000 : 0.4,
				delay = typeof this.data.hideDelay !== 'undefined' ? this.data.hideDelay : 10;

			if (this.visibleOn === 'always' || browserName === 'msie' && parseInt(browserVersion, 10) <= 7) {
				this.$layer.css('display', 'none');
			} else if (browserName === 'msie' && parseInt(browserVersion, 10) <= 9) {
				this.$layer.stop()
							.delay(delay)
							.animate({'opacity': 0}, duration * 1000, function() {
								$(this).css({'display': 'none'});
							});
			} else {
				var target = {
						'opacity': 0,
						'transition': 'all ' + duration + 's'
					},
					transformValues = '';

				if (this.data.hideTransition === 'left')
					transformValues = '-' + offset + 'px, 0';
				else if (this.data.hideTransition === 'right')
					transformValues = offset + 'px, 0';
				else if (this.data.hideTransition === 'up')
					transformValues = '0, -' + offset + 'px';
				else if (this.data.hideTransition === 'down')
					transformValues = '0, ' + offset + 'px';

				target.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(' + transformValues + ', 0)' : 'translate(' + transformValues + ')';
				target['-webkit-transform'] = target['-ms-transform'] = target.transform;
				
				// listen when the layer animation is complete
				this.$layer.on('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd', function() {
					that.$layer.off('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd');

					// remove the transition property in order to prevent other animations of the element
					that.$layer.css('transition', '');

					// remove transform property to prevent Safari 11 issue where layer text is disappearing after animation
					that.$layer.css('transform', '');

					// hide the layer after transition
					if (that.isVisible === false)
						that.$layer.css('display', 'none');
				});

				this.$layer.delay(delay)
							.queue(function() {
								that.$layer.css(target);
								$(this).dequeue();
							});
			}
		},

		destroy: function() {
			this.$layer.attr('style', '');
		}
	};

	$.GridAccordion.addModule('Layers', Layers, 'panel');

	var LayersHelper = {

		checked: false,

		transforms: '',

		/*
			Check if 2D and 3D transforms are supported
			Inspired by Modernizr
		*/
		useTransforms: function() {
			if (this.checked === true)
				return this.transforms;

			this.checked = true;

			var div = document.createElement('div');

			// check if 3D transforms are supported
			if (typeof div.style.WebkitPerspective !== 'undefined' || typeof div.style.perspective !== 'undefined')
				this.transforms = '3d';

			// additional checks for Webkit
			if (this.transforms === '3d' && typeof div.styleWebkitPerspective !== 'undefined') {
				var style = document.createElement('style');
				style.textContent = '@media (transform-3d),(-webkit-transform-3d){#test-3d{left:9px;position:absolute;height:5px;margin:0;padding:0;border:0;}}';
				document.getElementsByTagName('head')[0].appendChild(style);

				div.id = 'test-3d';
				document.body.appendChild(div);

				if (!(div.offsetLeft === 9 && div.offsetHeight === 5))
					this.transforms = '';

				style.parentNode.removeChild(style);
				div.parentNode.removeChild(div);
			}

			// check if 2D transforms are supported
			if (this.transforms === '' && (typeof div.style['-webkit-transform'] !== 'undefined' || typeof div.style.transform !== 'undefined'))
				this.transforms = '2d';

			return this.transforms;
		}
	};
	
})(window, jQuery);

/*
	Lazy Loading module for Grid Accordion

	Loads marked images only when they are in the view
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var LazyLoading = {

		initLazyLoading: function() {
			// listen when the page changes or when the accordion is updated (because the number of visible panels might change)
			this.on('update.LazyLoading.' + NS, $.proxy(this._checkImages, this));
			this.on('pageScroll.LazyLoading.' + NS, $.proxy(this._checkImages, this));
		},

		_checkImages: function() {
			var that = this,
				firstVisiblePanel = this._getFirstPanelFromPage(),
				lastVisiblePanel = this._getLastPanelFromPage(),

				// get all panels that are currently visible
				panelsToCheck = lastVisiblePanel !== this.getTotalPanels() - 1 ? this.panels.slice(firstVisiblePanel, lastVisiblePanel + 1) : this.panels.slice(firstVisiblePanel);

			// loop through all the visible panels, verify if there are unloaded images, and load them
			$.each(panelsToCheck, function(index, element) {
				var $panel = element.$panel,
					panelIndex = element.getIndex();

				// if the panel is on the same row or column with the opened panel
				// add it to the list of tracked loading panels
				if (that.currentIndex !== -1 && $.inArray(panelIndex, that.loadingPanels) == -1 &&
					(panelIndex % that.columns === that.currentIndex % that.columns || Math.floor(panelIndex / that.columns) === Math.floor(that.currentIndex / that.columns)))
					that.loadingPanels.push(panelIndex);

				if (typeof $panel.attr('data-loaded') === 'undefined') {
					$panel.attr('data-loaded', true);

					$panel.find('img').each(function() {
						var image = $(this);
						that._loadImage(image, element);
					});
				}
			});
		},

		_loadImage: function(image, panel) {
			if (typeof image.attr('data-src') !== 'undefined') {
				// create a new image element
				var newImage = $(new Image());

				// copy the class(es) and inline style
				newImage.attr('class', image.attr('class'));
				newImage.attr('style', image.attr('style'));

				// copy the data attributes
				$.each(image.data(), function(name, value) {
					newImage.attr('data-' + name, value);
				});

				// copy the width and height attributes if they exist
				if (typeof image.attr('width') !== 'undefined')
					newImage.attr('width', image.attr('width'));

				if (typeof image.attr('height') !== 'undefined')
					newImage.attr('height', image.attr('height'));

				if (typeof image.attr('alt') !== 'undefined')
					newImage.attr('alt', image.attr('alt'));

				if (typeof image.attr('title') !== 'undefined')
					newImage.attr('title', image.attr('title'));
				
				// assign the source of the image
				newImage.attr('src', image.attr('data-src'));
				newImage.removeAttr('data-src');

				// add the new image in the same container and remove the older image
				newImage.insertAfter(image);
				image.remove();
			}
		},

		destroyLazyLoading: function() {
			this.off('update.LazyLoading.' + NS);
			this.off('pageScroll.LazyLoading.' + NS);
		}
	};

	$.GridAccordion.addModule('LazyLoading', LazyLoading, 'accordion');

})(window, jQuery);

/*
	MouseWheel module for Grid Accordion

	Adds mousewheel support for scrolling through pages or individual panels
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var MouseWheel = {

		mouseWheelEventType: '',

		allowMouseWheelScroll: true,

		initMouseWheel: function() {
			var that = this;

			if (this.settings.mouseWheel === false)
				return;

			// get the current mouse wheel event used in the browser
			if ('onwheel' in document)
				this.mouseWheelEventType = 'wheel';
			else if ('onmousewheel' in document)
				this.mouseWheelEventType = 'mousewheel';
			else if ('onDomMouseScroll' in document)
				this.mouseWheelEventType = 'DomMouseScroll';
			else if ('onMozMousePixelScroll' in document)
				this.mouseWheelEventType = 'MozMousePixelScroll';
			
			this.on(this.mouseWheelEventType + '.' + NS, function(event) {
				event.preventDefault();

				var eventObject = event.originalEvent,
					delta;

				// get the movement direction and speed indicated in the delta property
				if (typeof eventObject.detail !== 'undefined')
					delta = eventObject.detail;

				if (typeof eventObject.wheelDelta !== 'undefined')
					delta = eventObject.wheelDelta;

				if (typeof eventObject.deltaY !== 'undefined')
					delta = eventObject.deltaY * -1;

				if (that.allowMouseWheelScroll === true && Math.abs(delta) >= that.settings.mouseWheelSensitivity) {
					that.allowMouseWheelScroll = false;

					setTimeout(function() {
						that.allowMouseWheelScroll = true;
					}, 500);

					if (delta <= -that.settings.mouseWheelSensitivity)
						if (that.settings.mouseWheelTarget === 'page')
							that.nextPage();
						else
							that.nextPanel();
					else if (delta >= that.settings.mouseWheelSensitivity)
						if (that.settings.mouseWheelTarget === 'page')
							that.previousPage();
						else
							that.previousPanel();
				}
			});
		},

		destroyMouseWheel: function() {
			this.off(this.mouseWheelEventType + '.' + NS);
		},

		mouseWheelDefaults: {
			mouseWheel: true,
			mouseWheelSensitivity: 10,
			mouseWheelTarget: 'panel'
		}
	};

	$.GridAccordion.addModule('MouseWheel', MouseWheel, 'accordion');
	
})(window, jQuery);

/*
	Retina module for Grid Accordion

	Checks if a high resolution image was specified and replaces the default image with the high DPI one
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var Retina = {

		initRetina: function() {
			// check if the current display supports high PPI
			if (this._isRetina() === false)
				return;

			// check if the Lazy Loading module is enabled and overwrite its loading method
			// if not, check all images from the accordion
			if (typeof this._loadImage !== 'undefined') {
				this._loadImage = this._loadRetinaImage;
			} else {
				this.on('update.Retina.' + NS, $.proxy(this._checkRetinaImages, this));
			}
		},

		_isRetina: function() {
			if (window.devicePixelRatio >= 2)
				return true;

			if (window.matchMedia && (window.matchMedia("(-webkit-min-device-pixel-ratio: 2),(min-resolution: 2dppx)").matches))
				return true;

			return false;
		},

		_checkRetinaImages: function() {
			var that = this;

			this.off('update.Retina.' + NS);

			$.each(this.panels, function(index, element) {
				var $panel = element.$panel,
					panelIndex = element.getIndex();

				// if the panel is on the same row or column with the opened panel
				// add it to the list of tracked loading panels
				if (that.currentIndex !== -1 && $.inArray(panelIndex, that.loadingPanels) == -1 &&
					(panelIndex % that.columns === that.currentIndex % that.columns || Math.floor(panelIndex / that.columns) === Math.floor(that.currentIndex / that.columns)))
					that.loadingPanels.push(panelIndex);

				if (typeof $panel.attr('data-loaded') === 'undefined') {
					$panel.attr('data-loaded', true);

					$panel.find('img').each(function() {
						var image = $(this);
						that._loadRetinaImage(image, element);
					});
				}
			});
		},

		_loadRetinaImage: function(image, panel) {
			var retinaFound = false,
				newImagePath = '';

			// check if there is a retina image specified
			if (typeof image.attr('data-retina') !== 'undefined') {
				retinaFound = true;

				newImagePath = image.attr('data-retina');
				image.removeAttr('data-retina');
			}

			// check if there is a lazy loaded, non-retina, image specified
			if (typeof image.attr('data-src') !== 'undefined') {
				if (retinaFound === false)
					newImagePath = image.attr('data-src');

				image.removeAttr('data-src');
			}

			// replace the image
			if (newImagePath !== '') {
				// create a new image element
				var newImage = $(new Image());

				// copy the class(es) and inline style
				newImage.attr('class', image.attr('class'));
				newImage.attr('style', image.attr('style'));

				// copy the data attributes
				$.each(image.data(), function(name, value) {
					newImage.attr('data-' + name, value);
				});

				// copy the width and height attributes if they exist
				if (typeof image.attr('width') !== 'undefined')
					newImage.attr('width', image.attr('width'));

				if (typeof image.attr('height') !== 'undefined')
					newImage.attr('height', image.attr('height'));

				if (typeof image.attr('alt') !== 'undefined')
					newImage.attr('alt', image.attr('alt'));

				if (typeof image.attr('title') !== 'undefined')
					newImage.attr('title', image.attr('title'));

				// assign the source of the image
				newImage.attr('src', newImagePath);
				
				// add the new image in the same container and remove the older image
				newImage.insertAfter(image);
				image.remove();
			}
		},

		destroyRetina: function() {

		}
	};

	$.GridAccordion.addModule('Retina', Retina, 'accordion');
	
})(window, jQuery);

/*
	Smart Video module for Grid Accordion

	Adds automatic control for several video players and providers
*/
;(function(window, $) {

	"use strict";

	var NS = $.GridAccordion.namespace,

		// detect the current browser name and version
		userAgent = window.navigator.userAgent.toLowerCase();
	
	var SmartVideo = {

		initSmartVideo: function() {
			this._setupVideos();
		},

		_setupVideos: function() {
			var that = this;

			// find all video elements from the accordion, instantiate the SmartVideo for each of the video,
			// and trigger the set actions for the videos' events
			this.$accordion.find('.ga-video').each(function() {
				var video = $(this);

				video.videoController();

				video.on('videoPlay.SmartVideo', function() {
					if (that.settings.playVideoAction === 'stopAutoplay' && typeof that.stopAutoplay !== 'undefined') {
						that.stopAutoplay();
						that.settings.autoplay = false;
					}

					var eventObject = {type: 'videoPlay', video: video};
					that.trigger(eventObject);
					if ($.isFunction(that.settings.videoPlay))
						that.settings.videoPlay.call(that, eventObject);
				});

				video.on('videoPause.SmartVideo', function() {
					if (that.settings.pauseVideoAction === 'startAutoplay' && typeof that.startAutoplay !== 'undefined') {
						that.startAutoplay();
						that.settings.autoplay = true;
					}

					var eventObject = {type: 'videoPause', video: video};
					that.trigger(eventObject);
					if ($.isFunction(that.settings.videoPause))
						that.settings.videoPause.call(that, eventObject);
				});

				video.on('videoEnded.SmartVideo', function() {
					if (that.settings.endVideoAction === 'startAutoplay' && typeof that.startAutoplay !== 'undefined') {
						that.startAutoplay();
						that.settings.autoplay = true;
					} else if (that.settings.endVideoAction === 'nextPanel') {
						that.nextPanel();
					} else if (that.settings.endVideoAction === 'replayVideo') {
						video.videoController('replay');
					}

					var eventObject = {type: 'videoEnd', video: video};
					that.trigger(eventObject);
					if ($.isFunction(that.settings.videoEnd))
						that.settings.videoEnd.call(that, eventObject);
				});
			});
			
			// when a panel opens, check to see if there are video actions associated 
			// with the opening an closing of individual panels
			this.on('panelOpen.SmartVideo.' + NS, function(event) {
				// handle the video from the closed panel
				if (event.previousIndex !== -1 && that.$panelsContainer.find('.ga-panel').eq(event.previousIndex).find('.ga-video').length !== 0) {
					var previousVideo = that.$panelsContainer.find('.ga-panel').eq(event.previousIndex).find('.ga-video');

					if (that.settings.closePanelVideoAction === 'stopVideo')
						previousVideo.videoController('stop');
					else if (that.settings.closePanelVideoAction === 'pauseVideo')
						previousVideo.videoController('pause');
				}

				// handle the video from the opened panel
				if (that.$panelsContainer.find('.ga-panel').eq(event.index).find('.ga-video').length !== 0) {
					var currentVideo = that.$panelsContainer.find('.ga-panel').eq(event.index).find('.ga-video');

					if (that.settings.openPanelVideoAction === 'playVideo')
						currentVideo.videoController('play');
				}
			});

			// when all panels close, check to see if there is a video in the 
			// previously opened panel and handle it
			this.on('panelsClose.SmartVideo.' + NS, function(event) {
				// handle the video from the closed panel
				if (event.previousIndex !== -1 && that.$panelsContainer.find('.ga-panel').eq(event.previousIndex).find('.ga-video').length !== 0) {
					var previousVideo = that.$panelsContainer.find('.ga-panel').eq(event.previousIndex).find('.ga-video');

					if (that.settings.closePanelVideoAction === 'stopVideo')
						previousVideo.videoController('stop');
					else if (that.settings.closePanelVideoAction === 'pauseVideo')
						previousVideo.videoController('pause');
				}
			});
		},

		destroySmartVideo: function() {
			this.$accordion.find('.ga-video').each(function() {
				var video = $(this);

				video.off('SmartVideo');
				$(this).videoController('destroy');
			});

			this.off('panelOpen.SmartVideo.' + NS);
			this.off('panelsClose.SmartVideo.' + NS);
		},

		smartVideoDefaults: {
			openPanelVideoAction: 'playVideo',
			closePanelVideoAction: 'pauseVideo',
			playVideoAction: 'stopAutoplay',
			pauseVideoAction: 'none',
			endVideoAction: 'none',
			videoPlay: function() {},
			videoPause: function() {},
			videoEnd: function() {}
		}
	};

	$.GridAccordion.addModule('SmartVideo', SmartVideo, 'accordion');
	
})(window, jQuery);

// Video Controller jQuery plugin
// Creates a universal controller for multiple video types and providers
;(function( $ ) {

	"use strict";

// Check if an iOS device is used.
// This information is important because a video can not be
// controlled programmatically unless the user has started the video manually.
var	isIOS = window.navigator.userAgent.match( /(iPad|iPhone|iPod)/g ) ? true : false;

var VideoController = function( instance, options ) {
	this.$video = $( instance );
	this.options = options;
	this.settings = {};
	this.player = null;

	this._init();
};

VideoController.prototype = {

	_init: function() {
		this.settings = $.extend( {}, this.defaults, this.options );

		var that = this,
			players = $.VideoController.players,
			videoID = this.$video.attr( 'id' );

		// Loop through the available video players
		// and check if the targeted video element is supported by one of the players.
		// If a compatible type is found, store the video type.
		for ( var name in players ) {
			if ( typeof players[ name ] !== 'undefined' && players[ name ].isType( this.$video ) ) {
				this.player = new players[ name ]( this.$video );
				break;
			}
		}

		// Return if the player could not be instantiated
		if ( this.player === null ) {
			return;
		}

		// Add event listeners
		var events = [ 'ready', 'start', 'play', 'pause', 'ended' ];
		
		$.each( events, function( index, element ) {
			var event = 'video' + element.charAt( 0 ).toUpperCase() + element.slice( 1 );

			that.player.on( element, function() {
				that.trigger({ type: event, video: videoID });
				if ( $.isFunction( that.settings[ event ] ) ) {
					that.settings[ event ].call( that, { type: event, video: videoID } );
				}
			});
		});
	},
	
	play: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'playing' ) {
			return;
		}

		this.player.play();
	},
	
	stop: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'stopped' ) {
			return;
		}

		this.player.stop();
	},
	
	pause: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'paused' ) {
			return;
		}

		this.player.pause();
	},

	replay: function() {
		if ( isIOS === true && this.player.isStarted() === false ) {
			return;
		}
		
		this.player.replay();
	},

	on: function( type, callback ) {
		return this.$video.on( type, callback );
	},
	
	off: function( type ) {
		return this.$video.off( type );
	},

	trigger: function( data ) {
		return this.$video.triggerHandler( data );
	},

	destroy: function() {
		if ( this.player.isStarted() === true ) {
			this.stop();
		}

		this.player.off( 'ready' );
		this.player.off( 'start' );
		this.player.off( 'play' );
		this.player.off( 'pause' );
		this.player.off( 'ended' );

		this.$video.removeData( 'videoController' );
	},

	defaults: {
		videoReady: function() {},
		videoStart: function() {},
		videoPlay: function() {},
		videoPause: function() {},
		videoEnded: function() {}
	}
};

$.VideoController = {
	players: {},

	addPlayer: function( name, player ) {
		this.players[ name ] = player;
	}
};

$.fn.videoController = function( options ) {
	var args = Array.prototype.slice.call( arguments, 1 );

	return this.each(function() {
		// Instantiate the video controller or call a function on the current instance
		if ( typeof $( this ).data( 'videoController' ) === 'undefined' ) {
			var newInstance = new VideoController( this, options );

			// Store a reference to the instance created
			$( this ).data( 'videoController', newInstance );
		} else if ( typeof options !== 'undefined' ) {
			var	currentInstance = $( this ).data( 'videoController' );

			// Check the type of argument passed
			if ( typeof currentInstance[ options ] === 'function' ) {
				currentInstance[ options ].apply( currentInstance, args );
			} else {
				$.error( options + ' does not exist in videoController.' );
			}
		}
	});
};

// Base object for the video players
var Video = function( video ) {
	this.$video = video;
	this.player = null;
	this.ready = false;
	this.started = false;
	this.state = '';
	this.events = $({});

	this._init();
};

Video.prototype = {
	_init: function() {},

	play: function() {},

	pause: function() {},

	stop: function() {},

	replay: function() {},

	isType: function() {},

	isReady: function() {
		return this.ready;
	},

	isStarted: function() {
		return this.started;
	},

	getState: function() {
		return this.state;
	},

	on: function( type, callback ) {
		return this.events.on( type, callback );
	},
	
	off: function( type ) {
		return this.events.off( type );
	},

	trigger: function( data ) {
		return this.events.triggerHandler( data );
	}
};

// YouTube video
var YoutubeVideoHelper = {
	youtubeAPIAdded: false,
	youtubeVideos: []
};

var YoutubeVideo = function( video ) {
	this.init = false;
	var youtubeAPILoaded = window.YT && window.YT.Player;

	if ( typeof youtubeAPILoaded !== 'undefined' ) {
		Video.call( this, video );
	} else {
		YoutubeVideoHelper.youtubeVideos.push({ 'video': video, 'scope': this });
		
		if ( YoutubeVideoHelper.youtubeAPIAdded === false ) {
			YoutubeVideoHelper.youtubeAPIAdded = true;

			var tag = document.createElement( 'script' );
			tag.src = "//www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName( 'script' )[0];
			firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

			window.onYouTubePlayerAPIReady = function() {
				$.each( YoutubeVideoHelper.youtubeVideos, function( index, element ) {
					Video.call( element.scope, element.video );
				});
			};
		}
	}
};

YoutubeVideo.prototype = new Video();
YoutubeVideo.prototype.constructor = YoutubeVideo;
$.VideoController.addPlayer( 'YoutubeVideo', YoutubeVideo );

YoutubeVideo.isType = function( video ) {
	if ( video.is( 'iframe' ) ) {
		var src = video.attr( 'src' );

		if ( src.indexOf( 'youtube.com' ) !== -1 || src.indexOf( 'youtu.be' ) !== -1 ) {
			return true;
		}
	}

	return false;
};

YoutubeVideo.prototype._init = function() {
	this.init = true;
	this._setup();
};
	
YoutubeVideo.prototype._setup = function() {
	var that = this;

	// Get a reference to the player
	this.player = new YT.Player( this.$video[0], {
		events: {
			'onReady': function() {
				that.trigger({ type: 'ready' });
				that.ready = true;
			},
			
			'onStateChange': function( event ) {
				switch ( event.data ) {
					case YT.PlayerState.PLAYING:
						if (that.started === false) {
							that.started = true;
							that.trigger({ type: 'start' });
						}

						that.state = 'playing';
						that.trigger({ type: 'play' });
						break;
					
					case YT.PlayerState.PAUSED:
						that.state = 'paused';
						that.trigger({ type: 'pause' });
						break;
					
					case YT.PlayerState.ENDED:
						that.state = 'ended';
						that.trigger({ type: 'ended' });
						break;
				}
			}
		}
	});
};

YoutubeVideo.prototype.play = function() {
	var that = this;

	if ( this.ready === true ) {
		this.player.playVideo();
	} else {
		var timer = setInterval(function() {
			if ( that.ready === true ) {
				clearInterval( timer );
				that.player.playVideo();
			}
		}, 100 );
	}
};

YoutubeVideo.prototype.pause = function() {
	// On iOS, simply pausing the video can make other videos unresponsive
	// so we stop the video instead.
	if ( isIOS === true ) {
		this.stop();
	} else {
		this.player.pauseVideo();
	}
};

YoutubeVideo.prototype.stop = function() {
	this.player.seekTo( 1 );
	this.player.stopVideo();
	this.state = 'stopped';
};

YoutubeVideo.prototype.replay = function() {
	this.player.seekTo( 1 );
	this.player.playVideo();
};

YoutubeVideo.prototype.on = function( type, callback ) {
	var that = this;

	if ( this.init === true ) {
		Video.prototype.on.call( this, type, callback );
	} else {
		var timer = setInterval(function() {
			if ( that.init === true ) {
				clearInterval( timer );
				Video.prototype.on.call( that, type, callback );
			}
		}, 100 );
	}
};

// Vimeo video
var VimeoVideoHelper = {
	vimeoAPIAdded: false,
	vimeoVideos: []
};

var VimeoVideo = function( video ) {
	this.init = false;

	if ( typeof window.Vimeo !== 'undefined' ) {
		Video.call( this, video );
	} else {
		VimeoVideoHelper.vimeoVideos.push({ 'video': video, 'scope': this });

		if ( VimeoVideoHelper.vimeoAPIAdded === false ) {
			VimeoVideoHelper.vimeoAPIAdded = true;

			var tag = document.createElement('script');
			tag.src = "//player.vimeo.com/api/player.js";
			var firstScriptTag = document.getElementsByTagName( 'script' )[0];
			firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
		
			var checkVimeoAPITimer = setInterval(function() {
				if ( typeof window.Vimeo !== 'undefined' ) {
					clearInterval( checkVimeoAPITimer );
					
					$.each( VimeoVideoHelper.vimeoVideos, function( index, element ) {
						Video.call( element.scope, element.video );
					});
				}
			}, 100 );
		}
	}
};

VimeoVideo.prototype = new Video();
VimeoVideo.prototype.constructor = VimeoVideo;
$.VideoController.addPlayer( 'VimeoVideo', VimeoVideo );

VimeoVideo.isType = function( video ) {
	if ( video.is( 'iframe' ) ) {
		var src = video.attr('src');

		if ( src.indexOf( 'vimeo.com' ) !== -1 ) {
			return true;
		}
	}

	return false;
};

VimeoVideo.prototype._init = function() {
	this.init = true;
	this._setup();
};

VimeoVideo.prototype._setup = function() {
	var that = this;

	// Get a reference to the player
	this.player = new Vimeo.Player( this.$video[0] );
	
	that.ready = true;
	that.trigger({ type: 'ready' });
		
	that.player.on( 'play', function() {
		if ( that.started === false ) {
			that.started = true;
			that.trigger({ type: 'start' });
		}

		that.state = 'playing';
		that.trigger({ type: 'play' });
	});
		
	that.player.on( 'pause', function() {
		that.state = 'paused';
		that.trigger({ type: 'pause' });
	});
		
	that.player.on( 'ended', function() {
		that.state = 'ended';
		that.trigger({ type: 'ended' });
	});
};

VimeoVideo.prototype.play = function() {
	var that = this;

	if ( this.ready === true ) {
		this.player.play();
	} else {
		var timer = setInterval(function() {
			if ( that.ready === true ) {
				clearInterval( timer );
				that.player.play();
			}
		}, 100 );
	}
};

VimeoVideo.prototype.pause = function() {
	this.player.pause();
};

VimeoVideo.prototype.stop = function() {
	var that = this;
 
	this.player.setCurrentTime( 0 ).then( function() {
		that.player.pause();
		that.state = 'stopped';
	});
};

VimeoVideo.prototype.replay = function() {
	var that = this;
 
	this.player.setCurrentTime( 0 ).then( function() {
		that.player.play();
	});
};

VimeoVideo.prototype.on = function( type, callback ) {
	var that = this;

	if ( this.init === true ) {
		Video.prototype.on.call( this, type, callback );
	} else {
		var timer = setInterval(function() {
			if ( that.init === true ) {
				clearInterval( timer );
				Video.prototype.on.call( that, type, callback );
			}
		}, 100 );
	}
};

// HTML5 video
var HTML5Video = function( video ) {
	Video.call( this, video );
};

HTML5Video.prototype = new Video();
HTML5Video.prototype.constructor = HTML5Video;
$.VideoController.addPlayer( 'HTML5Video', HTML5Video );

HTML5Video.isType = function( video ) {
	if ( video.is( 'video' ) && video.hasClass( 'video-js' ) === false && video.hasClass( 'sublime' ) === false ) {
		return true;
	}

	return false;
};

HTML5Video.prototype._init = function() {
	var that = this;

	// Get a reference to the player
	this.player = this.$video[0];
	this.ready = true;

	this.player.addEventListener( 'play', function() {
		if ( that.started === false ) {
			that.started = true;
			that.trigger({ type: 'start' });
		}

		that.state = 'playing';
		that.trigger({ type: 'play' });
	});
	
	this.player.addEventListener( 'pause', function() {
		that.state = 'paused';
		that.trigger({ type: 'pause' });
	});
	
	this.player.addEventListener( 'ended', function() {
		that.state = 'ended';
		that.trigger({ type: 'ended' });
	});
};

HTML5Video.prototype.play = function() {
	this.player.play();
};

HTML5Video.prototype.pause = function() {
	this.player.pause();
};

HTML5Video.prototype.stop = function() {
	this.player.currentTime = 0;
	this.player.pause();
	this.state = 'stopped';
};

HTML5Video.prototype.replay = function() {
	this.player.currentTime = 0;
	this.player.play();
};

// VideoJS video
var VideoJSVideo = function( video ) {
	Video.call( this, video );
};

VideoJSVideo.prototype = new Video();
VideoJSVideo.prototype.constructor = VideoJSVideo;
$.VideoController.addPlayer( 'VideoJSVideo', VideoJSVideo );

VideoJSVideo.isType = function( video ) {
	if ( ( typeof video.attr( 'data-videojs-id' ) !== 'undefined' || video.hasClass( 'video-js' ) ) && typeof videojs !== 'undefined' ) {
		return true;
	}

	return false;
};

VideoJSVideo.prototype._init = function() {
	var that = this,
		videoID = this.$video.hasClass( 'video-js' ) ? this.$video.attr( 'id' ) : this.$video.attr( 'data-videojs-id' );
	
	this.player = videojs( videoID );

	this.player.ready(function() {
		that.ready = true;
		that.trigger({ type: 'ready' });

		that.player.on( 'play', function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});
		
		that.player.on( 'pause', function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});
		
		that.player.on( 'ended', function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

VideoJSVideo.prototype.play = function() {
	this.player.play();
};

VideoJSVideo.prototype.pause = function() {
	this.player.pause();
};

VideoJSVideo.prototype.stop = function() {
	this.player.currentTime( 0 );
	this.player.pause();
	this.state = 'stopped';
};

VideoJSVideo.prototype.replay = function() {
	this.player.currentTime( 0 );
	this.player.play();
};

// Sublime video
var SublimeVideo = function( video ) {
	Video.call( this, video );
};

SublimeVideo.prototype = new Video();
SublimeVideo.prototype.constructor = SublimeVideo;
$.VideoController.addPlayer( 'SublimeVideo', SublimeVideo );

SublimeVideo.isType = function( video ) {
	if ( video.hasClass( 'sublime' ) && typeof sublime !== 'undefined' ) {
		return true;
	}

	return false;
};

SublimeVideo.prototype._init = function() {
	var that = this;

	sublime.ready(function() {
		// Get a reference to the player
		that.player = sublime.player( that.$video.attr( 'id' ) );

		that.ready = true;
		that.trigger({ type: 'ready' });

		that.player.on( 'play', function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});

		that.player.on( 'pause', function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});

		that.player.on( 'stop', function() {
			that.state = 'stopped';
			that.trigger({ type: 'stop' });
		});

		that.player.on( 'end', function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

SublimeVideo.prototype.play = function() {
	this.player.play();
};

SublimeVideo.prototype.pause = function() {
	this.player.pause();
};

SublimeVideo.prototype.stop = function() {
	this.player.stop();
};

SublimeVideo.prototype.replay = function() {
	this.player.stop();
	this.player.play();
};

// JWPlayer video
var JWPlayerVideo = function( video ) {
	Video.call( this, video );
};

JWPlayerVideo.prototype = new Video();
JWPlayerVideo.prototype.constructor = JWPlayerVideo;
$.VideoController.addPlayer( 'JWPlayerVideo', JWPlayerVideo );

JWPlayerVideo.isType = function( video ) {
	if ( ( typeof video.attr( 'data-jwplayer-id' ) !== 'undefined' || video.hasClass( 'jwplayer' ) || video.find( "object[data*='jwplayer']" ).length !== 0 ) &&
		typeof jwplayer !== 'undefined') {
		return true;
	}

	return false;
};

JWPlayerVideo.prototype._init = function() {
	var that = this,
		videoID;

	if ( this.$video.hasClass( 'jwplayer' ) ) {
		videoID = this.$video.attr( 'id' );
	} else if ( typeof this.$video.attr( 'data-jwplayer-id' ) !== 'undefined' ) {
		videoID = this.$video.attr( 'data-jwplayer-id');
	} else if ( this.$video.find( "object[data*='jwplayer']" ).length !== 0 ) {
		videoID = this.$video.find( 'object' ).attr( 'id' );
	}

	// Get a reference to the player
	this.player = jwplayer( videoID );

	this.player.onReady(function() {
		that.ready = true;
		that.trigger({ type: 'ready' });
	
		that.player.onPlay(function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});

		that.player.onPause(function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});
		
		that.player.onComplete(function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

JWPlayerVideo.prototype.play = function() {
	this.player.play( true );
};

JWPlayerVideo.prototype.pause = function() {
	this.player.pause( true );
};

JWPlayerVideo.prototype.stop = function() {
	this.player.stop();
	this.state = 'stopped';
};

JWPlayerVideo.prototype.replay = function() {
	this.player.seek( 0 );
	this.player.play( true );
};

})( jQuery );

/*
	Swap Background module for Grid Accordion

	Allows a different image to be displayed as the panel's background
	when the panel is selected
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var SwapBackgroundHelper = {
		cssTransitions: null,

		cssTransitionEndEvents: 'transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd',

		checkCSSTransitions: function() {
			if (this.cssTransitions !== null)
				return this.cssTransitions;

			var element = document.body || document.documentElement,
				elementStyle = element.style;

			if (typeof elementStyle.transition !== 'undefined' ||
				typeof elementStyle.WebkitTransition !== 'undefined' ||
				typeof elementStyle.MozTransition !== 'undefined' ||
				typeof elementStyle.OTransition !== 'undefined')
				this.cssTransitions = true;
			else
				this.cssTransitions = false;

			return this.cssTransitions;
		}
	};

	var SwapBackground = {

		initSwapBackground: function() {
			var that = this;

			this.on('panelOpen.SwapBackground.' + NS, function(event) {
				// get the currently opened panel
				var panel = that.getPanelAt(event.index),
					background = panel.$panel.find('.ga-background'),
					opened = panel.$panel.find('.ga-background-opened');

				// fade in the opened content
				if (opened.length !== 0) {
					opened.css({'visibility': 'visible', 'opacity': 0});
					that._fadeInBackground(opened);

					if (background.length !== 0 && that.settings.fadeOutBackground === true)
						that._fadeOutBackground(background);
				}

				if (event.previousIndex !== -1 && event.index !== event.previousIndex) {
					// get the previously opened panel
					var previousPanel = that.getPanelAt(event.previousIndex),
						previousBackground = previousPanel.$panel.find('.ga-background'),
						previousOpened = previousPanel.$panel.find('.ga-background-opened');

					// fade out the opened content
					if (previousOpened.length !== 0) {
						that._fadeOutBackground(previousOpened);

						if (previousBackground.length !== 0 && that.settings.fadeOutBackground === true)
							that._fadeInBackground(previousBackground);
					}
				}
			});

			this.on('panelsClose.SwapBackground.' + NS, function(event) {
				if (event.previousIndex === -1)
					return;

				// get the previously opened panel
				var panel = that.getPanelAt(event.previousIndex),
					background = panel.$panel.find('.ga-background'),
					opened = panel.$panel.find('.ga-background-opened');

				// fade out the opened content
				if (opened.length !== 0) {
					that._fadeOutBackground(opened);

					if (background.length !== 0 && that.settings.fadeOutBackground === true)
						that._fadeInBackground(background);
				}
			});
		},

		_fadeInBackground: function(target) {
			var duration = this.settings.swapBackgroundDuration;

			target.css({'visibility': 'visible'});

			if (SwapBackgroundHelper.checkCSSTransitions() === true) {
				// remove the transition property after the animation completes
				target.off(SwapBackgroundHelper.cssTransitionEndEvents).on(SwapBackgroundHelper.cssTransitionEndEvents, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					target.off(SwapBackgroundHelper.cssTransitionEndEvents);
					target.css({'transition': ''});
				});

				setTimeout(function() {
					target.css({'opacity': 1, 'transition': 'all ' + duration / 1000 + 's'});
				}, 100);
			} else {
				target.stop().animate({'opacity': 1}, duration);
			}
		},

		_fadeOutBackground: function(target) {
			var duration = this.settings.swapBackgroundDuration;

			if (SwapBackgroundHelper.checkCSSTransitions() === true) {
				// remove the transition property and make the image invisible after the animation completes
				target.off(SwapBackgroundHelper.cssTransitionEndEvents).on(SwapBackgroundHelper.cssTransitionEndEvents, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					target.off(SwapBackgroundHelper.cssTransitionEndEvents);
					target.css({'visibility': 'hidden', 'transition': ''});
				});

				setTimeout(function() {
					target.css({'opacity': 0, 'transition': 'all ' + duration / 1000 + 's'});
				}, 100);
			} else {
				target.stop().animate({'opacity': 0}, duration, function() {
					target.css({'visibility': 'hidden'});
				});
			}
		},

		destroySwapBackground: function() {
			this.off('panelOpen.SwapBackground.' + NS);
			this.off('panelsClose.SwapBackground.' + NS);
		},

		swapBackgroundDefaults: {
			swapBackgroundDuration: 700,
			fadeOutBackground: false
		}
	};

	$.GridAccordion.addModule('SwapBackground', SwapBackground, 'accordion');
	
})(window, jQuery);

/*
	TouchSwipe module for Grid Accordion

	Adds touch swipe support for scrolling through pages
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var TouchSwipe = {

		touchStartPoint: {x: 0, y: 0},

		touchEndPoint: {x: 0, y: 0},

		touchDistance: {x: 0, y: 0},

		touchStartPosition: 0,

		isTouchMoving: false,

		touchSwipeEvents: { startEvent: '', moveEvent: '', endEvent: '' },

		// indicates whether the previous 'start' event was a 'touchstart' or 'mousedown'
		previousStartEvent: '',

		initTouchSwipe: function() {
			var that = this;

			// check if touch swipe is enabled
			if (this.settings.touchSwipe === false)
				return;

			this.touchSwipeEvents.startEvent = 'touchstart' + '.' + NS + ' mousedown' + '.' + NS;
			this.touchSwipeEvents.moveEvent = 'touchmove' + '.' + NS + ' mousemove' + '.' + NS;
			this.touchSwipeEvents.endEvent = 'touchend' + '.' + this.uniqueId + '.' + NS + ' mouseup' + '.' + this.uniqueId + '.' + NS;
			
			this.$panelsContainer.on(this.touchSwipeEvents.startEvent, $.proxy(this._onTouchStart, this));
			this.$panelsContainer.on( 'dragstart.' + NS, function( event ) {
				event.preventDefault();
			});

			// prevent 'click' events unless there is intention for a 'click'
			this.$panelsContainer.find( 'a' ).on( 'click.' + NS, function( event ) {
				if ( that.$accordion.hasClass('ga-swiping') ) {
					event.preventDefault();
				}
			});

			// prevent 'tap' events unless the panel is opened
			this.$panelsContainer.find( 'a' ).on( 'touchstart.' + NS, function( event ) {
				if ( $( this ).parents( '.ga-panel' ).hasClass( 'ga-opened' ) === false ) {
					event.preventDefault();
				}
			});

			this.on('update.TouchSwipe.' + NS, function() {
				// add or remove grabbing icon
				if (that.getTotalPages() > 1)
					that.$panelsContainer.addClass('ga-grab');
				else
					that.$panelsContainer.removeClass('ga-grab');
			});
		},

		_onTouchStart: function(event) {

			// return if a 'mousedown' event follows a 'touchstart' event
			if ( event.type === 'mousedown' && this.previousStartEvent === 'touchstart' ) {
				this.previousStartEvent = event.type;
				return;
			}
 
			// assign the new 'start' event
			this.previousStartEvent = event.type;

			var that = this,
				eventObject =  typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// disable dragging if the element is set to allow selections
			if ($(event.target).closest('.ga-selectable').length >= 1 || (typeof event.originalEvent.touches === 'undefined' && this.getTotalPages() === 1))
				return;

			// get the initial position of the mouse pointer and the initial position of the panels' container
			this.touchStartPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchStartPoint.y = eventObject.pageY || eventObject.clientY;
			this.touchStartPosition = parseInt(this.$panelsContainer.css(this.positionProperty), 10);

			// clear the distance
			this.touchDistance.x = this.touchDistance.y = 0;

			// listen for 'move' and 'end' events
			this.$panelsContainer.on(this.touchSwipeEvents.moveEvent, $.proxy(this._onTouchMove, this));
			$(document).on(this.touchSwipeEvents.endEvent, $.proxy(this._onTouchEnd, this));

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grab').addClass('ga-grabbing');
		},

		_onTouchMove: function(event) {
			var eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// indicate that the 'move' event is being fired
			this.isTouchMoving = true;

			if ( this.$accordion.hasClass('ga-swiping') === false ) {
				this.$accordion.addClass('ga-swiping');
			}

			// get the current position of the mouse pointer
			this.touchEndPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchEndPoint.y = eventObject.pageY || eventObject.clientY;

			// calculate the distance of the movement on both axis
			this.touchDistance.x = this.touchEndPoint.x - this.touchStartPoint.x;
			this.touchDistance.y = this.touchEndPoint.y - this.touchStartPoint.y;
			
			var distance = this.settings.orientation === 'horizontal' ? this.touchDistance.x : this.touchDistance.y,
				oppositeDistance = this.settings.orientation === 'horizontal' ? this.touchDistance.y : this.touchDistance.x;

			if (Math.abs(distance) > Math.abs(oppositeDistance))
				event.preventDefault();
			else
				return;
			
			// get the current position of panels' container
			var currentPanelsPosition = parseInt(this.$panelsContainer.css(this.positionProperty), 10),
				max = this.settings.orientation === 'horizontal' ? - this.totalPanelsSize + this.totalWidth : - this.totalPanelsSize + this.totalHeight;

			// reduce the movement speed if the panels' container is outside its bounds
			if ((currentPanelsPosition >= 0 && this.currentPage === 0) || (currentPanelsPosition <= max && this.currentPage === this.getTotalPages() - 1))
				distance = distance * 0.2;

			// move the panels' container
			this.$panelsContainer.css(this.positionProperty, this.touchStartPosition + distance);
		},

		_onTouchEnd: function(event) {
			var that = this;

			// remove the 'move' and 'end' listeners
			this.$panelsContainer.off(this.touchSwipeEvents.moveEvent);
			$(document).off(this.touchSwipeEvents.endEvent);

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grabbing').addClass('ga-grab');

			// check if there is intention for a tap
			if (this.isTouchMoving === false || this.isTouchMoving === true && Math.abs(this.touchDistance.x) < 10 && Math.abs(this.touchDistance.y) < 10) {
				var index = $(event.target).parents('.ga-panel').index();

				if (typeof event.originalEvent.touches !== 'undefined' && index !== this.currentIndex && index !== -1) {
					this.openPanel(index);
				}
			}

			// remove the 'ga-swiping' class with a delay, to allow
			// other event listeners (i.e. click) to check the existance
			// of the swipe event.
			if ( this.$accordion.hasClass('ga-swiping') ) {
				setTimeout(function() {
					that.$accordion.removeClass('ga-swiping');
				}, 100);
			}

			// return if there was no movement and re-enable click events on links
			if (this.isTouchMoving === false) {
				this.$accordion.removeClass('ga-swiping');
			}

			this.isTouchMoving = false;

			var noScrollAnimObj = {};
			noScrollAnimObj[this.positionProperty] = this.touchStartPosition;

			// set the accordion's page based on the distance of the movement and the accordion's settings
			if (this.settings.orientation === 'horizontal') {
				if (this.touchDistance.x > this.settings.touchSwipeThreshold) {
					if (this.currentPage > 0) {
						this.previousPage();
					} else {
						this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
					}
				} else if (- this.touchDistance.x > this.settings.touchSwipeThreshold) {
					if (this.currentPage < this.getTotalPages() - 1) {
						this.nextPage();
					} else {
						this.gotoPage(this.currentPage);
					}
				} else if (Math.abs(this.touchDistance.x) < this.settings.touchSwipeThreshold) {
					this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
				}
			} else if (this.settings.orientation === 'vertical') {
				if (this.touchDistance.y > this.settings.touchSwipeThreshold) {
					if (this.currentPage > 0) {
						this.previousPage();
					} else {
						this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
					}
				} else if (- this.touchDistance.y > this.settings.touchSwipeThreshold) {
					if (this.currentPage < this.getTotalPages() - 1) {
						this.nextPage();
					} else {
						this.$panelsContainer.animate(noScrollAnimObj, 300);
					}
				} else if (Math.abs(this.touchDistance.y) < this.settings.touchSwipeThreshold) {
					this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
				}
			}
		},

		destroyTouchSwipe: function() {
			this.$panelsContainer.off( 'dragstart.' + NS );
			this.$panelsContainer.find( 'a' ).off( 'click.' + NS );
			this.$panelsContainer.find( 'a' ).off( 'touchstart.' + NS );

			this.$panelsContainer.off(this.touchSwipeEvents.startEvent);
			this.$panelsContainer.off(this.touchSwipeEvents.moveEvent);
			$(document).off(this.touchSwipeEvents.endEvent);

			this.off('update.TouchSwipe.' + NS);

			this.$panelsContainer.removeClass('ga-grab');
		},

		touchSwipeDefaults: {
			touchSwipe: true,
			touchSwipeThreshold: 50
		}
	};

	$.GridAccordion.addModule('TouchSwipe', TouchSwipe, 'accordion');
	
})(window, jQuery);

/*
	XML module for Grid Accordion

	Creates the panels based on XML data
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace,

		// detect the current browser name and version
		userAgent = window.navigator.userAgent.toLowerCase(),
		rmsie = /(msie) ([\w.]+)/,
		browserDetect = rmsie.exec(userAgent) || [],
		browserName = browserDetect[1];

	var XML = {

		XMLDataAttributesMap : {
			'width': 'data-width',
			'height': 'data-height',
			'depth': 'data-depth',
			'position': 'data-position',
			'horizontal': 'data-horizontal',
			'vertical': 'data-vertical',
			'showTransition': 'data-show-transition',
			'showOffset': 'data-show-offset',
			'showDelay': 'data-show-delay',
			'showDuration': 'data-show-duration',
			'showEasing': 'data-show-easing',
			'hideTransition': 'data-hide-transition',
			'hideOffset': 'data-',
			'hideDelay': 'data-hide-delay',
			'hideDuration': 'data-hide-duration',
			'hideEasing': 'data-hide-easing'
		},

		initXML: function() {
			if (this.settings.XMLSource !== null)
				this.updateXML();
		},

		updateXML: function() {
			var that = this;

			// clear existing content and data
			this.removePanels();
			this.$panelsContainer.empty();
			this.off('XMLReady.' + NS);

			// parse the XML data and construct the panels
			this.on('XMLReady.' + NS, function(event) {
				var xmlData = $(event.xmlData);

				// check if lazy loading is enabled
				var lazyLoading = xmlData.find('accordion')[0].attributes.lazyLoading;

				if (typeof lazyLoading !== 'undefined')
					lazyLoading = lazyLoading.nodeValue;

				// parse the panel node
				xmlData.find('panel').each(function() {
					var xmlPanel = $(this),
						xmlBackground = xmlPanel.find('background'),
						xmlBackgroundRetina = xmlPanel.find('backgroundRetina'),
						xmlBackgroundLink = xmlPanel.find('backgroundLink'),
						xmlBackgroundOpened = xmlPanel.find('backgroundOpened'),
						xmlBackgroundOpenedRetina = xmlPanel.find('backgroundOpenedRetina'),
						xmlBackgroundOpenedLink = xmlPanel.find('backgroundOpenedLink'),
						xmlLayer = xmlPanel.find('layer'),
						backgroundLink,
						backgroundOpenedLink;

					// create the panel element
					var panel = $('<div class="ga-panel"></div>').appendTo(that.$panelsContainer);

					// create the background image and link
					if (xmlBackgroundLink.length >= 1) {
						backgroundLink = $('<a href="' + xmlBackgroundLink.text() + '"></a>');

						$.each(xmlBackgroundLink[0].attributes, function(index, attribute) {
							backgroundLink.attr(attribute.nodeName, attribute.nodeValue);
						});

						backgroundLink.appendTo(panel);
					}

					if (xmlBackground.length >= 1) {
						var background = $('<img class="ga-background"/>');

						if (typeof lazyLoading !== 'undefined')
							background.attr({'src': lazyLoading, 'data-src': xmlBackground.text()});
						else
							background.attr({'src': xmlBackground.text()});

						if (xmlBackgroundRetina.length >= 1)
							background.attr({'data-retina': xmlBackgroundRetina.text()});

						$.each(xmlBackground[0].attributes, function(index, attribute) {
							background.attr(attribute.nodeName, attribute.nodeValue);
						});

						background.appendTo(xmlBackgroundLink.length ? backgroundLink : panel);
					}

					// create the background image and link for the opened state of the panel
					if (xmlBackgroundOpenedLink.length >= 1) {
						backgroundOpenedLink = $('<a href="' + xmlBackgroundOpenedLink.text() + '"></a>');

						$.each(xmlBackgroundOpenedLink[0].attributes, function(index, attribute) {
							backgroundOpenedLink.attr(attribute.nodeName, attribute.nodeValue);
						});

						backgroundOpenedLink.appendTo(panel);
					}

					if (xmlBackgroundOpened.length >= 1) {
						var backgroundOpened = $('<img class="ga-background-opened"/>');

						if (typeof lazyLoading !== 'undefined')
							backgroundOpened.attr({'src': lazyLoading, 'data-src': xmlBackgroundOpened.text()});
						else
							backgroundOpened.attr({'src': xmlBackgroundOpened.text()});

						if (xmlBackgroundOpenedRetina.length >= 1)
							backgroundOpened.attr({'data-retina': xmlBackgroundOpenedRetina.text()});

						$.each(xmlBackgroundOpened[0].attributes, function(index, attribute) {
							backgroundOpened.attr(attribute.nodeName, attribute.nodeValue);
						});

						backgroundOpened.appendTo(xmlBackgroundOpenedLink.length ? backgroundOpenedLink : panel);
					}

					// parse the layer(s)
					if (xmlLayer.length >= 1)
						$.each(xmlLayer, function() {
							var xmlLayerItem = $(this),
								classes = '',
								dataAttributes = '',
								parent = panel;

							// parse the attributes specified for the layer and extract the classes and data attributes
							$.each(xmlLayerItem[0].attributes, function(attributeIndex, attribute) {
								if (attribute.nodeName === 'style') {
									var classList = attribute.nodeValue.split(' ');
									
									$.each(classList, function(classIndex, className) {
										classes += ' ga-' + className;
									});
								} else {
									dataAttributes += ' ' + that.XMLDataAttributesMap[attribute.nodeName] + '="' + attribute.nodeValue + '"';
								}
							});

							// create the layer element
							var layer = $('<div class="ga-layer' + classes + '"' + dataAttributes + '"></div>');

							// check if the layer is a container for other layers and if so
							// assign it a unique class in order to target it when the child layers
							// are added
							if (xmlLayerItem.find('layer').length >= 1) {
								var id = new Date().valueOf();

								xmlLayerItem.attr('parentID', id);
								layer.attr('class', layer.attr('class') + ' ' + id);
							} else {
								layer.html(xmlLayerItem.text());
							}

							// check if the XML parent element is a layer and 
							// find the corresponding HTML parent
							if (xmlLayerItem.parent().is('layer'))
								parent = panel.find('.' + xmlLayerItem.parent().attr('parentID'));

							// add the layer to its parent
							layer.appendTo(parent);
						});
				});

				that.update();
			});

			// load the XML
			this._loadXML();
		},

		_loadXML: function() {
			var that = this;

			if (this.settings.XMLSource.slice(-4) === '.xml') {
				$.ajax({type: 'GET',
						url: this.settings.XMLSource,
						dataType:  browserName === 'msie' ? 'text' : 'xml',
						success: function(result) {
							var xmlData;
							
							if (browserName === 'msie') {
								xmlData = new ActiveXObject('Microsoft.XMLDOM');
								xmlData.async = false;
								xmlData.loadXML(result);
							} else {
								xmlData = result;
							}
							
							that.trigger({type: 'XMLReady.' + NS, xmlData: xmlData});
						}
				});
			} else {
				var xmlData = $.parseXML(this.settings.XMLSource);
				that.trigger({type: 'XMLReady.' + NS, xmlData: xmlData});
			}
		},

		destroyXML: function() {
			this.off('XMLReady.' + NS);
		},

		XMLDefaults: {
			XMLSource: null
		}
	};

	$.GridAccordion.addModule('XML', XML, 'accordion');
	
})(window, jQuery);