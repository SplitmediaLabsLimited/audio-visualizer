(function(){
  'use strict';
  const xjs = require('xjs');

  xjs.ready()
  .then(xjs.Item.getItemList)
  .then(function(item){
    const sourceWindow = xjs.SourcePluginWindow.getInstance();
    const currentItem = item[0];

    const _setData = function(data){
      currentItem.saveConfig(data);
      _updateGraphic(data);
    }
    const _savedData = function(data){
      currentItem.setName('XBC Audio Visualizer');
      console.log('saved data on load',data);
      window.xbca = new XBCAudioVisualizer(data);
      _updateGraphic(data);
    }

    const _updateGraphic = function(data){
      console.log('data.sensitivity',data)
      window.mca.sensitivity = data.sensitivity / 100;
      window.mca.analyser.smoothingTimeConstant = data.temporalSmoothing;
      window.mca.smoothPoints = data.smoothPoints;
      window.mca.barLength = parseInt(data.barcount,10);
      window.mca.analyser.fftSize = parseInt(data.bitsample,10);
      window.xbca._defaults.barcount = parseInt(data.barcount,10);
      window.xbca._defaults.spacing = parseInt(data.spacing,10);
      window.xbca._defaults.visualizationSelect = data.visualizationSelect;
      window.xbca._defaults.colorcode = data.colorcode;
    }
    var _left = 0.05,
    _top = 0.4,
    _right = 0.95,
    _bottom = 0.6;
    var rect = xjs.Rectangle.fromCoordinates(_left,_top,_right,_bottom);
    currentItem.setPosition(rect);
    currentItem.setEnhancedResizeEnabled(true);
    currentItem.setKeepAspectRatio(false)
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