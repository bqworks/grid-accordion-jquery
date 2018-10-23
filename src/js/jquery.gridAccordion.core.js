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