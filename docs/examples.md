# Examples #

This chapter contains a presentation of each example included with 'Grid Accordion'. The presentation will not go through the properties or HTML structure of the examples, as these can be understood by reading the other chapters from this documentation.

## Example 1 ##

Beyond demonstrating how to use layers and several other features, the main purpose of this example is to show the difference between 'auto' and 'custom' responsiveness. 

The example allows you to change the responsive mode at any time in order to see how each option works. You will notice that changing the responsive mode to 'auto' will display all layer content completely, but will also resize the layers proportionally to the size of the accordion. Changing the responsive mode to 'custom' will keep the layers at a size that makes the text easy to read at any size of the accordion, but for this purpose it will hide part of the layers and only show the most important content.

'Custom' responsiveness is used in conjunction with CSS media queries, which are used to partly hide the layers at smaller screen sizes. The CSS code used in this example can be found in 'examples/css/examples.css'.

The block of code used for changing the responsive mode is only for demonstration purposes, and doesn't need to be included in your project.

## Example 2 ##

This example demonstrates how to swap the background image when panels are opened, how to change the number of visible visible panels for smaller screens, and how to integrate the accordion with 3rd party scripts, Fancybox2 in this case.

Regarding Fancybox integration, it is important to note that integrating a lightbox script or a simple link with touch swipe or mouse drag functionality is a little tricky, because doing a mouse drag or a touch swipe can activate the link or lightbox even if this is not intended. Simple links are automatically handled by the Grid Accordion plugin (the Touch Swipe module, to be more specific), so they don't require any attention from your part, but using 3rd party scripts, like Fancybox, requires some attention. In the example, you can see a commented block of code that handles this integration.

## Example 3 ##

This example shows how to use HTML content inside the accordion, and focuses on using videos. In the Modules chapter, there is a chapter about how the videos are integrated with the accordion in order to have them automatically controlled.

It's not necessary to add the HTML content, including the videos, inside layers. You can add it directly in the main panel container, but layers make it easier to position and size this content.

The example also demonstrates how to use deep-linking. As you can see, below the accordion there are four numerated links which will open the four panels of the accordion. Then, there is another link which doesn't use deep-linking, but one of the accordion's public methods that will close all the panels.

## Example XML ##

This example replicates 'example 1', but uses XML as a source for the content of the accordion.

## Example JSON ##

This is similar to 'example 2', and uses a JSON file as a source for the content of the accordion.
