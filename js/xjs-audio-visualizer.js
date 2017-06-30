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
var XBCAudioVisualizer = function(config = {}){

	/**
	 * [config contains all the needed information to startup]
	 * @type {[type]}
	 */
	this.config = config;
	/**
	 * [_defaults a queueable object where we can merge local defaults with defaults of the user.]
	 * @type {Object}
	 */
	this._defaults = {}
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
	 * [audioStream is a handler for the audio stream]
	 * @type {null}
	 */
	this.audioStream = null;

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


	this.log = (args) =>{
		var self = this;
		if(self.enableLog){
			$("#log").text(args);
		}
	}
	/**
	 * [description]
	 * @param  {[type]} visualizerId [description]
	 * @param  {[type]} maskId       [description]
	 * @return {[type]}              [description]
	 */
	this.prepare = (visualizerId,maskId) => {
		var self = this;
		self.paths = document.getElementsByTagName('path');
		//self.visualizer = document.getElementById(visualizerId);
		//self.mask = visualizer.getElementById(maskId); 
	}

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
		if(window._requestAnimationFrame){
			window.cancelAnimationFrame(window._requestAnimationFrame);
			window._requestAnimationFrame = undefined;
		}

		/**
		 * [if no device id is given, then we will use the default 'XSplitBroadcaster (DirectShow)' source]
		 */
		if(XBCAudioDeviceId === ''){
			let defaultDeviceId = null;
			navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
				for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
					if (uuidAudioSourceId[i].kind === 'audioinput') {
						if(uuidAudioSourceId[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0){
							defaultDeviceId = uuidAudioSourceId[i].deviceId;
							break;
						}
					}
				}
				 navigator.getUserMedia({
					video: false,
					audio: {deviceId : {
						exact: defaultDeviceId
					}}
				}, self.soundAllowed, self.soundNotAllowed);
			})
			
		/**
		 * Otherwise we map what we can get from the configuration.
		 */
		} else {
			navigator.getUserMedia({
				video: false,
				audio: {deviceId : {
					exact: XBCAudioDeviceId
				}}
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
		let resizeHandler = () => {
			let w = window.innerWidth;
			let h = window.innerHeight;
			console.log(w+','+h);
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
		window.persistAudioStream = stream;
		self.audioStream = window._audioContent.createMediaStreamSource( stream );
		self.analyser = window._audioContent.createAnalyser();
		self.analyser.fftSize = self._defaults.bitsample;
		resizeHandler();

		/**
		 * we clear the frame
		 */
		self.visualizer.clearRect(0,0,self.canvas.width,self.canvas.height)

		/**
		 * [then we prepare a audioprocessor to fetch the frequencyArray to be drawn]
		 */
		let bufferLength = self.analyser.frequencyBinCount;
		let frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);

		
		console.log(frequencyArray);
		window.addEventListener('resize',resizeHandler,false)

		/**
		 * [and we draw what comes in the audio process]
		 */
		
		/** 
		 * code performance issues... looking into using requestAnimationFrame
		 * rather than javascriptNode
		 */
		let fps = 0;
		let lastRun;
		let fpInterval,startTime,now,then,elapsed;

		function showFPS(){
	        self.visualizer.fillStyle = "red";
	        self.visualizer.font      = "normal 16pt Arial";
	        self.visualizer.fillText(Math.floor(fps) + " fps", 10, 26);
	    }
	    fpsInterval = 1000 / self._defaults.fps;
	    then = Date.now();
	    startTime = then;
	    /**
	     * [draw is a function that renders in the canvas the data to be visualized]
	     */
		let draw = () =>{
			window._requestAnimationFrame = window.requestAnimationFrame(draw);
	        now = Date.now();
	        elapsed = now - then;
			if(elapsed > fpsInterval){
				self.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);
				var delta = (new Date().getTime() - lastRun)/1000;
		        lastRun = new Date().getTime();
		        fps = 1/delta;
		        if(self._defaults.displayfps){
		        	showFPS()
		        }
				then = now - (elapsed % fpsInterval);

				switch(self._defaults.skin){
					case 'sinewave':
						self.analyser.getByteTimeDomainData(frequencyArray);
						var x = 0;
						var y = 0;
						var sliceWidth = self.canvas.width / bufferLength;
						self.visualizer.strokeStyle = '#fff';
						self.visualizer.lineWidth = self._defaults.strokeW;
						self.visualizer.setLineDash([self._defaults.strokeS1,self._defaults.strokeS2]);
						self.visualizer.beginPath();
						var sliceWidth = self.canvas.width * 1.0 / bufferLength;
			      		var x = 0;
			      		for(var i = 0; i < bufferLength; i++) {
							var v = frequencyArray[i] / 128.0;
							var y = v * self.canvas.height/2;
							if(i === 0) {
							self.visualizer.moveTo(x, y);
							} else {
							self.visualizer.lineTo(x, y);
							}
							x += sliceWidth;
						}
						
						var gradientObject = self.visualizer.createLinearGradient(0,self.canvas.height,self.canvas.width,self.canvas.height);
						gradientObject.addColorStop('0' ,'#ff0a0a')
						gradientObject.addColorStop('0.2' ,'#f1ff0a')
						gradientObject.addColorStop('0.9' ,'#d923b9')
						gradientObject.addColorStop('1' ,'#050d61')
						self.visualizer.strokeStyle = gradientObject;
						
						self.visualizer.lineTo(self.canvas.width, self.canvas.height/2);
						self.visualizer.stroke();
						
					break;
					case 'bars':
						var spaceh = window.innerWidth/bufferLength;
						self.analyser.getByteFrequencyData(frequencyArray);
						self.visualizer.lineWidth = self._defaults.strokeW;
						self.visualizer.setLineDash([self._defaults.strokeS1,self._defaults.strokeS2]);
						
						var tmpPath = null;
						let adjustedLength = 0;
						let pos = 0;
						let calc1 = 0;
						let calc2  = 0;
						let max = 0;
						for(var i = 0; i < bufferLength; i++) {	
							calc1 = (frequencyArray[i]/bufferLength);
							calc2 = (window.innerHeight * calc1);
							// here we calculate the max height accordingly to window height vs max size of the bufferlength	
							max = (255/bufferLength)*window.innerHeight;
							calc2 = parseFloat(((calc2/max)*100).toFixed(2)); //this reveals the height of calc2 against the height of the screen in %
							calc2 = calc2 * 0.01;
							calc2 = window.innerHeight * calc2; //and here we get the correct height of the bar.
							if(i==0){
								pos = 0
							} else {
								pos = (i)*spaceh;
							}
							var gradientObject = self.visualizer.createLinearGradient(pos,(self.canvas.height - calc2),pos,self.canvas.height);
							gradientObject.addColorStop('0' ,'#ff0a0a')
							gradientObject.addColorStop('0.2' ,'#f1ff0a')
							gradientObject.addColorStop('0.9' ,'#d923b9')
							gradientObject.addColorStop('1' ,'#050d61')
							tmpPath = new Path2D('M '+(pos)+','+self.canvas.height+' v -'+calc2);
							self.visualizer.strokeStyle = gradientObject;
							self.visualizer.stroke(tmpPath);

						}
					break;
					case 'custom':
						self.customVisualization();
					break;
				}

			}
		}

		draw();
		/**
		 * finally we connect all the pieces and run the visualization.
		 */
		self.audioStream.connect(self.analyser);  
	}
	/**
	 * [soundNotAllowed throws an exception when the audio is not being handled properly (wrong device, system error, etc)]
	 * @param  {Object} error [description]
	 * @return {[type]}       [description]
	 */
	this.soundNotAllowed = (error) => {
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
			visualizer            : 'visualizer',
			isSVG                 : false,
			isCANVAS              : false,
			haveMask              : true,
			isMaskMarkup          : false,
			mask                  : 'mask',
			audioDeviceId         : '',
			hasCustomSoundAllowed : false,
			customSoundAllowed    : function() {},
			customSoundNotAllowed : function() {},
			is3d                  : false,
			enableLog             :false,
			skin                  : 'bars',
			fps                   : 30,
			bitsample             : 512,
			displayfps            : false,
			strokeW               : 1,
			strokeS1              : 0,
			strokeS2              : 0
		}

		/**
		 * then we pass the arguments to the _default attribute to be shared on the class...
		 */
		console.log(self.config);
		self._defaults = $.extend({},defaults,self.config);

		var self = this;
		if(document.getElementById(self._defaults.visualizer) === null) console.error('The visualizer container was not found into the HTML DOM');

		/**
		 * starting up instances...
		 */
		self.canvas = document.getElementById(self._defaults.visualizer);
		self.visualizer = self.canvas.getContext("2d")
		self.mask = document.getElementById(self._defaults.mask);
		if(self._defaults.skin === 'custom'){
			self.customVisualization = self._defaults.customVisualization;
		}

		//parse defaults with integer values to be integers...
		self._defaults.bitsample = parseInt(self._defaults.bitsample,10);
		self._defaults.fps       = parseInt(self._defaults.fps,10);
		self._defaults.strokeW   = parseInt(self._defaults.strokeW,10);
		self._defaults.strokeS1  = parseInt(self._defaults.strokeS1,10);
		self._defaults.strokeS2  = parseInt(self._defaults.strokeS2,10);

		if(typeof window._audioContent !== 'undefined'){
			window._audioContent.close().then(()=>{
				window._audioContent = null;
				window._audioContent = new AudioContext();
			})
		} else {
			window._audioContent = new AudioContext();	
		}

		/**
		 * This could change... I need an fps counter on the panel of properties
		 */
		window.external.SetLocalProperty("prop:Browser"+self._defaults.fps+"fps","1");  
		
		/** 
		 * ready to go!
		 */
		self.setXBCAudioDeviceAsSource()
	}

	/**
	 * finally we execute the class (call it a rudimentary constructor)
	 */
	this.init();
}