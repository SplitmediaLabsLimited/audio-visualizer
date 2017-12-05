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
  

    let loadUrl = null;
    let setType = 'script'
    if(self._defaults.animationElement === "oscilloscope" || self._defaults.animationElement === "bars"){
      loadUrl = {
        url:`./js/${self._defaults.animationElement}.js`,
        dataType: 'text'
       };
    } else {
      loadUrl = {
        url : `${self._defaults.animationElement}`,
        dataType: 'text'
      }
    }

    $.ajax(loadUrl)
    .then(data => {
      $.when(self.preloadRemoteScript(data))
      .then(()=>{
        try{
          eval(data); 
          var c = self.canvas,
              a = self.analyser,
              v = self.visualizer,
              fa = frequencyArray,
              bf = bufferLength;
          var capYPositionArray = [];
          const drawGraph = () => {
            window._requestAnimationFrame = window.requestAnimationFrame(drawGraph);
            now = Date.now(); elapsed = now - then;
            if (elapsed > fpsInterval) {
              self.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);
              var delta = (new Date().getTime() - lastRun) / 1000;
              lastRun = new Date().getTime();
              fps = 1 / delta;
              if (self._defaults.displayfps) {
                showFPS();
              }
              c = self.canvas,
              a = self.analyser,
              v = self.visualizer,
              fa = frequencyArray,
              bf = bufferLength
              then = now - (elapsed % fpsInterval);
              
            }
            remoteFn(
              c,
              a,
              v,
              fa,
              bf,
              self._defaults
            );
            
          }

          drawGraph();
          /**
           * finally we connect all the pieces and run the visualization.
           */
          self.mediaStreamSource.connect(self.analyser);
        } catch(e){
          console.error(e.message+'\n'+e.stack);            
        }
      })
      .fail((msg)=>{
        console.error(msg);
      })
    })


    

  
    
  }
  /**
   * [soundNotAllowed throws an exception when the audio is not being handled properly (wrong device, system error, etc)]
   * @param  {Object} error [description]
   * @return {[type]}       [description]
   */
  this.soundNotAllowed = (error) => {
    console.error('there was an error fetching audio:'+error);
  },
  /**
   * [preloadRemoteScript will include the required scripts defined by user on the header file]
   * @param  {[type]} strData [description]
   * @return {[type]}         [description]
   */
  this.preloadRemoteScript = (strData) => {
    
    let refreshData = strData.split('\n'),
    flagStart = false,
    flagEnd = false,
    listPreload = [],
    tmp = null,
    deferred = $.Deferred();
    
    for (var i = 0; i < refreshData.length; i++) {
      console.log(`refreshData[${i}]`,refreshData[i])
      if($.trim(refreshData[i]) === 'XBCAVZ_START'){
        flagStart = true;
        continue;
      }
      if(flagStart){
        tmp = refreshData[i].split('@require ');
        if($.trim(tmp[1]).length > 0){
          listPreload.push($.trim(tmp[1]));
          tmp = null;
        }
      }
      if($.trim(refreshData[i]) === 'XBCAVZ_END'){
        flagEnd = true;
        break;
      }
    }

    if(listPreload.length > 0){
      requirejs(listPreload,()=>{
        deferred.resolve();    
      })
    } else {
      deferred.resolve();
    }
    if(flagStart && !flagEnd){
      deferred.reject('The Header of your javascript does not contain the ending XBCAVZ_END. This could lead to slow performance reading your visualization.')
    }
    return deferred.promise();
  },

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
      animationElement: 'bars',
      fps: 60,
      bitsample: 512,
      displayfps: true,
      strokeW: 4,
      strokeS1: 4,
      strokeS2: 4,
      externalJSURL: [],
      visualizationSelect : 'flames',
      colorcode: "#ffffff",
      sensitivity:50,
      barcount:70,
      spacing:1
    }
    $('canvas').remove();
    $('<canvas id="visualizer"></canvas>').appendTo('body');
    

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
    window.external.SetLocalProperty("prop:Browser"+self._defaults.fps+"fps","1");  

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