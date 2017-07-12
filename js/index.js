
$(function(){
	let xjs = require('xjs')
	, Item = xjs.Source
	, SourcePluginWindow = xjs.SourcePluginWindow
	, myItem
	, item
	, tempConfig
	, initializePlugin;

	/** 
	 * initializes XJS
	 */
	xjs.ready()
	/**
	 * Load the current source
	 */
	.then(Item.getCurrentSource)
	/**
	 * then fetch the config
	 */
	.then((item)=>{
		debugger;
		myItem = item;
		return item.loadConfig();
	})
	.then((config)=>{
		tempConfig = config
		debugger;
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
	/** 
	 * and initializes 
	 */
	.then((item)=>{

		initializePlugin();
	})
	.catch(()=>{

		initializePlugin();
	})

	/**
	 * [initializePlugin runs and executes the visualization once it loads all the parameters. also it prepares the events that the view will use.]
	 * @return {[type]} [description]
	 */
	initializePlugin = () => {
		/** 
		 * Apply config when the property panel saves info
		 */
		SourcePluginWindow.getInstance().on('save-config',(cfg)=>{
			new XBCAudioVisualizer(cfg);
			myItem.saveConfig(cfg);
		});
		/**
		 * Apply config on load
		 */
		myItem.loadConfig().then((config)=>{
			new XBCAudioVisualizer(config)
		})
	};
	
})