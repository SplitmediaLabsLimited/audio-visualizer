/**
 * Copyright (c) 2017 Split Media Labs, All rights reserved.
 * <licenseinfo@splitmedialabs.com>
 * 
 * You may only use this file subject to direct and explicit grant of rights by Split Media Labs,
 * either by written license agreement or written permission.
 * 
 * You may use this file in its original or modified form solely for the purpose, and subject to the terms,
 * stipulated by the license agreement or permission.
 * 
 * If you have not received this file in source code format directly from Split Media Labs,
 * then you have no right to use this file or any part hereof.
 * Please delete all traces of the file from your system and notify Split Media Labs immediately.
 */
function remoteFn(canvas,visualizer,spectrum,waveform){
  let dataset = spectrum;
  var defaults = window.xbca._defaults
  let maximumLength = dataset.length;
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