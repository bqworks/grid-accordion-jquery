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

			$.extend(this.settings, this.keyboardDefaults, this.options);

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
					that.previousPanel();
				} else if (event.which === 39) {
					that.nextPanel();
				} else if (event.which === 13) {
					that.$accordion.find('.ga-panel').eq(that.currentIndex).children('a')[0].click();
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
			keyboardOnlyOnFocus: false
		}
	};

	$.GridAccordion.addModule('Keyboard', Keyboard, 'accordion');
	
})(window, jQuery);