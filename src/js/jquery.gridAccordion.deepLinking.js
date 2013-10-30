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