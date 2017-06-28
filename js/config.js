$(()=>{
	/**
	 * [updateConfigGUI changes the config GUI to match the config]
	 * @type {[type]}
	 */
	
	let myItem = null;

	let config = {};

	let updateElements = (config)=>{
		var firstTime = false;
		if(typeof config.skin === 'undefined'){
			firstTime = true;
			config.skin = 'bars';
			$('#skin option[value=bars]').prop('selected',true)
		} else {
			$('#skin option[value='+config.skin+']').prop('selected',true)
		}

		if(typeof config.fps === 'undefined'){
			firstTime = true;
			config.fps = 60;
			$('#fps option[value=bars]').prop('selected',true)
		} else {
			$('#fps option[value='+config.fps+']').prop('selected',true)
		}


		if(firstTime){
			updateConfig(currentSource)
		}
	},
	/**
	 * [updateConfig saves the configuration passed by the argument.]
	 * @type {[type]}
	 */
	updateConfig = (item)=>{
		console.log(config);
		item.requestSaveConfig(config);
	},

	/**
	 * [setGUILogic provide the GUI elements with actions to update the configuration of the view]
	 * @return {[type]} [description]
	 */
	setGUILogic = () =>{
		$("#skin").change((e)=>{
			config.skin = $("#skin option:selected").val();
			updateConfig(currentSource);
		})

		$("#fps").change((e)=>{
			config.fps = $("#fps option:selected").val();
			updateConfig(currentSource);
		})
		
	},
	/**
	 * [xjs is the XJS Framework]
	 * @type {object}
	 */
	xjs = require('xjs'),
	/**
	 * [Item holds the current source]
	 * @type {Object}
	 */
	Item = xjs.Source
	/**
	 * [SourcePropsWindow Contains the properties of the source window]
	 * @type {[type]}
	 */
	SourcePropsWindow = xjs.SourcePropsWindow,
	propsWindow = xjs.SourcePropsWindow.getInstance(),
	currentSource = null;
	/**
	 * [then we run the concatenated sets of promises to get and apply the config.]
	 */
	xjs.ready().then(() =>{
		var configWindow =  SourcePropsWindow.getInstance();
		propsWindow.useTabbedWindow({
			customTabs: ['Audio Visualizer'],
			tabOrder: ['Audio Visualizer', 'Layout', 'Color', 'Transition']
		});
		 return Item.getCurrentSource();
	})
	/** 
	 * then load the config from the visualization
	 */
	.then((myItem)=>{
		currentSource = myItem;
		return currentSource.loadConfig();
	})
	/**
	 * Finally apply the GUI logic and preload the data from the config
	 */
	.then((cfg)=>{
		config = cfg;
		updateElements(cfg);
		setGUILogic();
	});
});