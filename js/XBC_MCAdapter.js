class XBCMC_addapter {
  constructor(FFTArray) {

  }

  setup(obj){
    /* * Audio node settings * */
    /* *********************** */
    this.volumeStep = 0.05; // the step for each volume notch as a fraction of 1

    /* *************************** */
    /* * Basic spectrum settings * */
    /* *************************** */
    // BASIC ATTRIBUTES
    this.barLength            = obj.barLength            ==! undefined ? obj.barLength            : 63; // number of bars in the spectrum
    this.spectrumRatioHeight = obj.spectrumRatioHeight ==! undefined ? obj.spectrumRatioHeight : 4.5; // the ratio of the spectrum width to its height
    this.spectrumSpacing              = obj.spectrumSpacing         ==! undefined ? obj.spectrumSpacing         : 7; // the separation of each spectrum bar in pixels at width=1920
    this.maxFftSize              = obj.maxFftSize              ==! undefined ? obj.maxFftSize              : 16384; // the preferred fftSize to use for the audio node (actual fftSize may be lower)
    this.audioDelay              = obj.audioDelay              ==! undefined ? obj.audioDelay              : 0.4; // audio will lag behind the rendered spectrum by this amount of time (in seconds)
    this.spectrumWidth = (this.barWidth + this.spectrumSpacing) * spectrumSize - this.spectrumSpacing;
    this.barWidth = (this.spectrumWidth + this.spectrumSpacing) / spectrumSize - this.spectrumSpacing;
    // BASIC TRANSFORMATION
    this.spectrumStart           = obj.spectrumStart           ==! undefined ? obj.spectrumStart           : 4; // the first bin rendered in the spectrum
    this.spectrumEnd             = obj.spectrumEnd             ==! undefined ? obj.spectrumEnd             : 1200; // the last bin rendered in the spectrum
    this.spectrumScale           = obj.spectrumScale           ==! undefined ? obj.spectrumScale           : 2.5; // the logarithmic scale to adjust spectrum values to
    // EXPONENTIAL TRANSFORMATION
    this.spectrumMaxExponent     = obj.spectrumMaxExponent     ==! undefined ? obj.spectrumMaxExponent     : 6; // the max exponent to raise spectrum values to
    this.spectrumMinExponent     = obj.spectrumMinExponent     ==! undefined ? obj.spectrumMinExponent     : 3; // the min exponent to raise spectrum values to
    this.spectrumExponentScale   = obj.spectrumExponentScale   ==! undefined ? obj.spectrumExponentScale   : 2; // the scale for spectrum exponents
    // DROP SHADOW

    /* ********************** */
    /* * Smoothing settings * */
    /* ********************** */
    this.smootPoints         = obj.smootPoints         ==! undefined ? obj.smootPoints         : 3; // points to use for algorithmic smoothing. Must be an odd number.
    this.smoothSteps         = obj.smoothSteps         ==! undefined ? obj.smoothSteps         : 1; // number of smoothing passes to execute
    this.temporalSmoothing       = obj.temporalSmoothing       ==! undefined ? obj.temporalSmoothing       : 0.2; // passed directly to the JS analyzer node
    this.minProcessPeriod = 18; // ms between calls to the process function
    /* ************************************ */
    /* * Spectrum margin dropoff settings * */
    /* ************************************ */
    this.headMargin                   = obj.headMargin              ==! undefined ? obj.headMargin              : 7; // the size of the head margin dropoff zone
    this.tailMargin              = obj.tailMargin              ==! undefined ? obj.tailMargin              : 0; // the size of the tail margin dropoff zone
    this.minMarginWeight         = obj.minMarginWeight         ==! undefined ? obj.minMarginWeight         : 0.7; // the minimum weight applied to bars in the dropoff zone

    this.resRatio                     = obj.resRatio                ==! undefined ? obj.resRatio                : $(window).width() / 1920;
    this.blockTopPadding = 50 * this.resRatio;
    this.spectrumWidth                = obj.spectrumWidth           ==! undefined ? obj.spectrumWidth           : 1568 * this.resRatio
    this.spectrumHeight               = obj.spectrumHeight          ==! undefined ? obj.spectrumHeight          : this.spectrumWidth / this.spectrumRatioHeight;
    this.lastProcess = Date.now();
    this.lastSpectrum = [];

    /* *************************** */
    /* * Basic particle settings * */
    /* *************************** */

    /* ****************************** */
    /* * Particle analysis settings * */
    /* ****************************** */

    /* ***************** */
    /* * Misc settings * */
    /* ***************** */
    this.marginDecay = 1.6
    this.headMarginSlope = (1 - this.minMarginWeight) / Math.pow(this.headMargin, this.marginDecay);
    

    /*************** 
     * Audio nodes *
     ***************/
    this.context                      = obj.context                 ==! undefined ? obj.context                 : new AudioContext();
    this.dispContext                  = obj.dispContext             ==! undefined ? obj.dispContext             : new AudioContext();
    this.gainNode;
    this.audioBuffer;
    this.bufferSource;
    this.dispBufferSource;
    this.analyser;
    this.dispScriptProcessor;
    this.scriptProcessor;
    this.bufferLoader;
    this.bufferSource;
  }

  connectStream(stream){
    this.mediaStreamSource = this.context.createMediaStreamSource(stream);
    this.mediaStreamSource.connect(this.analyser)
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
    this.bufferSource.start(0)
  }



  /**
   *             ##################### SPECTRUM ALGORYTHMS #################################
   */

  smooth(array) {
    return savitskyGolaySmooth(array);
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
      var sidePoints = Math.floor(this.smootPoints / 2);
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
      if (begun) {
        values[i] = array[i] / 255 * this.spectrumHeight;
      } else {
        value = 1;
      }
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

  connect(buffer) {
    this.mediaStreamSource = window._audioContext.createMediaStreamSource(stream);
    this.mediaStreamSource.connect(this.analyser);
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


  /**
   *           ##################### SET UP AUDIO NODES #########################
   */


  setupAudioNodes() {
    bufferSource = context.createBufferSource();
    setOnEnded();
    bufferSource.connect(context.destination);

    muteGainNode = context.createGain();
    muteGainNode.gain.value = -1;
    bufferSource.connect(muteGainNode);
    muteGainNode.connect(context.destination);

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

    scriptProcessor = context.createScriptProcessor(bufferInterval, 1, 1);
    scriptProcessor.connect(context.destination);

    analyzer = context.createAnalyser();
    analyzer.connect(scriptProcessor);
    analyzer.smoothingTimeConstant = this.temporalSmoothing;
    analyzer.minDecibels = -100;
    analyzer.maxDecibels = -33;
    try {
        analyzer.fftSize = this.maxFftSize; // ideal bin count
        console.log('Using fftSize of ' + analyzer.fftSize + ' (woot!)');
    } catch (ex) {
        analyzer.fftSize = 2048; // this will work for most if not all systems
        console.log('Using fftSize of ' + analyzer.fftSize);
        alert('Could not set optimal fftSize! This may look a bit weird...');
    }
    bufferSource.connect(analyzer);
  }

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
  getWaveform() {
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

  /**getTransformedSpectrum**/
  getSpectrum(array) {
    var newArr = normalizeAmplitude(array);
    newArr = averageTransform(newArr);
    newArr = tailTransform(newArr);
    newArr = smooth(newArr);
    newArr = exponentialTransform(newArr);
    return newArr;
  }

  initSpectrumHandler() {
    scriptProcessor.onaudioprocess = handleAudio;
  }

  handleAudio() {
      // don't do anything if the audio is paused
      if (!isPlaying) {
          return;
      }

      var now = Date.now();
      do { now = Date.now(); } while (now - this.lastProcess < this.minProcessPeriod);
      this.lastProcess = Date.now();

      checkHideableText();

      var initialArray =  new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(initialArray);
      var array = transformToVisualBins(initialArray);
      ctx.clearRect(-ctx.shadowBlur, -ctx.shadowBlur, this.spectrumWidth + ctx.shadowBlur, this.spectrumHeight + ctx.shadowBlur);
      if (song.getGenre() == 'ayy lmao') {
          handleRainbowSpectrum();
      }
      ctx.fillStyle = color; // bar color

      drawSpectrum(array);
  }

  var spectrumAnimation = "phase_1";
  var spectrumAnimationStart = 0;

  drawSpectrum(array) {
      if (isPlaying) {
          updateParticleAttributes(array);

          if (this.lastSpectrum.length == 1) {
              this.lastSpectrum = array;
          }
      }

      var drawArray = isPlaying ? array : this.lastSpectrum;
      array = this.getSpectrum(array);

      var now = Date.now();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = spectrumShadowBlur;
      ctx.shadowOffsetX = spectrumShadowOffsetX;
      ctx.shadowOffsetY = spectrumShadowOffsetY;

      if (spectrumAnimation == "phase_1") {
          var ratio = (now - started) / 500;

          ctx.fillRect(0, this.spectrumHeight - 2 * this.resRatio, (this.spectrumWidth/2) * ratio, 2 * this.resRatio);
          ctx.fillRect(this.spectrumWidth - (this.spectrumWidth/2) * ratio, this.spectrumHeight - 2 * this.resRatio, (this.spectrumWidth/2) * ratio, 2 * this.resRatio);

          if (ratio > 1) {
              spectrumAnimation = "phase_2";
              spectrumAnimationStart = now;
          }
      } else if (spectrumAnimation == "phase_2") {
          var ratio = (now - spectrumAnimationStart) / 500;

          ctx.globalAlpha = Math.abs(Math.cos(ratio*10));

          ctx.fillRect(0, this.spectrumHeight - 2 * this.resRatio, this.spectrumWidth, 2 * this.resRatio);

          ctx.globalAlpha = 1;

          if (ratio > 1) {
              spectrumAnimation = "phase_3";
              spectrumAnimationStart = now;
          }
      } else if (spectrumAnimation == "phase_3") {
          var ratio = (now - spectrumAnimationStart) / 1000;

          // drawing pass
          for (var i = 0; i < this.barLength; i++) {
              var value = array[i];

              // Used to smooth transiton between bar & full spectrum (lasts 1 sec)
              if (ratio < 1) {
                  value = value / (1 + 9 - 9 * ratio); 
              }

              if (value < 2 * this.resRatio) {
                  value = 2 * this.resRatio;
              }

              ctx.fillRect(i * (this.barWidth + this.spectrumSpacing), this.spectrumHeight - value, this.barWidth, value, value);
          }
      }

      ctx.clearRect(0, this.spectrumHeight, this.spectrumWidth, this.blockTopPadding);
  }


}


initGui(song);