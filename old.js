// ==UserScript==
// @name Bookmarker
// @match file:///D:/Documents/jp/*
// ==/UserScript==

function buildPath(targetElement) {
    const path = [];

    for (let element = targetElement; element; element = element.parentElement) {
        console.log("buildPath", "element", element, "parentElement", element.parentElement);
      
        path.push({
            tag: element.tagName,
            index: element.parentElement ? Array.prototype.indexOf.call(element.parentElement.children, element) : -1
        });
    }

    return path.reverse();
}

function pathToSelector(path) {
    return path.map(node => {
        console.log("pathToSelector", "node", node, "path", path);
      
        let selector = node.tag.toLowerCase();

        if (node.index !== -1) {
            selector += `:nth-child(${node.index + 1})`;
        }

        return selector;
    }).join(" > ");
}

function makeUniqueSelector(element) {
    return pathToSelector(buildPath(element));
}

const bookmarkKey = 'bookmark';

function saveBookmark() {
    let selectedElement = window.getSelection().anchorNode;
  
    if (!selectedElement) {
        alert(`Error saving bookmark - no element was selected`);
        return false;
    }
  
    if (selectedElement.nodeType === Node.TEXT_NODE) {
        selectedElement = selectedElement.parentElement;
    }

    const selector = makeUniqueSelector(selectedElement);
    const element = document.querySelector(selector);

    if (!element) {
        alert(`Error saving bookmark - ${selector} does not point to an element`);
        return false;
    }

    if (element !== selectedElement) {
        alert(`Error saving bookmark - ${selector} does not match the selected element`);
        return false;
    }

    window.localStorage.setItem(bookmarkKey, selector);
    alert(`Saved bookmark - ${selector}: ${element.textContent}`);

    return true;
}

function loadBookmark() {
    const selector = window.localStorage.getItem(bookmarkKey);

    if (!selector) {
        alert(`Error loading bookmark - no selector was saved`);
        return false;
    }

    const element = document.querySelector(selector);
    
    if (!element) {
        alert(`Error loading bookmark - ${selector} does not point to an element`);
        return false;
    }

    element.scrollIntoView();
    alert(`Loaded bookmark ${selector}: ${element.textContent}`);

    return true;
}

document.addEventListener('keydown', event => {
    switch (event.key.toLowerCase()) {
        case 's': return saveBookmark();
        case 'l': return loadBookmark();
    }
});