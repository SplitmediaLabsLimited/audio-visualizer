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
let UIStart = () =>{
	$(()=> {
		$('.spinner .btn:first-of-type').on('click mousedown', function(e) {
			let obj =  $(this).parent().parent().find('input');
			$(obj).val( parseInt($(obj).val(), 10) + 1);
			$(obj).change();
	  	});
	  	$('.spinner .btn:last-of-type').on('click mousedown', function(e) {
			let obj =  $(this).parent().parent().find('input');
			$(obj).val( parseInt($(obj).val(), 10) - 1);
			$(obj).change();
	  	});

	  	$('.tabs a').click((e)=>{
			e.preventDefault();
			$('.tabs a').removeClass('selected');
			$(e.currentTarget).addClass('selected');
			$('.tabContainer').hide()
			$($(e.currentTarget).attr('href')).show();
		});
	  	
	  	$('.tabContainer').hide();
	  	$($('.tabs .selected').attr('href')).show();
	});
};
$(()=>{
	UIStart();
});

require('xjs').ready();