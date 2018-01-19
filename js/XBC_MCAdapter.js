'use strict';
class XBCMC_adapter {
  constructor(obj){
    /* * Audio node settings * */
    /* *********************** */
    this.volumeStep = 0; // the step for each volume notch as a fraction of 1

    /* *************************** */
    /* * Basic spectrum settings * */
    /* *************************** */
    // BASIC ATTRIBUTES
    this.sensitivity                  = obj.hasOwnProperty('sensitivity')           ? obj.sensitivity          : 1; //amplifies the signal making low frequencies to be more visible
    this.barLength                    = obj.hasOwnProperty('barLength')             ? obj.barLength            : 50;//63; // number of bars in the spectrum
    this.spectrumRatioHeight          = obj.hasOwnProperty('spectrumRatioHeight')   ? obj.spectrumRatioHeight  : 4.5;//4.5; // the ratio of the spectrum width to its height
    this.spectrumSpacing              = obj.hasOwnProperty('spectrumSpacing')       ? obj.spectrumSpacing      : 7;//7; // the separation of each spectrum bar in pixels at width=1920
    this.maxFftSize                   = obj.hasOwnProperty('maxFftSize')            ? obj.maxFftSize           : 1024;//16384; // the preferred fftSize to use for the audio node (actual fftSize may be lower)
    this.audioDelay                   = obj.hasOwnProperty('audioDelay')            ? obj.audioDelay           : 0;//0.4; // audio will lag behind the rendered spectrum by this amount of time (in seconds)
    this.spectrumStart                = obj.hasOwnProperty('spectrumStart')         ? obj.spectrumStart        : 4;//4; // the first bin rendered in the spectrum
    this.spectrumEnd                  = obj.hasOwnProperty('spectrumEnd')           ? obj.spectrumEnd          : 1200;//1200; // the last bin rendered in the spectrum
    this.spectrumScale                = obj.hasOwnProperty('spectrumScale')         ? obj.spectrumScale        : 2.5; //2.5; // the logarithmic scale to adjust spectrum values to
    // EXPONENTIAL TRANSFORMATION
    this.spectrumMaxExponent          = obj.hasOwnProperty('spectrumMaxExponent')   ? obj.spectrumMaxExponent  : 1.5;// 6; // the max exponent to raise spectrum values to
    this.spectrumMinExponent          = obj.hasOwnProperty('spectrumMinExponent')   ? obj.spectrumMinExponent  : 1;// 3; // the min exponent to raise spectrum values to
    this.spectrumExponentScale        = obj.hasOwnProperty('spectrumExponentScale') ? obj.spectrumExponentScale: 1;// 2; // the scale for spectrum exponents
    // DROP SHADOW

    /* ********************** */
    /* * Smoothing settings * */
    /* ********************** */
    this.smoothSteps                  = obj.hasOwnProperty('smoothSteps')           ? obj.smoothSteps          : 2;//1; // number of smoothing passes to execute
    this.temporalSmoothing            = obj.hasOwnProperty('temporalSmoothing')     ? obj.temporalSmoothing    : 0.7;//0.2; // passed directly to the JS analyser node
    this.smoothPoints                 = obj.hasOwnProperty('smoothPoints')          ? obj.smoothPoints         : 4;//3; // points to use for algorithmic smoothing. Must be an odd number.
    /* ************************************ */
    /* * Spectrum margin dropoff settings * */
    /* ************************************ */
    this.headMargin                   = obj.hasOwnProperty('headMargin')            ? obj.headMargin           : 1; // 7; // the size of the head margin dropoff zone
    this.tailMargin                   = obj.hasOwnProperty('tailMargin')            ? obj.tailMargin           : 0; // 0; // the size of the tail margin dropoff zone
    this.minMarginWeight              = obj.hasOwnProperty('minMarginWeight')       ? obj.minMarginWeight      : 1; // 1; // the minimum weight applied to bars in the dropoff zone
    this.resRatio                     = obj.hasOwnProperty('resRatio')              ? obj.resRatio             : 1; // 1;//window.innerWidth / 1920;
    this.spectrumWidth                = obj.hasOwnProperty('spectrumWidth')         ? obj.spectrumWidth        : window.innerWidth * this.resRatio
    this.spectrumHeight               = obj.hasOwnProperty('spectrumHeight')        ? obj.spectrumHeight       : window.innerHeight;//this.spectrumWidth / this.spectrumRatioHeight;
    this.context                      = obj.hasOwnProperty('context')               ? obj.context              : window._audioContext;
    //this.dispContext                  = obj.hasOwnProperty('dispContext')           ? obj.dispContext          : window._audioContext;
    this.spectrumWidth                = (this.barWidth + this.spectrumSpacing) * this.spectrumSize - this.spectrumSpacing;
    this.barWidth                     = (this.spectrumWidth + this.spectrumSpacing) / this.spectrumSize - this.spectrumSpacing;
    this.minProcessPeriod             = 0; // ms between calls to the process function
    this.marginDecay                  = 100
    this.headMarginSlope              = (1 - this.minMarginWeight) / Math.pow(this.headMargin, this.marginDecay);
    this.lastProcess                  = [Date.now()];
    this.bufferInterval               = 1024
    this.gainNode                     = null;
    this.audioBuffer                  = null;
    this.bufferSource                 = null;
    this.dispBufferSource             = null;
    this.analyser                     = this.context.createAnalyser();
    this.dispScriptProcessor          = null;
    this.scriptProcessor              = null;
    this.bufferLoader                 = null;
    this.bufferSource                 = null;
    this.freqDomain                   = null; //used for bars mainly
    this.timeDomain                   = null; //used mostly for oscilloscopes
    this.spectrumAnimation            = "phase_1";
    this.spectrumAnimationStart       = 0;
    this.delayNode                    = null;
    this.ctx
  }

  connectStream(stream){
    /* 
    this.mediaStreamSource = this.context.createMediaStreamSource(stream);
    this.mediaStreamSource.connect(this.context.destination);
    */
    this.bufferSource = this.context.createMediaStreamSource(stream);
    this.analyser.smoothingTimeConstant = this.temporalSmoothing; 
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -66;
    this.analyser.fftSize = this.maxFftSize;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.sensitivity;
    this.bufferSource.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    //this.muteGainNode = this.context.createGain();
    //this.muteGainNode.gain.value = -1;
    // this.scriptProcessor = this.context.createScriptProcessor(stream);
    // this.scriptProcessor.connect(this.context.destination);
    // this.analyser = this.context.createAnalyser();
    // this.analyser.connect(this.scriptProcessor);
    // this.analyser.smoothingTimeConstant = 0.85;
    // this.analyser.minDecibels = -100;
    // this.analyser.maxDecibels = -33;
    // try {
    //     this.analyser.fftSize = this.maxFftSize; // ideal bin count
    //     console.log('Using fftSize of ' + this.analyser.fftSize + ' (woot!)');
    // } catch (ex) {
    //     this.analyser.fftSize = 2048; // this will work for most if not all systems
    //     console.log('Using fftSize of ' + this.analyser.fftSize);
    //     alert('Could not set optimal fftSize! This may look a bit weird...');
    // }
    //this.bufferSource.connect(this.analyser);
  }
  connect(buffer) {
    this.bufferSource = this.context.createMediaStreamSource(buffer);
    this.bufferSource.connect(this.context.destination);
    this.muteGainNode = this.context.createGain();
    this.muteGainNode.gain.value = -1;
    this.bufferSource.connect(this.muteGainNode);
    this.muteGainNode.connect(this.context.destination);

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0;
    this.delayNode = this.context.createDelay(1);
    this.delayNode.delayTime.value = this.audioDelay;
    this.bufferSource.connect(this.gainNode);
    this.gainNode.connect(this.delayNode);
    this.bufferSource.connect(this.delayNode);
    this.delayNode.connect(this.context.destination);

    this.scriptProcessor = this.context.createScriptProcessor(this.bufferInterval, 1, 1);
    this.scriptProcessor.connect(this.context.destination);

    this.analyser = this.context.createAnalyser();
    this.analyser.connect(this.scriptProcessor);
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -33;
    this.analyser.fftSize = this.maxFftSize; // ideal bin count
    console.log('Using fftSize of ' + this.analyser.fftSize + ' (woot!)');
    
    this.bufferSource.connect(this.analyser);
    this.initSpectrumHandler();

    /*
    bufferSource.buffer = buffer;
    bufferSource.start(0);
    $('#status').fadeOut(); // will first fade out the loading animation
    $('#preloader').fadeOut('slow'); // will fade out the grey DIV that covers the website.
    $("body").addClass("playing");
    $('#spectrum_preloader').hide();
    $('#loading-info').fadeOut(); // fades out the loading text
      isPlaying = true;
      begun = true;
      started = Date.now();
    */
  }

  connectAudioStream(url){
    this.bufferLoader = new BufferLoader(
      this.context,
      [url],
      this.connectBuffer)
  }

  connectBuffer(bufferList){
    this.mediaStreamSource = this.context.createBufferSource()
    this.bufferSource =  bufferList[0];
    this.bufferSource.connect(this.context.destination);
    this.bufferSource.connect(this.analyser);
    this.bufferSource.start(0)
  }



  /**
   *             ##################### SPECTRUM ALGORYTHMS #################################
   */

  smooth(array) {
    return this.savitskyGolaySmooth(array);
  }

  refreshLastProcess(){
    this.lastProcess.unshift(Date.now());
    if(this.lastProcess.length > 2){
      this.lastProcess.pop();
    }
  }

  /**
   * A Savitzky–Golay filter is a digital filter that can be applied to a set of digital data 
   * points for the purpose of smoothing the data, that is, to increase the signal-to-noise ratio 
   * without greatly distorting the signal. This is achieved, in a process known as convolution, 
   * by fitting successive sub-sets of adjacent data points with a low-degree polynomial by the method 
   * f linear least squares. When the data points are equally spaced, an analytical solution to the least-squares 
   * equations can be found, in the form of a single set of "convolution coefficients" that can be applied to all 
   * data sub-sets, to give estimates of the smoothed signal, (or derivatives of the smoothed signal) at the central 
   * point of each sub-set.
   */
  savitskyGolaySmooth(array) {
    var lastArray = array;
    for (var pass = 0; pass < this.smoothSteps; pass++) {
      var sidePoints = Math.floor(this.smoothPoints / 2);
      var cn = 1 / (2 * sidePoints + 1);
      var newArr = [];
      for (var i = 0; i < sidePoints; i++) {
        newArr[i] = lastArray[i];
        newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
      }
      for (var i = sidePoints; i < lastArray.length - sidePoints; i++) {
        var sum = 0;
        for (var n = -sidePoints; n <= sidePoints; n++) {
          sum += cn * lastArray[i + n] + n;
        }
        newArr[i] = sum;
      }
      lastArray = newArr;
    }
    return newArr;
  }

  transformToVisualBins(array) {
    var newArray = new Uint8Array(this.barLength);
    for (var i = 0; i < this.barLength; i++) {
      var bin = Math.pow(i / this.barLength, this.spectrumScale) * (this.spectrumEnd - this.spectrumStart) + this.spectrumStart;
      newArray[i] = array[Math.floor(bin) + this.spectrumStart] * (bin % 1) +
        array[Math.floor(bin + 1) + this.spectrumStart] * (1 - (bin % 1))
    }
    return newArray;
  }

  normalizeAmplitude(array) {
    var values = [];
    for (var i = 0; i < this.barLength; i++) {
      //if (begun) {
        values[i] = array[i] / 255 * this.spectrumHeight;
      //} else {
        // value = 1;
      //}
    }
    return values;
  }

  averageTransform(array) {
    var values = [];
    var length = array.length;
    for (var i = 0; i < length; i++) {
      var value = 0;
      if (i == 0) {
        value = array[i];
      } else if (i == length - 1) {
        value = (array[i - 1] + array[i]) / 2;
      } else {
        var prevValue = array[i - 1];
        var curValue = array[i];
        var nextValue = array[i + 1];
        if (curValue >= prevValue && curValue >= nextValue) {
          value = curValue;
        } else {
          value = (curValue + Math.max(nextValue, prevValue)) / 2;
        }
      }
      value = Math.min(value + 1, this.spectrumHeight);
      values[i] = value;
    }
    var newValues = [];
    for (var i = 0; i < length; i++) {
      var value = 0;
      if (i == 0) {
        value = values[i];
      } else if (i == length - 1) {
        value = (values[i - 1] + values[i]) / 2;
      } else {
        var prevValue = values[i - 1];
        var curValue = values[i];
        var nextValue = values[i + 1];
        if (curValue >= prevValue && curValue >= nextValue) {
          value = curValue;
        } else {
          value = ((curValue / 2) + (Math.max(nextValue, prevValue) / 3) + (Math.min(nextValue, prevValue) / 6));
        }
      }
      value = Math.min(value + 1, this.spectrumHeight);
      newValues[i] = value;
    }
    return newValues;
  }

  tailTransform(array) {
    var values = [];
    for (var i = 0; i < this.barLength; i++) {
      var value = array[i];
      if (i < this.headMargin) {
        value *= this.headMarginSlope * Math.pow(i + 1, this.marginDecay) + this.minMarginWeight;
      } else if (this.barLength - i <= this.tailMargin) {
        value *= this.tailMarginSlope * Math.pow(this.barLength - i, this.marginDecay) + this.minMarginWeight;
      }
      values[i] = value;
    }
    return values;
  }

  exponentialTransform(array) {
    var newArr = [];
    for (var i = 0; i < array.length; i++) {
      var exp = (this.spectrumMaxExponent - this.spectrumMinExponent) * (1 - Math.pow(i / this.barLength, this.spectrumExponentScale)) + this.spectrumMinExponent;
      newArr[i] = Math.max(Math.pow(array[i] / this.spectrumHeight, exp) * this.spectrumHeight, 1);
    }
    return newArr;
  }

  experimentalTransform(array) {
    var resistance = 3;
    var newArr = [];
    for (var i = 0; i < array.length; i++) {
      var sum = 0;
      var divisor = 0;
      for (var j = 0; j < array.length; j++) {
        var dist = Math.abs(i - j);
        var weight = 1 / Math.pow(2, dist);
        if (weight == 1) weight = resistance;
        sum += array[j] * weight;
        divisor += weight;
      }
      newArr[i] = sum / divisor;
    }
    return newArr;
  }

  selectiveToUpperCase(str) {
    str = str.toUpperCase();
    var i;
    while ((i = str.indexOf('^')) !== -1) {
        str = str.replace(str.substring(i, i + 2), str.substring(i + 1, i + 2).toLowerCase());
    }
    return str;
  }

  centerBiasedRandom(range, bias) {
    return biasedRandom(range / 2, bias) * (Math.random() >= 0.5 ? 1 : -1);
  }

  biasedRandom(range, bias) {
      return (range - Math.pow(Math.random() * Math.pow(range, bias), 1 / bias));
  }




  /**
   *           ##################### SET UP AUDIO NODES #########################
   */


  setupAudioNodes() {
    bufferSource = context.createBufferSource();
    setOnEnded();
    bufferSource.connect(context.destination);

    this.muteGainNode = context.createGain();
    this.muteGainNode.gain.value = -1;
    bufferSource.connect(this.muteGainNode);
    this.muteGainNode.connect(context.destination);

    gainNode = context.createGain();
    gainNode.gain.value = 0;
    var vol = getCookie('volume');
    if (vol != null) {
        gainNode.gain.value = vol;
    }

    delayNode = context.createDelay(1);
    delayNode.delayTime.value = this.audioDelay;
    bufferSource.connect(gainNode);
    gainNode.connect(delayNode);
    bufferSource.connect(delayNode);
    delayNode.connect(context.destination);

    scriptProcessor = context.createScriptProcessor(this.bufferInterval, 1, 1);
    scriptProcessor.connect(context.destination);

    analyser = context.createAnalyser();
    analyser.connect(scriptProcessor);
    analyser.smoothingTimeConstant = this.temporalSmoothing;
    analyser.minDecibels = -100;
    analyser.maxDecibels = -0.1;
    
    analyser.fftSize = this.maxFftSize; // ideal bin count
    console.log('Using fftSize of ' + analyser.fftSize + ' (woot!)');
    
    bufferSource.connect(analyser);
  }

  

  timeToInt() {
    if (this.timeDomain instanceof Uint8Array === false) {
      this.timeDomain = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  /**getTransformedSpectrum**/
  getSpectrum(array) {
    var newArr = array;


    newArr = this.normalizeAmplitude(array);
    // console.log('normalizeAmplitude',newArr);
    newArr = this.averageTransform(newArr);
    // console.log('averageTransform',newArr);
    newArr = this.tailTransform(newArr);
    // console.log('tailTransform',newArr);
    newArr = this.smooth(newArr);
    // console.log('smooth',newArr);
    newArr = this.exponentialTransform(newArr);
    // console.log('exponentialTransform',newArr);
    return newArr;
  }

  amplify(array){
    for(let i = 0; i < array.length; i++){
      array[i] = array[i] * (this.sensitivity * 2);
    }
    return array;
  }

  initSpectrumHandler() {
    this.scriptProcessor.onaudioprocess = this.fetchSpectrum;
  }

  fetchSpectrum() {
      this.refreshLastProcess();
      var now = Date.now();
      do { now = Date.now(); } while (now - this.lastProcess[0] < this.minProcessPeriod);
      this.refreshLastProcess();
      this.freqDomain =  new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(this.freqDomain);
      var array = this.transformToVisualBins(this.freqDomain);
      this.freqDomain = array;
      return this.drawSpectrum(this.freqDomain)
  }

  fetchWaveform() {
      this.refreshLastProcess();
      var now = Date.now();
      do { now = Date.now(); } while (now - this.lastProcess[0] < this.minProcessPeriod);
      this.refreshLastProcess();
      this.freqDomain =  new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(freqDomain);
      var array = this.transformToVisualBins(freqDomain);
      this.freqDomain = array;
      return this.drawWaveform(array);
  }

  getWaveform() {
    var bins, mode, normalArray;
    this.refreshLastProcess();
    var now = Date.now();
    do { now = Date.now(); } while (now - this.lastProcess[0] < this.minProcessPeriod);

    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === 'number') {
        bins = arguments[i];
        this.analyser.fftSize = bins * 2;
      }
      if (typeof arguments[i] === 'string') {
        mode = arguments[i];
      }
    }
    this.timeToInt();
    this.analyser.getByteTimeDomainData(this.timeDomain);
    var normalArray = new Array();
    for (var j = 0; j < this.timeDomain.length; j++) {
      var scaled = this.map(this.timeDomain[j], 0, 255, -1, 1);
      normalArray.push(scaled);
    }
    return normalArray;
  }


  drawSpectrum(array) {
      var array = this.getSpectrum(array);
      var now = Date.now();
      var rArray = [];
      var ratio = null;


      if (this.spectrumAnimation == "phase_1") {
          ratio = (now - this.lastProcess[0]) / 500;
          if (ratio > 1) {
              this.spectrumAnimation = "phase_2";
              this.spectrumAnimationStart = now;
          }
      } else if (this.spectrumAnimation == "phase_2") {
          ratio = (now - this.spectrumAnimationStart) / 500;
          if (ratio > 1) {
              this.spectrumAnimation = "phase_3";
              this.spectrumAnimationStart = now;
          }
      } else if (this.spectrumAnimation == "phase_3") {
          ratio = (now - this.spectrumAnimationStart) / 1000;

          // drawing pass
          for (var i = 0; i < this.barLength; i++) {
              rArray[i] = array[i];

              // Used to smooth transiton between bar & full spectrum (lasts 1 sec)
              if (ratio < 1) {
                  rArray[i] = rArray[i] / (1 + 9 - 9 * ratio); 
              }

              if (rArray[i] < 2 * this.resRatio) {
                  rArray[i] = 2 * this.resRatio;
              }

              //ctx.fillRect(i * (this.barWidth + this.spectrumSpacing), this.spectrumHeight - value, this.barWidth, value, value);
          }
          
      }
      if(!rArray.length){
        rArray = array;
      }
      return rArray;
      // ctx.clearRect(0, this.spectrumHeight, this.spectrumWidth, this.blockTopPadding);
  }
}