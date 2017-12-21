/**
XBCAVZ_START
@require https://www.kirupa.com/js/easing.js
@requore https://raw.githubusercontent.com/corbanbrook/dsp.js/master/dsp.js
XBCAVZ_END
 */

var remoteFn = (canvas,analyser,visualizer,frequencyArray,bufferLength,defaults) => {
  let usableLength = 200;
  consZ = 0,
  consZLim = 50,
  spacing = parseInt(defaults.spacing);
  analyser.getByteFrequencyData(frequencyArray);
  defaults.barcount = 10;

  function setUsableLength(len) {
    if (len < usableLength) return;
    //console.log('Increased usable length to '+usableLength);
    usableLength = len;
  }

  for (var i = 0; i < frequencyArray.length; i++) {
    if (frequencyArray[i] == 0) {
      consZ++;
    } else {
      consZ = 0;
    }
    if (consZ >= consZLim) {
      setUsableLength(i - consZLim + 1);
      break;
    }
  }
  let cwidth = canvas.width,
  cheight = canvas.height - 2,
  capHeight = 2,
  capStyle = '#fff',
  ind = 0,
  cInd = 0,
  gradientObject = null,
  //array = new Uint8Array(analyser.frequencyBinCount),
  step = Math.round(frequencyArray.length / defaults.barcount),
  meterWidth = canvas.width/defaults.barcount - spacing,
  barWidth = canvas.width/defaults.barcount - spacing,
  meterNum = canvas.width / (10 + 2);

  meterWidth = 10;
  step = Math.round(frequencyArray.length / meterNum);
  for (var i = 0; i < meterNum; i++) {
      var value = frequencyArray[i * step];
      if (window.capYPositionArray.length < Math.round(meterNum)) {
          window.capYPositionArray.push(value);
      };
      visualizer.fillStyle = capStyle;
      //draw the cap, with transition effect
      if (value < window.capYPositionArray[i]) {
          visualizer.fillRect(i * 12, cheight - (--window.capYPositionArray[i]), meterWidth, capHeight);
      } else {
          visualizer.fillRect(i * 12, cheight - value, meterWidth, capHeight);
          window.capYPositionArray[i] = value;
      };
      visualizer.fillStyle = "#003366"; //set the filllStyle to gradient for a better look
      visualizer.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
  }

};

/**
 * current visualization


var spaceh = window.innerWidth / bufferLength;
  analyser.getByteFrequencyData(frequencyArray);
  visualizer.lineWidth = defaults.strokeWidth;
  let usableLength = 200;
  consZ = 0,
  consZLim = 50,
  spacing = parseInt(defaults.spacing),
  pos = 0,
  hideIfZero = false,
  barWidth = canvas.width/defaults.barcount - spacing,
  sensitivity = defaults.sensitivity * 0.01,
  ind = 0,
  cInd=0,
  _x = 0,
  _y = 0,
  _w = 0,
  _h = 0,
  _x0 = 0,
  _x1 = 0,
  _y0 = 0,
  _y1 = 0,
  gradientObject = null,
  capYPositionArray = []

  function setUsableLength(len) {
    if (len < usableLength) return;
    //console.log('Increased usable length to '+usableLength);
    usableLength = len;
  }

  for (var i = 0; i < frequencyArray.length; i++) {
    if (frequencyArray[i] == 0) {
      consZ++;
    } else {
      consZ = 0;
    }
    if (consZ >= consZLim) {
      setUsableLength(i - consZLim + 1);
      break;
    }
  }

  for (var i = 0; i < canvas.width; i += (barWidth + spacing)) {


    visualizer.save();
    // if (!hideIfZero){
    //   _x0 = 0;
    //   _y0 = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255) - 1);
    //   _x1 = 0;
    //   _y1 = canvas.height;
    // }else{ 
    //   _x0 = 0;
    //   _y0 = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255));
    //   _x1 = 0;
    //   _y1 = canvas.height;
    // }
    //_y0 = _y0 * ((sensitivity/0.01)*2);
    //gradientObject = visualizer.createLinearGradient(_x0,_y0,_x1,_y1);

    if(defaults.visualizationSelect === 'flames'){
      gradientObject.addColorStop('0', '#ff0a0a')
      gradientObject.addColorStop('0.2', '#f1ff0a')
      gradientObject.addColorStop('0.9', '#d923b9')
      gradientObject.addColorStop('1', '#050d61')
      visualizer.fillStyle = gradientObject;
    } else {
      visualizer.fillStyle = `${defaults.colorcode}`;
    }
    
    

    visualizer.translate(i, 0);
    if (hideIfZero){
      _x = 0;
      _y = canvas.height/2;//Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255) - 1);
      _w = barWidth;
      _h = 20;
    }else{ 
      _x = 0;
      _y = canvas.height/2;//Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255));
      _w = barWidth;
      _h = 1120;//canvas.height;
    }
    _y = canvas.height - 50;
    _h = 50;

    visualizer.fillRect(_x,_y,_w,_h);
    visualizer.font="12px arial";
    visualizer.fillStyle = "blue";
    visualizer.fillText(_h,_x,canvas.height/2)
    visualizer.restore();
    ind += Math.floor(usableLength / defaults.barcount);
  }
  let tmpPath = null;
  let adjustedLength = 0;

 */