// ==UserScript==
// @name Bookmarker
// @match file:///D:/Documents/jp/*
// ==/UserScript==

function makeUniqueSelector(leaf) {   
    function buildBranch(leaf) {
        const branch = [];

        for (let node = leaf; node; node = node.parentElement) {      
            branch.push({
                tag: node.tagName.toLowerCase(),
                index: node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) : -1
            });
        }

        return branch.reverse();
    }

    function branchToSelector(branch) {
        return branch.map(node => {      
            let selector = node.tag;

            if (node.index !== -1) {
                selector += `:nth-child(${node.index + 1})`;
            }

            return selector;
        }).join(" > ");
    }

    return branchToSelector(buildBranch(leaf));
}

const store = (function(key) {
    function get() {
        let value = [];
        const raw = localStorage.getItem(key);

        if (raw !== null) {
            try {
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    value = parsed;
                }
            } catch (ignored) {}
        }

        return value;
    }

    function set(value) {
        const current = get();

        current.push(value);
        localStorage.setItem(key, JSON.stringify(current));

        return current;
    }

    return function(value) {
        if (value) {
            return set(value);
        } else {
            return get();
        }
    };
}('bookmark'));

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