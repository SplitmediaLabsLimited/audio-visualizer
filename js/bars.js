/**
XBCAVZ_START
@require https://www.kirupa.com/js/easing.js
XBCAVZ_END
 */

var remoteFn = (canvas,analyser,visualizer,frequencyArray,bufferLength,defaults) => {
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
  sensitivity = defaults.sensitivity / 50,
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
    if (!hideIfZero){
      _x0 = 0;
      _y0 = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255) - 1);
      _x1 = 0;
      _y1 = canvas.height;
    }else{ 
      _x0 = 0;
      _y0 = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255));
      _x1 = 0;
      _y1 = canvas.height;
    }
    //_y0 = _y0 * ((sensitivity/0.01)*2);
    gradientObject = visualizer.createLinearGradient(_x0,_y0,_x1,_y1);

    if(defaults.visualizationSelect === 'flames'){
      gradientObject.addColorStop('0', '#ff0a0a')
      gradientObject.addColorStop('0.2', '#f1ff0a')
      gradientObject.addColorStop('0.9', '#d923b9')
      gradientObject.addColorStop('1', '#050d61')
    } else {
      gradientObject.addColorStop('0', `${defaults.colorcode}`)
      gradientObject.addColorStop('1', `${defaults.colorcode}`)
    }
    
    visualizer.fillStyle = gradientObject;

    visualizer.translate(i, 0);
    if (hideIfZero){
      _x = 0;
      _y = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255) - 1);
      _w = barWidth;
      _h = canvas.height;
    }else{ 
      _x = 0;
      _y = Math.floor(canvas.height - canvas.height * (frequencyArray[Math.floor(ind)] / 255));
      _w = barWidth;
      _h = canvas.height;
    }

    visualizer.fillRect(_x,_y,_w,_h);
    visualizer.restore();
    ind += Math.floor(usableLength / defaults.barcount);
  }
  let tmpPath = null;
  let adjustedLength = 0;
};