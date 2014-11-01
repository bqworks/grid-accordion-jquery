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