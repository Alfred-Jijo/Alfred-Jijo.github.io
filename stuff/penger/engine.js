const BACKGROUND = "#101010"
const FOREGROUND = "#50FF50"
const FPS = 60;

function start3DInstance(canvasId, modelData) {
    const game = document.getElementById(canvasId);

    game.width = game.clientWidth;
    game.height = game.clientHeight;

    const ctx = game.getContext("2d");

    const vs = modelData.vs;
    const fs = modelData.fs;
    let dz = 4;
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
        // -1..1 => 0..2 => 0..1 => 0..w
        return {
            x: (p.x + 1) / 2 * game.width,
            y: (1 - (p.y + 1) / 2) * game.height,
        }
    }

    function project({x, y, z}) {
        if (z === 0) z = 0.01; // prevent divide by zero
        return {
            x: x / z,
            y: y / z,
        }
    }

    function translate_z({x, y, z}, dz) {
        return {x, y, z: z + dz};
    }

    function rotate_xz({x, y, z}, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
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

                // Chain the transformations
                const p1 = screen(project(translate_z(rotate_xz(a, angle), dz)));
                const p2 = screen(project(translate_z(rotate_xz(b, angle), dz)));

                line(p1, p2);
            }
        }

        setTimeout(frame, 1000 / FPS);
    }

    frame();
}