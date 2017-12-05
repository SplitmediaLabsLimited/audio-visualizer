var remoteFn = (canvas,analyser,visualizer,frequencyArray,bufferLength,defaults) => {
  analyser.getByteTimeDomainData(frequencyArray);
  visualizer.beginPath();
  var x = 0;
  var y = 0;
  var sliceWidth = canvas.width / bufferLength;
  visualizer.strokeStyle = '#fff';
  visualizer.lineWidth = defaults.strokeW;
  if (defaults.strokeS1 > 0 && defaults.strokeS2 > 0) {
    visualizer.setLineDash([defaults.strokeS1, defaults.strokeS2]);
  }

  var sliceWidth = canvas.width / bufferLength;
  var x = 0;
  for (var i = 0; i < bufferLength; i++) {
    var v = frequencyArray[i] / 128.0;
    var y = v * canvas.height / 2;
    if (i === 0) {
      visualizer.moveTo(x, y);
    } else {
      visualizer.lineTo(x, y);
    }
    x += sliceWidth;
  }

  var gradientObject = visualizer.createLinearGradient(0, canvas.height, canvas.width, canvas.height);
  if(defaults.visualizationSelect === 'flames'){
    gradientObject.addColorStop('0', '#ff0a0a')
    gradientObject.addColorStop('0.2', '#f1ff0a')
    gradientObject.addColorStop('0.9', '#d923b9')
    gradientObject.addColorStop('1', '#050d61')
  } else {
    gradientObject.addColorStop('0', `${defaults.colorcode}`)
    gradientObject.addColorStop('1', `${defaults.colorcode}`)
  }
  visualizer.strokeStyle = gradientObject;

  visualizer.lineTo(canvas.width, canvas.height / 2);
  visualizer.stroke();
}