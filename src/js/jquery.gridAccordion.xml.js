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