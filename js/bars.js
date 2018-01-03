function remoteFn(canvas,visualizer,spectrum,waveform,defaults){
  /** The following is an attempt to emulate the behavior of the bars in monstercat */
  
  class MonsterCatAdapter {
    constructor(spectrumData){
      this.PI = Math.PI
      this.MoveX = null
      this.MoveY = null,
      this.matrix = [
        Math.cos(145*PI/180),
        Math.sin(145*PI/180),
        Math.sin(145*PI/180),
        Math.cos(145*PI/180),
        286.70322,
        974.85043
      ];
      this.nearestAxis = 0;
      this.Angle = 0;
      this.FTTAttack = 100;
      this.FTTDecay = 60;
      this.minFreq = 10;
      this.scale = 1;
      this.barHeight = window.innerHeight;
      this.barWidth = null;
      this.lowerLimit = 0;
      this.upperLimit = spectrumData.length;
      this.spectrumData = spectrumData;
    }

    returnNearestAxis(Angle){
      var NearestAxis = (((Angle > 45) && (Angle <= 135)) || ((Angle > 225) && (Angle <= 315))) ? 1 : 0;
      return NearestAxis
    }

    Width(){
      return window.innerWidth;
    }

    Height(){
      return window.innerHeight;
    }

    AbsSinWidth(Angle){
      return (Math.abs(Math.sin(Angle*PI/180)*Width()))
    }

    AbsCosWidth(Angle){
      return(Math.abs(Math.cos(Angle*PI/180)*Width()))
    }

    AbsSinHeight(Angle){
      return(Math.abs(Math.sin(Angle*PI/180)*Height()))  
    }

    AbsCosHeight(Angle){
      return(Math.abs(Math.cos(Angle*PI/180)*Height()))
    }

    MoveX(Angle){
      if(((Angle > 0) && (Angle <= 45)) || ((Angle > 270) && (Angle <= 315))){
        return 0;
      }
      if(((Angle > 45) && (Angle <= 90)) || ((Angle > 315) && (Angle < 360))){
        return AbsSinHeight(Angle);
      }
      if(((Angle > 90) && (Angle <= 135)) || ((Angle > 180) && (Angle <= 225))){
        return AbsSinHeight(Angle)+AbsCosWidth(Angle);
      }

      if(((Angle > 135) && (Angle <= 180)) || ((Angle > 225) && (Angle <= 270))){
        return AbsCosWidth(Angle);
      }
    }

    MoveY(Angle){
      if(((Angle > 0) && (Angle <= 45)) || ((Angle > 90) && (Angle <= 135))){
        return AbsSinWidth(Angle);
      }
      if(((Angle > 45) && (Angle <= 90)) || ((Angle > 135) && (Angle <= 180))){
        return AbsSinWidth(Angle)+AbsCosHeight(Angle);
      }

      if(((Angle > 180) && (Angle <= 225)) || ((Angle > 270) && (Angle <= 315))){
        return AbsCosHeight(Angle);
      }

      if((((Angle > 225) && (Angle <= 270)) || ((Angle > 315) && (Angle < 360)))){
        return 0
      }
    }

    start(){
      if(this.nearestAxis !== 0){

      } else {
        for (var i = lowerLimit; i < upperLimit; i++) {
          this.spectrumData[i]
        }
      }
    }

  }

  
  

  /* working visualization starts here */
  let barHeight = (spectrumData) => {
    //max possible value of SpectrumData is 255;
    var getPercentage = (spectrumData/255)*100;
    var barHeight = (getPercentage * 0.01) * canvas.height;
    if(isNaN(barHeight)) barHeight = 0;
    
    return barHeight;
  }

  let dataset = spectrum;
  let maximumLength = dataset.length;
  let sensitivity = (defaults.sensitivity*0.01)*2;
  let barcount = defaults.barcount+1;
  let spacing = defaults.spacing;
  let datasetSpace = Math.floor((maximumLength)/(barcount + spacing));
  console.log('datasetSpace',datasetSpace)
  console.log('datasetSpace',datasetSpace)
  let usableSpace = canvas.width/(barcount+spacing);
  let _barHeight = null;
  let counter = 0;
  let gradientObject = null;
  let max = 0;

  let compare = 0;
  for (var i = 0; i < maximumLength; i = i + datasetSpace) {
    _barHeight = barHeight(dataset[i]);
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
    visualizer.fillRect(counter*(usableSpace+spacing),canvas.height -_barHeight,usableSpace-spacing, +_barHeight);
    counter++;
  }

}
