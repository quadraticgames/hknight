const fs = require('fs');
eval(fs.readFileSync('node_modules/playcanvas/build/playcanvas.js', 'utf8'));

const canvas = {
    getContext: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
};

try {
    const app = new pc.Application(canvas, {});
    // WHAT IF WE DONT CALL app.start() ?
    pc.createScript('test1');
    console.log("No app.start() worked!");
} catch (e) {
    console.log("No app.start() failed:", e.message);
}

try {
    const app2 = new pc.Application(canvas, {});
    app2.start();
    pc.createScript('test2');
    console.log("With app.start() worked!");
} catch (e) {
    console.log("With app.start() failed:", e.message);
}
