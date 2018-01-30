/** 
 * code formatted properly for the visualizer.
 * I have cleaned up the unnecesary functions and initializations.
 */
var analyser          = XBC_avz.analyser;
var canvas            = XBC_avz.canvas;
var ctx               = XBC_avz.visualizer;
var mediaStreamSource = XBC_avz.mediaStreamSource;
canvas.width          = window.innerWidth;
canvas.height         = window.innerHeight;
analyser.fftSize      = XBC_avz.fftsize;
var bufferLength      = analyser.frequencyBinCount;
var dataArray         = new Uint8Array(bufferLength);
var WIDTH             = canvas.width;
var HEIGHT            = canvas.height;
var barWidth          = (WIDTH / bufferLength) * 2.5;
var barHeight;
var x                 = 0;

function renderFrame() {
    requestAnimationFrame(renderFrame);
    x = 0;
    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        var r = barHeight + (25 * (i/bufferLength));
        var g = 250 * (i/bufferLength);
        var b = 50;
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}
renderFrame();
mediaStreamSource.connect(analyser);