// $(function(){
//   let _tooltipTimeout,$tooltip;
//   $(document).on("mouseover mousemove mouseout",".help",(event)=>{
//     switch(event.type){
//       case "mouseover":
//         $(event.currentTarget).find('.help-text').css({
//           position:'absolute',
//           height: $(event.currentTarget).find('.help-text')[0].offsetHeight + 5,
//           'z-index':20,
//           top:event.clientY,
//           left:event.clientX,
//         })
//       break;
//       case "mouseout":
//       $(event.currentTarget).find('.help-text').attr('style','');
//       break;
//     }
//   })
// })
// $(function(){
//   var _tooltipTimeout;
//   var $tooltip;

//   $(document).on("mouseover mousemove mouseout", ".help",
//     function(event){
//       switch(event.type){
//         case "mouseover":
//           _tooltipTimeout = setTimeout(function() {
//             $tooltip = $(event.currentTarget).closest('.help-text');
//             $tooltip.show();
//           }, 1000);
//           break;
//         case "mousemove":
//           var _tooltip = { height: $tooltip.outerHeight(), width: $tooltip.outerWidth() },
//               _window = { height: $(window).outerHeight(), width: $(window).outerWidth() },
//               _pos = { x: event.clientX + 15, y: event.clientY + 15 },
//               _widthTotal = _pos.x + _tooltip.width;

//           if(_widthTotal > _window.width && (_pos.x - _tooltip.width) < 0){
//             _pos.x = 0;
//           }else{
//             if((_pos.x + _tooltip.width) > _window.width){
//               _pos.x = _pos.x - _tooltip.width - 5;
//             }
//           }

//           if((_pos.y + _tooltip.height) > _window.height){
//             _pos.y = _pos.y - _tooltip.height - 5;
//           }

//           $tooltip.offset({ left: _pos.x, top: _pos.y });
//           break;
//         case "mouseout":
//           $tooltip.hide();
//           clearTimeout(_tooltipTimeout);
//           break;
//       }

//     }
//   )
// })