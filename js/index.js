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
    _DEFAULT_TEMPORALSMOOTHING   = 0.7,
    _DEFAULT_SMOOTHPOINTS        = 2,
    _DEFAULT_BITSAMPLE           = 4096,
    _DEFAULT_SPACING             = 5,
    _DEFAULT_ANIMATIONELEMENT    = 'bars',
    _DEFAULT_BARCOUNT            = 70,
    _DEFAULT_VISUALIZATIONSELECT = 'flames',
    _DEFAULT_COLORCODE           = "#FFFFFF";

    const _setData = function(data){
      console.log('saving this data',data)
      currentItem.saveConfig(data);
      //if the selected audiodevice id is different than the current visualization audiodevice
      //I have to refresh the screen to force a new updated device
      if(window.xbca.defaultDeviceId !== data.audioDeviceId){
        window.location.reload();
      }
      _updateGraphic(data);
    }
    const _savedData = function(data){
      currentItem.setName('XBC Audio Visualizer');
      console.log('saved data on load',data);
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

    /*window.addEventListener('deviceLoadedOnDefault',function(e){
      data.audioDeviceId = e.detail;
      data.bitsample = _DEFAULT_BITSAMPLE;
      data.visualizationSelect = _DEFAULT_VISUALIZATIONSELECT;
      data.animationElement = _DEFAULT_ANIMATIONELEMENT;
      data.sensitivity = _DEFAULT_SENSITIVITY;
      data.temporalSmoothing = _DEFAULT_TEMPORALSMOOTHING;
      data.smoothPoints = _DEFAULT_SMOOTHPOINTS;
      data.colorcode = _DEFAULT_COLORCODE;
      data.spacing = _DEFAULT_SPACING;
      data.barcount = _DEFAULT_BARCOUNT;
      data.initialized = true;
      console.log('defaults',data);
      try{
        window.mca.gainNode.gain.value =  0.005 + (0.005 * data.sensitivity);  
        window.mca.analyser.smoothingTimeConstant = data.temporalSmoothing;
        window.mca.smoothPoints = data.smoothPoints;
        window.mca.barLength = parseInt(data.barcount,10);
        window.mca.analyser.fftSize = parseInt(data.bitsample,10);
        window.xbca._defaults.barcount = parseInt(data.barcount,10);
        window.xbca._defaults.spacing = parseInt(data.spacing,10);
        window.xbca._defaults.visualizationSelect = data.visualizationSelect;
        window.xbca._defaults.colorcode = data.colorcode;
      } catch (e) {
        console.log(e);
        setTimeout(function(){
          if (!window.mca.hasOwnProperty('gainNode')){
            _updateGraphic(data);
            console.log('trying to get gainNode');
          }  
        },100)
      }
      
    })*/

    const _updateGraphic = function(data){
      if(!data.hasOwnProperty('initialized')){
        var _left = 0.05,
        _top = 0.4,
        _right = 0.95,
        _bottom = 0.6;
        var rect = xjs.Rectangle.fromCoordinates(_left,_top,_right,_bottom);
        currentItem.setPosition(rect);

        /*navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
          let tmpstr = '';
          let tmpArr = [];
          let i = 0;
          for (i = 0; i < uuidAudioSourceId.length ; i++) {
            if (uuidAudioSourceId[i].kind === 'audioinput') {
              if (uuidAudioSourceId[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0) {
                tmpstr = uuidAudioSourceId[i].deviceId;
                break;
              }
            }

          }
          console.log(`index - kind : ${uuidAudioSourceId[i].kind}, label: ${uuidAudioSourceId[i].label}, id: ${uuidAudioSourceId[i].deviceId}`)
          console.log(tmpstr);
          var event = new CustomEvent('deviceLoadedOnDefault',{detail : tmpstr});
          window.dispatchEvent(event);

        });*/
        data.initialized = true;
        //return;
      }
      console.log('current Data',data)
      try{
        debuger;
        window.mca.gainNode.gain.value =  0.005 + (0.005 * data.sensitivity);  
        window.mca.analyser.smoothingTimeConstant = data.temporalSmoothing;
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
            console.log('trying to get gainNode');
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

/*
$(function(){
	let xjs = require('xjs')
	, Item = xjs.Source
	, SourcePluginWindow = xjs.SourcePluginWindow
  , sourceWindow = xjs.SourcePluginWindow.getInstance()
	, myItem
	, item
	, tempConfig
	, initializePlugin;

	xjs.ready()

	.then(Item.getCurrentSource)
	.then(function(source){
    return source.getItemList()
  })
  .then(function(items){
    return items[0].setEnhancedResizeEnabled(true)
  })
  .then(Item.getCurrentSource)
	.then((item)=>{
		myItem = item;
		return myItem.loadConfig();
	})
	.then((config)=>{
		tempConfig = config
		if (Object.keys(config).length > 0) {
			try{
				throw new Error();
			} catch(e){
			// handle
				throw e; // or a wrapper over e so we know it wasn't handled
			}
		} else {
			return myItem.setName('XBC Audio Visualizer');
		}
	})

	.then((item)=>{

		initializePlugin();
	})
	.catch(()=>{

		initializePlugin();
	})


	initializePlugin = () => {

		sourceWindow.on('apply-config',(cfg)=>{
      console.log('save requested',cfg)
      new XBCAudioVisualizer(cfg);
      myItem.saveConfig(cfg);
    });

    sourceWindow.on('save-config',(cfg)=>{
			console.log('save requested',cfg)
      new XBCAudioVisualizer(cfg);
			myItem.saveConfig(cfg);
		});

		myItem.loadConfig().then((config)=>{
      console.log('load Config', config)
      myItem.saveConfig(config);
			new XBCAudioVisualizer(config)
		})
	};
})
*/