(function(){
	'use strict'
	var xjs = require('xjs');
	var Item = xjs.Source;
	var SourcePropsWindow = xjs.SourcePropsWindow;
	var propsWindow = SourcePropsWindow.getInstance();
	var currentSource;
	xjs.ready().then(function() {
		var configWindow =  SourcePropsWindow.getInstance();
		propsWindow.useTabbedWindow({
			customTabs: ['Audio Visualizer'],
			tabOrder: ['Audio Visualizer', 'Layout', 'Color', 'Transition'] // Layout/Color/Transition are optional reusable XSplit tabs
		});
		return Item.getCurrentSource();
	}).then((myItem)=>{
		currentSource = myItem;
		return currentSource.loadConfig();
	}).then((cfg)=>{
		debugger;
		console.log('config:',cfg)
	});
})();