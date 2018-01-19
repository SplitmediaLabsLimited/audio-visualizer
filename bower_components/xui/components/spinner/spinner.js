/* globals Polymer */

(function()
{
	'use strict';

    var self,
        pressTimer,
        onRaise = function(event)
        {
            clearTimeout(pressTimer);                      
            self.fire("stop");
            self.$.up.removeEventListener("mouseout", onRaise);
            self.$.down.removeEventListener("mouseout", onRaise);
            document.removeEventListener("mouseup", onRaise);
            self = null;
        };

	new Polymer(
	{
		publish:
		{
            /**
             * Label for the dropdown
             *
             * @attribute   label
             * @type        String
             */
            label           : { value: "", reflect: true },

			placeholder: { value: '', reflect: true },
            min:         { value: 0, reflect: true },
            step:        { value: 1, reflect: true },
            oldvalue:    { value: "", reflect: true },
            max:         { value: 100, reflect: true },
            disabled:    { value: false, reflect: true }
		},
        
        disabledChanged: function()
        {
            this.$.input.disabled = this.disabled;

            if (this.disabled)
            {
                this.$.up.setAttribute('disabled', '');  
                this.$.down.setAttribute('disabled', '');                 
            }
            else
            {
                this.$.up.removeAttribute('disabled');   
                this.$.down.removeAttribute('disabled');              
            }
        },

        valueChanged: function(oldValue, newValue)
        {
            if (this.oldvalue == newValue)
            {
                return;
            }

            if (isNaN(newValue) || 
                    (newValue.toString().trim() == "") ||
                    (parseInt(newValue) < parseInt(this.min)) || 
                    (parseInt(newValue) > parseInt(this.max)))
            {
                this.value = this.oldvalue;
                this.$.input.value = this.oldvalue;               
                return;
            }
            this.$.input.value = newValue;
            this.oldvalue = newValue;            
            this.fire("change");
        },

        onKeyDown : function(event)
        {
            if (event.which === 38 || event.which === 40)
            {
                var _this = this;
                setTimeout(function()
                {
                    _this.value = Number(_this.$.input.value);
                }, 0);
            }
        },

        onKeyUp : function(event)
        {
            if (event.which === 38 || event.which === 40)
            {
                var _this = this;
                setTimeout(function()
                {
                    _this.value = Number(_this.$.input.value);
                    _this.fire("stop")
                }, 0);
            }
        },

        onKeyPress : function(event)
        {
            var acceptKeyPress =
                // accept numbers
                (event.which >= 48  && event.which <= 57) ||
                // accept minus sign.or period
                (event.which === 45 || event.which === 46) ||
                (event.which === 13);

            if (event.which === 13)
            {
                this.value = Number(this.$.input.value);
                this.fire("stop");
            }

            if (!acceptKeyPress)
            {
                event.preventDefault();
            }
            // changed value will still need to be validated in onChange
        },

        onChange : function(event)
        {
            var input = event.target;
            // revert to old value if invalid number
            // if(input.type === "number")
            // {

                event.stopPropagation();
            // }
            // else
            // {
            //     this.fire("change"); // need this general case, because the 
            //         // change event does not bubble
            // }
        },

        onInputBlur: function(event)
        {
            this.value = Number(this.$.input.value);
            this.fire("stop");
        },

        incrementValue: function(event)
        {
            var thisValue = Number(this.value);
            if (thisValue + this.step > this.max)
            {
                this.value = this.max;
            }
            else
            {
                this.value = thisValue + this.step;
            }
        },

        decrementValue: function(event)
        {
            var thisValue = Number(this.value);
            if (thisValue - this.step < this.min)
            {
                this.value = this.min;
            }
            else
            {
                this.value = thisValue - this.step;
            }
        },

        onIncrement: function(event)
        {
            if(event.which == 1)
            {
                if(this.disabled) {
                    return;
                }

                var delay = 1000;
                var increment = event.target;
                this.setFocus();

                self = this;
                var manageSpinner = function()
                {
                    self.incrementValue();
                    if (delay > 75)
                    {
                        delay = delay/2;
                    }
                    pressTimer = setTimeout(manageSpinner,delay);
                }
                manageSpinner();

                increment.addEventListener("mouseout", onRaise, false);
                document.addEventListener("mouseup", onRaise, false);
            }
        },

        onDecrement: function(event)
        {
            if(event.which == 1)
            {
                if(this.disabled) {
                    return;
                }

                var delay = 1000;
                var decrement = event.target;
                this.setFocus();

                self = this;
                var manageSpinner = function()
                {
                    self.decrementValue();
                    if (delay > 75)
                    {
                        delay = delay/2;
                    }
                    pressTimer = setTimeout(manageSpinner,delay);
                }
                manageSpinner();

                decrement.addEventListener("mouseout", onRaise, false);
                document.addEventListener("mouseup", onRaise, false);

            }
        },

        setFocus: function()
        {
            this.$.input.focus();
        },

        ready : function()
        {
            this.$.input.addEventListener("dragstart", function(event){ event.preventDefault(); return false });
        }
	});
})();