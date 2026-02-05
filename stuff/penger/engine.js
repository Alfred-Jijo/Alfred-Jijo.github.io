const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";
const FPS = 60;

function start3DInstance(canvasId, modelData) {
    const game = document.getElementById(canvasId);

    if (!game) {
        console.error(`Canvas with id '${canvasId}' not found.`);
        return;
    }
    if (!modelData || !modelData.vs || !modelData.fs) {
        console.error(`Data missing for '${canvasId}'. Check penger.js/cube.js variable names.`);
        return;
    }

    game.width = game.clientWidth;
    game.height = game.clientHeight;
    const ctx = game.getContext("2d");

    const vs = modelData.vs;
    const fs = modelData.fs;
    let dz = 5; // Move object further back (z=5) so it doesn't clip
    let angle = 0;

    function clear() {
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, game.width, game.height);
    }

    function line(p1, p2) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = FOREGROUND;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    function screen(p) {
        return {
            x: (p.x + 1) / 2 * game.width,
            y: (1 - (p.y + 1) / 2) * game.height,
        };
    }

    function project({x, y, z}) {
        // Prevent divide by zero or negative z issues
        if (z <= 0) z = 0.1;
        return { x: x / z, y: y / z };
    }

    function translate_z({x, y, z}, offset) {
        return {x, y, z: z + offset};
    }

    function rotate_xz({x, y, z}, theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return {
            x: x * c - z * s,
            y: y,
            z: x * s + z * c,
        };
    }

    function frame() {
        const dt = 1 / FPS;
        angle += Math.PI * dt;

        clear();

        for (const f of fs) {
            for (let i = 0; i < f.length; ++i) {
                const a = vs[f[i]];
                const b = vs[f[(i + 1) % f.length]];

                // Rotate -> Translate (move away) -> Project -> Screen
                const p1 = screen(project(translate_z(rotate_xz(a, angle), dz)));
                const p2 = screen(project(translate_z(rotate_xz(b, angle), dz)));

                line(p1, p2);
            }
        }
        setTimeout(frame, 1000 / FPS);
    }

    frame();
}