# Text-Translator
This Chrome/Edge extension, called Text Translator, enables users to translate selected text on a webpage using the Azure Translator API. When text is selected, a context menu option called "Translate selection" appears. Upon selecting this option, the extension retrieves the selected text and translates it into the target language specified in the user's settings. The translated text is displayed in a customizable translation box on the webpage.

The extension supports multiple languages, as listed in the code, and uses Azure's Translator API to perform the translation. Users can change both input and output languages through dropdown menus in the translation box.

# How to Use

# Install the Extension: Follow the usual procedure to install Chrome extensions by loading this project in developer mode from the Chrome/Edge Extensions page (chrome://extensions or edge://extensions/).

# Right-click to Translate:

Select any text on a webpage.
Right-click the selected text and choose the "Translate selection" option from the context menu.
View and Customize Translation:

# The extension will fetch the translation using Azure Translator API and display the result in a popup box near the selected text.
Inside the popup, you can:
View the original and translated text.
Change the input and output languages using the dropdowns.
The translation will automatically update based on the new language selections.
Close the Translation Box:

You can close the translation box by clicking the "Close" button.
# API Key Configuration:

You will need to replace the placeholder API key in background.js with your Azure Translator API key to use this extension properly.
The API endpoint and region settings can also be configured in the background.js file.
