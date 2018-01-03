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
(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);
$(()=>{
	/**
	 * [config stores the configuration previous to be sent to the plugin]
	 * @type {Object}
	 */
	let config = {};
	/**
	 * [XBCMixerId will store the HW ID of XSplitBoradcaster (DirectShow) Input]
	 * @type {String}
	 */
	let XBCMixerId = '';
	/**
	 * [XBCCodeMirror loads a codemirror instance on this variable]
	 * @type {null}
	 */
	let XBCCodeMirror = null;

	/**
	 * [updateElements prepares the initial events of the plugin in order to setup default values to be used by the plugin]
	 * @param  {Object} config [the configuration object]
	 */
	let updateElements = (config = {})=>{	
		var firstTime = false;

		/**audio device */
		if(typeof config.audioDeviceId === 'undefined'){
			firstTime = true;
			config.audioDeviceId = XBCMixerId;
		}
		$('#selectAudioSource').val(config.audioDeviceId);
		$('#selectAudioSource').disableSelection();

		/** sensitivity */
		if(typeof config.sensitivity === 'undefined'){
			firstTime = true;
			config.sensitivity = 50;
		}
		$("#sensitivity").val(config.sensitivity);

		/** fps */
		if(typeof config.smoothing === 'undefined'){
			firstTime = true;
			config.smoothing = 0.8;
		}
		$("#smoothing").val(config.smoothing);

		/** Bit Sample */
		if(typeof config.bitsample === 'undefined'){
			firstTime = true;
			config.bitsample = "1024";
		}
		$("#bitsample").val(config.bitsample);

		if(typeof config.spacing === 'undefined'){
			firstTime = true;
			config.spacing = "1";
		}
		$("#spacing").val(config.spacing);

		/** default visualization */
		console.log('config.animationElement',config.animationElement)
		if (typeof config.animationElement === 'undefined'){
			firstTime = true;
			config.animationElement = 'bars';
		}
		$("#animationElement").val(config.animationElement);
		console.log('$("#animationElement").val()',$("#animationElement").val())

		if(typeof config.barcount === 'undefined'){
			firstTime = true;
			config.barcount = 70;
		}
		$("#barCount").val(config.barcount);

		if (typeof config.visualizationSelect === 'undefined'){
			firstTime = true;
			config.visualizationSelect = 'flames';
		}
		$("#visualizationSelect").val(config.visualizationSelect);

		if(typeof config.colorcode === 'undefined'){
			firstTime = true;
			config.colorcode = "#ffffff";
		}
		$("#solidOption").val(config.colorcode);

		
		
		if(firstTime){
			updateConfig(currentSource)
		}
	},
	/**
	 * [renderListVisuals displays the list of visualizations into the panel, in order to be selected by the user]
	 * @param  {Object} item [item is composed of: visualname which is the visualization name, and visualurl that is the url of the remote script]
	 * @return {[type]}      [description]
	 */
	renderListVisuals = (item = {visualname:'',visualurl:''})=>{
		let skinBox = $('#skin');
		let tpl = '<option value="{0}">{1}</option>';
		skinBox.append(tpl.format(item.visualurl,item.visualname));
		addUrlToConfig(item.visualname,item.visualurl);
	},
	/**
	 * updateConfig saves the configuration passed by the argument.
	 * @param  {Object} item [the XBC reference to the source iten]
	 */
	updateConfig = (item = {})=>{
		console.log(config);
		item.requestSaveConfig(config);
	},
	/**
	 * [description]
	 * @param  {String} urlstr [description]
	 * @return {[type]}        [description]
	 */
	addUrlToConfig = (urlstr='',labelstr='') =>{
		var tpl = '<li><i class="fa fa-bars handler"></i> <input class="targetScript" type="text" value="{1}" data-url="{0}" readOnly><i class="removeThis fa fa-times"></i></li>';
		$(tpl.format(labelstr,urlstr)).appendTo('#list');
	}

	/**
	 * [setGUILogic provide the GUI elements with actions to update the configuration of the view]
	 * @return {[type]} [description]
	 */
	setGUILogic = () => {
		$("#saveSettings").on('click', (e) => {
			updateConfig(currentSource);
		})
	},
	removeAt = (array, index) => {
	    var len = array.length;
	    var ret = array[index];
	    for (var i = index + 1; i < len; ++i) {
	        array[i - 1] = array[i];
	    }
	    array.length = len - 1;
	    return ret;
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
	 * @type {Object}
	 */
	SourcePropsWindow = xjs.SourcePropsWindow,
	/**
	 * [propsWindow is a short reference for xjs.SourcePropsWindow.getInstance()]
	 * @type {Function}
	 */
	propsWindow = xjs.SourcePropsWindow.getInstance(),
	/**
	 * [currentSource is the source to be used by the application to load the configurations]
	 * @type {Object}
	 */
	currentSource = {},
	/**
	 * [util handles the io utilities from xjs]
	 * @type {Object}
	 */
	IO = xjs.IO;
	/**
	 * [then we run the concatenated sets of promises to get and apply the config.]
	 */
	xjs.ready().then(() =>{
		/**
		 * Let's first map the audio devices into the audioDeviceId 
		 */
		navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
			/**
			 * We make sure to clean up the list of devices... leaving it open will just duplicate elements...
			 */
			
			/**
			 * [tmpstr is a cleaned up version of the audio input]
			 * @type {String}
			 */
			let tmpstr = '';
			for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
				if (uuidAudioSourceId[i].kind === 'audioinput') {
					if($.trim(uuidAudioSourceId[i].label) !== ''){
						tmpstr = uuidAudioSourceId[i].label.replace(' (DirectShow)','');
						$("#selectAudioSource").append(`<xui-option value="${uuidAudioSourceId[i].deviceId}">${tmpstr}</xui-option>`);
						if(tmpstr.indexOf('XSplitBroadcaster') === 0){
							XBCMixerId = uuidAudioSourceId[i].deviceId;
						}	
					}
				}
			}
		});

		var configWindow =  SourcePropsWindow.getInstance();
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
	})
	.then(data =>{
		$("#selectAudioSource").on('select-changed', (e)=>{
			config.audioDeviceId = e.detail.value;
			updateConfig(currentSource);
		});

		$("#sensitivity").on('change', (e)=>{
			config.sensitivity = $(e.currentTarget).val()
			updateConfig(currentSource);
		});

		$("#smoothing").on('change', (e)=>{
			let s = $(e.currentTarget).val();
			s = s.toString().split('');
			s = s[0]+s[1]+s[2]+s[3]+s[4];
			s = parseFloat(s);
			config.smoothing = s;
			$("#smoothing::shadow #inputText").val(s)
			console.log(config.smoothing);
			updateConfig(currentSource);
		});

		$("#bitsample").on('select-changed', (e)=>{
			config.bitsample = parseInt(e.detail.value);
			let barcount = parseInt($("#barCount").val());
			if (barcount > (config.bitsample/2)){
				$("#barCount").attr("max",(config.bitsample/2));
				$("#barCount").val(config.bitsample/2);
				config.barcount = config.bitsample/2;
			}
			updateConfig(currentSource);
		});

		$("#animationElement").on('select-changed',(e)=>{
			config.animationElement = e.detail.value;
			updateConfig(currentSource);
		})

		$("#barCount").on('change', (e)=>{
			config.barcount = parseInt($(e.currentTarget).val());
			let bitsample = parseInt($("#bitsample").val());
			if (config.barcount > (bitsample/2)){
				$("#barCount").val(bitsample/2);
				config.barcount = bitsample/2;
			}
			updateConfig(currentSource);
		});

		$("#visualizationSelect").on('select-changed',(e)=>{
			config.visualizationSelect = e.detail.value;
			if(config.visualizationSelect !== 'solid'){
				$("#solidOption").hide();
			} else {
				$("#solidOption").show();
			}
			updateConfig(currentSource);
		})

		$("#solidOption").on('change',(e)=>{
			config.colorcode = $(e.currentTarget).val();
			updateConfig(currentSource);
		})

		$("#spacing").on('change',(e)=>{
			config.spacing = parseInt($(e.currentTarget).val());
			updateConfig(currentSource);
		})
	});
});

/*
 * String Prototype Format : this will allow is to replace multiple characters like sprintf does in PHP or ASP
 * "{0} is dead, but {1} is alive! {0}".format("ASP", "ASP.NET")
 * output : ASP is dead, but ASP.NET is alive! ASP
 */
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}