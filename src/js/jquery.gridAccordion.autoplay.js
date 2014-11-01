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