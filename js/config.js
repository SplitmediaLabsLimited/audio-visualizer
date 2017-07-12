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
			$('#skin option[value=\''+config.skin+'\']').prop('selected',true)
		}

		if(typeof config.fps === 'undefined'){
			firstTime = true;
			config.fps = 60;
			$('#fps option[value=60]').prop('selected',true)
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
			$('#strokeW').val(4);
			config.strokeW = 4;
		} else {
			$('#strokeW').val(config.strokeW);
		}
		
		if(typeof config.strokeS1 === 'undefined'){
			firstTime = true;
			$('#strokeS1').val(2);
			config.strokeS1 = 2;
		} else {
			$('#strokeS1').val(config.strokeS1);
		}
		
		if(typeof config.strokeS2 === 'undefined'){
			firstTime = true;
			$('#strokeS2').val(2);
			config.strokeS2 = 2;
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

		

		if(typeof config.externalJSURL === 'undefined'){
			config.externalJSURL = [];
			$('.nocontent').show();
			firstTime = true;
		} else {
			$("#list")
			config.externalJSURL.forEach((o,i)=>{
				renderListVisuals(o);
			})
		}


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
	setGUILogic = () =>{
		$("#skin").change((e)=>{
			config.skin = $("#skin option:selected").val();
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

		$("#saveExternalJS").click((e)=>{	
			config.externalJSURL = [];
			$('.targetScript').each((i,o)=>{
				if($.trim($(o).val()) !== ''){
					config.externalJSURL.push($.trim($(o).val()))
				} else{
					$(o).parent().remove();
				}
			})
			updateConfig(currentSource);
		});

		$("#addExternalJS").click((e)=>{
			$('.nocontent').hide();
			$('<li><i class="fa fa-bars handler"></i> <input class="targetScript" type="text" value=""><i class="removeThis fa fa-times"></i></li>').appendTo('#list');
		});

		$('.addLocal').click((e)=>{
			$('.manageAction').hide();
			$("#manageVisuals").hide();
			$('#addLocalVisual').show();
		})

		$('.addURL').click((e)=>{
			$('.manageAction').hide();
			$("#manageVisuals").hide();
			$('#addURLVisual').show();
		})

		$('.cancelAction').click((e)=>{
			$("#manageVisuals").show();
			$('.subpanel').hide();
			//clean up function for local and remote url
			$('.manageAction').show();
		})
		$('.addRemoteSource').click((e)=>{
			e.preventDefault();
			let msg = [];
			let checkScriptName = () => {
				var d = $.Deferred();
				var isFound = false;
				var visualname = $.trim($('#scriptName').val());
				if(visualname.length < 3){
					msg.push('- Visualization name must have more than 3 characters');
					d.reject();
				} else {
					config.externalJSURL.forEach((o,i)=>{
						if(o.visualname.toLowerCase() === visualname.toLowerCase()){
							isFound = true;
						}
					})
					if(isFound){
						msg.push('- Visualization name already exists. Please use another name');
						d.reject();
					} else {
						d.resolve(visualname)
					}
				}
				return d.promise();
			};
			let checkUrl = () =>{
				var d = $.Deferred();
				var visualurl = $.trim($('#urlscript').val())
				if(visualurl.length < 3){
					msg.push('- URL is too short');
					d.reject();
				} else {
					$.ajax({
						url : visualurl,
						dataType : 'text'
					}).done((data)=>{
						console.log(data);
						d.resolve(visualurl);
					}).fail((a,b,c,x)=>{
						console.log([a,b,c,x])
						msg.push('- invalid url');
						d.reject();
					})
				}
				return d.promise();
			}
			
			$.when(checkScriptName(),checkUrl())
			.then((rCheckScriptName,rCheckUrl)=>{
				console.log('success',[rCheckScriptName,rCheckUrl]);
				let obj = {
					visualname : rCheckScriptName,
					visualurl : rCheckUrl
				};
				config.externalJSURL.push(obj);
				renderListVisuals(obj);
				updateConfig(currentSource);
				alert('Visualization '+rCheckScriptName+' was added successfully. the Item will be available now on the selection box.')
				$("#manageVisuals").show();
				$('.subpanel').hide();
			})
			.fail(()=>{
				alert ('There are erros adding your script:\n'+msg.join('\n'));
			})
		})

		

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
		var configWindow =  SourcePropsWindow.getInstance();
		propsWindow.useFullWindow();
		propsWindow.resize(600,550);
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
		$("#list").sortable({
			handle:'.handler',
			animation: 150,
			ghostClass : 'ghost',
			filter: '.removeThis',
			onFilter: function (evt) {
				evt.item.parentNode.removeChild(evt.item);
			}
		});
		config = cfg;
		updateElements(cfg);
		setGUILogic();

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