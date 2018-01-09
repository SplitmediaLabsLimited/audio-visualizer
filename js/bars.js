function remoteFn(canvas,visualizer,spectrum,waveform,defaults){
  /** The following is an attempt to emulate the behavior of the bars in monstercat */
  let dataset = spectrum;
  let maximumLength = dataset.length;
  let sensitivity = (defaults.sensitivity*0.01)*2;
  let barcount = defaults.barcount+1;
  let spacing = defaults.spacing;
  
  let usableSpace = canvas.width/(barcount+spacing);
  let _barHeight = null;
  let counter = 0;
  let gradientObject = null;
  let max = 0;

  let compare = 0;
  console.log(dataset.length);
  for (var i = 0; i < dataset.length; i++) {
    ///dataset[i] = dataset[i] * ((defaults.sensitivity / 100)*2);
    if(dataset[i] > window.innerHeight){
      dataset[i] = window.innerHeight;
    }
    if(dataset[i] < 5){
      dataset[i] = 5;
    }
    if(defaults.visualizationSelect === 'flames'){
      gradientObject = visualizer.createLinearGradient(0,canvas.height - dataset[i],0,canvas.height);
      gradientObject.addColorStop('0', '#ff0a0a')
      gradientObject.addColorStop('0.2', '#f1ff0a')
      gradientObject.addColorStop('0.9', '#d923b9')
      gradientObject.addColorStop('1', '#050d61')
      visualizer.fillStyle = gradientObject;
    } else {
      visualizer.fillStyle = defaults.colorcode;
    }
    visualizer.fillRect(counter*(usableSpace+spacing),canvas.height - dataset[i],usableSpace, dataset[i]);
    counter++;
  }

}
