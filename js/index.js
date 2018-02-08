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
(function(){
  'use strict';
  const xjs = require('xjs');
  let counter = 0;
  let data = {};
  xjs.ready()
  .then(xjs.Item.getItemList)
  .then(function(item){
    const sourceWindow = xjs.SourcePluginWindow.getInstance();
    const currentItem = item[0];
    const _DEFAULT_SENSITIVITY   = 50,
    _DEFAULT_TEMPORALSMOOTHING   = 70,
    _DEFAULT_SMOOTHPOINTS        = 2,
    _DEFAULT_BITSAMPLE           = 4096,
    _DEFAULT_SPACING             = 5,
    _DEFAULT_ANIMATIONELEMENT    = 'bars',
    _DEFAULT_BARCOUNT            = 70,
    _DEFAULT_VISUALIZATIONSELECT = 'flames',
    _DEFAULT_COLORCODE           = "#FFFFFF",
    _DEFAULT_TITLE               = "Visualizer";

    const _setData = function(data){
      currentItem.saveConfig(data);
      if(window.xbca.defaultDeviceId !== data.audioDeviceId){
        window.location.reload();
      }
      _updateGraphic(data);
    }
    const _savedData = function(data){
      currentItem.setName(_DEFAULT_TITLE);
      if(Object.keys(data).length < 2){
        data.audioDeviceId = null;
        data.bitsample = _DEFAULT_BITSAMPLE;
        data.visualizationSelect = _DEFAULT_VISUALIZATIONSELECT;
        data.animationElement = _DEFAULT_ANIMATIONELEMENT;
        data.sensitivity = _DEFAULT_SENSITIVITY;
        data.temporalSmoothing = _DEFAULT_TEMPORALSMOOTHING;
        data.smoothPoints = _DEFAULT_SMOOTHPOINTS;
        data.colorcode = _DEFAULT_COLORCODE;
        data.spacing = _DEFAULT_SPACING;
        data.barcount = _DEFAULT_BARCOUNT;
      }

      if(!window.hasOwnProperty('xbca') || window.xbca === undefined){
        window.xbca = new XBCAudioVisualizer(data);  
      }
      _updateGraphic(data);
    }

    const _updateGraphic = function(data){
      if(!data.hasOwnProperty('initialized')){
        var _left = 0.05,
        _top = 0.4,
        _right = 0.95,
        _bottom = 0.6;
        var rect = xjs.Rectangle.fromCoordinates(_left,_top,_right,_bottom);
        currentItem.setPosition(rect);
        data.initialized = true;
      }
      try{
        window.mca.gainNode.gain.value =  0.005 + (0.005 * data.sensitivity);
        window.mca.analyser.smoothingTimeConstant = data.temporalSmoothing * 0.01;
        window.mca.smoothPoints = data.smoothPoints;
        window.mca.barLength = parseInt(data.barcount,10);
        window.mca.analyser.fftSize = parseInt(data.bitsample,10);
        window.xbca._defaults.barcount = parseInt(data.barcount,10);
        window.xbca._defaults.spacing = parseInt(data.spacing,10);
        window.xbca._defaults.visualizationSelect = data.visualizationSelect;
        window.xbca._defaults.colorcode = data.colorcode;
      } catch (e) {
        setTimeout(function(){
          if (!window.mca.hasOwnProperty('gainNode')){
            _updateGraphic(data);
          }  
        },100)
      }
    }
    currentItem.setEnhancedResizeEnabled(true);
    currentItem.setKeepAspectRatio(false);
    currentItem.loadConfig().then(_savedData);
    sourceWindow.on('save-config', _setData);
  })
})();