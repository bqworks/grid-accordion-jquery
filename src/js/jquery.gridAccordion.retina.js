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