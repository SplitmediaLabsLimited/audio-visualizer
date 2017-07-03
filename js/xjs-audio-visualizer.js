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
let xjs = require('xjs');
"use strict";
/**
 * [XBCAudioVisualizer is a class that allows the manipulation of audio visualizations]
 */
var XBCAudioVisualizer = function(config = {}) {

    /**
     * [config contains all the needed information to startup]
     * @type {[type]}
     */
    this.config = config;
    /**
     * [_defaults a queueable object where we can merge local defaults with defaults of the user.]
     * @type {Object}
     */
    this._defaults = {};
    /**
     * [paths is an array that will display multiple visualizations when used on frequece bars]
     * @type {[type]}
     */
    this.paths = null;
    /**
     * [path indicated the individual path to be treated into the array ]
     * @type {[type]}
     */
    this.path = null;
    /**
     * [visualizer is the DOM ELEMENT that contains the visualizer]
     * @type {[type]}
     */
    this.visualizer = null;
    /**
     * [mask is the DOM ELEMENT that contain the mask to be used.]
     * @type {[type]}
     */
    this.mask = null;
    /**
     * [AudioContext is an instance of AudioContext Browser Worker]
     * @type {AudioContext}
     */
    this.audioContent = null;

    /**
     * [mediaStreamSource is a handler for the audio stream]
     * @type {null}
     */
    this.mediaStreamSource = null;

    /**
     * [analyser is an object that will help with analysing the wave.]
     * @type {[type]}
     */
    this.analyser = null;
    /**
     * [enableLog enables/disables internal logs]
     * @type {Boolean}
     */
    this.enableLog = true;

    /**
     * [canvas container]
     * @type {[type]}
     */
    this.canvas = null;

    /**
     * [temp is used for math operations that could involve temporary values to be used.]
     * @type {Number}
     */
    this.temp = 0;


    this.log = (args) => {
        var self = this;
        if (self.enableLog) {
            $("#log").text(args);
        }
    }
    /**
     * [description]
     * @param  {[type]} visualizerId [description]
     * @param  {[type]} maskId       [description]
     * @return {[type]}              [description]
     */
    this.prepare = (visualizerId, maskId) => {
        var self = this;
        self.paths = document.getElementsByTagName('path');
        //self.visualizer = document.getElementById(visualizerId);
        //self.mask = visualizer.getElementById(maskId); 
    }

    /**
     * [clearCanvas clears the canvas in each redraw]
     */
    this.clearCanvas = () => {
        var self = this;
        self.visualizer.beginPath();
        self.visualizer.globalCompositeOperation = "source-over";
        self.visualizer.fillStyle = 'rgba(0,0,0,1)';
        self.visualizer.fillRect(0, 0, self.canvas.width, self.canvas.height);
        self.visualizer.fill();
        self.visualizer.closePath();
    };

    /**
     * [setXBCAudioDeviceAsSource sets an audio device to be used by XBCAudioVisualizer. if no parameters are given, then Directshow is implemented as default]
     * @param  {String} XBCAudioDeviceId [the audio device ID]
     * @return {[type]}                  [description]
     */
    this.setXBCAudioDeviceAsSource = (XBCAudioDeviceId = '') => {
        var self = this;
        /**
         * In case there is a previous request animation, we cancel it, so we avoid glitchy animations	 
         */
        if (window._requestAnimationFrame) {
            window.cancelAnimationFrame(window._requestAnimationFrame);
            window._requestAnimationFrame = undefined;
        }

        /**
         * [if no device id is given, then we will use the default 'XSplitBroadcaster (DirectShow)' source]
         */
        if (XBCAudioDeviceId === '') {
            let defaultDeviceId = null;
            navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId) => {
                for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
                    if (uuidAudioSourceId[i].kind === 'audioinput') {
                        if (uuidAudioSourceId[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0) {
                            defaultDeviceId = uuidAudioSourceId[i].deviceId;
                            break;
                        }
                    }
                }
                navigator.getUserMedia({
                    video: false,
                    audio: {
                        deviceId: {
                            exact: defaultDeviceId
                        }
                    }
                }, self.soundAllowed, self.soundNotAllowed);
            })

            /**
             * Otherwise we map what we can get from the configuration.
             */
        } else {
            navigator.getUserMedia({
                video: false,
                audio: {
                    deviceId: {
                        exact: XBCAudioDeviceId
                    }
                }
            }, self.soundAllowed, self.soundNotAllowed);
        }
    }

    /**
     * [soundAllowed allows you to prepare and display the wave stream into your graphic.]
     * @param  {Object}   stream   [the audio stream to be processed]
     * @param  {Function} callback [is a function that can be used to send the stream out of the scope of this class in order to be manipulated by other users]
     * @return {[type]}            [description]
     */
    this.soundAllowed = (stream) => {
        var self = this;
        window.persistAudioStream = stream;
        self.mediaStreamSource = window._audioContext.createMediaStreamSource(stream);
        self.analyser = window._audioContext.createAnalyser();
        self.analyser.fftSize = self._defaults.bitsample;
        if (self._defaults.skin === 'custom') {

            /**
             * When we do a custom animation, we give total freedom to the user to manipulate
             * the event.
             * well.. almost... the analyzer and audiostream are connected persistently throw the window object and 
             * some variable reassingnations has to be passed on the execution.
             *
             * Also we give the user the option to create their own loops in case they need to 
             * instantiate their own callbacks for redraw.
             */

            var load = (function() {
                // Function which returns a function: https://davidwalsh.name/javascript-functions
                function _load(tag) {
                    return function(url) {
                        // This promise will be used by Promise.all to determine success or failure
                        return new Promise(function(resolve, reject) {
                            var element = document.createElement(tag);
                            var parent = 'body';
                            var attr = 'src';

                            // Important success and error for the promise
                            element.onload = function() {
                                resolve(url);
                            };
                            element.onerror = function() {
                                reject(url);
                            };

                            // Need to set different attributes depending on tag type
                            switch (tag) {
                                case 'script':
                                    element.async = true;
                                    break;
                                case 'link':
                                    element.type = 'text/css';
                                    element.rel = 'stylesheet';
                                    attr = 'href';
                                    parent = 'head';
                            }

                            // Inject into document to kick off loading
                            element[attr] = url;
                            document[parent].appendChild(element);
                        });
                    };
                }

                return {
                    css: _load('link'),
                    js: _load('script'),
                    img: _load('img')
                }
            })();

            var XBC_avz = {
                canvas: self.canvas,
                visualizer: self.visualizer,
                analyser: self.analyser,
                fftsize: self._defaults.bitsample,
                stream: stream,
                mediaStreamSource: self.mediaStreamSource,
                fps: self._defaults.fps,
                displayfps: self._defaults.displayfps

            }
            var executeFunction = (XBC_avz = {}) => {
                eval(self.customVisualization);
            }
            try {
            	if(self._defaults.externalJSURL.length > 0){
            		var arrs = [];
            		self._defaults.externalJSURL.forEach((o,i)=>{
            			arrs.push(load.js(o))
            		})
            		Promise.all(arrs)
            		.then(()=>{
            			executeFunction(XBC_avz);
            		})
            		.catch(()=>{
            			console.log('the following script didnt load');
            			console.log(arguments);
            		})
            	} else {
            		executeFunction(XBC_avz);	
            	}
                
            } catch (e) {
                /**
                 * To see if there are errors on the stream, it is a must to have
                 * the developer mode on XBC to see the errors.
                 */
                console.log(e.stack)
            }

        } else {


            let resizeHandler = () => {
                let w = window.innerWidth;
                let h = window.innerHeight;
                let cx = w / 2;
                let cy = h / 2;
                self.visualizer.canvas.width = w;
                self.visualizer.canvas.height = h;
                self.canvas.width = w;
                self.canvas.height = h
            };

            /**
             * [we prepare the stream by connecting the audio stream to the needed analyzer]
             */

            resizeHandler();

            /**
             * we clear the frame
             */
            self.clearCanvas();

            /**
             * [then we prepare a audioprocessor to fetch the frequencyArray to be drawn]
             */
            let bufferLength = self.analyser.frequencyBinCount;
            let frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);


            window.addEventListener('resize', resizeHandler, false)

            /**
             * [and we draw what comes in the audio process]
             */

            let fps = 0;
            let lastRun;
            let fpInterval, startTime, now, then, elapsed;

            function showFPS() {
                self.visualizer.fillStyle = "red";
                self.visualizer.font = "normal 16pt Arial";
                self.visualizer.fillText(Math.floor(fps) + " fps", 10, 26);
            }
            fpsInterval = 1000 / self._defaults.fps;
            then = Date.now();
            startTime = then;
            /**
             * [draw is a function that renders in the canvas the data to be visualized]
             */
            let draw = () => {
                window._requestAnimationFrame = window.requestAnimationFrame(draw);
                now = Date.now();
                elapsed = now - then;
                if (elapsed > fpsInterval) {
                    self.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);
                    var delta = (new Date().getTime() - lastRun) / 1000;
                    lastRun = new Date().getTime();
                    fps = 1 / delta;
                    if (self._defaults.displayfps) {
                        showFPS()
                    }
                    then = now - (elapsed % fpsInterval);

                    switch (self._defaults.skin) {
                        case 'oscilloscope':
                            self.analyser.getByteTimeDomainData(frequencyArray);
                            self.visualizer.beginPath();
                            var x = 0;
                            var y = 0;
                            var sliceWidth = self.canvas.width / bufferLength;
                            self.visualizer.strokeStyle = '#fff';
                            self.visualizer.lineWidth = self._defaults.strokeW;
                            if (self._defaults.strokeS1 > 0 && self._defaults.strokeS2 > 0) {
                                self.visualizer.setLineDash([self._defaults.strokeS1, self._defaults.strokeS2]);
                            }

                            var sliceWidth = self.canvas.width / bufferLength;
                            var x = 0;
                            for (var i = 0; i < bufferLength; i++) {
                                var v = frequencyArray[i] / 128.0;
                                var y = v * self.canvas.height / 2;
                                if (i === 0) {
                                    self.visualizer.moveTo(x, y);
                                } else {
                                    self.visualizer.lineTo(x, y);
                                }
                                x += sliceWidth;
                            }

                            var gradientObject = self.visualizer.createLinearGradient(0, self.canvas.height, self.canvas.width, self.canvas.height);
                            gradientObject.addColorStop('0', '#ff0a0a')
                            gradientObject.addColorStop('0.2', '#f1ff0a')
                            gradientObject.addColorStop('0.9', '#d923b9')
                            gradientObject.addColorStop('1', '#050d61')
                            self.visualizer.strokeStyle = gradientObject;

                            self.visualizer.lineTo(self.canvas.width, self.canvas.height / 2);
                            self.visualizer.stroke();

                            break;
                        case 'bars':
                            var spaceh = window.innerWidth / bufferLength;
                            self.analyser.getByteFrequencyData(frequencyArray);
                            self.visualizer.lineWidth = self._defaults.strokeW;
                            self.visualizer.setLineDash([self._defaults.strokeS1, self._defaults.strokeS2]);

                            var tmpPath = null;
                            let adjustedLength = 0;
                            let pos = 0;
                            let calc1 = 0;
                            let calc2 = 0;
                            let max = 0;
                            for (var i = 0; i < bufferLength; i++) {
                                calc1 = (frequencyArray[i] / bufferLength);
                                calc2 = (window.innerHeight * calc1);
                                // here we calculate the max height accordingly to window height vs max size of the bufferlength	
                                max = (255 / bufferLength) * window.innerHeight;
                                calc2 = parseFloat(((calc2 / max) * 100).toFixed(2)); //this reveals the height of calc2 against the height of the screen in %
                                calc2 = calc2 * 0.01;
                                calc2 = window.innerHeight * calc2; //and here we get the correct height of the bar.
                                if (i == 0) {
                                    pos = 0
                                } else {
                                    pos = (i) * spaceh;
                                }
                                var gradientObject = self.visualizer.createLinearGradient(pos, (self.canvas.height - calc2), pos, self.canvas.height);
                                gradientObject.addColorStop('0', '#ff0a0a')
                                gradientObject.addColorStop('0.2', '#f1ff0a')
                                gradientObject.addColorStop('0.9', '#d923b9')
                                gradientObject.addColorStop('1', '#050d61')
                                tmpPath = new Path2D('M ' + (pos) + ',' + self.canvas.height + ' v -' + calc2);
                                self.visualizer.strokeStyle = gradientObject;
                                self.visualizer.stroke(tmpPath);

                            }
                            break;
                    }

                }
            }

            draw();
            /**
             * finally we connect all the pieces and run the visualization.
             */
            self.mediaStreamSource.connect(self.analyser);
        }
    }
    /**
     * [soundNotAllowed throws an exception when the audio is not being handled properly (wrong device, system error, etc)]
     * @param  {Object} error [description]
     * @return {[type]}       [description]
     */
    this.soundNotAllowed = (error) => {
        debugger;
        throw ('there was an error fetching audio:')
        console.error(error);
    }

    /**
     * [init will read the config passed to the class and put everything in order to start to work]
     * @return {[type]} [description]
     */
    this.init = () => {
        var self = this;
        var defaults = {
            visualizer: 'visualizer',
            isSVG: false,
            isCANVAS: false,
            haveMask: true,
            isMaskMarkup: false,
            mask: 'mask',
            audioDeviceId: '',
            hasCustomSoundAllowed: false,
            customSoundAllowed: function() {},
            customSoundNotAllowed: function() {},
            is3d: false,
            enableLog: false,
            skin: 'bars',
            fps: 30,
            bitsample: 512,
            displayfps: false,
            strokeW: 1,
            strokeS1: 0,
            strokeS2: 0,
            customVisualization: "/**\r\n * USE CUSTOM VISUALIZATION IF YOU ARE VERY WELL VERSED ON JAVASCRIPT!!!!\r\n * WHEN YOU HAVE CUSTOM VISUALIZATIONS, PLEASE READ CAREFULLY THE INSTRUCTIONS \r\n * BELOW IN ORDER TO MAKE YOUR CODE TO WORK. If you need more scope variables that\r\n * could be missing, please write to erro@splitmedialabs.com with the requested\r\n * scope variable with details.\r\n *\r\n * ### Development Notes ###\r\n *\r\n * You can pass your code ALMOST intact. Few modifications are needed to make your\r\n * code to work. Please read carefully this references notes in order to consider  \r\n * what to do to make your custom visualization code work properly.\r\n *\r\n *   ### DEBUGGING YOUR CODE ###\r\n * please enable developer mode on XBC and debug in http://localhost:9222\r\n * (default port used for XBC to debug sources) and look for \r\n * 'XSplit Broadcaster Audio Visualizer' on the list of links. IN THAT WAY YOU CAN\r\n * DEBUG YOUR CODE IF THERE IS ANY ERROR OR IF THE VISUALIZATION DOESN'T WORK\r\n * PROPERLY\r\n *\r\n *   ### STRICT MODE ###\r\n *\r\n * Note that strict mode is enforced from the start up. If you have a visualization\r\n * that has bad notations or undefined calls, it will most likely throw you an error. \r\n *\r\n *   ### Canvas Object and Visualizer Object ###\r\n *\r\n * The canvas object already exists on the visualization plugin:\r\n * <canvas id=\"visualizer\"></canvas>\r\n * so you could use this to reference such DOM Object:\r\n\r\n\r\nvar canvas = document.getElementById('visualizer');\r\nvar visualizer = canvas.getContext('2d');\r\n\r\n * or use the existing reference passed by XBC_avz (canvas & visualizer):\r\n \r\nvar canvas = XBC_avz.canvas; \r\nvar visualizer = XBC_avz.visualizer;\r\n\r\n *\r\n *   ### AudioContext ###\r\n *\r\n * Audio context is already stored in window._audioContext, so If you want to extract \r\n * or set any method or propertym you do not need to create a new AudioContext(). Use\r\n * the existing reference. WARNING: Creating new AudioContext() instances COULD RESULT\r\n * IN BREAKING THE SCRIPT.\r\n *\r\n *   ### Analyser Object ###\r\n * \r\n * so If you want to create an analyzer, the answer is\r\n * var analyser = window._audioContext.createAnalyser()\r\n *\r\n * or you can use this if you want to save some time. Again it is under your \r\n * convenience\r\n\r\nvar analyser = XBC_avz.analyser;\r\n\r\n * If you want to set getByteFrequencyData or getByteTimeDomainData for the analyser\r\n * you have to set the frequencyArray as follows:\r\n \r\n var frequencyArray = new Uint8Array(analyser.frequencyBinCount);\r\n\r\n *   ### FFTSIZE ###\r\n * The analyser uses the fttsize (bitsample) passed by the main configuration window.\r\n * so if you want to use the configuration options, please use XBC_avz.fftsize to use\r\n * its value against the analyzer:\r\n\r\nvar analyser = XBC_avz.analyser;\r\nanalyzer.fttSize = XBC_avz.fttsize;\r\n\r\n *   ### Media Stream Source ###\r\n *\r\n * By default, This plugin already connects to the audio source, so you don not need \r\n * to do\r\n * myMediaStream = window._audioContext.createMediaStreamSource(stream)\r\n *\r\n * if you want to connect methods and properties of the Media Stream Source use \r\n * XBC_avz.mediaStreamSource to call any method or property of the current\r\n * selected source. example:\r\n *\r\n * var myMediaStreamSource = XBC_avz.mediaStreamSource;\r\n * .\r\n * .\r\n * .\r\n * Visualization code\r\n * .\r\n * .\r\n * .\r\n * myMediaStreamSource.connect(analyzer);\r\n * \r\n *\r\n *   ### fftSize ###\r\n *\r\n * the fftSize is defined on the main dialog window, and can be called user as follows:\r\n * analyser.fftSize = XBC_avz.fftSize;\r\n *\r\n *   ### requestAnimationFrame CALLBACKS AND ID ###\r\n *\r\n * When you setup a requstAnimationFrame in your function PLEASE bind the id of the \r\n * request to window._requestAnimationFrame, so in case the plugin have to perform a \r\n * cancelation of the drawing the plugin can stop the execution of the drawing function \r\n * without breaking your visualization. this is an example on how to achieve this:\r\n\r\nvar myMediaStreamSource = XBC_avz.mediaStreamSource;\r\nvar drawFunction = function(){\r\n\twindow._requestAnimationFrame = window.requestAnimationFrame(drawFunction);\r\n\t.\r\n\t.\r\n\t.\r\n\tanimation code\r\n\t.\r\n\t.\r\n\t.\r\n}\r\ndrawFunction();\r\nmyMediaStreamSource.connect(analyser);\r\n\r\n *\r\n *   ### CONTROLING FRAMERATE ###\r\n *\r\n * By default This plugin provides a framerate control for the two default visualizers\r\n * bars and osciloscope, while on custom it is always set to 60fps. If you want to\r\n * control your framerate you have to add the following code.\r\n *\r\n *  ## indicatons\r\n *  1. Use XBC_avz.fps to use the fps you set on the configuration dialog window, and use\r\n *  XBC_avz.displayfps to allow to see the framerate on screen.\r\n *\r\n *  2. insert this code before the function that creates the draw:\r\n\r\nlet fps = 0;\r\nlet lastRun;\r\nlet fpInterval,startTime,now,then,elapsed;\r\nfunction showFPS(){\r\n    self.visualizer.fillStyle = \"red\";\r\n    self.visualizer.font      = \"normal 16pt Arial\";\r\n    self.visualizer.fillText(Math.floor(fps) + \" fps\", 10, 26);\r\n}\r\nfpsInterval = 1000 / XBC_avz.fps;\r\nthen = Date.now();\r\nstartTime = then;\r\n\r\n *  3. add this piece of code INSIDE of your drawing function BEFORE your code that\r\n *  performs the drawing. please see this example\r\n\r\nvar canvas = XBC_avz.canvas; \r\nvar visualizer = XBC_avz.visualizer;\r\nvar analyser = XBC_avz.analyser;\r\nanalyzer.fttSize = XBC_avz.fttsize;\r\n\r\n// ### START FRAMESKIP INITIALIZATION CODE\r\nlet fps = 0;\r\nlet lastRun;\r\nlet fpInterval,startTime,now,then,elapsed;\r\nfunction showFPS(){\r\n    self.visualizer.fillStyle = \"red\";\r\n    self.visualizer.font      = \"normal 16pt Arial\";\r\n    self.visualizer.fillText(Math.floor(fps) + \" fps\", 10, 26);\r\n}\r\nfpsInterval = 1000 / XBC_avz.fps;\r\nthen = Date.now();\r\nstartTime = then;\r\n// END FRAMESKIP INITIALIZATION CODE\r\n\r\nvar drawFunction = function(){\r\n\twindow._requestAnimationFrame = window.requestAnimationFrame(drawFunction);\r\n\t..\r\n\t..\r\n\tsetup initial visualization settings\r\n\t..\r\n\t..\r\n\t// ### START FRAMESKIP CODE PART 1\r\n\tnow = Date.now();\r\n\telapsed = now - then;\r\n\tif(elapsed > fpsInterval){\r\n\t\tvisualizer.clearRect(0, 0, canvas.width, canvas.height);\r\n\t\tvar delta = (new Date().getTime() - lastRun)/1000;\r\n\t    lastRun = new Date().getTime();\r\n\t    fps = 1/delta;\r\n\t    if(XBC_avz.displayfps){\r\n\t    \tshowFPS()\r\n\t    }\r\n\t\tthen = now - (elapsed % fpsInterval);\r\n\t// ## END FRAMESKIP CODE PART 1\r\n\t\t..\r\n\t\t..\r\n\t\t.. \r\n\t\tyour animation DRAWING code\r\n\t\t..\r\n\t\t..\r\n\t\t..\r\n\t// ## START FRAMESKIP CODE PART 2\r\n\t}\r\n\t// ## END FRAMESKIP CODE PART 2\r\n\r\n}\r\ndrawFunction();\r\nmyMediaStreamSource.connect(analyser);\r\n\r\n *\r\n * ############### INSERT YOUR CODE BELOW ################## \r\n */",
            externalJSURL: []
        }

        /**
         * then we pass the arguments to the _default attribute to be shared on the class...
         */
        self._defaults = $.extend({}, defaults, self.config);

        var self = this;
        if (document.getElementById(self._defaults.visualizer) === null) console.error('The visualizer container was not found into the HTML DOM');

        /**
         * starting up instances...
         */
        self.canvas = document.getElementById(self._defaults.visualizer);
        self.visualizer = self.canvas.getContext("2d")
        self.mask = document.getElementById(self._defaults.mask);
        if (self._defaults.skin === 'custom') {
            self.customVisualization = self._defaults.customVisualization;
        }

        //parse defaults with integer values to be integers...
        self._defaults.bitsample = parseInt(self._defaults.bitsample, 10);
        self._defaults.fps = parseInt(self._defaults.fps, 10);
        self._defaults.strokeW = parseInt(self._defaults.strokeW, 10);
        self._defaults.strokeS1 = parseInt(self._defaults.strokeS1, 10);
        self._defaults.strokeS2 = parseInt(self._defaults.strokeS2, 10);

        if (typeof window._audioContext !== 'undefined') {
            window._audioContext.close().then(() => {
                window._audioContext = null;
                window._audioContext = new AudioContext();
            })
        } else {
            window._audioContext = new AudioContext();
        }

        /**
         * This could change... I need an fps counter on the panel of properties
         */

        /**
         * setup the value of the custom code
         */
        console.log(self._defaults)
        /** 
         * ready to go!
         */
        self.setXBCAudioDeviceAsSource(self._defaults.audioDeviceId)
    }



    /**
     * finally we execute the class (call it a rudimentary constructor)
     */
    this.init();
}

/*
 * String Prototype Format : this will allow is to replace multiple characters like sprintf does in PHP or ASP
 * "{0} is dead, but {1} is alive! {0}".format("ASP", "ASP.NET")
 * output : ASP is dead, but ASP.NET is alive! ASP
 */
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}