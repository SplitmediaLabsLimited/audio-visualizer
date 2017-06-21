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
//let xjs = require('xjs');
"use strict";
if(typeof window.external.SetLocalProperty !== "undefined"){
	window.external.SetLocalProperty("prop:Browser60fps","1");  
}

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
	this.audioContent = new AudioContext();

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
	this.enableLog = false;

	/**
	 * [log prints into the console the given arguments]
	 * @return {[type]} [description]
	 */
	this.log = () =>{
		var self = this;
		if(self.enableLog){
			console.log(arguments);
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

		/**
		 * [we prepare the stream by connecting the audio stream to the needed analyzer]
		 */
		window.persistAudioStream = stream;
		self.audioStream = self.audioContent.createMediaStreamSource( stream );
		self.analyser = self.audioContent.createAnalyser();
		self.analyser.fftSize = 1024;
		var canvasCtx = self.visualizer.getContext("2d");

		/**
		 * first we prepare the canvas
		 */
		self.visualizer.clearRect(0, 0, self.visualizer.width, self.visualizer.height);

		/*self.paths = document.getElementsByTagName('path');
		self.visualizer = document.getElementById(self._defaults.visualizer);
		//self.mask = visualizer.getElementById(maskId); 
		self.mask = document.createElement('mask')
		self.mask.setAttribute('id','mask');
		var g = document.createElement('g');
		g.setAttribute('id','maskgroup');
		self.mask.appendChild(g);
		self.visualizer.appendChild(self.mask);

		self.visualizer.setAttribute('viewBox', '0 0 500 500');*/
		
		/**
		 * then we draw the waveform
		 */
		/*for (let i = 0 ; i < 255; i++) {
			self.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			self.path.setAttribute('stroke-dasharray', '1,1');
			self.path.setAttribute('stroke-width','0.5px');
			self.mask.appendChild(self.path);
		}*/

		/**
		 * [then we prepare a audioprocessor to fetch the frequencyArray to be drawn]
		 */
		let frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);
		let javascriptNode = self.audioContent.createScriptProcessor(1024,1,1);


		/**
		 * [and we draw what comes in the audio process]
		 */
		javascriptNode.onaudioprocess = (e) => {
			self.analyser.getByteFrequencyData(frequencyArray);
			let adjustedLength;
			for (let i = 0 ; i < 255; i++) {
				adjustedLength = Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 5);
				self.paths[i].setAttribute('d', 'M '+ (i) +',255 l 0,-' + adjustedLength);
			}
		}

		/**
		 * finally we connect all the pieces and run the visualization.
		 */
		self.audioStream.connect(self.analyser); 
		self.analyser.connect(javascriptNode); 
		javascriptNode.connect(self.audioContent.destination); 
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
			visualizer : 'visualizer',
			isSVG : false,
			isCANVAS: false,
			haveMask : true,
			isMaskMarkup : false,
			mask : 'mask',
			canvas_width : '100%',
			canvas_height : '100%',
			audioDeviceId : '',
			hasCustomSoundAllowed : false,
			customSoundAllowed : function() {},
			customSoundNotAllowed : function() {},
			is3d : false
		}

		/**
		 * then we pass the arguments to the _default attribute to be shared on the class...
		 */
		self._defaults = $.extend({},defaults,self.config);

		var self = this;
		if(typeof self.config.visualizer === 'undefined') throw 'It is required the use of the id of the visualizer container';
		if(document.getElementById(self._defaults.visualizer) === null) throw 'The visualizer container was not found into the HTML DOM';
		if(typeof self.config.canvas_width === 'undefined') throw 'The visualizer width was not found on the settings';
		if(typeof self.config.canvas_height === 'undefined') throw 'The visualizer height was not found on the settings';


		self.visualizer = document.getElementById(self._defaults.visualizer);
		self.mask = document.getElementById(self._defaults.mask); 
		self.setXBCAudioDeviceAsSource()
	}

	/**
	 * finally we execute the class (call it a rudimentary )
	 */
	this.init();
}


$(function(){
	var config = {
		visualizer : 'visualizer',
		haveMask : true,
		isMaskMarkup : false,
		mask : 'mask',
		canvas_width : '100%',
		canvas_height : '100%'
	}
	new XBCAudioVisualizer(config);	
})