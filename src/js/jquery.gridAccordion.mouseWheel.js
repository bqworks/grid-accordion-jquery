/*
	MouseWheel module for Grid Accordion

	Adds mousewheel support for scrolling through pages or individual panels
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var MouseWheel = {

		mouseWheelEventType: '',

		initMouseWheel: function() {
			var that = this;

			$.extend(this.settings, this.mouseWheelDefaults, this.options);

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

				// scroll the accordion as indicated by the mouse wheel input
				// but don't allow the scroll if another scroll is in progress
				if (that.isPageScrolling === false) {
					if (delta <= -that.settings.mouseWheelSensitivity)
						if (that.settings.mouseWheelTarget == 'page')
							that.nextPage();
						else
							that.nextPanel();
					else if (delta >= that.settings.mouseWheelSensitivity)
						if (that.settings.mouseWheelTarget == 'page')
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
			mouseWheelSensitivity: 50,
			mouseWheelTarget: 'panel'
		}
	};

	$.GridAccordion.addModule('MouseWheel', MouseWheel, 'accordion');
	
})(window, jQuery);