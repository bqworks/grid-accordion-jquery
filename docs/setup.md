# Setup #

## Package presentation ##

The package downloaded from CodeCanyon includes several files and folders:

**dist**

Contains the concatenated and compressed JavaScript and CSS files, which you can use in your project.

**src**

Contains the uncompressed JavaScript and CSS files. The JavaScript code is separated in a core and several modules, each in its own file. More about this in the Modules chapter.

**libs**

Contains the jQuery library and other scripts used in the examples.

**examples**

Contains several examples that showcase some of the accordion's capabilities.

**docs**

Contains the documentation.

## Installing and instantiating Grid Accordion ##

### 1. Copying the required files ###

First of all, you will need to copy the files needed for the plugin. You may want to create separate directories for the JavaScript and CSS files for better organization; for this demonstration, we'll name the two folders 'js' and 'css'.

#### JavaScript files ####

Copy the Grid Accordion script (jquery.gridAccordion.min.js) from the 'dist/js' folder to your 'js' folder. You will also need to copy the jQuery script (jquery-1.10.1.min.js) from the 'libs' folder, or you can download it from [the official jQuery website](http://jquery.com/).

#### CSS files ####

From 'dist/css', copy grid-accordion.min.css and the 'images' folder into your 'css' folder.

### 2. Including the required files in the page ###

Once you have copied the files mentioned above, you will need to include them in the header of the HTML page:

```
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">

<title>Page title</title>

<link rel="stylesheet" type="text/css" href="css/grid-accordion.min.css" media="screen"/>

<script type="text/javascript" src="js/jquery-1.10.1.min.js"></script>
<script type="text/javascript" src="js/jquery.gridAccordion.min.js"></script>

</head>
<body>

</body>
</html>
```

### 3. Creating HTML markup ###

Inside the `<body>` tag, you need to specify HTML markup like in the example below:

```
<body>
	<div id="my-accordion" class="grid-accordion">
		<div class="ga-panels">
			<div class="ga-panel">
				<img class="ga-background" src="path/to/image1.jpg"/>
			</div>
			<div class="ga-panel">
				<img class="ga-background" src="path/to/image2.jpg"/>
			</div>
			<div class="ga-panel">
				<img class="ga-background" src="path/to/image3.jpg"/>
			</div>
			<div class="ga-panel">
				<img class="ga-background" src="path/to/image4.jpg"/>
			</div>
			<div class="ga-panel">
				<img class="ga-background" src="path/to/image5.jpg"/>
			</div>
		</div>
    </div>
</body>
```

This is one of the most basic accordions that you can create. In the "Modules" chapter you will learn how to add richer functionality to the accordion, which will require some additional HTML code.

The accordion's main DIV element needs to have the `grid-accordion` class. Then, inside the main accordion container you create another DIV, which has the `ga-panels` class. This DIV will be a container for the individual panel elements. The panel elements need to be DIV's that have the `ga-panel` class. Inside the panels you can insert any HTML content. If you want to add a background image you need to add to it the `ga-background` class.

Please note that all class names are prefixed with `ga-` in order to prevent CSS conflicts with other scripts from the page.

### 4. Instantiating the accordion ###

After including the required files in the header and creating the HTML markup, you will need to instantiate the accordion by adding the following code before the `</head>` tag:

```
<script type="text/javascript">
	jQuery(document).ready(function($) {
		$('#my-accordion').gridAccordion();
	});
</script>
```

If you want to change any of the default settings for the accordion, you can also pass various properties to the accordion here - more about that in the [JavaScript API](api.md) chapter.