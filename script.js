const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const figureCounter = document.getElementById('figure-counter');
const instruction = document.getElementById('instruction');
const figureName = document.getElementById('figure-name');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const resetButton = document.getElementById('resetButton');

// --- State Variables ---
let currentFigureIndex = 0;
let connectedPoints = [];
let isCompleted = false;
let particles = [];
let scale = 1;
const originalCanvasSize = { width: 800, height: 600 };

// --- Audio & Speech ---
let audioCtx;
const numberWords = ['', 'Vienas', 'Du', 'Trys', 'Keturi', 'Penki', 'Šeši', 'Septyni', 'Aštuoni', 'Devyni', 'Dešimt', 'Vienuolika', 'Dvylika', 'Trylika'];

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'lt-LT';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function playSound(type) {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("AudioContext not supported.");
            return;
        }
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
    } else if (type === 'complete') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        setTimeout(() => oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1), 100);
        setTimeout(() => oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2), 200);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    } else if (type === 'wrong') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
    }

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// --- Figures Data ---
const figures = [
    { name: 'Namas', isClosed: true, points: [{x:400,y:150},{x:600,y:300},{x:600,y:500},{x:200,y:500},{x:200,y:300}] },
    { name: 'Žvaigždė', isClosed: true, points: [{x:400,y:100},{x:450,y:250},{x:600,y:250},{x:475,y:350},{x:525,y:500},{x:400,y:400},{x:275,y:500},{x:325,y:350},{x:200,y:250},{x:350,y:250}] },
    { name: 'Raketa', isClosed: true, points: [{x:400,y:100},{x:450,y:200},{x:450,y:400},{x:500,y:500},{x:300,y:500},{x:350,y:400},{x:350,y:200}] },
    { name: 'Gėlė', isClosed: true, points: [{x:400,y:300},{x:400,y:200},{x:500,y:200},{x:500,y:300},{x:600,y:300},{x:600,y:400},{x:500,y:400},{x:500,y:500},{x:400,y:500},{x:400,y:400},{x:300,y:400},{x:300,y:300}] },
    { name: 'Drugelis', isClosed: true, points: [{x:400,y:350},{x:550,y:200},{x:600,y:250},{x:550,y:350},{x:600,y:450},{x:550,y:500},{x:400,y:350},{x:250,y:500},{x:200,y:450},{x:250,y:350},{x:200,y:250},{x:250,y:200}] },
    { name: 'Valtis', isClosed: false, points: [{x:200,y:400},{x:600,y:400},{x:500,y:500},{x:300,y:500},{x:200,y:400},{x:400,y:400},{x:400,y:200},{x:450,y:250},{x:400,y:250}] },
    { name: 'Medis', isClosed: false, points: [{x:400,y:500},{x:400,y:400},{x:300,y:400},{x:350,y:300},{x:300,y:250},{x:400,y:200},{x:500,y:250},{x:450,y:300},{x:500,y:400},{x:400,y:400}] },
    { name: 'Automobilis', isClosed: false, points: [{x:200,y:400},{x:250,y:300},{x:550,y:300},{x:600,y:400},{x:200,y:400},{x:250,y:450},{x:350,y:450},{x:350,y:400},{x:450,y:400},{x:450,y:450},{x:550,y:450},{x:550,y:400}] },
    { name: 'Žuvis', isClosed: true, points: [{x:250,y:300},{x:400,y:250},{x:600,y:300},{x:550,y:350},{x:600,y:400},{x:400,y:450},{x:250,y:400},{x:300,y:350}] },
    { name: 'Katinas', isClosed: false, points: [{x:400,y:200},{x:350,y:150},{x:450,y:150},{x:400,y:200},{x:400,y:400},{x:300,y:500},{x:500,y:500},{x:400,y:400}] },
    { name: 'Šuo', isClosed: true, points: [{x:300,y:200},{x:500,y:200},{x:550,y:250},{x:550,y:350},{x:500,y:400},{x:300,y:400},{x:250,y:350},{x:250,y:250}] },
    { name: 'Sraigė', isClosed: true, points: [{x:400,y:300},{x:350,y:250},{x:400,y:200},{x:450,y:250},{x:450,y:350},{x:400,y:400},{x:350,y:350},{x:350,y:300}] },
    { name: 'Dramblys', isClosed: true, points: [{x:250,y:200},{x:350,y:150},{x:500,y:150},{x:600,y:250},{x:550,y:400},{x:450,y:500},{x:350,y:400},{x:300,y:300}] },
    { name: 'Ananasas', isClosed: false, points: [{x:400,y:150},{x:450,y:100},{x:400,y:150},{x:350,y:100},{x:400,y:150},{x:400,y:200},{x:300,y:300},{x:500,y:300},{x:400,y:500},{x:300,y:300}] },
    { name: 'Braškė', isClosed: false, points: [{x:400,y:200},{x:350,y:150},{x:450,y:150},{x:400,y:200},{x:300,y:300},{x:500,y:300},{x:400,y:450},{x:300,y:300}] },
    { name: 'Kriaušė', isClosed: false, points: [{x:400,y:150},{x:350,y:250},{x:450,y:250},{x:400,y:150},{x:400,y:200},{x:300,y:350},{x:500,y:350},{x:400,y:450},{x:300,y:350}] },
    { name: 'Obuolys', isClosed: false, points: [{x:400,y:200},{x:300,y:250},{x:300,y:350},{x:400,y:450},{x:500,y:350},{x:500,y:250},{x:400,y:200},{x:400,y:150},{x:420,y:150}] },
    { name: 'Vynuogės', isClosed: false, points: [{x:400,y:150},{x:350,y:200},{x:450,y:200},{x:400,y:150},{x:380,y:250},{x:420,y:250},{x:350,y:300},{x:450,y:300},{x:400,y:350}] },
    { name: 'Kivis', isClosed: true, points: [{x:400,y:200},{x:300,y:250},{x:300,y:350},{x:400,y:400},{x:500,y:350},{x:500,y:250}] },
    { name: 'Apelsinas', isClosed: true, points: [{x:400,y:200},{x:300,y:300},{x:400,y:400},{x:500,y:300}] },
    { name: 'Citrina', isClosed: true, points: [{x:350,y:250},{x:450,y:250},{x:500,y:300},{x:450,y:350},{x:350,y:350},{x:300,y:300}] },
    { name: 'Bananas', isClosed: true, points: [{x:300,y:200},{x:400,y:150},{x:500,y:200},{x:550,y:300},{x:500,y:350},{x:400,y:400},{x:300,y:350},{x:250,y:250}] },
    { name: 'Arbūzas', isClosed: true, points: [{x:200,y:400},{x:600,y:400},{x:400,y:200}] },
    { name: 'Melionas', isClosed: true, points: [{x:300,y:250},{x:500,y:250},{x:600,y:350},{x:500,y:450},{x:300,y:450},{x:200,y:350}] },
    { name: 'Krabas', isClosed: false, points: [{x:400,y:300},{x:300,y:250},{x:200,y:300},{x:300,y:350},{x:200,y:400},{x:300,y:400},{x:400,y:300},{x:500,y:250},{x:600,y:300},{x:500,y:350},{x:600,y:400},{x:500,y:400},{x:400,y:300}] },
];

// --- Drawing & Animation ---
function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;
    scale = size / originalCanvasSize.width;
}

function getScaledPoint(point) {
    const scaledX = point.x * scale;
    const scaledY = point.y * scale;
    return { x: scaledX, y: scaledY };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const figure = figures[currentFigureIndex];
    const scaledPoints = figure.points.map(getScaledPoint);
    const nextPointIndex = connectedPoints.length;

    // Draw filled shape
    if (isCompleted) {
        ctx.beginPath();
        const startPoint = scaledPoints[0];
        ctx.moveTo(startPoint.x, startPoint.y);
        for (let i = 1; i < scaledPoints.length; i++) {
            ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
        }
        if (figure.isClosed) ctx.closePath();
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.fill();
    }

    // Draw lines
    if (connectedPoints.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = '#666';
        const startPoint = scaledPoints[connectedPoints[0] - 1];
        ctx.moveTo(startPoint.x, startPoint.y);
        for (let i = 1; i < connectedPoints.length; i++) {
            const point = scaledPoints[connectedPoints[i] - 1];
            ctx.lineTo(point.x, point.y);
        }
        if (isCompleted && figure.isClosed) {
             ctx.lineTo(scaledPoints[0].x, scaledPoints[0].y);
        }
        ctx.stroke();
    }

    // Draw points
    scaledPoints.forEach((point, index) => {
        const pointNumber = index + 1;
        let radius = 15 * scale;
        
        // Pulsating effect for the next point
        if (pointNumber === nextPointIndex + 1 && !isCompleted) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
            radius = 15 * scale * pulse;
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = connectedPoints.includes(pointNumber) ? '#4CAF50' : '#ddd';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = `${16 * scale}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pointNumber, point.x, point.y);
    });

    updateAndDrawParticles();
    requestAnimationFrame(draw);
}

function handleClick(event) {
    event.preventDefault();
    if (!audioCtx) playSound(); // Initialize audio on first user interaction

    const rect = canvas.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;
    
    const figure = figures[currentFigureIndex];
    const scaledPoints = figure.points.map(getScaledPoint);
    const nextPointIndex = connectedPoints.length;

    if (isCompleted) return;

    if (nextPointIndex < figure.points.length) {
        const point = scaledPoints[nextPointIndex];
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);

        if (distance < 20 * scale) { // Larger touch area
            playSound('click');
            speak(numberWords[nextPointIndex + 1] || '');
            connectedPoints.push(nextPointIndex + 1);
            
            const nextInstruction = connectedPoints.length + 1;
            if (nextInstruction > figure.points.length) {
                instruction.textContent = 'Valio!';
            } else {
                instruction.textContent = `Spausk tašką: ${nextInstruction}`;
            }

            if (connectedPoints.length === figure.points.length) {
                isCompleted = true;
                figureName.textContent = figure.name;
                playSound('complete');
                speak(figure.name);
                createParticles(point.x, point.y);
            }
        } else {
            playSound('wrong');
            if (navigator.vibrate) navigator.vibrate(100);
            speak(`Bandyk dar kartą. Ieškok skaičiaus ${numberWords[nextPointIndex + 1]}.`);
        }
    }
}

// --- Game Logic ---
function reset() {
    connectedPoints = [];
    isCompleted = false;
    particles = [];
    figureName.textContent = '';
    instruction.textContent = 'Spausk tašką: 1';
    window.speechSynthesis.cancel();
}

function changeFigure(offset) {
    currentFigureIndex = (currentFigureIndex + offset + figures.length) % figures.length;
    figureCounter.textContent = `Figūra ${currentFigureIndex + 1} / ${figures.length}`;
    reset();
}

function createParticles(x, y) {
    for (let i = 0; i < 50; i++) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, alpha: 1, color: `hsl(${Math.random() * 360}, 100%, 50%)` });
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
        ctx.globalAlpha = 1;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

// --- Event Listeners ---
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('pointerdown', handleClick);
resetButton.addEventListener('click', () => changeFigure(0));
prevButton.addEventListener('click', () => changeFigure(-1));
nextButton.addEventListener('click', () => changeFigure(1));

// --- Initial Load ---
resizeCanvas();
changeFigure(0);
requestAnimationFrame(draw);

