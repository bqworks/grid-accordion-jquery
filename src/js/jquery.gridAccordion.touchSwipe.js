/*
	TouchSwipe module for Grid Accordion

	Adds touch swipe support for scrolling through pages
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var TouchSwipe = {

		isTouchSupport: false,

		touchStartPoint: {x: 0, y: 0},

		touchEndPoint: {x: 0, y: 0},

		touchDistance: {x: 0, y: 0},

		touchStartPosition: 0,

		isTouchMoving: false,

		initTouchSwipe: function() {
			var that = this;

			$.extend(this.settings, this.touchSwipeDefaults, this.options);

			// check if touch swipe is enabled
			if (this.settings.touchSwipe === false)
				return;

			// check if there is touch support
			this.isTouchSupport = 'ontouchstart' in window;

			// listen to touch events or, if touch support doesn't exist, listen to mouse events
			var startEvent = this.isTouchSupport ? 'touchstart' : 'mousedown';
			this.$panelsContainer.on(startEvent + '.' + NS, $.proxy(this._onTouchStart, this));
			
			this.on('update.TouchSwipe.' + NS, function() {
				// remove mouse events on panels
				if (that.isTouchSupport)
					$.each(that.panels, function(index, element) {
						var panel = element;
						panel.off('panelMouseOver.' + NS);
						panel.off('panelMouseOut.' + NS);
						panel.off('panelClick.' + NS);
						panel.off('panelMouseDown.' + NS);
					});

				// add or remove grabbing icon
				if (that.getTotalPages() > 1)
					that.$panelsContainer.addClass('ga-grab');
				else
					that.$panelsContainer.removeClass('ga-grab');
			});
		},

		_onTouchStart: function(event) {
			// disable dragging if the element is set to allow selections
			if ($(event.target).closest('.ga-selectable').length >= 1 || (this.isTouchSupport === false && this.getTotalPages() === 1))
				return;

			// prevent default behavior only for mouse events
			if (this.isTouchSupport === false)
				event.preventDefault();

			var that = this,
				eventObject = this.isTouchSupport ? event.originalEvent.touches[0] : event.originalEvent,
				moveEvent = this.isTouchSupport ? 'touchmove' : 'mousemove',
				endEvent = this.isTouchSupport ? 'touchend' : 'mouseup';

			// get the initial position of the mouse pointer and the initial position of the panels' container
			this.touchStartPoint.x = eventObject.pageX;
			this.touchStartPoint.y = eventObject.pageY;
			this.touchStartPosition = parseInt(this.$panelsContainer.css(this.positionProperty), 10);

			// clear the distance
			this.touchDistance.x = this.touchDistance.y = 0;

			// listen for move and end events
			this.$panelsContainer.on(moveEvent + '.' + NS, $.proxy(this._onTouchMove, this));
			$(document).on(endEvent + '.' + this.uniqueId + '.' + NS, $.proxy(this._onTouchEnd, this));

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grab').addClass('ga-grabbing');

			// disable click events on links
			$(event.target).parents('.ga-panel').find('a').addClass('ga-swiping').one('click.TouchSwipe', function(event) {
				event.preventDefault();
			});
		},

		_onTouchMove: function(event) {
			var eventObject = this.isTouchSupport ? event.originalEvent.touches[0] : event.originalEvent;

			// indicate that the move event is being fired
			this.isTouchMoving = true;

			// get the current position of the mouse pointer
			this.touchEndPoint.x = eventObject.pageX;
			this.touchEndPoint.y = eventObject.pageY;

			// calculate the distance of the movement on both axis
			this.touchDistance.x = this.touchEndPoint.x - this.touchStartPoint.x;
			this.touchDistance.y = this.touchEndPoint.y - this.touchStartPoint.y;
			
			var distance = this.settings.orientation === 'horizontal' ? this.touchDistance.x : this.touchDistance.y,
				oppositeDistance = this.settings.orientation === 'horizontal' ? this.touchDistance.y : this.touchDistance.x;

			if (Math.abs(distance) > Math.abs(oppositeDistance))
				event.preventDefault();
			else
				return;
			
			// get the current position of panels' container
			var currentPanelsPosition = parseInt(this.$panelsContainer.css(this.positionProperty), 10),
				max = this.settings.orientation === 'horizontal' ? - this.totalPanelsSize + this.totalWidth : - this.totalPanelsSize + this.totalHeight;

			// reduce the movement speed if the panels' container is outside its bounds
			if ((currentPanelsPosition >= 0 && this.currentPage === 0) || (currentPanelsPosition <= max && this.currentPage === this.getTotalPages() - 1))
				distance = distance * 0.2;

			// move the panels' container
			this.$panelsContainer.css(this.positionProperty, this.touchStartPosition + distance);
		},

		_onTouchEnd: function(event) {
			// remove the move and end listeners
			var moveEvent = this.isTouchSupport ? 'touchmove' : 'mousemove',
				endEvent = this.isTouchSupport ? 'touchend' : 'mouseup';

			this.$panelsContainer.off(moveEvent + '.' + NS);
			$(document).off(endEvent + '.' + this.uniqueId + '.' + NS);

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grabbing').addClass('ga-grab');

			// check if there is intention for a tap
			if (this.isTouchSupport === true && (this.isTouchMoving === false || this.isTouchMoving === true && Math.abs(this.touchDistance.x) < 10 && Math.abs(this.touchDistance.y) < 10)) {
				var index = $(event.target).parents('.ga-panel').index();

				if (index !== this.currentIndex && index !== -1) {
					this.openPanel(index);
				} else {
					// re-enable click events on links
					$(event.target).parents('.ga-panel').find('a').removeClass('ga-swiping').off('click.TouchSwipe');
				}

				return;
			}

			// return if there was no movement and re-enable click events on links
			if (this.isTouchMoving === false) {
				$(event.target).parents('.ga-panel').find('a').removeClass('ga-swiping').off('click.TouchSwipe');
				return;
			}

			this.isTouchMoving = false;

			// remove the 'ga-swiping' class but with a delay
			// because there might be other event listeners that check
			// the existence of this class, and this class should still be 
			// applied for those listeners, since there was a swipe event
			setTimeout(function() {
				$(event.target).parents('.ga-panel').find('a').removeClass('ga-swiping');
			}, 1);

			var noScrollAnimObj = {};
			noScrollAnimObj[this.positionProperty] = this.touchStartPosition;

			// set the accordion's page based on the distance of the movement and the accordion's settings
			if (this.settings.orientation === 'horizontal') {
				if (this.touchDistance.x > this.settings.touchSwipeThreshold) {
					if (this.currentPage > 0) {
						this.previousPage();
					} else {
						this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
					}
				} else if (- this.touchDistance.x > this.settings.touchSwipeThreshold) {
					if (this.currentPage < this.getTotalPages() - 1) {
						this.nextPage();
					} else {
						this.gotoPage(this.currentPage);
					}
				} else if (Math.abs(this.touchDistance.x) < this.settings.touchSwipeThreshold) {
					this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
				}
			} else if (this.settings.orientation === 'vertical') {
				if (this.touchDistance.y > this.settings.touchSwipeThreshold) {
					if (this.currentPage > 0) {
						this.previousPage();
					} else {
						this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
					}
				} else if (- this.touchDistance.y > this.settings.touchSwipeThreshold) {
					if (this.currentPage < this.getTotalPages() - 1) {
						this.nextPage();
					} else {
						this.$panelsContainer.animate(noScrollAnimObj, 300);
					}
				} else if (Math.abs(this.touchDistance.y) < this.settings.touchSwipeThreshold) {
					this.$panelsContainer.stop().animate(noScrollAnimObj, 300);
				}
			}
		},

		destroyTouchSwipe: function() {
			var startEvent = this.isTouchSupport ? 'touchstart' : 'mousedown',
				endEvent = this.isTouchSupport ? 'touchend' : 'mouseup',
				moveEvent = this.isTouchSupport ? 'touchmove' : 'mousemove';

			this.$panelsContainer.off(startEvent + '.' + NS);
			$(document).off(endEvent + '.' + this.uniqueId + '.' + NS);
			this.$panelsContainer.off(moveEvent + '.' + NS);
			this.off('update.TouchSwipe.' + NS);
		},

		touchSwipeDefaults: {
			touchSwipe: true,
			touchSwipeThreshold: 50
		}
	};

	$.GridAccordion.addModule('TouchSwipe', TouchSwipe, 'accordion');
	
})(window, jQuery);