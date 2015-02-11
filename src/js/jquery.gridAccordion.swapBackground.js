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