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