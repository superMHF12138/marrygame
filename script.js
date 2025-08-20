(function () {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const fxCanvas = document.getElementById('fx');
    const fx = fxCanvas.getContext('2d');
    const gridSize = 20; // 21x21 grid on 420 canvas
    const cells = canvas.width / gridSize;

    let snake = [{ x: 10, y: 10 }];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = spawnFood();
    let score = 0;
    let speedMs = 140;
    let timer = null;
    let paused = true;

    const scoreEl = document.getElementById('score');
    const finalScoreEl = document.getElementById('finalScore');
    const overlay = document.getElementById('overlay');

    function drawCell(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * gridSize + 2, y * gridSize + 2, gridSize - 4, gridSize - 4);
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function spawnFood() {
        let pos;
        while (true) {
            pos = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
            if (!snake.some(p => p.x === pos.x && p.y === pos.y)) break;
        }
        return pos;
    }

    function step() {
        if (paused) return;
        direction = nextDirection;
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        // wrap world
        head.x = (head.x + cells) % cells;
        head.y = (head.y + cells) % cells;

        // self collision
        if (snake.some(p => p.x === head.x && p.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            speedMs = Math.max(70, speedMs - 3);
            food = spawnFood();
            celebrate(head);
        } else {
            snake.pop();
        }

        render();
        schedule();
    }

    function render() {
        clear();
        // draw food with heart
        ctx.fillStyle = '#ff7aa2';
        drawHeart(food.x, food.y);
        // draw snake
        snake.forEach((p, i) => {
            const t = i / snake.length;
            const color = `hsl(${340 - t * 60} 90% ${60 - t * 20}%)`;
            drawCell(p.x, p.y, color);
        });
        scoreEl.textContent = String(score);
    }

    function drawHeart(cx, cy) {
        const x = cx * gridSize + gridSize / 2;
        const y = cy * gridSize + gridSize / 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.7, 0.7);
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(0, -4, -10, -4, -10, 6);
        ctx.bezierCurveTo(-10, 16, 0, 20, 0, 26);
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(0, -4, 10, -4, 10, 6);
        ctx.bezierCurveTo(10, 16, 0, 20, 0, 26);
        ctx.fillStyle = '#ff4d79';
        ctx.fill();
        ctx.restore();
    }

    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(step, speedMs);
    }

    function gameOver() {
        paused = true;
        finalScoreEl.textContent = String(score);
        overlay.classList.remove('hidden');
        confetti();
    }

    function celebrate(head) {
        fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14;
            const len = 10 + Math.random() * 10;
            const x = head.x * gridSize + gridSize / 2;
            const y = head.y * gridSize + gridSize / 2;
            fx.strokeStyle = `hsl(${Math.random() * 40 + 330} 90% 70%)`;
            fx.beginPath();
            fx.moveTo(x, y);
            fx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            fx.stroke();
        }
    }

    function confetti() {
        const particles = Array.from({ length: 80 }).map(() => ({
            x: Math.random() * fxCanvas.width,
            y: -10 - Math.random() * 100,
            s: Math.random() * 2 + 1,
            c: `hsl(${Math.random() * 40 + 330} 90% 70%)`
        }));
        let raf;
        (function tick() {
            fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
            particles.forEach(p => {
                p.y += p.s * 1.2;
                fx.fillStyle = p.c;
                fx.fillRect(p.x, p.y, p.s, p.s * 3);
            });
            raf = requestAnimationFrame(tick);
            setTimeout(() => cancelAnimationFrame(raf), 2000);
        })();
    }

    function start() {
        if (!paused) return;
        paused = false;
        schedule();
    }

    function pause() {
        paused = true;
    }

    function restart() {
        snake = [{ x: 10, y: 10 }];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        food = spawnFood();
        score = 0;
        speedMs = 140;
        paused = true;
        overlay.classList.add('hidden');
        fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        render();
    }

    // controls
    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('pauseBtn').addEventListener('click', pause);
    document.getElementById('restartBtn').addEventListener('click', restart);
    document.getElementById('overlayRestart').addEventListener('click', () => { restart(); start(); });

    function setDirectionByKey(key) {
        if (key === 'ArrowUp' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        else if (key === 'ArrowDown' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
        else if (key === 'ArrowLeft' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        else if (key === 'ArrowRight' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
    }

    document.addEventListener('keydown', (e) => {
        setDirectionByKey(e.key);
    });

    // on-screen mobile keys (click/touch)
    const keysContainer = document.querySelector('.mobile-keys');
    if (keysContainer) {
        const block = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
        ['touchstart', 'touchmove', 'touchend'].forEach(t => keysContainer.addEventListener(t, block, { passive: false }));
        keysContainer.addEventListener('pointerdown', block);
    }
    document.querySelectorAll('.mobile-keys button').forEach(btn => {
        const key = btn.getAttribute('data-key');
        const handle = (ev) => { ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); setDirectionByKey(key); if (paused) start(); };
        btn.addEventListener('click', handle);
        btn.addEventListener('touchstart', handle, { passive: false });
        btn.addEventListener('pointerdown', handle);
    });

    // QR code - auto render
    const qrcodeEl = document.getElementById('qrcode');
    const currentUrlEl = document.getElementById('currentUrl');
    const statusEl = document.getElementById('qrStatus');

    function setLoading(on) {
        if (on) qrcodeEl.classList.add('loading'); else qrcodeEl.classList.remove('loading');
    }

    function makeQR(text) {
        qrcodeEl.innerHTML = '';
        let usedFallback = false;
        if (window.QRCode) {
            try {
                new QRCode(qrcodeEl, { text, width: 160, height: 160, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
            } catch { usedFallback = true; }
        } else usedFallback = true;
        if (usedFallback) {
            const img = new Image();
            img.alt = '二维码'; img.width = 160; img.height = 160;
            img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(text);
            qrcodeEl.appendChild(img);
        }
        currentUrlEl.textContent = text;
    }

    async function fetchPublicUrlSmart(totalMs) {
        // 如果是 GitHub Pages，直接使用当前地址，极速出码
        if (/github\.io$/.test(location.hostname)) {
            return location.href;
        }
        const start = Date.now();
        while (Date.now() - start < totalMs) {
            try {
                const resp = await fetch('public_url.txt', { cache: 'no-store' });
                if (resp.ok) {
                    const txt = (await resp.text()).trim();
                    if (/^https?:\/\//.test(txt)) return txt;
                }
            } catch { }
            // 5 秒后回退到当前地址，避免久等
            if (Date.now() - start > 5000) return location.href;
            await new Promise(r => setTimeout(r, 500));
        }
        return location.href;
    }

    (async function initQrAuto() {
        statusEl.textContent = '正在获取访问地址…';
        setLoading(true);
        const url = await fetchPublicUrlSmart(15000); // 最多等 15 秒
        makeQR(url);
        statusEl.textContent = '扫码直达';
        setLoading(false);
    })();

    // init game
    restart();
})(); 