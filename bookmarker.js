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

const store = (function(key, size) {
    function read(callback) {
        let history = [];
        const raw = localStorage.getItem(key);

        if (raw !== null) {
            try {
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    history = parsed;
                }
            } catch (ignored) {}
        }

        return callback(history);
    }

    function write(history) {
        localStorage.setItem(key, JSON.stringify(history.slice(-size)));
    }

    function push(value) {
        return read(history => {
            history.push(value);
            write(history);
            return history.length;
        });
    }

    function peek() {
        return read(history => history[history.length - 1]);
    }

    function pop() {
        return read(history => {
            const top = history.pop();
            write(history);
            return top;
        });
    }

    return {
        push,
        peek,
        pop
    };
}('bookmark_v2', 50));

const bookmarker = (function(store, makeUniqueSelector) {
    function notifyWith(notifier, type, message) {
        const formattedMessage = `[Bookmarker] ${type.toUpperCase()}: ${message}`;
        return notifier(formattedMessage);
    }

    function notify(type, message) {
        return notifyWith(message => {
            alert(message);
            return message;
        }, type, message);
    }

    function error(type, message) {
        throw new Error(notify(`${type} error`, message));
    }

    function success(type, selector, element) {
        notify(type, `${selector} -> ${element.textContent}`);
    }

    function save() {
        function saveError(message) {
            error('save', message);
        }

        let selectedElement = window.getSelection().anchorNode;
        if (!selectedElement) saveError('No element was selected');
        if (selectedElement.nodeType === Node.TEXT_NODE) selectedElement = selectedElement.parentElement;
        const selector = makeUniqueSelector(selectedElement);
        const recoveredElement = document.querySelector(selector);
        if (!recoveredElement) saveError(`${selector} does not point to an element`);
        if (recoveredElement !== selectedElement) saveError(`${selector} does not match the selected element`);
        store.push(selector);
        success('saved', selector, recoveredElement);
    }

    function load() {
        function loadError(message) {
            error('load', message);
        }

        const selector = store.peek();
        if (!selector) loadError(`No selector was saved`);
        const recoveredElement = document.querySelector(selector);
        if (!recoveredElement) loadError(`${selector} does not point to an element`);
        recoveredElement.scrollIntoView();
        success('loaded', selector, recoveredElement);
    }

    function pop() {
        if (notifyWith(confirm, 'warning', 'Pop bookmark?')) {
            store.pop();
            load();
        }
    }

    return {
        save,
        load,
        pop
    };
}(store, makeUniqueSelector));

document.addEventListener('keydown', event => {
    switch (event.key.toLowerCase()) {
        case 's': return bookmarker.save();
        case 'l': return bookmarker.load();
        case 'p': return bookmarker.pop();
    }
});