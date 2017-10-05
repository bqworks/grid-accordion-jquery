/*
	Layers module for Grid Accordion

	Adds support for animated and static layers.
*/
;(function(window, $) {

	"use strict";
	
	var NS = $.GridAccordion.namespace,

		// detect the current browser name and version
		userAgent = window.navigator.userAgent.toLowerCase(),
		rmsie = /(msie) ([\w.]+)/,
		browserDetect = rmsie.exec(userAgent) || [],
		browserName = browserDetect[1],
		browserVersion = browserDetect[2];

	var Layers = {

		initLayers: function() {
			
			// holds references to the layers
			this.layers = [];

			// reference to the panel object
			var that = this;

			// iterate through the panel's layer jQuery objects
			// and create Layer instances for each object
			this.$panel.find('.ga-layer').each(function() {
				var layer = new Layer($(this));
				that.layers.push(layer);
			});

			// check the index pf the panel against the index of the selected/opened panel
            if (this.index === this.accordion.getCurrentIndex())
                this._handleLayersInOpenedState();
            else
                this._handleLayersInClosedState();

			// listen when a panel is opened and when the panels are closed, and handle 
			// the layer's behavior based on the state of the panel
			this.accordion.on('panelOpen.Layers.' + this.panelNS, function(event) {
				if (event.index === event.previousIndex)
					return;

				if (that.index === event.previousIndex)
					that._handleLayersInClosedState();

				if (that.index === event.index)
					that._handleLayersInOpenedState();
			});

			this.accordion.on('panelsClose.Layers.' + this.panelNS, function(event) {
				if (that.index === event.previousIndex)
					that._handleLayersInClosedState();
			});
		},

		_handleLayersInOpenedState: function() {
			// show 'opened' layers and close 'closed' layers
			$.each(this.layers, function(index, layer) {
				if (layer.visibleOn === 'opened')
					layer.show();

				if (layer.visibleOn === 'closed')
					layer.hide();
			});
		},

		_handleLayersInClosedState: function() {
			// hide 'opened' layers and show 'closed' layers
			$.each(this.layers, function(index, layer) {
				if (layer.visibleOn === 'opened')
					layer.hide();

				if (layer.visibleOn === 'closed')
					layer.show();
			});
		},

		destroyLayers: function() {
			this.accordion.off('panelOpen.Layers.' + this.panelNS);
			this.accordion.off('panelsClose.Layers.' + this.panelNS);

			$.each(this.layers, function(index, layer) {
				layer.destroy();
			});
		}
	};

	var Layer = function(layer) {

		// reference to the layer jQuery object
		this.$layer = layer;

		// indicates when will the layer be visible
		// can be visible when the panel is opened, when the panel is closed or always
		this.visibleOn = 'n/a';

		// indicates whether a layer is currently visible (or hidden)
		this.isVisible = false;

		// indicates whether the layer was styled
		this.styled = false;

		this._init();
	};

	Layer.prototype = {

		_init: function() {
			// hide the layer by default
			this.$layer.css({'display': 'none'});

			if (this.$layer.hasClass('ga-opened')) {
				this.visibleOn = 'opened';
			} else if (this.$layer.hasClass('ga-closed')) {
				this.visibleOn = 'closed';
			} else {
				this.visibleOn = 'always';
				this.show();
			}
		},

		/*
			Set the size and position of the layer
		*/
		_setStyle: function() {
			this.styled = true;

			this.$layer.css({'display': 'block', 'margin': 0});

			// get the data attributes specified in HTML
			this.data = this.$layer.data();
			
			if (typeof this.data.width !== 'undefined')
				this.$layer.css('width', this.data.width);
			
			if (typeof this.data.height !== 'undefined')
				this.$layer.css('height', this.data.height);

			if (typeof this.data.depth !== 'undefined')
				this.$layer.css('z-index', this.data.depth);

			this.position = this.data.position ? (this.data.position).toLowerCase() : 'topleft';
			this.horizontalPosition = this.position.indexOf('right') !== -1 ? 'right' : 'left';
			this.verticalPosition = this.position.indexOf('bottom') !== -1 ? 'bottom' : 'top';

			this._setPosition();
		},

		/*
			Set the position of the layer
		*/
		_setPosition: function() {
			// set the horizontal position of the layer based on the data set
			if (typeof this.data.horizontal !== 'undefined') {
				if (this.data.horizontal === 'center') {
					// prevent content wrapping while setting the width
					if (this.$layer.attr('style').indexOf('width') === -1 && this.$layer.is('img') === false) {
						this.$layer.css('white-space', 'nowrap');
						this.$layer.css('width', this.$layer.outerWidth(true));
					}
					// center horizontally
					this.$layer.css({'marginLeft': 'auto', 'marginRight': 'auto', 'left': 0, 'right': 0});
				} else {
					this.$layer.css(this.horizontalPosition, this.data.horizontal);
				}
			} else {
				this.$layer.css(this.horizontalPosition, 0);
			}

			// set the vertical position of the layer based on the data set
			if (typeof this.data.vertical !== 'undefined') {
				if (this.data.vertical === 'center') {
					// prevent content wrapping while setting the height
					if (this.$layer.attr('style').indexOf('height') === -1 && this.$layer.is('img') === false) {
						this.$layer.css('white-space', 'nowrap');
						this.$layer.css('height', this.$layer.outerHeight(true));
					}
					// center vertically
					this.$layer.css({'marginTop': 'auto', 'marginBottom': 'auto', 'top': 0, 'bottom': 0});
				} else {
					this.$layer.css(this.verticalPosition, this.data.vertical);
				}
			} else {
				this.$layer.css(this.verticalPosition, 0);
			}
		},

		/*
			Show the layer
		*/
		show: function() {
			if (this.isVisible === true)
				return;

			this.isVisible = true;

			if (this.styled === false)
				this._setStyle();

			var that = this,
				offset = typeof this.data.showOffset !== 'undefined' ? this.data.showOffset : 50,
				duration = typeof this.data.showDuration !== 'undefined' ? this.data.showDuration / 1000 : 0.4,
				delay = typeof this.data.showDelay !== 'undefined' ? this.data.showDelay : 10;

			if (this.visibleOn === 'always' || browserName === 'msie' && parseInt(browserVersion, 10) <= 7) {
				this.$layer.css('display', 'block');
			} else if (browserName === 'msie' && parseInt(browserVersion, 10) <= 9) {
				this.$layer.stop()
							.delay(delay)
							.css({'opacity': 0, 'display': 'block'})
							.animate({'opacity': 1}, duration * 1000);
			} else {
				var start = {
						'opacity': 0, 'display': 'block'
					},
					transformValues = '';

				if (this.data.showTransition === 'left')
					transformValues = offset + 'px, 0';
				else if (this.data.showTransition === 'right')
					transformValues = '-' + offset + 'px, 0';
				else if (this.data.showTransition === 'up')
					transformValues = '0, ' + offset + 'px';
				else if (this.data.showTransition === 'down')
					transformValues = '0, -' + offset + 'px';

				start.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(' + transformValues + ', 0)' : 'translate(' + transformValues + ')';
				start['-webkit-transform'] = start['-ms-transform'] = start.transform;

				var target = {
					'opacity': 1,
					'transition': 'all ' + duration + 's'
				};

				if (typeof this.data.showTransition !== 'undefined') {
					target.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(0, 0, 0)' : 'translate(0, 0)';
					target['-webkit-transform'] = target['-ms-transform'] = target.transform;
				}

				// listen when the layer animation is complete
				this.$layer.on('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd', function() {
					that.$layer.off('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd');

					// remove the transition property in order to prevent other animations of the element
					that.$layer.css('transition', '');
					
					// remove transform property to prevent Safari 11 issue where layer text is disappearing after animation
					that.$layer.css('transform', '');
				});

				this.$layer.css(start)
							.delay(delay)
							.queue(function() {
								that.$layer.css(target);
								$(this).dequeue();
							});
			}
		},

		/*
			Hide the layer
		*/
		hide: function() {
			if (this.isVisible === false)
				return;

			this.isVisible = false;

			var that = this,
				offset = typeof this.data.hideOffset !== 'undefined' ? this.data.hideOffset : 50,
				duration = typeof this.data.hideDuration !== 'undefined' ? this.data.hideDuration / 1000 : 0.4,
				delay = typeof this.data.hideDelay !== 'undefined' ? this.data.hideDelay : 10;

			if (this.visibleOn === 'always' || browserName === 'msie' && parseInt(browserVersion, 10) <= 7) {
				this.$layer.css('display', 'none');
			} else if (browserName === 'msie' && parseInt(browserVersion, 10) <= 9) {
				this.$layer.stop()
							.delay(delay)
							.animate({'opacity': 0}, duration * 1000, function() {
								$(this).css({'display': 'none'});
							});
			} else {
				var target = {
						'opacity': 0,
						'transition': 'all ' + duration + 's'
					},
					transformValues = '';

				if (this.data.hideTransition === 'left')
					transformValues = '-' + offset + 'px, 0';
				else if (this.data.hideTransition === 'right')
					transformValues = offset + 'px, 0';
				else if (this.data.hideTransition === 'up')
					transformValues = '0, -' + offset + 'px';
				else if (this.data.hideTransition === 'down')
					transformValues = '0, ' + offset + 'px';

				target.transform = LayersHelper.useTransforms() === '3d' ? 'translate3d(' + transformValues + ', 0)' : 'translate(' + transformValues + ')';
				target['-webkit-transform'] = target['-ms-transform'] = target.transform;
				
				// listen when the layer animation is complete
				this.$layer.on('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd', function() {
					that.$layer.off('transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd');

					// remove the transition property in order to prevent other animations of the element
					that.$layer.css('transition', '');

					// remove transform property to prevent Safari 11 issue where layer text is disappearing after animation
					that.$layer.css('transform', '');

					// hide the layer after transition
					if (that.isVisible === false)
						that.$layer.css('display', 'none');
				});

				this.$layer.delay(delay)
							.queue(function() {
								that.$layer.css(target);
								$(this).dequeue();
							});
			}
		},

		destroy: function() {
			this.$layer.attr('style', '');
		}
	};

	$.GridAccordion.addModule('Layers', Layers, 'panel');

	var LayersHelper = {

		checked: false,

		transforms: '',

		/*
			Check if 2D and 3D transforms are supported
			Inspired by Modernizr
		*/
		useTransforms: function() {
			if (this.checked === true)
				return this.transforms;

			this.checked = true;

			var div = document.createElement('div');

			// check if 3D transforms are supported
			if (typeof div.style.WebkitPerspective !== 'undefined' || typeof div.style.perspective !== 'undefined')
				this.transforms = '3d';

			// additional checks for Webkit
			if (this.transforms === '3d' && typeof div.styleWebkitPerspective !== 'undefined') {
				var style = document.createElement('style');
				style.textContent = '@media (transform-3d),(-webkit-transform-3d){#test-3d{left:9px;position:absolute;height:5px;margin:0;padding:0;border:0;}}';
				document.getElementsByTagName('head')[0].appendChild(style);

				div.id = 'test-3d';
				document.body.appendChild(div);

				if (!(div.offsetLeft === 9 && div.offsetHeight === 5))
					this.transforms = '';

				style.parentNode.removeChild(style);
				div.parentNode.removeChild(div);
			}

			// check if 2D transforms are supported
			if (this.transforms === '' && (typeof div.style['-webkit-transform'] !== 'undefined' || typeof div.style.transform !== 'undefined'))
				this.transforms = '2d';

			return this.transforms;
		}
	};
	
})(window, jQuery);