# JavaScript API #

## 1. Properties ##

Grid Accordion can be customized using several properties which are described below. These properties must be passed to the accordion when the accordion is instantiated.

*Example:*

```
$('#my-accordion').gridAccordion({
	width: 960, 
	height: 800,
	responsiveMode: 'custom',
	columns: 3,
	rows: 3,
	startPanel: 3,
	closePanelsOnMouseOut: false,
	shadow: false,
	panelDistance: 10,
	autoplay: false,
	mouseWheel: false
});
```

#### width ####

Sets the width of the accordion. Can be set to a fixed value, like 900 (indicating 900 pixels), or to a percentage value, like '100%'. It's important to note that percentage values need to be specified inside quotes. For fixed values, the quotes are not necessary. Also, please note that, in order to make the accordion responsive, it's not necessary to use percentage values. More about this in the description of the 'responsive' property.

*Default value:* 800

#### height ####

Sets the height of the accordion. The same rules available for the 'width' property also apply for the 'height' property.

*Default value:* 400

#### responsive ####

Makes the accordion responsive. The accordion can be responsive even if the 'width' and/or 'height' properties are set to fixed values. In this situation, 'width' and 'height' will act as the maximum width and height of the accordion.

*Default value:* true

#### responsiveMode ####

Sets the responsive mode of the accordion. Possible values are 'auto' and 'custom'. 'auto' resizes the accordion and all of its elements (e.g., layers, videos) automatically, while 'custom' resizes only the accordion container and panels, and you are given flexibility over the way inner elements (e.g., layers, videos) will respond to smaller sizes. For example, you could use CSS media queries to define different text sizes or to hide certain elements when the accordion becomes smaller, ensuring that all content remains readable without having to zoom in.

It's important to note that, if 'auto' responsiveness is used, the 'width' and 'height' need to be set to fixed values, so that the accordion can calculate correctly how much it needs to scale.

*Default value:* 'auto'

#### aspectRatio ####

Sets the aspect ratio of the accordion. The accordion will set its height depending on what value its width has, so that this ratio is maintained. For this reason, the set 'height' might be overridden.

This property can be used only when 'responsiveMode' is set to 'custom'. When it's set to 'auto', the 'aspectRatio' needs to remain -1.

*Default value:* -1 (determined by the ratio of the set 'width' and 'height')

#### orientation ####

Sets the orientation of the panels. Possible values are 'horizontal' and 'vertical'.

*Default value:* 'horizontal'

#### columns ####

Sets the number of columns. If it's set to -1, the number of columns will be determined automatically, based on the number of rows.

*Default value:* 4

#### rows ####

Sets the number of rows. If it's set to -1, the number of rows will be determined automatically, based on the number of columns.

*Default value:* 3

Note: The 'columns' the 'rows' can't be set to -1 at the same time; one must have a specific value. Also, when either is set to -1, all the panels will be contained in a single page.

#### startPanel ####

Indicates which panel will be opened when the accordion loads (0 for the first panel, 1 for the second panel, etc.). If set to -1, no panel will be opened.

*Default value:* -1

#### openedPanelWidth ####
Sets the width of the opened panel. Possible values are: 'max', which will open the panel to its maximum width, so that all the inner content is visible, a percentage value, like '50%', which indicates the percentage of the total width of the accordion, a fixed value, or 'auto'. If it's set to 'auto', all panels opened on the vertical axis will have the same width without any of these panels to open more than their size.

*Default value:* 'max'

#### openedPanelHeight ####
Sets the height of the opened panel. Possible values are: 'max', which will open the panel to its maximum height, so that all the inner content is visible, a percentage value, like '50%', which indicates the percentage of the total height of the accordion, a fixed value, or 'auto'. If it's set to 'auto', all panels opened on the horizontal axis will have the same height without any of these panels to open more than their size.

*Default value:* 'max'

#### maxOpenedPanelWidth ####

Sets the maximum allowed width of the opened panel. This should be used when the 'openedPanelWidth' is set to 'max', because sometimes the maximum width of the panel might be too big and we want to set a limit. The property can be set to a percentage (of the total width of the accordion) or to a fixed value.

*Default value:* '70%'

#### maxOpenedPanelHeight ####

Sets the maximum allowed height of the opened panel. This should be used when the 'openedPanelWidth' is set to 'max', because sometimes the maximum height of the panel might be too big and we want to set a limit. The property can be set to a percentage (of the total height of the accordion) or to a fixed value.

*Default value:* '70%'

#### openPanelOn ####

If set to 'hover', the panels will be opened by moving the mouse pointer over them; if set to 'click', the panels will open when clicked.  Can also be set to 'never' to disable the opening of the panels.

*Default value:* 'hover'

#### closePanelsOnMouseOut ####

Determines whether the opened panel closes or remains open when the mouse pointer is moved away.

*Default value:* true

#### mouseDelay ####

Sets the delay in milliseconds between the movement of the mouse pointer and the opening of the panel. Setting a delay ensures that panels are not opened if the mouse pointer only moves over them without an intent to open the panel.

*Default value:* 200

#### panelDistance ####

Sets the distance between consecutive panels. Can be set to a percentage or fixed value.

*Default value:* 10

#### openPanelDuration ####

Determines the duration in milliseconds for the opening of a panel.

*Default value:* 700

#### closePanelDuration ####

Determines the duration in milliseconds for the closing of a panel.

*Default value:* 700

#### pageScrollDuration ####

Indicates the duration of the page scroll.

*Default value:* 500

#### pageScrollEasing ####

Indicates the easing type of the page scroll. Setting a custom value requires the use of a jQuery easing plugin.

*Default value:* 'swing'

#### breakpoints ####

Sets specific breakpoints which allow changing the look and behavior of the accordion (decreasing the number of panels visible per page, shifting the orientation of the panels, etc.) when the page resizes. 

*Example:*

```
$('#my-accordion').gridAccordion({
	width: 960, 
	height: 800,
	...
	breakpoints: {
		960: {columns: 5, rows: 4},
		800: {columns: 4, rows: 2, orientation: 'vertical', width: 600, height: 500},
		650: {columns: 3, rows: 2},
		500: {columns: 2, rows: 2, orientation: 'vertical', aspectRatio: 1.2}
	}
});
```

As you can see, the 'breakpoints' property is assigned an object which contains certain browser window widths and the accordion properties that are applied to those specific widths. This is very similar to CSS media queries. However, please note that these custom properties will not be inherited between different breakpoints. The accordion's properties will reset to the original values before applying a new set of properties, so if you want a certain property value to persist, you need to set it for each breakpoint.

#### startPage ####

Indicates which page will be opened when the accordion loads, if the panels are displayed on more than one page.

*Default value:* 0

#### shadow ####

Indicates if the panels will have a drop shadow effect.

*Default value:* false

#### shuffle ####

Indicates if the panels will be shuffled/randomized.

*Default value:* false

#### autoplay ####

Indicates if the autoplay will be enabled.

*Default value:* true

#### autoplayDelay ####

Sets the delay, in milliseconds, of the autoplay cycle.

*Default value:* 5000

#### autoplayDirection ####

Sets the direction in which the panels will be opened. Can be set to 'normal' (ascending order) or 'backwards' (descending order).

*Default value:* 'normal'

#### autoplayOnHover ####

Indicates if the autoplay will be paused or stopped when the accordion is hovered. Can be set to 'pause', 'stop' or 'none'.

*Default value:* 'pause'

#### mouseWheel ####

Indicates if the accordion will respond to mouse wheel input.

*Default value:* true

#### mouseWheelSensitivity ####

Sets how sensitive the accordion will be to mouse wheel input. Lower values indicate stronger sensitivity.

*Default value:* 10

#### mouseWheelTarget ####

Sets what elements will be targeted by the mouse wheel input. Can be set to 'panel' or 'page'. Setting it to 'panel' will indicate that the panels will be scrolled, while setting it to 'page' indicate that the pages will be scrolled.

*Default value:* 'panel'

#### keyboard ####

Indicates if the accordion will respond to keyboard input.

*Default value:* true

#### keyboardOnlyOnFocus ####

Indicates if the accordion will respond to keyboard input only if the accordion has focus.

*Default value:* false

#### keyboardTarget ####

Sets what elements will be targeted by the keyboard input. Can be set to 'panel' or 'page'. Setting it to 'panel' will indicate that the panels will be scrolled, while setting it to 'page' indicate that the pages will be scrolled.

*Default value:* 'panel'

#### swapBackgroundDuration ####

Sets the duration, in milliseconds, of the transition effect.

*Default value:* 700

#### fadeOutBackground ####

Indicates if the main image background will be faded out when the opened/alternative background fades in.

*Default value:* false

#### touchSwipe ####

Indicates if the touch swipe functionality will be enabled.

*Default value:* true

#### touchSwipeThreshold ####

Sets how many pixels the distance of the swipe gesture needs to be in order to trigger a page change.

*Default value:* 50

#### openPanelVideoAction ####

Sets what the video will do when the panel is opened. Can be set to 'playVideo' or 'none'.

*Default value:* 'playVideo'

#### closePanelVideoAction ####

Sets what the video will do when the panel is closed. Can be set to 'pauseVideo' or 'stopVideo.'

*Default value:* 'pauseVideo'

#### playVideoAction ####

Sets what the accordion will do when a video starts playing. Can be set to 'stopAutoplay' or 'none'.

*Default value:* 'stopAutoplay'

#### pauseVideoAction ####

Sets what the accordion will do when a video is paused. Can be set to 'startAutoplay' or 'none'.

*Default value:* 'none'

#### endVideoAction ####

Sets what the accordion will do when a video ends. Can be set to 'startAutoplay', 'nextPanel', 'replayVideo' or 'none'.

*Default value:* 'none'

#### XMLSource ####

Sets the XML source for the accordion. Can be set to a path to an XML file or to an XML string.

#### JSONSource ####

Sets the JSON source for the accordion. Can be set to a path to a JSON file or to a JSON string.

## 2. Public methods ##

The public methods below allow you to manipulate the accordion using external controls. There are two ways of calling a public method.

The first way is by calling the `gridAccordion` plugin and passing the name of the method and additional arguments:

```
$('#my-accordion').gridAccordion('openPanel', 3);
```

The first argument represents the name of the method and the second argument represents the value which will be applied. Please note that some methods don't have a second argument. For example:

```
$('#my-accordion').gridAccordion('nextPanel');
```

The second way is by getting a reference to the gridAccordion instance and calling the method on the instance:

```
// get a reference to the gridAccordion instance
var accordion = $('#my-accordion').data('gridAccordion');

console.log(accordion.getTotalPanels());

accordion.gotoPage(2);
```

This way of calling a public method is mandatory when you use public methods that return data: `getPanelAt`, `getCurrentIndex`, `getTotalPanels`, `getTotalPages` and `getCurrentPage`, but it can be used with all the other public methods as well.

Here is the list of available public methods:

#### getPanelAt(index) ####

Gets all the data of the panel at the specified index. Returns an object that contains all the data specified for that panel.
		
#### getCurrentIndex() ####

Gets the index of the current panel.

#### getTotalPanels() ####

Gets the total number of panels.

#### nextPanel() ####

Opens the next panel.

#### previousPanel() ####

Opens the previous panel.

#### openPanel(index) ####

Opens the panel at the specified index.

#### closePanels() ####

Closes all the panels.

#### getTotalPages() ####

Gets the number of pages.

#### getCurrentPage() ####

Gets the index of the page currently displayed.

#### gotoPage(index) ####

Scrolls to the specified page.

#### nextPage() ####

Goes to the next page.

#### previousPage() ####

Goes to the previous page.

#### on(eventType, callback) ####

Adds an event listener to the accordion. More details about the use of this method will be presented in the 'Callbacks' chapter.

#### off(eventType) ####

Removes an event listener from the accordion.

#### destroy() ####

Destroys an accordion by removing all the visual elements and functionality added by the plugin. Basically, it leaves the accordion in the state it was before the plugin was instantiated.

#### update() ####

This is called by the plugin automatically when a property is changed. You can call this manually in order to refresh the accordion after changing its HTML, like removing or adding panels.

#### removePanels() ####

Removes all the panels.

#### resize() ####

This is called by the plugin automatically, when the browser window is resized. You can also call it manually if you find it necessary to have the accordion resize itself.

## 3. Callbacks ##

Callbacks (or events) are used to detect when certain actions take place. The callbacks can be added when the accordion is instantiated, or at a later time.

*Examples:*

```
$('#my-accordion').gridAccordion({
	width: 1200, 
	height: 1000,
	responsiveMode: 'custom',
	panelOpenComplete: function(event) {
		console.log(event.index);
	},
	panelsCloseComplete: function(event) {
		console.log(event.previousIndex);
	}
});

$('#my-accordion').on('panelOpen', function(event) {
	console.log(event.index);
})
```

As you can notice, the callback functions have an "event" parameter which contains some information about that event.

The list of available events:

#### init ####

Triggered after the accordion was created.

#### update ####

Triggered when the 'update' method is called, either automatically or manually.

#### accordionMouseOver ####

Triggered when the mouse pointer moves over the accordion.

#### accordionMouseOut ####

Triggered when the mouse pointer leaves the accordion.

#### panelClick ####

Triggered when a panel is clicked. Returned data:

* index: the index of the clicked panel

#### panelMouseOver ####

Triggered when the mouse pointer moves over a panel. Returned data:

* index: the index of the panel over which the mouse pointer has moved

#### panelMouseOut ####

Triggered when the mouse pointer leaves a panel. Returned data:

* index: the index of panel from which the mouse pointer has moved away

#### panelOpen ####

Triggered when a panel is opened. Returned data:

* index: the index of the opened panel
* previousIndex: the index of the previously opened panel

#### panelsClose ####

Triggered when the panels are closed. Returned data:

* previousIndex: the index of the previously opened panel

#### pageScroll ####

Triggered when the accordion scrolls to another page. Returned data:

* index: the index of the current page

#### panelOpenComplete ####

Triggered when the opening of a panel is completed. Returned data:

* index: the index of the opened panel

#### panelsCloseComplete ####

Triggered when the closing of the panels is completed. Returned data:

* previousIndex: the index of the previously opened panel

#### pageScrollComplete ####

Triggered when the scroll to a page is completed. Returned data:

* index: the index of the current page

#### breakpointReach ####

Triggered when a breakpoint is reached. Returned data:

* size: the specified size that was reached
* settings: the settings specified for the current size

#### videoPlay ####

Triggered when a video starts playing.

#### videoPause ####

Triggered when a video is paused.

#### videoEnd ####

Triggered when a video ends.
