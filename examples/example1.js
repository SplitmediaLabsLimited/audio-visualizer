/**
 * Copyright (c) 2017 Split Media Labs, All rights reserved.
 * <licenseinfo@splitmedialabs.com>
 * 
 * You may only use this file subject to direct and explicit grant of rights by Split Media Labs,
 * either by written license agreement or written permission.
 * 
 * You may use this file in its original or modified form solely for the purpose, and subject to the terms,
 * stipulated by the license agreement or permission.
 * 
 * If you have not received this file in source code format directly from Split Media Labs,
 * then you have no right to use this file or any part hereof.
 * Please delete all traces of the file from your system and notify Split Media Labs immediately.
 */

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