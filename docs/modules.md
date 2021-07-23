# Modules #

### 1. Touch Swipe ###

Although it's an optional module, you will most likely want to include it in all your projects, because it enables touch functionality for touch screen devices. The module also adds mouse drag functionality (on non-touch screen devices) when the accordion has more than one page.

### 2. Autoplay ###

Adds autoplay functionality. In the [Javascript API](api.md) chapter, you can see the properties that allow you to control this module. If you do include this module but want to disable the autoplay, you can set the 'autoplay' property to false.

### 3. Mouse Wheel ###

Enables the accordion to respond to mouse wheel input.

### 4. Keyboard ###

Adds keyboard navigation support. The next panel can be opened by pressing the right arrow key and the previous panel can be opened by pressing the left arrow key. Also, the Enter key will open the link attached to the background or opened background images.

By default, the accordion will respond to keyboard input all the time, not only when the accordion has focus. If you would like it to respond only when the accordion is in focus, you need to add the `tabindex=0` attribute to the main accordion `div` container:

```
<div id="my-accordion" class="grid-accordion" tabindex="0">
	...
</div>
```

Also, you can add the `tabindex=-1` attribute to all anchor elements that are inside the accordion, in order to not allow these elements to get focus.

### 5. Layers ###

Adds support for layers, which are blocks of text or HTML content that can easily be positioned, sized or animated.

Layers have several predefined styles and support various settings, all of which define the layers' look and behavior. The following example shows how to create two basic layers inside a panel. These layers will be static and we won't add any styling to them.

```
<div class="ga-panel">
	<img class="ga-background" src="path/to/image1.jpg"/>
	<h3 class="ga-layer">
		Lorem ipsum dolor sit amet
	</h3>
	<p class="ga-layer">
		consectetur adipisicing elit
	</p>
</div>
```

As you can see above, the layers need to have the `ga-layer` class, but they can be any HTML element: paragraphs, headings or just DIV elements.

Here is an example that adds some styling and animates the layers:

```
<div class="ga-panel">
	<img class="ga-background" src="path/to/image1.jpg"/>
	<h3 class="ga-layer ga-closed ga-black"
		data-position="bottomLeft" data-horizontal="10%"
		data-show-transition="left" data-show-delay="300" data-hide-transition="right">
		Lorem ipsum dolor sit amet
	</h3>
	<p class="ga-layer ga-opened ga-white ga-padding"
		data-width="200" data-horizontal="center" data-vertical="40%"
		data-show-transition="down" data-hide-transition="up">
		consectetur adipisicing elit
	</p>
</div>
```

There are several predefined classes that can be passed to layers in order to style them. The position, size and animations are set using data attributes. For a better organization of the HTML code, I added the classes, the attributes that set the position and size, and the attributes that set the animation on separate lines, but you can add them in a single line if you want to.

This is the list of predefined classes that can be passed to the layers:

##### ga-opened #####

Sets the layer to be visible only when the panel is opened.

##### ga-closed #####

Sets the layer to be visible only when the panel is closed.

##### ga-black #####

Adds a black and transparent background and makes the font color white.

##### ga-white #####

Adds a white and transparent background and makes the font color black.

##### ga-padding #####

Adds a 10 pixel padding to the layer.

##### ga-rounded #####

Makes the layer's corners rounded.

In the accordion's CSS file, grid-accordion.css, you can edit the properties specified for the above classes. For example, you can set the padding to 5 pixels instead of 10 pixels, or you can change the transparency of the black and white backgrounds. However, it's a best practice to add your custom styling in a separate CSS file instead of modifying the accordion's CSS.

This is the list of data attributes:

##### data-width #####

Sets the width of the layer. Can be set to a fixed or percentage value. If it's not set, the layer's width will adapt to the width of the inner content.

##### data-height #####

Sets the height of the layer. Can be set to a fixed or percentage value. If it's not set, the layer's height will adapt to the height of the inner content.

##### data-depth #####

Sets the depth (z-index, in CSS terms) of the layer.

##### data-position #####

Sets the position of the layer. Can be set to 'topLeft' (which is the default value), 'topRight', 'bottomLeft' or 'bottomRight'.

##### data-horizontal #####

Sets the horizontal position of the layer, using the value specified for data-position as a reference point. Can be set to a fixed value, percentage value or to 'center'.

##### data-vertical #####

Sets the vertical position of the layer, using the value specified for data-position as a reference point. Can be set to a fixed value, percentage value or to 'center'.

##### data-show-transition #####

Sets the transition of the layer when it appears in the panel. Can be set to 'left', 'right', 'up' or 'down', these values describing the direction in which the layer will move when it appears.

##### data-show-offset #####

Sets an offset for the position of the layer from which the layer will be animated towards the final position when it appears in the panel. Needs to be set to a fixed value.

##### data-show-duration #####

Sets the duration of the show transition.

##### data-show-delay #####

Sets a delay for the show transition. This delay starts from the moment when the panel starts opening.

##### data-hide-transition #####

Sets the transition of the layer when it disappears from the panel. Can be set to 'left', 'right', 'up' or 'down', these values describing the direction in which the layer will move when it disappears.

##### data-hide-offset #####

Sets an offset for the position of the layer towards which the layer will be animated from the original position when it disappears from the panel. Needs to be set to a fixed value.

##### data-hide-duration #####

Sets the duration of the hide transition.

##### data-hide-delay #####

Sets a delay for the hide transition. This delay starts from the moment when the panel starts closing.

The layers are animated using CSS3 transitions in most browsers. In IE9 and IE8 (where CSS3 transitions are not supported), the layers will only fade in/out, and in IE7 and older, the layers will appear without any animation.

This module is showcased in example1.html and example3.html.

### 6. Lazy Loading ###

Enables the accordion to load images only when they are in view. It makes sense to use it when there are multiple pages in the accordion, so that images from other pages are not loaded until the user navigates to that page.

*Example:*

```
<div class="ga-panel">
	<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image1.jpg"/>
</div>

<div class="ga-panel">
	<a href="http://bqworks.com">
		<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image2.jpg"/>
	</a>
</div>

<div class="ga-panel">
	<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image3.jpg"/>
</div>
```

The `src` attribute of the image will point to a placeholder image, and the actual image will be specified in the `data-src` attribute. When the panel becomes visible, the placeholder image will be replaced by the actual image. You can use the placeholder image that comes with the accordion, or you can create your own placeholder image. The bundled placeholder image is located in dist/css/images/blank.gif and it's a 1 pixel by 1 pixel blank image.

This module is showcased in example1.html and example3.html.

### 7. Retina ###

Allows you to specify an alternative image for screens with high PPI (pixels per inch), like the 'Retina' screens from Apple devices. Please note that this module will work for any screen that has high PPI, not only for the 'Retina' screens.

The high resolution image needs to be specified in the `data-retina` attribute, as seen below:

```
<div class="ga-panel">
	<img class="ga-background" src="path/to/image1.jpg" data-retina="path/to/image1@2x.jpg" width="400" height="300"/>
</div>

<div class="ga-panel">
	<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image2.jpg" data-retina="path/to/image2@2x.jpg" width="400" height="300"/>
</div>

<div class="ga-panel">
	<a href="http://bqworks.com">
		<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image3.jpg" data-retina="path/to/image3@2x.jpg" width="400" height="300"/>
	</a>
</div>
```

It's a naming convention to add the '@2x' suffix for the high resolution version of the image. Also, for best results, it's recommended to specify the real width and height of the image.

As you can see, it's possible to use lazy loading and high resolution images at the same time.

This module is showcased in example1.html, example2.html and example3.html.

### 8. Deep Linking ###

Provides the possibility to link to a specific panel in the accordion. You can use this to have the accordion opened at a specific panel when the page loads or to load a specific panel later at a later time.

The hash that needs to be appended to the URL consists of the 'id' attribute of the accordion and the index of the panel separated by a slash character (/). For example, `http://domain.com/page#my-accordion/0` will open the first panel (because panel indexes start with 0) in the accordion that has the 'id' set to 'my-accordion'.

It's also possible to specify the 'id' attribute of the panel instead of its index.

*Example:*

```
<div id="my-accordion" class="grid-accordion">
	<div class="ga-panels">
		<div class="ga-panel">
			<img class="ga-background" src="path/to/image1.jpg"/>
		</div>
		<div id="my-panel" class="ga-panel">
			<img class="ga-background" src="path/to/image2.jpg"/>
		</div>
		<div class="ga-panel">
			<img class="ga-background" src="path/to/image3.jpg"/>
		</div>
	</div>
</div>
```

In order to open the second panel, you can use either `http://domain.com/page#my-accordion/1` or `http://domain.com/page#my-accordion/my-panel`.

This module is showcased in example3.html.

### 9. Swap Background ###

Allows you to set an alternative background image that will appear when the panel is opened. The alternative image must be added in a separate `img` element and it must be given the `ga-background-opened` class.

```
<div class="ga-panel">
	<img class="ga-background" src="path/to/image1.jpg"/>
	<img class="ga-background-opened" src="path/to/alt_image1.jpg"/>
</div>

<div class="ga-panel">
	<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image2.jpg" data-retina="path/to/image2@2x.jpg"/>
	<img class="ga-background-opened" src="path/to/blank.gif" data-src="path/to/alt_image2.jpg" data-retina="path/to/alt_image2@2x.jpg"/>
</div>

<div class="ga-panel">
	<img class="ga-background" src="path/to/blank.gif" data-src="path/to/image3.jpg" data-retina="path/to/image3@2x.jpg"/>
	<a href="http://bqworks.com">
		<img class="ga-background-opened" src="path/to/blank.gif" data-src="path/to/alt_image3.jpg" data-retina="path/to/alt_image3@2x.jpg"/>
	</a>
</div>
```

As you can see, the alternative image can be lazy loaded and can have a high resolution version as well.

Please note that the size of the 'opened' image should be equal or bigger than the size of the default image, in order to prevent parts of the default image to be visible behind the 'opened' image when the panel is opened.

This module is showcased in example2.html.

### 10. Smart Video ###

Provides automatic control of the videos loaded inside the panels. For example, the video will pause automatically when the panel closes, or the autoplay, if enabled, will stop when a video starts playing. Inside the accordion, videos can be added in the main panel container or inside layers. 

The video types or providers supported by this module are: YouTube, Vimeo, HTML5, Video.js and SublimeVideo.

In order to have a video automatically controlled by the accordion, the video must have the `ga-video` class. Also, there are some provider-specific requirements for the videos, as presented below.

##### YouTube #####

The videos need to have the `enablejsapi=1` parameter appended to the URL of the video. It's also recommended to append the `wmode=opaque` parameter. The parameters need to be delimited by `&amp;`.

*Example:*

```
<iframe class="ga-video" src="http://www.youtube.com/embed/msIjWthwWwI?enablejsapi=1&amp;wmode=opaque" width="500" height="350" frameborder="0" allowfullscreen></iframe>
```

##### Vimeo #####

The videos need to have the `api=1` parameter appended to the URL of the video.

*Example:*

```
<iframe class="ga-video" src="http://player.vimeo.com/video/43401199?api=1" width="500" height="350" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
```

##### HTML5 #####

Simple HTML5 videos don't need any preparations other than having the `ga-video` class.

*Example:*

```
<video class="ga-video" poster="path/to/poster.jpg" width="500" height="350" controls="controls" preload="none">
	<source src="path/to/video.mp4" type="video/mp4"/>
	<source src="path/to/video.ogv" type="video/ogg"/>
</video>
```

##### Video.js #####

Each Video.js video must have a unique 'id' attribute. Also, because the Video.js library changes the HTML markup of the video, we'll create a container element and add the `ga-video` class to that element instead. Also, the container element must have the `data-video-id` attribute, which is used to specify the 'id' attribute of the video.

*Example:*

```
<div class="ga-video" data-videojs-id="video1">
	<video id="video1" class="video-js vjs-default-skin" poster="path/to/poster.jpg" width="500" height="350" controls="controls" preload="none"
			data-setup="{}">
		<source src="path/to/video.mp4" type="video/mp4"/>
		<source src="path/to/video.ogv" type="video/ogg"/>
	</video>
</div>
```

Please note that, in order to use Video.js, you need to load the Video.js JavaScript and CSS files in your page. More information about how to use Video.js, in general, can be found on the [official Video.js page](http://www.videojs.com/). 

##### SublimeVideo #####

Each SublimeVideo instance must have a unique 'id' attribute.

*Example:*

```
<video id="video2" class="ga-video sublime" poster="path/to/poster.jpg" width="500" height="350" controls="controls" preload="none">
	<source src="path/to/video.mp4" type="video/mp4"/>
	<source src="path/to/video.ogv" type="video/ogg"/>
</video>
```

Please note that, in order to use SublimeVideo, you will also need to load a script in your page which you need to download from the SublimeVideo page. More information about how to use SublimeVideo, in general, can be found on the [official SublimeVideo page](http://www.sublimevideo.net/).

##### Notes #####

* Most of the videos will work correctly only if the page is on a server. It can be a local server or an online server.

* iOS doesn't allow videos to play automatically, so an initial user action is required in order to play the video. After the initial action, the videos will be controlled automatically.

* When pausing a YouTube video automatically, on iOS, the video will be stopped instead, because only pausing it makes the entire region that the video occupies unresponsive to user input. For example, if another video slides in over the YouTube video, we won't be able to play this video because the controls will be unresponsive. However, this doesn't occur if the YouTube video is stopped instead of paused, so the accordion does this.

* The control bar of SublimeVideo videos will become unresponsive on iOS if the 'auto' responsive mode is used. It seems that, in general, scaling SublimeVideo using the CSS3 'transform' property will make them unresponsive to user input.

This module is showcased in example3.html.

### 11. XML ###

Allows you to use an XML file or XML string as a source for the accordion's content. The path of the XML file or the XML string must be passed to the 'XMLSource' property.

*Example:*

```
$('#example-xml').gridAccordion({
	XMLSource: 'path/to/file.xml',
	width: 960, 
	height: 800
});
```

In the accordion's HTML code, you will need to create only the main container DIV. The rest will be created automatically, based on the XML data.

```
<div id="example-xml" class="grid-accordion"></div>
```

The syntax used in XML is similar to that used in HTML. Some differences would be that the `ga-` prefix is not used anymore for classes, the `data-` prefix is not used for attributes, and using the dash (-) as a delimiter is replaced with using the CamelCase notation.

These are the node names that need to be used:

* `accordion`: for the root node
* `panel`: for panel nodes
* `background`: for background images
* `backgroundLink`: for links attached to background images
* `backgroundRetina`: for alternative, high resolution images
* `backgroundOpened`: for alternative images that will appear when the panel is opened
* `backgroundOpenedLink`: for links attached to the opened background image
* `backgroundOpenedRetina`: for retina version of the opened background image
* `layer`: for layer nodes

*Example:*

```
<accordion>
	<panel>
		<background>path/to/image1.jpg</background>
		<backgroundRetina>path/to/image1@2x.jpg</backgroundRetina>
		<backgroundOpened>path/to/alt_image1.jpg</backgroundOpened>
		<backgroundOpenedRetina>path/to/alt_image1@2x.jpg</backgroundOpenedRetina>
		<backgroundLink>http://bqworks.com/</backgroundLink>
	</panel>

    <panel>
    	<background>path/to/image2.jpg</background>
		<backgroundRetina>path/to/image2@2x.jpg</backgroundRetina>
		<backgroundOpened>path/to/alt_image2.jpg</backgroundOpened>
		<backgroundOpenedRetina>path/to/alt_image2@2x.jpg</backgroundOpenedRetina>
		<backgroundOpenedLink>http://bqworks.com/</backgroundOpenedLink>
	</panel>
</accordion>
```

If you want to use lazy loading, you simply need to add the `lazyLoading` attribute to the root `accordion` node and specify the path of the placeholder image.

*Example:*

```
<accordion lazyLoading="path/to/blank.gif">
	...
</accordion>
```

When using layers, the equivalent for the `class` attribute is the `style` attribute. As noted before, the `ga-` and `data-` prefixes are not used anymore and the names of the attributes use a CamelCase notation. It's important to already be familiar with the 'Layers' module before learning how to use layers in XML. The available styles and attributes are enumerated below, but check the presentation of the 'Layers' module for a description of these.

##### Styles #####

* opened
* closed
* black
* white
* padding
* rounded.

##### Attributes #####

* width
* height
* depth
* position
* horizontal
* vertical
* showTransition
* showOffset
* showDuration
* showDelay
* hideTransition
* hideOffset
* hideDuration
* hideDelay

This module is showcased in example_xml.html, which is the XML version of example1.html. Please check the XML file created for this example, accordion.xml, to see how layers can be created in XML.

### 12. JSON ###

Allows you to use a JSON file or JSON string as a source for the accordion's content. The path of the JSON file or the JSON string must be passed to the 'JSONSource' property.

*Example:*

```
$('#example-json').gridAccordion({
	JSONSource: 'path/to/file.json',
	width: 960, 
	height: 800
});
```

In the accordion's HTML code, you will need to create only the main container DIV. The rest will be created automatically, based on the JSON data.

```
<div id="example-json" class="grid-accordion"></div>
```

The syntax used in JSON is similar to that used in HTML. Some differences would be that the `ga-` prefix is not used anymore for classes, the `data-` prefix is not used for attributes, and using the dash (-) as a delimiter is replaced with using the CamelCase notation.

These are the node names that need to be used:

* `accordion`: for the main accordion object
* `panels`: for the array of panel objects
* `background`: for background images
* `backgroundLink`: for links attached to background images
* `backgroundRetina`: for alternative, high resolution images
* `backgroundOpened`: for alternative images that will appear when the panel is opened
* `backgroundOpenedLink`: for links attached to the opened background image
* `backgroundOpenedRetina`: for retina version of the opened background image
* `layers`: for the array of layer objects

*Example:*

```
{
	"accordion": {
		"panels": [
			{
				"background": {"source": "path/to/image1.jpg"},
				"backgroundRetina": {"source": "path/to/image1@2x.jpg"},
				"backgroundOpened": {"source": "path/to/alt_image1.jpg"},
				"backgroundOpenedRetina": {"source": "path/to/image1@2x.jpg"},
				"backgroundLink": {"address": "http://bqworks.com"}
			},
			{
				"background": {"source": "path/to/image2.jpg"},
				"backgroundRetina": {"source": "path/to/image2@2x.jpg"},
				"backgroundOpened": {"source": "path/to/alt_image2.jpg"},
				"backgroundOpenedRetina": {"source": "path/to/alt_image2@2x.jpg"},
				"backgroundOpenedLink": {"address": "http://bqworks.com"}
			}
		]
	}
}
```

If you want to use lazy loading, you simply need to add the `lazyLoading` property to the `accordion` object and specify the path of the placeholder image.

*Example:*

```
{
	"accordion": {
		"lazyLoading": "path/to/blank.gif"
		"panels": [
			...
		]
	}
}
```

When using layers, the equivalent for the `class` attribute is the `style` property. As noted before, the `ga-` and `data-` prefixes are not used anymore and the names of the properties use a CamelCase notation. It's important to already be familiar with the 'Layers' module before learning how to use layers in JSON. The available styles and properties are enumerated below, but check the presentation of the 'Layers' module for a description of these.

##### Styles #####

* opened
* closed
* black
* white
* padding
* rounded.

##### Properties #####

* content - this is the only particular property and it's used to set the content of the layer
* width
* height
* depth
* position
* horizontal
* vertical
* showTransition
* showOffset
* showDuration
* showDelay
* hideTransition
* hideOffset
* hideDuration
* hideDelay

This module is showcased in example_json.html, which is the JSON version of example2.html. Please check the JSON file created for this example, accordion.json, to see how layers can be created in JSON.
