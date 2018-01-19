/* globals Polymer */

(function()
{
	'use strict';

	new Polymer(
	{
		publish:
		{
			value: { value: null, reflect: true },
			disabled: {value: false, reflect: true}
		},

		eventDelegates:
		{
			select: 'onSelect'
		},

		onSelect: function(event)
		{
			if (event.target.selected)
			{
				this.value = event.target.value;
			}
		},

		valueChanged: function()
		{
			var radios = this.querySelectorAll('xui-radio');

			for (var i = 0; i < radios.length; i++)
			{
				var radio = radios[i];

				radio.selected = (this.value === radio.value);
			}
		},

		disabledChanged: function()
		{
			var radios = this.querySelectorAll('xui-radio');

			for (var i = 0; i < radios.length; i++)
			{
				var radio = radios[i];

				radio.disabled = this.disabled;
			}
		}

	});
})();