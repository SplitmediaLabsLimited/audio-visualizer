/* globals Polymer */

(function()
{
    'use strict';
    var self;

    var mouseCancel = function(event)
        {
            if (typeof event.target === 'undefined' || (event.target != self && !self.contains(event.target)))
            {
                self.onClick(event);
            }
        },

        blurCancel = function(event)
        {
            self.onClick();
        },

        keyCancel = function(event)
        {
            if (event.which == 9) // tab
            {
                self.onClick();
            }
            else if (event.which == 27) // esc
            {
                self.onClick();
                self.blur();
                event.stopPropagation();
            }
        };

    new Polymer(
    {
        publish:
        {
            disabled: { value: false, reflect: true },
            value:    { value: '', reflect: true },
            placeholder: { value: '', reflect: true },
            selected: null,
            name: ''
        },

        eventDelegates:
        {
            click: 'onClick',
            blur: 'onBlur'
        },

        domReady: function()
        {
            this.async(this.valueChanged);
        },
        
        ready: function()
        {
            this.$.list.hidden = true;
            this.onMutation(this, this.onContentUpdate);
        },

        valueChanged: function()
        {
            var option = this.querySelector(
                'xui-option[value="' + this.value + '"]'
            ), data = option ? option.data : '';

            this.selected = option;

            this.fire('select-changed', { 
                value       : this.value, 
                selectedText: this.selected ? this.selected.label  : '',
                name        : this.name, 
                data        : data 
            });
        },

        computeScrollTop: function(viewportOffset, height)
        {
            var scrollDiv = this.$.list;
            var minTop = scrollDiv.getBoundingClientRect().top;
            var maxTop = scrollDiv.getBoundingClientRect().bottom - height;

            if (viewportOffset.top < minTop)
            {
                var difference = minTop - viewportOffset.top;
                scrollDiv.scrollTop = scrollDiv.scrollTop - difference;
            }
            else if (viewportOffset.top > maxTop)
            {
                var difference = viewportOffset.top - maxTop;
                scrollDiv.scrollTop = scrollDiv.scrollTop + difference;
            }
        },

        showSelected: function()
        {
            if (this.selected !== null) {
                this.selected.classList.add('selected');
                var viewportOffset = this.selected.getBoundingClientRect();
                var outerHeight = this.selected.offsetHeight +
                    parseFloat(getComputedStyle(this.selected).marginTop) +
                    parseFloat(getComputedStyle(this.selected).marginBottom);
                this.computeScrollTop(viewportOffset, outerHeight);
            }
        },

        clearSelected: function()
        {
            var options = this.querySelectorAll('xui-option');
            for (var i = options.length - 1; i >= 0; i--) {
                options[i].classList.remove('selected');
            };
        },

        onContentUpdate: function()
        {
            this.async(this.valueChanged);
            this.onMutation(this, this.onContentUpdate);
        },

        onBlur: function()
        {
            this.$.list.hidden = true;
            document.body.removeEventListener('mousedown', mouseCancel, false);
            document.body.removeEventListener('keydown', keyCancel, false);
            window.removeEventListener('blur', blurCancel, false);
            self = null;
        },        

        onClick: function(event)
        {
            this.focus();
            var hidden = this.$.list.hidden;
            this.$.list.hidden = !hidden;
            if (typeof event !== 'undefined' &&
                typeof event.target !== 'undefined' &&
                (/xui-option$/i).test(event.target.tagName))
            {
                this.value = event.target.value;
                this.blur();
            }

            if (!hidden)
            {
                this.clearSelected();
                document.body.removeEventListener('mousedown', mouseCancel, false);
                document.body.removeEventListener('keydown', keyCancel, false);
                window.removeEventListener('blur', blurCancel, false);
                self = null;
            }
            else
            {
                self = this;
                this.showSelected();
                document.body.addEventListener('mousedown', mouseCancel, false);
                document.body.addEventListener('keydown', keyCancel, false);
                window.addEventListener('blur', blurCancel, false);                
            }
        }
    });
})();