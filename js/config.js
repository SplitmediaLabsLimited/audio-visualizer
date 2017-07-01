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
	 * Let's first map the audio devices into the audioDeviceId 
	 */
	navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
		/**
		 * We make sure to clean up the list of devices... leaving it open will just duplicate elements...
		 */
		$("#audioDeviceId").html('');
		/**
		 * [tmpstr is a cleaned up version of the audio input]
		 * @type {String}
		 */
		let tmpstr = '';
		for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
			if (uuidAudioSourceId[i].kind === 'audioinput') {
				if($.trim(uuidAudioSourceId[i].label) !== ''){
					tmpstr = uuidAudioSourceId[i].label.replace(' (DirectShow)','');
					$('<option value="'+uuidAudioSourceId[i].deviceId+'">'+tmpstr+'</option>').appendTo("#audioDeviceId");
					if(tmpstr.indexOf('XSplitBroadcaster') === 0){
						XBCMixerId = uuidAudioSourceId[i].deviceId;
					}	
				}
			}
		}
	});

	/**
	 * [updateElements prepares the initial events of the plugin in order to setup default values to be used by the plugin]
	 * @param  {Object} config [the configuration object]
	 */
	let updateElements = (config = {})=>{	
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

		if(typeof config.bitsample === 'undefined'){
			firstTime = true;
			config.bitsample = 512;
			$('#bitsample option[value=512]').prop('selected',true);
		} else {
			$('#bitsample option[value='+config.bitsample+']').prop('selected',true);
		}

		if(typeof config.strokeW === 'undefined'){
			firstTime = true;
			$('#strokeW').val(2);
			config.strokeW = 2;
		} else {
			$('#strokeW').val(config.strokeW);
		}
		
		if(typeof config.strokeS1 === 'undefined'){
			firstTime = true;
			$('#strokeS1').val(1);
			config.strokeS1 = 1;
		} else {
			$('#strokeS1').val(config.strokeS1);
		}
		
		if(typeof config.strokeS2 === 'undefined'){
			firstTime = true;
			$('#strokeS2').val(1);
			config.strokeS2 = 1;
		} else {
			$('#strokeS2').val(config.strokeS2);
		}

		if(typeof config.displayfps === 'undefined'){
			firstTime = true;
			$('#displayfps').prop('checked',false);
			config.displayfps = false;
		} else {
			$('#displayfps').prop('checked',config.displayfps);
		}

		if(typeof config.audioDeviceId === 'undefined'){
			firstTime = true;
			config.audioDeviceId = XBCMixerId;
			$('#audioDeviceId option[value='+config.audioDeviceId+']').prop('selected',true);
		} else {
			$('#audioDeviceId option[value='+config.audioDeviceId+']').prop('selected',true);
		}

		if(typeof config.customVisualization === 'undefined'){
			var defcontent = "/**\r\n * When you use your custom function, please make sure to map properly your\r\n * variables as shown below:\r\n */\r\n/**\r\n * [canvas holds the DOM Object of the visualization, a <canvas> tag]\r\n * @type {DOM(<CANVAS>)}\r\n */\r\nvar canvas = XBC_avz.canvas;\r\n/**\r\n * [visualizer holds the current context of the canvas. if you want to later on\r\n * override the visualization from 2d to 3d, you could use after the assignation\r\n * the following:\r\n * visualizer = canvas.getContext('3d');\r\n * ]\r\n * @type {VISUALIZER}\r\n */\r\nvar visualizer = XBC_avz.visualizer;\r\n/**\r\n * The analyser represents a node able to provide real-time frequency and time-domain \r\n * analysis information. It is an AudioNode that passes the audio stream unchanged \r\n * from the input to the output, but allows you to take the generated data, process it, \r\n * and create audio visualizations.\r\n * \r\n * An AnalyserNode has exactly one input and one output. The node works even if the \r\n * output is not connected.\r\n * @type {Analizer}\r\n */\r\nvar analyser = XBC_avz.analyser;\r\n/**\r\n * XBC_avz.bitsample is the fftSize property of the AnalyserNode interface is an \r\n * unsigned long value representing the size of the FFT (Fast Fourier Transform) \r\n * to be used to determine the frequency domain.\r\n * \r\n * The fftSize property's value must be a non-zero power of 2 in a range \r\n * from 32 to 32768; \r\n *\r\n * the bitsample comes from the selection of the Bit Sample dropdown box. \r\n * You can override its value manually or let XBC_avz manage by the given \r\n * options of the main dialog\r\n * @type {Numeric|XBC_avz.bitsample}\r\n */\r\nanalyser.fftSize = XBC_avz.bitsample;\r\n/** \r\n * FROM HERE YOU CAN SETUP CUSTOM VARIABLES\r\n */\r\n/**\r\n * [bufferLength contains the frequency bitcount to be used in the visualization]\r\n * @type {integer}\r\n */\r\nvar bufferLength = analyser.frequencyBinCount;\r\n/**\r\n * [frequencyArray indicates the array of elements that defines the lenghth of \r\n * the frequency and its variances]\r\n * @type {Uint8Array}\r\n */\r\nvar frequencyArray = new Uint8Array(XBC_avz.analyser.frequencyBinCount);\r\n/**\r\n * BELOW USE YOUR CUSTOM CODE TO DRAW YOUR VISUALIZATION. DO NOT INCLUDE LOOPS SINCE\r\n * THE PLUGIN TAKES CARE OF THE REDRAW.\r\n */";
			window._editor.setValue(defcontent);
			config.customVisualization = defcontent;
			firstTime = true;
		} else {
			window._editor.setValue(config.customVisualization,0);
		}


		if(firstTime){
			updateConfig(currentSource)
		}
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
	 * [setGUILogic provide the GUI elements with actions to update the configuration of the view]
	 * @return {[type]} [description]
	 */
	setGUILogic = () =>{
		$("#skin").change((e)=>{
			config.skin = $("#skin option:selected").val();
			if(config.skin === 'custom'){
				$('.std').hide();
				$('.custom').show();
			} else {
				$('.std').show();
				$('.custom').hide();
			}
			updateConfig(currentSource);
		})

		$("#fps").change((e)=>{
			config.fps = parseInt($("#fps option:selected").val(),10);
			updateConfig(currentSource);
		})

		$("#bitsample").change((e)=>{
			config.bitsample = parseInt($("#bitsample option:selected").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeW").change((e)=>{
			config.strokeW = parseInt($("#strokeW").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeS1").change((e)=>{
			config.strokeS1 = parseInt($("#strokeS1").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeS2").change((e)=>{
			config.strokeS2 = parseInt($("#strokeS2").val(),10);
			updateConfig(currentSource);
		})

		$("#audioDeviceId").change((e)=>{
			config.audioDeviceId = $("#audioDeviceId option:selected").val();
			updateConfig(currentSource);
		})

		$('#displayfps').click((e)=>{
			if($(e.currentTarget).is(':checked')){
				config.displayfps = true;			
			} else{
				config.displayfps = false;
			}
			updateConfig(currentSource);
		})

		$('#refreshVisualizer').click((e)=>{
			 xjs.Source.getCurrentSource().then(function(source) {
			   source.refresh(); // execution of JavaScript halts because of refresh
			});
		})

		$("#saveCustomVisualization").click((e)=>{
			config.customVisualization = window._editor.getValue();
			updateConfig(currentSource);
		})

		if(config.skin === 'custom'){
			$('.std').hide();
			$('.custom').show();
		} else {
			$('.std').show();
			$('.custom').hide();
		}

		/**
		 * setup tabs
		 */
		$('.tabs a').click((e)=>{
			e.preventDefault();
			$('.tabs a').removeClass('selected');
			$(e.currentTarget).addClass('selected');
			$('.tabContainer').hide()
			$($(e.currentTarget).attr('href')).show();
		});

		var tempSelected = $('.tabs a.selected').attr('href');
		$('.tabContainer').hide();
		$(tempSelected).show();

		

		/**
		 * verifying if the editor is available
		 */
		window._editor.gotoLine(0,0)
		




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
	currentSource = {};
	/**
	 * [then we run the concatenated sets of promises to get and apply the config.]
	 */
	xjs.ready().then(() =>{
		var configWindow =  SourcePropsWindow.getInstance();
		propsWindow.useFullWindow();
		propsWindow.resize(600,550);
		/*propsWindow.useTabbedWindow({
			customTabs: ['Audio Visualizer'],
			tabOrder: ['Audio Visualizer', 'Layout', 'Color', 'Transition']
		});*/
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
		/**
		 * [editor is an instance of Ace editor]
		 * for some reason, it doesn't seems to work with the config.js file, just here...
		 * @type {Object}
		 */
		window._editor = ace.edit("customClientJS");
	    window._editor.setTheme("ace/theme/monokai");
	    window._editor.getSession().setMode("ace/mode/javascript");
		window._editor.setFontSize(10);
		window._editor.setShowPrintMargin(false);
		config = cfg;
		updateElements(cfg);
		setGUILogic();

	});
});