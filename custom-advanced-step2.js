/**
 * USE CUSTOM VISUALIZATION IF YOU ARE VERY WELL VERSED ON JAVASCRIPT!!!!
 * WHEN YOU HAVE CUSTOM VISUALIZATIONS, PLEASE READ CAREFULLY THE INSTRUCTIONS 
 * BELOW IN ORDER TO MAKE YOUR CODE TO WORK. If you need more scope variables that
 * could be missing, please write to erro@splitmedialabs.com with the requested
 * scope variable with details.
 *
 * ### Development Notes ###
 *
 * You can pass your code ALMOST intact. Few modifications are needed to make your
 * code to work. Please read carefully this references notes in order to consider  
 * what to do to make your custom visualization code work properly.
 *
 *   ### DEBUGGING YOUR CODE ###
 * please enable developer mode on XBC and debug in http://localhost:9222
 * (default port used for XBC to debug sources) and look for 
 * 'XSplit Broadcaster Audio Visualizer' on the list of links. IN THAT WAY YOU CAN
 * DEBUG YOUR CODE IF THERE IS ANY ERROR OR IF THE VISUALIZATION DOESN'T WORK
 * PROPERLY
 *
 *   ### STRICT MODE ###
 *
 * Note that strict mode is enforced from the start up. If you have a visualization
 * that has bad notations or undefined calls, it will most likely throw you an error. 
 *
 *   ### Canvas Object and Visualizer Object ###
 *
 * The canvas object already exists on the visualization plugin:
 * <canvas id="visualizer"></canvas>
 * so you could use this to reference such DOM Object:


var canvas = document.getElementById('visualizer');
var visualizer = canvas.getContext('2d');

 * or use the existing reference passed by XBC_avz (canvas & visualizer):
 
var canvas = XBC_avz.canvas; 
var visualizer = XBC_avz.visualizer;

 *   ### AudioContext ###
 *
 * Audio context is already stored in window._audioContext, so If you want to extract 
 * or set any method or propertym you do not need to create a new AudioContext(). Use
 * the existing reference. WARNING: Creating new AudioContext() instances COULD RESULT
 * IN BREAKING THE SCRIPT.
 *
 *   ### Analyser Object ###
 * 
 * so If you want to create an analyzer, the answer is
 * var analyser = window._audioContext.createAnalyser()
 *
 * or you can use this if you want to save some time. Again it is under your 
 * convenience

var analyser = XBC_avz.analyser;

 * If you want to set getByteFrequencyData or getByteTimeDomainData for the analyser
 * you have to set the frequencyArray as follows:
 
 var frequencyArray = new Uint8Array(analyser.frequencyBinCount);

 *   ### FFTSIZE ###
 * The analyser uses the fttsize (bitsample) passed by the main configuration window.
 * so if you want to use the configuration options, please use XBC_avz.fftsize to use
 * its value against the analyzer:

var analyser = XBC_avz.analyser;
analyzer.fttSize = XBC_avz.fttsize;

 *   ### Media Stream Source ###
 *
 * By default, This plugin stores the stream in XBC_avz.stream, so you need 
 * to do:

var myMediaStream = window._audioContext.createMediaStreamSource(XBC_avz.stream)

 *
 * if you want to connect methods and properties of the Media Stream Source use 
 * XBC_avz.mediaStreamSource to call any method or property of the current
 * selected source. example:
 *
 * var myMediaStreamSource = XBC_avz.mediaStreamSource;
 * .
 * .
 * .
 * Visualization code
 * .
 * .
 * .
 * myMediaStreamSource.connect(analyzer);
 * 
 *
 *   ### fftSize ###
 *
 * the fftSize is defined on the main dialog window, and can be called user as follows:
 * analyser.fftSize = XBC_avz.fftSize;
 *
 *   ### requestAnimationFrame CALLBACKS AND ID ###
 *
 * When you setup a requstAnimationFrame in your function PLEASE bind the id of the 
 * request to window._requestAnimationFrame, so in case the plugin have to perform a 
 * cancelation of the drawing the plugin can stop the execution of the drawing function 
 * without breaking your visualization. this is an example on how to achieve this:

var myMediaStreamSource = XBC_avz.mediaStreamSource;
var drawFunction = function(){
    window._requestAnimationFrame = window.requestAnimationFrame(drawFunction);
    .
    .
    .
    animation code
    .
    .
    .
}
drawFunction();
myMediaStreamSource.connect(analyser);

 *
 *   ### CONTROLING FRAMERATE ###
 *
 * By default This plugin provides a framerate control for the two default visualizers
 * bars and osciloscope, while on custom it is always set to 60fps. If you want to
 * control your framerate you have to add the following code.
 *
 *  ## indicatons
 *  1. Use XBC_avz.fps to use the fps you set on the configuration dialog window, and use
 *  XBC_avz.displayfps to allow to see the framerate on screen.
 *
 *  2. insert this code before the function that creates the draw:

let fps = 0;
let lastRun;
let fpInterval,startTime,now,then,elapsed;
function showFPS(){
    ctx.fillStyle = "red";
    ctx.font      = "normal 16pt Arial";
    ctx.fillText(Math.floor(fps) + " fps", 10, 26);
}
fpsInterval = 1000 / XBC_avz.fps;
then = Date.now();
startTime = then;

 *  3. add this piece of code INSIDE of your drawing function BEFORE your code that
 *  performs the drawing. please see this example

var canvas = XBC_avz.canvas; 
var visualizer = XBC_avz.visualizer;
var analyser = XBC_avz.analyser;
analyzer.fttSize = XBC_avz.fttsize;

// ### START FRAMESKIP INITIALIZATION CODE
let fps = 0;
let lastRun;
let fpInterval,startTime,now,then,elapsed;
function showFPS(){
    visualizer.fillStyle = "red";
    visualizer.font      = "normal 16pt Arial";
    visualizer.fillText(Math.floor(fps) + " fps", 10, 26);
}
fpsInterval = 1000 / XBC_avz.fps;
then = Date.now();
startTime = then;
// END FRAMESKIP INITIALIZATION CODE

var drawFunction = function(){
    window._requestAnimationFrame = window.requestAnimationFrame(drawFunction);
    ..
    ..
    setup initial visualization settings
    ..
    ..
    // ### START FRAMESKIP CODE PART 1
    now = Date.now();
    elapsed = now - then;
    if(elapsed > fpsInterval){
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        var delta = (new Date().getTime() - lastRun)/1000;
        lastRun = new Date().getTime();
        fps = 1/delta;
        if(XBC_avz.displayfps){
            showFPS()
        }
        then = now - (elapsed % fpsInterval);
    // ## END FRAMESKIP CODE PART 1
        ..
        ..
        .. 
        your animation DRAWING code
        ..
        ..
        ..
    // ## START FRAMESKIP CODE PART 2
    }
    // ## END FRAMESKIP CODE PART 2

}
drawFunction();
myMediaStreamSource.connect(analyser);

 *
 * ############### INSERT YOUR CODE BELOW ################## 
 *
 */
//original script: https://codepen.io/tbogard/pen/EXmwBB

//original script: https://codepen.io/tbogard/pen/EXmwBB

var analyser          = XBC_avz.analyser;
var canvas            = XBC_avz.canvas;
var ctx               = XBC_avz.visualizer;
var mediaStreamSource = XBC_avz.mediaStreamSource;


var fftSize = XBC_avz.fftsize,

background_color = "rgba(0, 0, 1, 1)",
background_gradient_color_1 = "rgba(0, 0, 1, 1)",//"#000011",
background_gradient_color_2 = "rgba(0, 0, 1, 1)",//"#060D1F",
background_gradient_color_3 = "rgba(0, 0, 1, 1)",//"#02243F",

stars_color = "#465677",
stars_color_2 = "#B5BFD4",
stars_color_special = "#F451BA",
TOTAL_STARS = 1500,
STARS_BREAK_POINT = 140,
stars = [],

waveform_color = "rgba(29, 36, 57, 0.05)",
waveform_color_2 = "rgba(0,0,0,0)",
waveform_line_color = "rgba(157, 242, 157, 0.11)",
waveform_line_color_2 = "rgba(157, 242, 157, 0.8)",
waveform_tick = 0.05,
TOTAL_POINTS = fftSize / 2,
points = [],

bubble_avg_color = "rgba(29, 36, 57, 0.1)",
bubble_avg_color_2 = "rgba(29, 36, 57, 0.05)",
bubble_avg_line_color = "rgba(77, 218, 248, 1)",
bubble_avg_line_color_2 = "rgba(77, 218, 248, 1)",
bubble_avg_tick = 0.001,
TOTAL_AVG_POINTS = 64,
AVG_BREAK_POINT = 100,
avg_points = [],

SHOW_STAR_FIELD = true,
SHOW_WAVEFORM = true,
SHOW_AVERAGE = true,

AudioContext = window._audioContext,
floor = Math.floor,
round = Math.round,
random = Math.random,
sin = Math.sin,
cos = Math.cos,
PI = Math.PI,
PI_TWO = PI * 2,
PI_HALF = PI / 180,

w = 0,
h = 0,
cx = 0,
cy = 0,

playing = false,
startedAt, pausedAt,

rotation = 0,
avg, ctx, actx, asource, gainNode, frequencyData, frequencyDataLength, timeData;


// ### START FRAMESKIP INITIALIZATION CODE
let fps = 0;
let lastRun;
let fpInterval,startTime,now,then,elapsed;
function showFPS(){
    ctx.fillStyle = "red";
    ctx.font      = "normal 16pt Arial";
    ctx.fillText(Math.floor(fps) + " fps", 10, 26);
}
fpsInterval = 1000 / XBC_avz.fps;
then = Date.now();
startTime = then;
// END FRAMESKIP INITIALIZATION CODE

function initialize() {
    if (!AudioContext) {
        return featureNotSupported();
    }

    ctx = XBC_avz.visualizer;
    actx = window._audioContext;
    resizeHandler();
    initializeAudio();
}

function featureNotSupported() {
    hideLoader();
    return document.getElementById('no-audio').style.display = "block";
}

function hideLoader() {
    return document.getElementById('loading').className = "hide";
}

function updateLoadingMessage(text) {
    console.log(text)
}

function initializeAudio() {
    updateLoadingMessage("- Loading Audio Buffer -");
        analyser.fftSize = fftSize;
        analyser.minDecibels = -100;
        analyser.maxDecibels = -30;
        analyser.smoothingTimeConstant = 0.8;
        console.timeEnd('decoding audio data');
        console.log("- Ready -");
        gainNode = actx.createGain();
        gainNode.connect(analyser);
        /** if you enable this line, you can create a weird audio distortion of your audio source!!! */
        //analyser.connect(actx.destination);
    
        /**
         * We connect the audio source to the analizer:
         */
        mediaStreamSource.connect(analyser);
        frequencyDataLength = analyser.frequencyBinCount;
        frequencyData = new Uint8Array(frequencyDataLength);
        timeData = new Uint8Array(frequencyDataLength);

        createStarField();
        createPoints();
        animate();
}

function getAvg(values) {
    var value = 0;
    values.forEach(function(v) {
        value += v;
    })
    return value / values.length;
}

function clearCanvas() {
    var gradient = ctx.createLinearGradient(0, 0, 0, h);

    gradient.addColorStop(0, background_gradient_color_1);
    gradient.addColorStop(0.96, background_gradient_color_2);
    gradient.addColorStop(1, background_gradient_color_3);

    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fill();
    ctx.closePath();

    gradient = null;
}

function drawStarField() {
    var i, len, p, tick;

    for (i = 0, len = stars.length; i < len; i++) {
        p = stars[i];
        tick = (avg > AVG_BREAK_POINT) ? (avg/20) : (avg/50);
        p.x += p.dx * tick;
        p.y += p.dy * tick;
        p.z += p.dz;

        p.dx += p.ddx;
        p.dy += p.ddy;
        p.radius = 0.2 + ((p.max_depth - p.z) * .1);

        if (p.x < -cx || p.x > cx || p.y < -cy || p.y > cy) {
            stars[i] = new Star();
            continue;
        }

        ctx.beginPath();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = p.color;
        ctx.arc(p.x + cx, p.y + cy, p.radius, PI_TWO, false);
        ctx.fill();
        ctx.closePath();
    }

    i = len = p = tick = null;
}

function drawAverageCircle() {
    var i, len, p, value, xc, yc;

    if (avg > AVG_BREAK_POINT) {
        rotation += -bubble_avg_tick;
        value = avg + random() * 10;
        ctx.strokeStyle = bubble_avg_line_color_2;
        ctx.fillStyle = bubble_avg_color_2;
    } else {
        rotation += bubble_avg_tick;
        value = avg;
        ctx.strokeStyle = bubble_avg_line_color;
        ctx.fillStyle = bubble_avg_color;
    }

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    ctx.moveTo(avg_points[0].dx, avg_points[0].dy);

    for (i = 0, len = TOTAL_AVG_POINTS; i < len - 1; i ++) {
        p = avg_points[i];
        p.dx = p.x + value * sin(PI_HALF * p.angle);
        p.dy = p.y + value * cos(PI_HALF * p.angle);
        xc = (p.dx + avg_points[i+1].dx) / 2;
        yc = (p.dy + avg_points[i+1].dy) / 2;

        ctx.quadraticCurveTo(p.dx, p.dy, xc, yc);
    }

    p = avg_points[i];
    p.dx = p.x + value * sin(PI_HALF * p.angle);
    p.dy = p.y + value * cos(PI_HALF * p.angle);
    xc = (p.dx + avg_points[0].dx) / 2;
    yc = (p.dy + avg_points[0].dy) / 2;

    ctx.quadraticCurveTo(p.dx, p.dy, xc, yc);
    ctx.quadraticCurveTo(xc, yc, avg_points[0].dx, avg_points[0].dy);

    ctx.stroke();
    ctx.fill();
    ctx.restore();
    ctx.closePath();

    i = len = p = value = xc = yc = null;
}

function drawWaveform() {
    var i, len, p, value, xc, yc;

    if (avg > AVG_BREAK_POINT) {
        rotation += waveform_tick;
        ctx.strokeStyle = waveform_line_color_2;
        ctx.fillStyle = waveform_color_2;
    } else {
        rotation += -waveform_tick;
        ctx.strokeStyle = waveform_line_color;
        ctx.fillStyle = waveform_color;
    }

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy);

    ctx.moveTo(points[0].dx, points[0].dy);

    for (i = 0, len = TOTAL_POINTS; i < len - 1; i ++) {
        p = points[i];
        value = timeData[i];
        p.dx = p.x + value * sin(PI_HALF * p.angle);
        p.dy = p.y + value * cos(PI_HALF * p.angle);
        xc = (p.dx + points[i+1].dx) / 2;
        yc = (p.dy + points[i+1].dy) / 2;

        ctx.quadraticCurveTo(p.dx, p.dy, xc, yc);
    }

    value = timeData[i];
    p = points[i];
    p.dx = p.x + value * sin(PI_HALF * p.angle);
    p.dy = p.y + value * cos(PI_HALF * p.angle);
    xc = (p.dx + points[0].dx) / 2;
    yc = (p.dy +points[0].dy) / 2;

    ctx.quadraticCurveTo(p.dx, p.dy, xc, yc);
    ctx.quadraticCurveTo(xc, yc, points[0].dx, points[0].dy);

    ctx.stroke();
    ctx.fill();
    ctx.restore();
    ctx.closePath();

    i = len = p = value = xc = yc = null;
}

function animate() {
    window._requestAnimationFrame = window.requestAnimationFrame(animate);
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);
    avg = getAvg([].slice.call(frequencyData)) * gainNode.gain.value;
    clearCanvas();

     // ### START FRAMESKIP CODE PART 1
    now = Date.now();
    elapsed = now - then;
    if(elapsed > fpsInterval){
        ctx.clearRect(0, 0, XBC_avz.canvas.width, XBC_avz.canvas.height);
        var delta = (new Date().getTime() - lastRun)/1000;
        lastRun = new Date().getTime();
        fps = 1/delta;
        if(XBC_avz.displayfps){
            showFPS()
        }
        then = now - (elapsed % fpsInterval);
    // ## END FRAMESKIP CODE PART 1

    

    if (SHOW_STAR_FIELD) {
        drawStarField();
    }

    if (SHOW_AVERAGE) {
        drawAverageCircle();
    }

    if (SHOW_WAVEFORM) {
        drawWaveform();
    }

    // ## START FRAMESKIP CODE PART 2
    }
    // ## END FRAMESKIP CODE PART 2
}

function Star() {
    var xc, yc;

    this.x = Math.random() * w - cx;
    this.y = Math.random() * h - cy;
    this.z = this.max_depth = Math.max(w/h);
    this.radius = 0.2;

    xc = this.x > 0 ? 1 : -1;
    yc = this.y > 0 ? 1 : -1;

    if (Math.abs(this.x) > Math.abs(this.y)) {
        this.dx = 1.0;
        this.dy = Math.abs(this.y / this.x);
    } else {
        this.dx = Math.abs(this.x / this.y);
        this.dy = 1.0;
    }

    this.dx *= xc;
    this.dy *= yc;
    this.dz = -0.1;

    this.ddx = .001 * this.dx;
    this.ddy = .001 * this.dy;

    if (this.y > (cy/2)) {
        this.color = stars_color_2;
    } else {
        if (avg > AVG_BREAK_POINT + 10) {
            this.color = stars_color_2;
        } else if (avg > STARS_BREAK_POINT) {
            this.color = stars_color_special;
        } else {
            this.color = stars_color;
        }
    }

    xc = yc = null;
}

function createStarField() {
    var i = -1;

    while(++i < TOTAL_STARS) {
        stars.push(new Star());
    }

    i = null;
}

function Point(config) {
    this.index = config.index;
    this.angle = (this.index * 360) / TOTAL_POINTS;

    this.updateDynamics = function() {
        this.radius = Math.abs(w, h) / 10;
        this.x = cx + this.radius * sin(PI_HALF * this.angle);
        this.y = cy + this.radius * cos(PI_HALF * this.angle);
    }

    this.updateDynamics();

    this.value = Math.random() * 256;
    this.dx = this.x + this.value * sin(PI_HALF * this.angle);
    this.dy = this.y + this.value * cos(PI_HALF * this.angle);
}

function AvgPoint(config) {
    this.index = config.index;
    this.angle = (this.index * 360) / TOTAL_AVG_POINTS;

    this.updateDynamics = function() {
        this.radius = Math.abs(w, h) / 10;
        this.x = cx + this.radius * sin(PI_HALF * this.angle);
        this.y = cy + this.radius * cos(PI_HALF * this.angle);
    }

    this.updateDynamics();

    this.value = Math.random() * 256;
    this.dx = this.x + this.value * sin(PI_HALF * this.angle);
    this.dy = this.y + this.value * cos(PI_HALF * this.angle);
}

function createPoints() {
    var i;

    i = -1;
    while(++i < TOTAL_POINTS) {
        points.push(new Point({index: i+1}));
    }

    i = -1;
    while(++i < TOTAL_AVG_POINTS) {
        avg_points.push(new AvgPoint({index: i+1}));
    }

    i = null;
}

function resizeHandler() {
    w = window.innerWidth;
    h = window.innerHeight;
    cx = w / 2;
    cy = h / 2;

    ctx.canvas.width = w;
    ctx.canvas.height = h;

    points.forEach(function(p) {
        p.updateDynamics();
    });

    avg_points.forEach(function(p) {
        p.updateDynamics();
    });
}

initialize();