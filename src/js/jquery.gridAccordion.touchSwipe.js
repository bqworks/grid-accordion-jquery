/*
	TouchSwipe module for Grid Accordion

	Adds touch swipe support for scrolling through pages
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace;

	var TouchSwipe = {

		touchStartPoint: {x: 0, y: 0},

		touchEndPoint: {x: 0, y: 0},

		touchDistance: {x: 0, y: 0},

		touchStartPosition: 0,

		isTouchMoving: false,

		touchSwipeEvents: { startEvent: '', moveEvent: '', endEvent: '' },

		// indicates whether the previous 'start' event was a 'touchstart' or 'mousedown'
		previousStartEvent: '',

		initTouchSwipe: function() {
			var that = this;

			// check if touch swipe is enabled
			if (this.settings.touchSwipe === false)
				return;

			this.touchSwipeEvents.startEvent = 'touchstart' + '.' + NS + ' mousedown' + '.' + NS;
			this.touchSwipeEvents.moveEvent = 'touchmove' + '.' + NS + ' mousemove' + '.' + NS;
			this.touchSwipeEvents.endEvent = 'touchend' + '.' + this.uniqueId + '.' + NS + ' mouseup' + '.' + this.uniqueId + '.' + NS;
			
			this.$panelsContainer.on(this.touchSwipeEvents.startEvent, $.proxy(this._onTouchStart, this));
			this.$panelsContainer.on( 'dragstart.' + NS, function( event ) {
				event.preventDefault();
			});

			// prevent 'click' events unless there is intention for a 'click'
			this.$panelsContainer.find( 'a' ).on( 'click.' + NS, function( event ) {
				if ( that.$accordion.hasClass('ga-swiping') ) {
					event.preventDefault();
				}
			});

			// prevent 'tap' events unless the panel is opened
			this.$panelsContainer.find( 'a' ).on( 'touchstart.' + NS, function( event ) {
				if ( $( this ).parents( '.ga-panel' ).hasClass( 'ga-opened' ) === false ) {
					event.preventDefault();
				}
			});

			this.on('update.TouchSwipe.' + NS, function() {
				// add or remove grabbing icon
				if (that.getTotalPages() > 1)
					that.$panelsContainer.addClass('ga-grab');
				else
					that.$panelsContainer.removeClass('ga-grab');
			});
		},

		_onTouchStart: function(event) {

			// return if a 'mousedown' event follows a 'touchstart' event
			if ( event.type === 'mousedown' && this.previousStartEvent === 'touchstart' ) {
				this.previousStartEvent = event.type;
				return;
			}
 
			// assign the new 'start' event
			this.previousStartEvent = event.type;

			var that = this,
				eventObject =  typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// disable dragging if the element is set to allow selections
			if ($(event.target).closest('.ga-selectable').length >= 1 || (typeof event.originalEvent.touches === 'undefined' && this.getTotalPages() === 1))
				return;

			// get the initial position of the mouse pointer and the initial position of the panels' container
			this.touchStartPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchStartPoint.y = eventObject.pageY || eventObject.clientY;
			this.touchStartPosition = parseInt(this.$panelsContainer.css(this.positionProperty), 10);

			// clear the distance
			this.touchDistance.x = this.touchDistance.y = 0;

			// listen for 'move' and 'end' events
			this.$panelsContainer.on(this.touchSwipeEvents.moveEvent, $.proxy(this._onTouchMove, this));
			$(document).on(this.touchSwipeEvents.endEvent, $.proxy(this._onTouchEnd, this));

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grab').addClass('ga-grabbing');
		},

		_onTouchMove: function(event) {
			var eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// indicate that the 'move' event is being fired
			this.isTouchMoving = true;

			if ( this.$accordion.hasClass('ga-swiping') === false ) {
				this.$accordion.addClass('ga-swiping');
			}

			// get the current position of the mouse pointer
			this.touchEndPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchEndPoint.y = eventObject.pageY || eventObject.clientY;

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
			var that = this;

			// remove the 'move' and 'end' listeners
			this.$panelsContainer.off(this.touchSwipeEvents.moveEvent);
			$(document).off(this.touchSwipeEvents.endEvent);

			// swap grabbing icons
			this.$panelsContainer.removeClass('ga-grabbing').addClass('ga-grab');

			// check if there is intention for a tap
			if (this.isTouchMoving === false || this.isTouchMoving === true && Math.abs(this.touchDistance.x) < 10 && Math.abs(this.touchDistance.y) < 10) {
				var index = $(event.target).parents('.ga-panel').index();

				if (typeof event.originalEvent.touches !== 'undefined' && index !== this.currentIndex && index !== -1) {
					this.openPanel(index);
				}
			}

			// remove the 'ga-swiping' class with a delay, to allow
			// other event listeners (i.e. click) to check the existance
			// of the swipe event.
			if ( this.$accordion.hasClass('ga-swiping') ) {
				setTimeout(function() {
					that.$accordion.removeClass('ga-swiping');
				}, 100);
			}

			// return if there was no movement and re-enable click events on links
			if (this.isTouchMoving === false) {
				this.$accordion.removeClass('ga-swiping');
			}

			this.isTouchMoving = false;

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
			this.$panelsContainer.off( 'dragstart.' + NS );
			this.$panelsContainer.find( 'a' ).off( 'click.' + NS );
			this.$panelsContainer.find( 'a' ).off( 'touchstart.' + NS );

			this.$panelsContainer.off(this.touchSwipeEvents.startEvent);
			this.$panelsContainer.off(this.touchSwipeEvents.moveEvent);
			$(document).off(this.touchSwipeEvents.endEvent);

			this.off('update.TouchSwipe.' + NS);

			this.$panelsContainer.removeClass('ga-grab');
		},

		touchSwipeDefaults: {
			touchSwipe: true,
			touchSwipeThreshold: 50
		}
	};

	$.GridAccordion.addModule('TouchSwipe', TouchSwipe, 'accordion');
	
})(window, jQuery);