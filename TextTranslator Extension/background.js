// When the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "Translate selection",
    contexts: ["selection"]  // The menu will only appear when text is selected
  });
});

// Full list of supported languages for Azure Translator
const supportedLanguages = {
  "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian",
  "az": "Azerbaijani", "bn": "Bangla", "eu": "Basque", "be": "Belarusian", "bs": "Bosnian",
  "bg": "Bulgarian", "yue": "Cantonese", "ca": "Catalan", "zh-Hans": "Chinese (Simplified)", "zh-Hant": "Chinese (Traditional)",
  "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English",
  "et": "Estonian", "fi": "Finnish", "fr": "French", "fr-ca": "French (Canada)", "gl": "Galician",
  "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole",
  "he": "Hebrew", "hi": "Hindi", "hu": "Hungarian", "is": "Icelandic", "id": "Indonesian",
  "it": "Italian", "ja": "Japanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer",
  "ko": "Korean", "lv": "Latvian", "lt": "Lithuanian", "ml": "Malayalam", "ms": "Malay",
  "mt": "Maltese", "mr": "Marathi", "mn": "Mongolian", "ne": "Nepali", "nb": "Norwegian",
  "pl": "Polish", "pt": "Portuguese", "pt-pt": "Portuguese (Portugal)", "pa": "Punjabi", "ro": "Romanian",
  "ru": "Russian", "sr": "Serbian", "sk": "Slovak", "sl": "Slovenian", "es": "Spanish",
  "sw": "Swahili", "sv": "Swedish", "ta": "Tamil", "te": "Telugu", "th": "Thai",
  "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "vi": "Vietnamese", "cy": "Welsh",
  "zu": "Zulu"
};

// Listen for when the user clicks the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection") {
    const selectedText = info.selectionText;
    chrome.storage.sync.get(['inputLang', 'outputLang'], (settings) => {
      const inputLang = settings.inputLang || "en";
      const outputLang = settings.outputLang || "vi";

      translateText(selectedText, inputLang, outputLang, (translatedText) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: displayInteractiveTranslationBox,
          args: [translatedText, selectedText, inputLang, outputLang, supportedLanguages]
        });
      });
    });
  }
});

// Function to translate text using Azure Translator API
function translateText(text, fromLang, toLang, callback) {
  const key = '<Your API key>';  // Replace with your Azure Translator API key
  const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';

  // Split text into paragraphs and translate each paragraph individually
  const paragraphs = text.split(/\n+/);  // Split based on line breaks

  // Translate each paragraph separately
  const translationPromises = paragraphs.map(paragraph => {
    const requestUrl = `${endpoint}&from=${fromLang}&to=${toLang}`;
    const requestBody = JSON.stringify([{ "Text": paragraph }]);
    
    return fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': '<Your region>',  // Replace with your Azure region if different
        'Content-Type': 'application/json'
      },
      body: requestBody
    })
    .then(response => response.json())
    .then(data => {
      if (data && data[0] && data[0].translations && data[0].translations.length > 0) {
        return data[0].translations[0].text;
      } else {
        return 'Translation error or unsupported language';
      }
    });
  });

  // Once all paragraphs are translated, combine them and return the result
  Promise.all(translationPromises)
    .then(translations => callback(translations.join('\n\n')))  // Join paragraphs with line breaks
    .catch(error => {
      console.error('Translation API error:', error);
      callback('Error in translation');
    });
}

// Function to display translation box near selected text
function displayInteractiveTranslationBox(translatedText, originalText, inputLang, outputLang, supportedLanguages) {
  try {
    // Get the position of the selected text
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create translation box
    const translationBox = document.createElement("div");
    translationBox.id = "translation-box";
    translationBox.style.position = "absolute";
    translationBox.style.left = `${rect.left + window.scrollX}px`;
    translationBox.style.top = `${rect.bottom + window.scrollY + 10}px`;
    translationBox.style.backgroundColor = "white";
    translationBox.style.color = "black";
    translationBox.style.border = "1px solid black";
    translationBox.style.padding = "10px";
    translationBox.style.fontSize = "14px";
    translationBox.style.zIndex = "99999";
    translationBox.style.width = "400px";  // Default width
    translationBox.style.height = "300px";  // Set a default height
    translationBox.style.wordWrap = "break-word";
    translationBox.style.resize = "both";
    translationBox.style.overflow = "hidden";
    translationBox.style.boxSizing = "border-box";  // Include padding and border in width and height
    translationBox.style.display = 'flex';
    translationBox.style.flexDirection = 'column';

    // Create input/output language selectors
    const inputLangSelect = document.createElement("select");
    const outputLangSelect = document.createElement("select");

    // Populate language dropdowns with supported languages
    for (const [code, name] of Object.entries(supportedLanguages)) {
      const inputOption = document.createElement("option");
      inputOption.value = code;
      inputOption.text = name;
      if (code === inputLang) inputOption.selected = true;
      inputLangSelect.appendChild(inputOption);

      const outputOption = document.createElement("option");
      outputOption.value = code;
      outputOption.text = name;
      if (code === outputLang) outputOption.selected = true;
      outputLangSelect.appendChild(outputOption);
    }

    // Create a container for the language selectors
    const langSelectContainer = document.createElement("div");
    langSelectContainer.style.display = 'flex';
    langSelectContainer.style.flexWrap = 'wrap';
    langSelectContainer.style.marginBottom = '5px';
    langSelectContainer.style.cursor = 'move';  // Indicate that this area can be used to drag

    // Add input and output language selectors to the container
    const inputLabel = document.createElement("label");
    inputLabel.textContent = "Input: ";
    inputLabel.appendChild(inputLangSelect);
    inputLabel.style.marginRight = '10px';

    const outputLabel = document.createElement("label");
    outputLabel.textContent = "Output: ";
    outputLabel.appendChild(outputLangSelect);

    langSelectContainer.appendChild(inputLabel);
    langSelectContainer.appendChild(outputLabel);

    // Create textarea to show translation result
    const translationTextarea = document.createElement("textarea");
    translationTextarea.value = translatedText;
    translationTextarea.style.resize = "none";  // Disable resize for textarea
    translationTextarea.style.width = "100%";
    translationTextarea.style.flexGrow = '1';  // Let it expand to fill available space
    translationTextarea.style.border = 'none';
    translationTextarea.style.outline = 'none';
    translationTextarea.style.padding = '5px';
    translationTextarea.readOnly = true;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.marginTop = "5px";
    closeButton.addEventListener("click", () => translationBox.remove());

    // Append elements to translation box
    translationBox.appendChild(langSelectContainer);
    translationBox.appendChild(translationTextarea);
    translationBox.appendChild(closeButton);

    // Append the translation box to the document body
    document.body.appendChild(translationBox);

    // Re-translate when the output or input language is changed
    const retranslate = () => {
      const selectedOutputLang = outputLangSelect.value;
      const selectedInputLang = inputLangSelect.value;

      // Fetch new translation with selected languages
      chrome.runtime.sendMessage({
        action: "retranslate",
        text: originalText,
        from: selectedInputLang,
        to: selectedOutputLang
      }, (newTranslation) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          translationTextarea.value = "Translation failed.";
        } else {
          translationTextarea.value = newTranslation || "Translation failed";
        }
      });
    };

    outputLangSelect.addEventListener("change", retranslate);
    inputLangSelect.addEventListener("change", retranslate);

    // Make the translation box draggable
    let isDragging = false;
    let dragStartX, dragStartY;

    const onMouseDown = (e) => {
      // Only start dragging if the click is on the top part (langSelectContainer)
      if (e.target === langSelectContainer || langSelectContainer.contains(e.target)) {
        isDragging = true;
        dragStartX = e.clientX - translationBox.offsetLeft;
        dragStartY = e.clientY - translationBox.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();  // Prevent text selection
      }
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        translationBox.style.left = `${e.clientX - dragStartX}px`;
        translationBox.style.top = `${e.clientY - dragStartY}px`;
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    };

    translationBox.addEventListener('mousedown', onMouseDown);

  } catch (error) {
    console.error("Error during translation box injection:", error);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'retranslate') {
    const { text, from, to } = request;
    translateText(text, from, to, (translatedText) => {
      sendResponse(translatedText);
    });
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});
