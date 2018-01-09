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
  /**  */
  this.defaultDeviceId = null;
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
              self.defaultDeviceId = defaultDeviceId;
              self.defaultDeviceIdx = i;
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
      self.defaultDeviceId = XBCAudioDeviceId;
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

  //this.XBCFFT(smooth)

  /**
   * [soundAllowed allows you to prepare and display the wave stream into your graphic.]
   * @param  {Object}   stream   [the audio stream to be processed]
   * @param  {Function} callback [is a function that can be used to send the stream out of the scope of this class in order to be manipulated by other users]
   * @return {[type]}            [description]
   */
  this.soundAllowed = (stream) => {
    'use strict';
    var self = this;
    

    window.persistAudioStream = stream;
    self.mediaStreamSource = window._audioContext.createMediaStreamSource(stream);
    self.analyser = window._audioContext.createAnalyser();
    
    var freqToFloat = function (fft) {
      if (fft.freqDomain instanceof Float32Array === false) {
        fft.freqDomain = new Float32Array(fft.analyser.frequencyBinCount);
      }
    };
    var freqToInt = function (fft) {
      if (fft.freqDomain instanceof Uint8Array === false) {
        fft.freqDomain = new Uint8Array(fft.analyser.frequencyBinCount);
      }
    };
    var timeToFloat = function (fft) {
      if (fft.timeDomain instanceof Float32Array === false) {
        fft.timeDomain = new Float32Array(fft.analyser.frequencyBinCount);
      }
    };
    var timeToInt = function (fft) {
      if (fft.timeDomain instanceof Uint8Array === false) {
        fft.timeDomain = new Uint8Array(fft.analyser.frequencyBinCount);
      }
    };

    class xbcfft {
      constructor(smoothing,bins,stream){
        var Master = function () {
          var audiocontext = window._audioContext;
          this.input = audiocontext.createGain();
          this.output = audiocontext.createGain();
          //put a hard limiter on the output
          this.limiter = audiocontext.createDynamicsCompressor();
          //this.limiter.threshold.value = 0;
          //this.limiter.ratio.value = 20;
          this.audiocontext = audiocontext;
          this.output.disconnect();
          // an array of input sources
          this.inputSources = [];
          // connect input to limiter
          this.input.connect(this.limiter);
          // connect limiter to output
          this.limiter.connect(this.output);
          // meter is just for global Amplitude / FFT analysis
          this.meter = audiocontext.createGain();
          this.fftMeter = audiocontext.createGain();
          this.mediaStreamSource = null;
          this.output.connect(this.meter);
          this.output.connect(this.fftMeter);
          // connect output to destination
          this.output.connect(this.audiocontext.destination);
          // an array of all sounds in the sketch
          this.soundArray = [];
          // an array of all musical parts in the sketch
          this.parts = [];
          // file extensions to search for
          this.extensions = [];
        };

        this.sound = new Master();
        this.start(smoothing,bins);
      }

      start(smoothing,bins,stream){
        var sound = this.sound;
        this.input = this.analyser = window._audioContext.createAnalyser();
        Object.defineProperties(this, {
          'bins': {
            get: function () {
              return this.analyser.fftSize;
            },
            set: function (b) {
              this.analyser.fftSize = b;
            },
            configurable: true,
            enumerable: true
          },
          'smoothing': {
            get: function () {
              return this.analyser.smoothingTimeConstant;
            },
            set: function (s) {
              this.analyser.smoothingTimeConstant = s;
            },
            configurable: true,
            enumerable: true
          }
        });
        //debugger;
        this.smooth(smoothing);
        this.bins = bins || 1024;
        // default connections to p5sound fftMeter
        sound.fftMeter.connect(this.analyser);

        this.freqDomain = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomain = new Uint8Array(this.analyser.frequencyBinCount);
        // predefined frequency ranges, these will be tweakable
        this.bass = [
          20,
          140
        ];
        this.lowMid = [
          140,
          400
        ];
        this.mid = [
          400,
          2600
        ];
        this.highMid = [
          2600,
          5200
        ];
        this.treble = [
          5200,
          14000
        ];
        // add this p5.SoundFile to the soundArray
        sound.soundArray.push(this);
      }


      /**
       *  Smooth FFT analysis by averaging with the last analysis frame.
       *
       *  @method smooth
       *  @param {Number} smoothing    0.0 < smoothing < 1.0.
       *                               Defaults to 0.8.
       */
      smooth(s) {
        if (typeof s !== 'undefined') {
          this.smoothing = s;
        }
        return this.smoothing;
      };
      /**
       * Re-maps a number from one range to another.
       * <br><br>
       * In the first example above, the number 25 is converted from a value in the
       * range of 0 to 100 into a value that ranges from the left edge of the
       * window (0) to the right edge (width).
       *
       * @method map
       * @param  {Number} value  the incoming value to be converted
       * @param  {Number} start1 lower bound of the value's current range
       * @param  {Number} stop1  upper bound of the value's current range
       * @param  {Number} start2 lower bound of the value's target range
       * @param  {Number} stop2  upper bound of the value's target range
       * @param  {Boolean} [withinBounds] constrain the value to the newly mapped range
       * @return {Number}        remapped number
       * @example
       *   <div><code>
       * var value = 25;
       * var m = map(value, 0, 100, 0, width);
       * ellipse(m, 50, 10, 10);
      </code></div>
       *
       *   <div><code>
       * function setup() {
       *   noStroke();
       * }
       *
       * function draw() {
       *   background(204);
       *   var x1 = map(mouseX, 0, width, 25, 75);
       *   ellipse(x1, 25, 25, 25);
       *   //This ellipse is constrained to the 0-100 range
       *   //after setting withinBounds to true
       *   var x2 = map(mouseX, 0, width, 0, 100, true);
       *   ellipse(x2, 75, 25, 25);
       * }
      </code></div>
       *
       * @alt
       * 10 by 10 white ellipse with in mid left canvas
       * 2 25 by 25 white ellipses move with mouse x. Bottom has more range from X
       *
       */
      map(n, start1, stop1, start2, stop2, withinBounds) {
        var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
          return newval;
        }
        if (start2 < stop2) {
          return this.constrain(newval, start2, stop2);
        } else {
          return this.constrain(newval, stop2, start2);
        }
      }

      /**
       * Constrains a value between a minimum and maximum value.
       *
       * @method constrain
       * @param  {Number} n    number to constrain
       * @param  {Number} low  minimum limit
       * @param  {Number} high maximum limit
       * @return {Number}      constrained number
       * @example
       * <div><code>
       * function draw() {
       *   background(200);
       *
       *   var leftWall = 25;
       *   var rightWall = 75;
       *
       *   // xm is just the mouseX, while
       *   // xc is the mouseX, but constrained
       *   // between the leftWall and rightWall!
       *   var xm = mouseX;
       *   var xc = constrain(mouseX, leftWall, rightWall);
       *
       *   // Draw the walls.
       *   stroke(150);
       *   line(leftWall, 0, leftWall, height);
       *   line(rightWall, 0, rightWall, height);
       *
       *   // Draw xm and xc as circles.
       *   noStroke();
       *   fill(150);
       *   ellipse(xm, 33, 9, 9); // Not Constrained
       *   fill(0);
       *   ellipse(xc, 66, 9, 9); // Constrained
       * }
       * </code></div>
       *
       * @alt
       * 2 vertical lines. 2 ellipses move with mouse X 1 does not move passed lines
       *
       */

      constrain(n, low, high) {
        return Math.max(Math.min(n, high), low);
      };

      /**
       *  Returns an array of amplitude values (between -1.0 and +1.0) that represent
       *  a snapshot of amplitude readings in a single buffer. Length will be
       *  equal to bins (defaults to 1024). Can be used to draw the waveform
       *  of a sound.
       *
       *  @method waveform
       *  @param {Number} [bins]    Must be a power of two between
       *                            16 and 1024. Defaults to 1024.
       *  @param {String} [precision] If any value is provided, will return results
       *                              in a Float32 Array which is more precise
       *                              than a regular array.
       *  @return {Array}  Array    Array of amplitude values (-1 to 1)
       *                            over time. Array length = bins.
       *
       */
      waveform() {
        var bins, mode, normalArray;
        for (var i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] === 'number') {
            bins = arguments[i];
            this.analyser.fftSize = bins * 2;
          }
          if (typeof arguments[i] === 'string') {
            mode = arguments[i];
          }
        }
       
        timeToInt(this, this.timeDomain);
        this.analyser.getByteTimeDomainData(this.timeDomain);
        var normalArray = new Array();
        for (var j = 0; j < this.timeDomain.length; j++) {
          var scaled = this.map(this.timeDomain[j], 0, 255, -1, 1);
          normalArray.push(scaled);
        }
        return normalArray;
        
      }

      /**
       *  Returns an array of amplitude values (between 0 and 255)
       *  across the frequency spectrum. Length is equal to FFT bins
       *  (1024 by default). The array indices correspond to frequencies
       *  (i.e. pitches), from the lowest to the highest that humans can
       *  hear. Each value represents amplitude at that slice of the
       *  frequency spectrum. Must be called prior to using
       *  <code>getEnergy()</code>.
       *
       *  @method analyze
       *  @param {Number} [bins]    Must be a power of two between
       *                             16 and 1024. Defaults to 1024.
       *  @param {Number} [scale]    If "dB," returns decibel
       *                             float measurements between
       *                             -140 and 0 (max).
       *                             Otherwise returns integers from 0-255.
       *  @return {Array} spectrum    Array of energy (amplitude/volume)
       *                              values across the frequency spectrum.
       *                              Lowest energy (silence) = 0, highest
       *                              possible is 255.
       *  @example
       *  <div><code>
       *  var osc;
       *  var fft;
       *
       *  function setup(){
       *    createCanvas(100,100);
       *    osc = new p5.Oscillator();
       *    osc.amp(0);
       *    osc.start();
       *    fft = new p5.FFT();
       *  }
       *
       *  function draw(){
       *    background(0);
       *
       *    var freq = map(mouseX, 0, 800, 20, 15000);
       *    freq = constrain(freq, 1, 20000);
       *    osc.freq(freq);
       *
       *    var spectrum = fft.analyze();
       *    noStroke();
       *    fill(0,255,0); // spectrum is green
       *    for (var i = 0; i< spectrum.length; i++){
       *      var x = map(i, 0, spectrum.length, 0, width);
       *      var h = -height + map(spectrum[i], 0, 255, height, 0);
       *      rect(x, height, width / spectrum.length, h );
       *    }
       *
       *    stroke(255);
       *    text('Freq: ' + round(freq)+'Hz', 10, 10);
       *
       *    isMouseOverCanvas();
       *  }
       *
       *  // only play sound when mouse is over canvas
       *  function isMouseOverCanvas() {
       *    var mX = mouseX, mY = mouseY;
       *    if (mX > 0 && mX < width && mY < height && mY > 0) {
       *      osc.amp(0.5, 0.2);
       *    } else {
       *      osc.amp(0, 0.2);
       *    }
       *  }
       *  </code></div>
       *
       *
       */
      analyze() {
        var mode;
        for (var i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] === 'number') {
            this.bins = arguments[i];
            this.analyser.fftSize = this.bins * 2;
          }
          if (typeof arguments[i] === 'string') {
            mode = arguments[i];
          }
        }
        if (mode && mode.toLowerCase() === 'db') {
          freqToFloat(this);
          this.analyser.getFloatFrequencyData(this.freqDomain);
          return this.freqDomain;
        } else {
          freqToInt(this, this.freqDomain);
          this.analyser.getByteFrequencyData(this.freqDomain);
          var normalArray = Array.apply([], this.freqDomain);
          normalArray.length === this.analyser.fftSize;
          normalArray.constructor === Array;
          return normalArray;
        }
      };

      /**
       *  Returns an array of average amplitude values for a given number
       *  of frequency bands split equally. N defaults to 16.
       *  <em>NOTE: analyze() must be called prior to linAverages(). Analyze()
       *  tells the FFT to analyze frequency data, and linAverages() uses
       *  the results to group them into a smaller set of averages.</em></p>
       *
       *  @method  linAverages
       *  @param  {Number}  N                Number of returned frequency groups
       *  @return {Array}   linearAverages   Array of average amplitude values for each group
       */
      linAverages(N) {
        var N = N || 16;
        // This prevents undefined, null or 0 values of N
        var spectrum = this.freqDomain;
        var spectrumLength = spectrum.length;
        var spectrumStep = Math.floor(spectrumLength / N);
        var linearAverages = new Array(N);
        // Keep a second index for the current average group and place the values accordingly
        // with only one loop in the spectrum data
        var groupIndex = 0;
        for (var specIndex = 0; specIndex < spectrumLength; specIndex++) {
          linearAverages[groupIndex] = linearAverages[groupIndex] !== undefined ? (linearAverages[groupIndex] + spectrum[specIndex]) / 2 : spectrum[specIndex];
          // Increase the group index when the last element of the group is processed
          if (specIndex % spectrumStep === spectrumStep - 1) {
            groupIndex++;
          }
        }
        return linearAverages;
      };

      connect(stream){
        this.mediaStreamSource = window._audioContext.createMediaStreamSource(stream);
        this.mediaStreamSource.connect(this.analyser);
      }
    }


    
    var tmpPath = null;
    let adjustedLength = 0;
    let pos = 0;
    let calc1 = 0;
    let calc2 = 0;
    let max = 0;

    
    let loadUrl = null;
    let setType = 'script'
    if(self._defaults.animationElement === "oscilloscope" || self._defaults.animationElement === "bars"){
      loadUrl = {
        url:`./js/${self._defaults.animationElement}.js`,
        dataType: 'text',
        async:false
       };
    } else {
      loadUrl = {
        url : `${self._defaults.animationElement}`,
        dataType: 'text',
        async:false
      }
    }

    $.ajax(loadUrl)
    .then(data => {
      // $.when(self.preloadRemoteScript(data))
      // .then((datas)=>{
        let strData = data;
        var animation = null;
        try{
          let remoteFn = self.testRemoteFn(strData);
          var fft = new xbcfft(self._defaults.smoothing,self._defaults.bitsample);
          fft.connect(stream);
          let resizeHandler = () => {
            let w = window.innerWidth;
            let h = window.innerHeight;
            let cx = w / 2;
            let cy = h / 2;
            self.visualizer.canvas.width = w;
            self.visualizer.canvas.height = h;
            self.canvas.width = w;
            self.canvas.height = h
            $("#visualizer").css({
              width:w+"px",
              height:h+"px"
            })
          };
          /**
           * [we prepare the stream by connecting the audio stream to the needed analyzer]
           */
          $(window).on('resize',function(){
            resizeHandler();  
          })
          var draw = ()=>{
            self._defaults.barcount = parseInt(self._defaults.barcount,10);
            self._defaults.spacing = parseInt(self._defaults.spacing,10);
            self._defaults.sensitivity = parseInt(self._defaults.sensitivity,10);
            self._defaults.smoothing = parseFloat(self._defaults.smoothing);
            self.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);
            animation = window.requestAnimationFrame(draw);
            var spectrum = fft.analyze();
            var waveform = fft.waveform();
            remoteFn(
              self.canvas,
              self.visualizer,
              spectrum,
              waveform,
              self._defaults
            );
          }
          draw();
        } catch(e){
          console.error(e.message+'\n'+e.stack);
          cancelAnimationFrame(animation);        
        }
      // })
      // .fail((msg)=>{
      //   console.error(msg);
      // })
    })




    /**
    //#region  
    
    var fft,audioAnalysis,cnv,sac;
    var p5C = function(p,container,extrajuice){
      console.log(extrajuice);
      var audioAnalysis = new p5.AudioIn();
      p.setup = ()=>{
        cnv = p.createCanvas(1,1);
        sac = window._audioContext.createMediaStreamSource(stream);
        var getAudioIdx = async ()=>{
          var idx = await audioDeviceIdx();
          return idx;
        };
        var audioDeviceIdx = () =>{
          return new Promise( (resolve,reject) =>{
            audioAnalysis.getSources((sourceList)=>{
              let idx = 0;
              for(let i = 0; i < sourceList.length; i++){
                if(self._defaults.audioDeviceId === sourceList[i].deviceId){
                  idx = i;
                  break;
                }
              }
              console.log(sourceList[idx].deviceId);
              resolve({idx:idx,device:sourceList[idx]});
            });
          });
        };
        getAudioIdx().then(data => {
          
          
          //audioAnalysis.setSource(data.idx);
          audioAnalysis.start();
          fft = new p5.FFT(0.99,16);
          
          //fft.setInput(audioAnalysis);
          

          // // audioAnalysis.connect();
          // audioAnalysis.start(function(data){
          //   console.log('success',data)
          // },function(error){
          //   console.log('error',error)
          // })
          // console.log('idx',data)
          // console.log(audioAnalysis);
        })
        .catch(e =>{
          console.log('error',e);
        })

      };

      p.draw = ()=>{
        if(fft !== undefined){
          var spectrum = fft.analyze();
          console.log('spectrum',spectrum)
        }
      }
      //#endregion
      **/
    
/*    var p5C = function(p,container,extrajuice){
      var mic, fft;

      p.setup = function () {
        p.createCanvas(1920,1080);
        p.noFill();
        mic = new p5.AudioIn();
        mic.start();
        fft = new p5.FFT(0.8);
        fft.setInput(mic);
        var getAudioIdx = async ()=>{
          var idx = await audioDeviceIdx();
          return idx;
        };
        var audioDeviceIdx = () =>{
          return new Promise( (resolve,reject) =>{
            mic.getSources((sourceList)=>{
              let idx = 0;
              for(let i = 0; i < sourceList.length; i++){
                if(self._defaults.audioDeviceId === sourceList[i].deviceId){
                  idx = i;
                  break;
                }
              }
              console.log(sourceList[idx].deviceId);
              resolve({idx:idx,device:sourceList[idx]});
            });
          });
        };
        getAudioIdx().then(data => {
          
          mic.setSource(data.idx);
          
         
        })
        .catch(e =>{
          console.log('error',e);
        })

        
        
      }

      p.draw = function () {
        p.background(200);

        var spectrum = fft.analyze();

        p.beginShape();
        for (i = 0; i<spectrum.length; i++) {
          p.vertex(i, p.map(spectrum[i], 0, 255, p.height, 0) );
        }
        p.endShape();
      }
      
    };
    
    var myP5 = new p5(p5C,'dataSource',self._defaults);*/
    
    
    
    
    

    
    //console.log(_audioIdx);
    //audioAnalysis.setSource(idx);
    
    //self.analyser.fftSize = self._defaults.bitsample;


    // var XBC_avz = {
    //   canvas: self.canvas,
    //   visualizer: self.visualizer,
    //   analyser: self.analyser,
    //   fftsize: self._defaults.bitsample,
    //   stream: stream,
    //   mediaStreamSource: self.mediaStreamSource,
    //   fps: self._defaults.fps,
    //   displayfps: self._defaults.displayfps
    // }
  
    // let resizeHandler = () => {
    //   let w = window.innerWidth;
    //   let h = window.innerHeight;
    //   let cx = w / 2;
    //   let cy = h / 2;
    //   self.visualizer.canvas.width = w;
    //   self.visualizer.canvas.height = h;
    //   self.canvas.width = w;
    //   self.canvas.height = h
    // };

    // /**
    //  * [we prepare the stream by connecting the audio stream to the needed analyzer]
    //  */

    // resizeHandler();

    // /**
    //  * we clear the frame
    //  */
    // self.clearCanvas();

    // /**
    //  * [then we prepare a audioprocessor to fetch the frequencyArray to be drawn]
    //  */
    // let bufferLength = self.analyser.frequencyBinCount;
    // let frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);


    // window.addEventListener('resize', resizeHandler, false)

    // /**
    //  * [and we draw what comes in the audio process]
    //  */

    // let fps = 0;
    // let lastRun;
    // let fpInterval, startTime, now, then, elapsed;

    // function showFPS() {
    //   self.visualizer.fillStyle = "red";
    //   self.visualizer.font = "normal 16pt Arial";
    //   self.visualizer.fillText(Math.floor(fps) + " fps", 10, 26);
    // }
    // fpsInterval = 1000 / self._defaults.fps;
    // then = Date.now();
    // startTime = then;

    // /**
    //  * [draw is a function that renders in the canvas the data to be visualized]
    //  */
  


    /*
   
    */

    

  
    
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
    $("#visualizer").css({
      width:window.innerWidth+"px",
      height:window.innerHeight+"px"
    })
    

    /**
     * then we pass the arguments to the _default attribute to be shared on the class...
     */
    self._defaults = $.extend({}, defaults, self.config);
    console.log('defaults',self._defaults);

    var self = this;
    if (document.getElementById(self._defaults.visualizer) === null) console.error('The visualizer container was not found into the HTML DOM');

    /**
     * starting up instances...
     */
    self.canvas = document.getElementById(self._defaults.visualizer);
    self.canvas.width = window.innerWidth;
    self.canvas.height = window.innerHeight;
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

  this.testRemoteFn = function(strData){
    var self = this;
    eval(strData);
    if(typeof remoteFn === "undefined"){
      return this.remoteFn(strData)
    } else {
      return remoteFn;
    }
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