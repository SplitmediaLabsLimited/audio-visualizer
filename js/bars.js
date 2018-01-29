function remoteFn(canvas,visualizer,spectrum,waveform){
  /** The following is an attempt to emulate the behavior of the bars in monstercat */
  let dataset = spectrum;
  var defaults = window.xbca._defaults
  //console.log('dataset length',canvas.width);
  let maximumLength = dataset.length;
  //let sensitivity = defaults.sensitivity;
  let barcount = defaults.barcount;
  let spacing = defaults.spacing;
  
  let usableSpace = canvas.width/(barcount);
  let _barHeight = null;
  let counter = 0;
  let gradientObject = null;
  let max = 0;
  
  let compare = 0;
  for (var i = 0; i < dataset.length; i++) {
    usableSpace = canvas.width/(barcount);
    if(dataset[i] > window.innerHeight){
      dataset[i] = window.innerHeight;
    }
    if(dataset[i] < 1){
      dataset[i] = 1;
    }
    if(window.xbca._defaults.visualizationSelect === 'flames'){
      gradientObject = visualizer.createLinearGradient(0,canvas.height - dataset[i],0,canvas.height);
      gradientObject.addColorStop('0', '#ff0a0a')
      gradientObject.addColorStop('0.2', '#f1ff0a')
      gradientObject.addColorStop('0.9', '#d923b9')
      gradientObject.addColorStop('1', '#050d61')
      visualizer.fillStyle = gradientObject;
    } else {
      visualizer.fillStyle = window.xbca._defaults.colorcode;
    }
    visualizer.fillRect(counter*(usableSpace),canvas.height - dataset[i],usableSpace-spacing, dataset[i]);
    counter++;
  }
}