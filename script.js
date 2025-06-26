const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const figureCounter = document.getElementById('figure-counter');
const instruction = document.getElementById('instruction');
const figureName = document.getElementById('figure-name');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const resetButton = document.getElementById('resetButton');
const modeToggleButton = document.getElementById('modeToggleButton');

// --- State Variables ---
let currentFigureIndex = 0;
let connectedPoints = [];
let isCompleted = false;
let particles = [];
let currentScale = 1;
let offsetX = 0;
let offsetY = 0;
let nextFigureTimeout = null;
let gameMode = 'connect'; // 'connect' or 'recognize'
let targetNumber = 1; // For recognize mode
const padding = 50; // Padding around the figure

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
    { name: 'Namas', isClosed: true, points: [
        {x:400,y:150},{x:600,y:300},{x:600,y:500},{x:200,y:500},{x:200,y:300}
    ] },
    { name: 'Žvaigždė', isClosed: true, points: [
        {x:400,y:100},{x:450,y:250},{x:600,y:250},{x:475,y:350},{x:525,y:500},{x:400,y:400},{x:275,y:500},{x:325,y:350},{x:200,y:250},{x:350,y:250}
    ] },
    { name: 'Raketa', isClosed: true, points: [
        {x:400,y:100},{x:450,y:200},{x:450,y:400},{x:500,y:500},{x:300,y:500},{x:350,y:400},{x:350,y:200}
    ] },
    { name: 'Gėlė', isClosed: true, points: [
        {x:400,y:300},{x:400,y:200},{x:500,y:200},{x:500,y:300},{x:600,y:300},{x:600,y:400},{x:500,y:400},{x:500,y:500},{x:400,y:500},{x:400,y:400},{x:300,y:400},{x:300,y:300}
    ] },
    { name: 'Drugelis', isClosed: true, points: [
        {x:400,y:350},{x:550,y:200},{x:600,y:250},{x:550,y:350},{x:600,y:450},{x:550,y:500},{x:400,y:350},{x:250,y:500},{x:200,y:450},{x:250,y:350},{x:200,y:250},{x:250,y:200}
    ] },
    { name: 'Valtis', isClosed: false, points: [
        {x:200,y:400},{x:600,y:400},{x:500,y:500},{x:300,y:500},{x:200,y:400},{x:400,y:400},{x:400,y:200},{x:450,y:250},{x:400,y:250}
    ] },
    { name: 'Medis', isClosed: false, points: [
        {x:400,y:500},{x:400,y:400},{x:300,y:400},{x:350,y:300},{x:300,y:250},{x:400,y:200},{x:500,y:250},{x:450,y:300},{x:500,y:400},{x:400,y:400}
    ] },
    { name: 'Automobilis', isClosed: false, points: [
        {x:200,y:400},{x:250,y:300},{x:550,y:300},{x:600,y:400},{x:200,y:400},{x:250,y:450},{x:350,y:450},{x:350,y:400},{x:450,y:400},{x:450,y:450},{x:550,y:450},{x:550,y:400}
    ] },
    { name: 'Žuvis', isClosed: true, points: [
        {x:250,y:300},{x:400,y:250},{x:600,y:300},{x:550,y:350},{x:600,y:400},{x:400,y:450},{x:250,y:400},{x:300,y:350}
    ] },
    { name: 'Katinas', isClosed: false, points: [
        {x:400,y:200},{x:350,y:150},{x:450,y:150},{x:400,y:200},{x:400,y:400},{x:300,y:500},{x:500,y:500},{x:400,y:400}
    ] },
    { name: 'Šuo', isClosed: true, points: [
        {x:300,y:200},{x:500,y:200},{x:550,y:250},{x:550,y:350},{x:500,y:400},{x:300,y:400},{x:250,y:350},{x:250,y:250}
    ] },
    { name: 'Sraigė', isClosed: true, points: [
        {x:400,y:300},{x:350,y:250},{x:400,y:200},{x:450,y:250},{x:450,y:350},{x:400,y:400},{x:350,y:350},{x:350,y:300}
    ] },
    { name: 'Dramblys', isClosed: true, points: [
        {x:250,y:200},{x:350,y:150},{x:500,y:150},{x:600,y:250},{x:550,y:400},{x:450,y:500},{x:350,y:400},{x:300,y:300}
    ] },
    { name: 'Ananasas', isClosed: false, points: [
        {x:400,y:150},{x:450,y:100},{x:400,y:150},{x:350,y:100},{x:400,y:150},{x:400,y:200},{x:300,y:300},{x:500,y:300},{x:400,y:500},{x:300,y:300}
    ] },
    { name: 'Braškė', isClosed: false, points: [
        {x:400,y:200},{x:350,y:150},{x:450,y:150},{x:400,y:200},{x:300,y:300},{x:500,y:300},{x:400,y:450},{x:300,y:300}
    ] },
    { name: 'Kriaušė', isClosed: false, points: [
        {x:400,y:150},{x:350,y:250},{x:450,y:250},{x:400,y:150},{x:400,y:200},{x:300,y:350},{x:500,y:350},{x:400,y:450},{x:300,y:350}
    ] },
    { name: 'Obuolys', isClosed: false, points: [
        {x:400,y:200},{x:300,y:250},{x:300,y:350},{x:400,y:450},{x:500,y:350},{x:500,y:250},{x:400,y:200},{x:400,y:150},{x:420,y:150}
    ] },
    { name: 'Vynuogės', isClosed: false, points: [
        {x:400,y:150},{x:350,y:200},{x:450,y:200},{x:400,y:150},{x:380,y:250},{x:420,y:250},{x:350,y:300},{x:450,y:300},{x:400,y:350}
    ] },
    { name: 'Kivis', isClosed: true, points: [
        {x:400,y:200},{x:300,y:250},{x:300,y:350},{x:400,y:400},{x:500,y:350},{x:500,y:250}
    ] },
    { name: 'Apelsinas', isClosed: true, points: [
        {x:400,y:200},{x:300,y:300},{x:400,y:400},{x:500,y:300}
    ] },
    { name: 'Citrina', isClosed: true, points: [
        {x:350,y:250},{x:450,y:250},{x:500,y:300},{x:450,y:350},{x:350,y:350},{x:300,y:300}
    ] },
    { name: 'Bananas', isClosed: true, points: [
        {x:300,y:200},{x:400,y:150},{x:500,y:200},{x:550,y:300},{x:500,y:350},{x:400,y:400},{x:300,y:350},{x:250,y:250}
    ] },
    { name: 'Arbūzas', isClosed: true, points: [
        {x:200,y:400},{x:600,y:400},{x:400,y:200}
    ] },
    { name: 'Melionas', isClosed: true, points: [
        {x:300,y:250},{x:500,y:250},{x:600,y:350},{x:500,y:450},{x:300,y:450},{x:200,y:350}
    ] },
    { name: 'Krabas', isClosed: false, points: [
        {x:400,y:300},{x:300,y:250},{x:200,y:300},{x:300,y:350},{x:200,y:400},{x:300,y:400},{x:400,y:300},{x:500,y:250},{x:600,y:300},{x:500,y:350},{x:600,y:400},{x:500,y:400},{x:400,y:300}
    ] }
];

// --- Drawing & Animation ---
function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight);
    
    // Get the device pixel ratio, falling back to 1. 
    const dpr = window.devicePixelRatio || 1;

    // Set the canvas's internal size to be scaled by the DPR
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Set the canvas's CSS size to match the desired display size
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    // Scale the context to ensure drawing operations are consistent
    ctx.scale(dpr, dpr);

    // Calculate bounding box of the current figure
    const figure = figures[currentFigureIndex];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    figure.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });

    const figureWidth = maxX - minX;
    const figureHeight = maxY - minY;

    // Calculate scale to fit the figure within the canvas with padding
    const scaleX = (size - 2 * padding) / figureWidth;
    const scaleY = (size - 2 * padding) / figureHeight;
    currentScale = Math.min(scaleX, scaleY);

    // Calculate offset to center the figure
    offsetX = (size - figureWidth * currentScale) / 2 - minX * currentScale;
    offsetY = (size - figureHeight * currentScale) / 2 - minY * currentScale;
}

function getScaledPoint(point) {
    const scaledX = point.x * currentScale + offsetX;
    const scaledY = point.y * currentScale + offsetY;
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
        ctx.lineWidth = 3 * currentScale;
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
    for (let i = 0; i < figure.points.length; i++) {
        const point = scaledPoints[i];
        const pointNumber = i + 1;
        let radius = 15 * currentScale;
        
        // Pulsating effect for the next point in connect mode, or target number in recognize mode
        if (!isCompleted) {
            if (gameMode === 'connect' && pointNumber === connectedPoints.length + 1) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
                radius = 15 * currentScale * pulse;
            } else if (gameMode === 'recognize' && pointNumber === targetNumber) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
                radius = 15 * currentScale * pulse;
            }
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = connectedPoints.includes(pointNumber) ? '#4CAF50' : '#ddd';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2 * currentScale;
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = `${16 * currentScale}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pointNumber, point.x, point.y);
    }

    updateAndDrawParticles();
    requestAnimationFrame(draw);
}

function handleClick(event) {
    event.preventDefault();
    if (!audioCtx) playSound(); // Initialize audio on first user interaction

    const rect = canvas.getBoundingClientRect();
    const x = ((event.touches ? event.touches[0].clientX : event.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((event.touches ? event.touches[0].clientY : event.clientY) - rect.top) * (canvas.height / rect.height);
    
    const figure = figures[currentFigureIndex];
    const scaledPoints = figure.points.map(getScaledPoint);

    if (isCompleted) return;

    if (gameMode === 'connect') {
        const nextPointIndex = connectedPoints.length;
        if (nextPointIndex < figure.points.length) {
            const point = scaledPoints[nextPointIndex];
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);

            if (distance < 20 * currentScale) { // Larger touch area
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
                    nextFigureTimeout = setTimeout(() => {
                        changeFigure(1);
                    }, 3000); // 3 seconds delay
                }
            } else {
                playSound('wrong');
                if (navigator.vibrate) navigator.vibrate(100);
                speak(`Bandyk dar kartą. Ieškok skaičiaus ${numberWords[nextPointIndex + 1]}.`);
            }
        }
    } else if (gameMode === 'recognize') {
        let clickedPointNumber = -1;
        for (let i = 0; i < scaledPoints.length; i++) {
            const point = scaledPoints[i];
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < 20 * currentScale) {
                clickedPointNumber = i + 1;
                break;
            }
        }

        if (clickedPointNumber === targetNumber) {
            playSound('click');
            speak(numberWords[targetNumber] || '');
            connectedPoints.push(targetNumber);
            targetNumber++;
            if (targetNumber > figure.points.length) {
                isCompleted = true;
                figureName.textContent = figure.name;
                instruction.textContent = 'Valio!';
                playSound('complete');
                speak(figure.name);
                createParticles(scaledPoints[scaledPoints.length - 1].x, scaledPoints[scaledPoints.length - 1].y);
                nextFigureTimeout = setTimeout(() => {
                    changeFigure(1);
                }, 3000); // 3 seconds delay
            } else {
                instruction.textContent = `Rask skaičių: ${numberWords[targetNumber]}`;
                speak(numberWords[targetNumber]);
            }
        } else if (clickedPointNumber !== -1) { // Clicked on a wrong point
            playSound('wrong');
            if (navigator.vibrate) navigator.vibrate(100);
            speak(`Bandyk dar kartą. Rask skaičių ${numberWords[targetNumber]}.`);
        }
    }
}

function toggleGameMode() {
    window.speechSynthesis.cancel();
    if (gameMode === 'connect') {
        gameMode = 'recognize';
        instruction.textContent = `Rask skaičių: ${numberWords[targetNumber]}`;
        speak(`Skaičių atpažinimo režimas. Rask skaičių ${numberWords[targetNumber]}.`);
    } else {
        gameMode = 'connect';
        instruction.textContent = `Spausk tašką: 1`;
        speak(`Sujungimo režimas. Spausk tašką 1.`);
    }
    reset();
}

// --- Game Logic ---
function reset() {
    connectedPoints = [];
    isCompleted = false;
    particles = [];
    figureName.textContent = '';
    instruction.textContent = 'Spausk tašką: 1';
    window.speechSynthesis.cancel();
    if (nextFigureTimeout) {
        clearTimeout(nextFigureTimeout);
        nextFigureTimeout = null;
    }
    targetNumber = 1; // Reset target number for recognize mode
    resizeCanvas(); // Recalculate scale and offset on reset
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
modeToggleButton.addEventListener('click', toggleGameMode);

// --- Initial Load ---
resizeCanvas();
changeFigure(0);
requestAnimationFrame(draw);


