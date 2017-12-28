function remoteFn(canvas,visualizer,spectrum,waveform,defaults){
  /** The following is an attempt to emulate the behavior of the bars in monstercat */
  const PI = Math.PI;
  var matrix = [
    Math.cos(145*PI/180),
    Math.sin(145*PI/180),
    Math.sin(145*PI/180),
    Math.cos(145*PI/180),
    286.70322,
    974.85043
  ];
  var nearestAxis = 0;
  var angle = 0;
  let returnNearestAxis = function(Angle){
    var NearestAxis = (((Angle > 45) && (Angle <= 135)) || ((Angle > 225) && (Angle <= 315))) ? 1 : 0;
    return NearestAxis
  }
  var Width = function(){
    return window.innerWidth;
  }
  var Height = function(){
    return window.innerHeight;
  } 
  var AbsSinWidth = function(Angle){
    return (Math.abs(Math.sin(Angle*PI/180)*Width()))
  }
  var AbsCosWidth = function(Angle){
    return(Math.abs(Math.cos(Angle*PI/180)*Width()))
  }
  var AbsSinHeight = function(Angle){
    return(Math.abs(Math.sin(Angle*PI/180)*Height()))  
  }
  var AbsCosHeight = function(Angle){
    return(Math.abs(Math.cos(Angle*PI/180)*Height()))
  }
  let MoveX = function(Angle){
    /*IfCondition=(((#Angle# > 0) && (#Angle# <= 45)) || ((#Angle# > 270) && (#Angle# <= 315)))
    IfTrueAction=[!SetOption MoveX Formula 0][!UpdateMeasure MoveX]
    IfCondition2=(((#Angle# > 45) && (#Angle# <= 90)) || ((#Angle# > 315) && (#Angle# < 360)))
    IfTrueAction2=[!SetOption MoveX Formula (AbsSinHeight)][!UpdateMeasure MoveX]
    IfCondition3=(((#Angle# > 90) && (#Angle# <= 135)) || ((#Angle# > 180) && (#Angle# <= 225)))
    IfTrueAction3=[!SetOption MoveX Formula (AbsSinHeight+AbsCosWidth)][!UpdateMeasure MoveX]
    IfCondition4=(((#Angle# > 135) && (#Angle# <= 180)) || ((#Angle# > 225) && (#Angle# <= 270)))
    IfTrueAction4=[!SetOption MoveX Formula (AbsCosWidth)][!UpdateMeasure MoveX]*/
  }

  let MoveY = function(Angle){
    /*Measure=Calc
    IfCondition=(((#Angle# > 0) && (#Angle# <= 45)) || ((#Angle# > 90) && (#Angle# <= 135)))
    IfTrueAction=[!SetOption MoveY Formula (AbsSinWidth)][!UpdateMeasure MoveY]
    IfCondition2=(((#Angle# > 45) && (#Angle# <= 90)) || ((#Angle# > 135) && (#Angle# <= 180)))
    IfTrueAction2=[!SetOption MoveY Formula (AbsSinWidth+AbsCosHeight)][!UpdateMeasure MoveY]
    IfCondition3=(((#Angle# > 180) && (#Angle# <= 225)) || ((#Angle# > 270) && (#Angle# <= 315)))
    IfTrueAction3=[!SetOption MoveY Formula (AbsCosHeight)][!UpdateMeasure MoveY]
    IfCondition4=(((#Angle# > 225) && (#Angle# <= 270)) || ((#Angle# > 315) && (#Angle# < 360)))
    IfTrueAction4=[!SetOption MoveY Formula 0][!UpdateMeasure MoveY]*/
  }
  

  /* working visualization starts here */
  let barHeight = (spectrumData) => {
    //max possible value of SpectrumData is 255;
    var getPercentage = (spectrumData/255)*100;
    var barHeight = (getPercentage * 0.01) * canvas.height;
    if(isNaN(barHeight)) barHeight = 0;
    return barHeight;
  }

  let maximumLength = spectrum.length;
  let sensitivity = (defaults.sensitivity*0.01)*2;
  let barcount = defaults.barcount;
  let spacing = defaults.spacing;
  let spectrumSpace = Math.floor(maximumLength/(barcount + spacing));
  let usableSpace = canvas.width/(barcount - spacing);
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
    visualizer.fillRect(counter*(usableSpace+spacing),canvas.height -_barHeight,usableSpace-spacing, +_barHeight);
    counter++;
  }

}
  