// Tiny hash router — fires registered handlers when location.hash changes
// or when the page first loads. Handlers receive a boolean indicating
// whether their hash is currently active.

const handlers = new Map();

export function register(hash, handler) {
    handlers.set(hash, handler);
}

function dispatch() {
    const current = window.location.hash;
    handlers.forEach((handler, hash) => {
        handler(current === hash);
    });
}

export function start() {
    window.addEventListener('hashchange', dispatch);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', dispatch);
    } else {
        dispatch();
    }
}
