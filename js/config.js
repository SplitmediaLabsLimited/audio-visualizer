(function(){
	'use strict'

	/**
	 * [updateConfigGUI changes the config GUI to match the config]
	 * @type {[type]}
	 */
	let updateConfigGUI = (config)=>{

	};

	/**
	 * [updateConfig saves the configuration passed by the argument.]
	 * @type {[type]}
	 */
	let updateConfig = (item)=>{
		let config = {
			skin : 'bars'
		}
		item.requestSaveConfig(config)
	};

	/**
	 * [setGUILogic provide the GUI elements with actions to update the configuration of the view]
	 * @return {[type]} [description]
	 */
	let setGUILogic = () =>{

	}

	/**
	 * [xjs is the XJS Framework]
	 * @type {object}
	 */
	let xjs = require('xjs');
	/**
	 * [Item holds the current source]
	 * @type {Object}
	 */
	, Item = xjs.Source;
	/**
	 * [SourcePropsWindow Contains the properties of the source window]
	 * @type {[type]}
	 */
	, SourcePropsWindow = xjs.SourcePropsWindow;
	, propsWindow = SourcePropsWindow.getInstance();
	, currentSource;

	/**
	 * [then we run the concatenated sets of promises to get and apply the config.]
	 * @param  {Function} ).then(() [description]
	 * @return {[type]}             [description]
	 */
	xjs.ready().then(() =>{
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
		console.log('config:',cfg);
		setGUILogic();
		//get the config to the GUI
		updateConfigGUI(cfg);

	});
})();