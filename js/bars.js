function remoteFn(canvas,visualizer,spectrum,waveform,defaults){
  let barHeight = (spectrumData) => {
    //max possible value of SpectrumData is 255;
    var getPercentage = Math.floor((spectrumData/255)*100);
    var barHeight = (getPercentage * 0.01) * canvas.height;
    if(isNaN(barHeight)) barHeight = 0;
    return barHeight;
  }
  debugger;

  let maximumLength = spectrum.length;
  let sensitivity = (defaults.sensitivity*0.01)*2;
  let barcount = defaults.barcount;
  let spacing = defaults.spacing;
  let spectrumSpace = Math.floor(maximumLength/(barcount + spacing));
  let usableSpace = Math.floor(canvas.width/(barcount - spacing));
  


  let _barHeight = null;
  let counter = 0;

  let gradientObject = null;
  for (var i = 0; i < maximumLength; i = i + spectrumSpace) {
    _barHeight = barHeight(spectrum[i]);
    _barHeight = _barHeight * sensitivity;
    if(_barHeight > canvas.height){
      _barHeight = canvas.height
    }

    if(defaults.visualizationSelect === 'flames'){
      gradientObject = visualizer.createLinearGradient(0,canvas.height - _barHeight,0,canvas.height);
      gradientObject.addColorStop('0', '#ff0a0a')
      gradientObject.addColorStop('0.2', '#f1ff0a')
      gradientObject.addColorStop('0.9', '#d923b9')
      gradientObject.addColorStop('1', '#050d61')
      visualizer.fillStyle = gradientObject;
    } else {
      visualizer.fillStyle = defaults.colorcode;
    }

    //visualizer.fillStyle = defaults.colorcode;
    visualizer.fillRect(counter*(usableSpace+spacing),canvas.height -_barHeight,usableSpace-spacing, +_barHeight);
    counter++;
  }
  
 // console.log(spectrum.length);
 // for (var i = 0; i < spectrum.length; i++) {
 //    _barHeight = barHeight(spectrum[i]);
 //    visualizer.fillStyle = defaults.colorcode;
 //    visualizer.fillRect(i,canvas.height -_barHeight,1, +_barHeight);
 // }

}
  