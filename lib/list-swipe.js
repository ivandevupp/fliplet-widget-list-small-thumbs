var transformName = function () {
    var i,
        undefined,
        el = document.createElement('div'),
        transforms = {
            'webkitTransform' : 'webkitTransform',
            'mozTransform' : 'mozTransform',
            'msTransform' : 'msTransform',
            'oTransform' : 'oTransform'
        };

    for (i in transforms) {
        if (transforms.hasOwnProperty(i) && el.style[i] !== undefined) {
            return transforms[i];
        }
    }

    return false;
};

var transitionEndEventName = function () {
    var i,
        undefined,
        el = document.createElement('div'),
        transitions = {
            'transition':'transitionend',
            'OTransition':'otransitionend',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

    for (i in transitions) {
        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
            return transitions[i];
        }
    }

    return false;
};

var animationEndEventName = function () {
    var i,
        undefined,
        el = document.createElement('div'),
        animations = {
            'animation':'animationend',
            'OAnimation':'oanimationend',
            'MozAnimation':'animationend',
            'WebkitAnimation':'webkitAnimationEnd'
        };

    for (i in animations) {
        if (animations.hasOwnProperty(i) && el.style[i] !== undefined) {
            return animations[i];
        }
    }

    return false;
};

/********  ListSwipe  ********/ 
/********  ListSwipe  ********/ 
/********  ListSwipe  ********/ 

var ListSwipe = function ( container, opt ) {
    Object.defineProperty( this, 'listWrapperClass' , { value : 'list-swipe-wrapper' } );

    Object.defineProperty( this, 'TRANSITION_END' , { value : transitionEndEventName() } );
    Object.defineProperty( this, 'ANIMATION_END'  , { value : animationEndEventName() } );
    Object.defineProperty( this, 'TRANSFORM'      , { value : transformName() } );

    Object.defineProperty( this, 'ACTION_SWIPE_NONE' , { value : 0 } );
    Object.defineProperty( this, 'ACTION_SWIPE_LEFT' , { value : 1 } );
    Object.defineProperty( this, 'ACTION_SWIPE_RIGHT', { value : 2 } );

    Object.defineProperty( this, 'ACTION_CLASS_LEFT' , { value : 'swipe-action-left'  } );
    Object.defineProperty( this, 'ACTION_CLASS_RIGHT', { value : 'swipe-action-right' } );

    this.defaultOptions = {
        // Number of pixels to swipe before an action become active
        actionThreshold : 150,
        // Number of pixels to swipe vertically/horizontally before recognising users' intention to scroll/swipe
        // If one threshold is too high, users won't be able to easily activate the action
        // If one threshold is too low, users won't be able to easily activate the other action
        scrollThreshold : 10,
        swipeThreshold : 10,
        actionLeftLabel : 'Swipe Left',
        actionLeftSwipedLabel : 'Swiped Left',
        actionLeftCallback : null,
        actionRightLabel : 'Swipe Right',
        actionRightSwipedLabel : 'Swiped Right',
        actionRightCallback : null
    };
    
    this.options = JSON.parse( JSON.stringify(this.defaultOptions) );
    for ( var prop in opt ) {
        this.options[prop] = opt[prop];
    }
    
    this.container = container;
    
    this.reset();    
    this.init();
    this.attachObservers();
    
    return this;
};

ListSwipe.prototype.handleEvent = function(event) {
    if (typeof(this[event.type]) === 'function')
        return this[event.type](event);
};

ListSwipe.prototype.reset = function() {
    this.listSwiping = false;
    this.listDisabled = false;
    this.listTransitioning = false;
    this.disabledSwipeFactor = 0.1;
    this.action = this.ACTION_SWIPE_NONE;
    this.x = 0;
    this.activateAction('none');
    delete this.listItem;
};

ListSwipe.prototype.init = function () {
    this.swipeLeftEnabled = (typeof this.options.actionLeftCallback === 'function');
    this.swipeRightEnabled = (typeof this.options.actionRightCallback === 'function');
    
    var listItems = this.container.querySelectorAll('li');
    for (var i = 0, l = listItems.length; i < l; i++) {
        var cHeight = listItems[i].clientHeight;
        var paddingTop = window.getComputedStyle(listItems[i], null).getPropertyValue('padding-top');
        var paddingBottom = window.getComputedStyle(listItems[i], null).getPropertyValue('padding-bottom');
        var paddingLeft = window.getComputedStyle(listItems[i], null).getPropertyValue('padding-left');
        var paddingRight = window.getComputedStyle(listItems[i], null).getPropertyValue('padding-right');
        var origContent = listItems[i].innerHTML;
        var swipeLeftDiv = '<div class="swipe-action ' + this.ACTION_CLASS_LEFT + '" style="line-height: ' + cHeight + 'px">' + (this.swipeLeftEnabled ? this.options.actionLeftLabel : '') + '</div>';
        var swipeRightDiv = '<div class="swipe-action ' + this.ACTION_CLASS_RIGHT + '" style="line-height: ' + cHeight + 'px">' + (this.swipeRightEnabled ? this.options.actionRightLabel : '') + '</div>';
        listItems[i].innerHTML = '<div class="' + this.listWrapperClass + '" style="padding-top: ' + paddingTop + '; padding-bottom: ' + paddingBottom + '; padding-left: ' + paddingLeft + '; padding-right: ' + paddingRight + ';">' + swipeRightDiv + origContent + swipeLeftDiv + '</div>';
        listItems[i].style.padding = 0;
    }
};

ListSwipe.prototype.handleTouchStart = function (event) {
    if (event.type === 'mousedown')  {
        var el = event.target;
    } else {
        if (event.touches.length > 1) {
            this.handleTouchEnd(true);
            this.detachObservers();
        }
        var el = document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
    }
        
    while (el && !el.classList.contains(this.listWrapperClass) ) {
        if (el.compareDocumentPosition(this.container) ===  0 || el.compareDocumentPosition(this.container) & Node.DOCUMENT_POSITION_CONTAINED_BY) return;
        el = el.parentNode;
    }
    
    if (el && el.classList.contains(this.listWrapperClass) && !this.listDisabled) {
        this.listItem = el;
        this.swipeLeftAction = el.querySelector('.'+this.ACTION_CLASS_LEFT);
        this.swipeRightAction = el.querySelector('.'+this.ACTION_CLASS_RIGHT);
        this.listItem.classList.remove('restore');
        this.startX = (event.type === 'mousedown') ? event.clientX : event.touches[0].clientX;
        this.startY = (event.type === 'mousedown') ? event.clientY : event.touches[0].clientY;
    } else {
        this.detachObservers();
        return false;
    }
};

ListSwipe.prototype.handleTouchMove = function (event) {
    var touchX = (event.type === 'mousemove') ? event.clientX : event.touches[0].clientX;
    var touchY = (event.type === 'mousemove') ? event.clientY : event.touches[0].clientY;
    
    if ( Math.abs(touchY - this.startY) > this.options.scrollThreshold && !this.listSwiping ) {
        return;
    }
    
    if ( this.listSwiping || Math.abs(touchX - this.startX) > this.options.swipeThreshold ) {
        if (this.listDisabled) return;
        if ( !this.listSwiping ) {
            this.listSwiping = true;
            this.startX = touchX;
        }
        this.x = touchX - this.startX;
        if ( this.x < 0 && !this.swipeLeftEnabled || this.x > 0 && !this.swipeRightEnabled ) {
            this.x *= this.disabledSwipeFactor;
        }
        
        if ( Math.abs(this.x) > this.options.actionThreshold ) {
            if (this.x < 0 && this.swipeLeftEnabled) {
                this.activateAction('left');
            } else if (this.x > 0 && this.swipeRightEnabled) {
                this.activateAction('right');
            }
        } else {
		    this.activateAction('none');
        }
        
        this.move();
        event.preventDefault();
    }
};

ListSwipe.prototype.handleTouchEnd = function () {
    if ( this.listSwiping ) {
        this.listSwiping = false;
        this.listItem.classList.add('animated');
        if ( this.action === this.ACTION_SWIPE_LEFT && this.swipeLeftEnabled ) {
            this.listItem.style[this.TRANSFORM] = 'translate3d(-100%,0,0)';
            this.listItem.classList.remove('action-swipe-right');
            this.listItem.classList.add('action-swipe-left');
        }
        if ( this.action === this.ACTION_SWIPE_RIGHT && this.swipeRightEnabled ) {
            this.listItem.style[this.TRANSFORM] = 'translate3d(100%,0,0)';
            this.listItem.classList.remove('action-swipe-left');
            this.listItem.classList.add('action-swipe-right');
        }
        if ( this.action === this.ACTION_SWIPE_NONE) {
            this.listItem.style[this.TRANSFORM] = 'translate3d(0,0,0)';
        }

        this.listDisabled = true;
        this.listTransitioning = true;

        if ( this.TRANSITION_END === false ) {
            // Browser does not support transition. Trigger swipeActionConfirmed manually.
            this.swipeActionConfirmed();
        }
	}
};

ListSwipe.prototype.swipeActionConfirmed = function () {
    // Transition is used to manage UI behaviour when user gesture ends
    if (this.listTransitioning) {
        this.listTransitioning = false;

        var elem = this.listItem;
        elem.classList.remove('animated');
        elem.style[this.TRANSFORM] = 'translate3d(0,0,0)';

        switch ( this.action ) {
            case this.ACTION_SWIPE_LEFT :
                elem.classList.add('restore');
                this.swipeLeftAction.innerHTML = this.options.actionLeftSwipedLabel;
                break;
            case this.ACTION_SWIPE_RIGHT :
                elem.classList.add('restore');
                this.swipeRightAction.innerHTML = this.options.actionRightSwipedLabel;
                break;
            case this.ACTION_SWIPE_NONE :
            default :
                this.listDisabled = false;
                break;
        }    

        this.triggerSwipeCallback();

        if ( this.ANIMATION_END === false || this.action === this.ACTION_SWIPE_NONE ) {
            // Browser does not support animation. Trigger swipeActionCompleted manually.
            this.swipeActionCompleted();
        }
    }
};

ListSwipe.prototype.swipeActionCompleted = function () {
    // Animation is used to manage UI behaviour when user swipe ends and action is fading away
    if ( typeof this.listItem === 'undefined' ) {
        this.listItem = this.container.querySelector('.restore');
        this.swipeLeftAction = this.listItem.querySelector('.'+this.ACTION_CLASS_LEFT);
        this.swipeRightAction = this.listItem.querySelector('.'+this.ACTION_CLASS_RIGHT);
    }
    this.listItem.classList.remove('restore');
    switch ( this.action ) {
        case this.ACTION_SWIPE_LEFT :
            this.swipeLeftAction.innerHTML = this.options.actionLeftLabel;
            break;
        case this.ACTION_SWIPE_RIGHT :
            this.swipeRightAction.innerHTML = this.options.actionRightLabel;
            break;
        case this.ACTION_SWIPE_NONE :
        default :
            break;
    }

    this.reset();
};

ListSwipe.prototype.triggerSwipeCallback = function () {
    switch ( this.action ) {
        case this.ACTION_SWIPE_LEFT :
            if ( typeof this.options.actionLeftCallback === 'function' ) {
                var index = this.getIndexOf(this.listItem);
                this.options.actionLeftCallback(this.listItem, index);
            }
            break;
        case this.ACTION_SWIPE_RIGHT :
            if ( typeof this.options.actionRightCallback === 'function' ) {
                var index = this.getIndexOf(this.listItem);
                this.options.actionRightCallback(this.listItem, index);
            }
            break;
        case this.ACTION_SWIPE_NONE :
        default :
            break;
    }
};

ListSwipe.prototype.getIndexOf = function(el){
    var listItems = this.container.querySelectorAll('li');
    for ( var i = 0, l = listItems.length; i < l; i++ ) {
        if ( el.parentNode.compareDocumentPosition(listItems[i]) === 0 ) {
            return i;
        }
    }
    return -1;
};

ListSwipe.prototype.move = function () {
    this.listItem.style[this.TRANSFORM] = 'translate3d(' + this.x + 'px,0,0)';
};

ListSwipe.prototype.activateAction = function (actionDirection) {
    var actionSelector = '';
    var swipeAction;
    switch ( actionDirection ) {
        case 'left' :
            this.action = this.ACTION_SWIPE_LEFT;
            this.listItem.querySelector('.'+this.ACTION_CLASS_LEFT).classList.add('active');
            break;
        case 'right' :
            this.action = this.ACTION_SWIPE_RIGHT;
            this.listItem.querySelector('.'+this.ACTION_CLASS_RIGHT).classList.add('active');
            break;
        case 'none' :
            this.action = this.ACTION_SWIPE_NONE;
            if (this.swipeLeftEnabled) {
                this.listItem.querySelector('.'+this.ACTION_CLASS_LEFT).classList.remove('active');
            }
            if (this.swipeRightEnabled) {
                this.listItem.querySelector('.'+this.ACTION_CLASS_RIGHT).classList.remove('active');
            }
            break;
    }
};

ListSwipe.prototype.attachObservers = function () {
    this.container.addEventListener( 'mousedown' , this, false );
    this.container.addEventListener( 'touchstart', this, false );
    this.container.addEventListener( this.TRANSITION_END, this.swipeActionConfirmed.bind(this), false );
    this.container.addEventListener( this.ANIMATION_END, this.swipeActionCompleted.bind(this), false );
};

ListSwipe.prototype.mousedown = function (event) {
    this.container.addEventListener( 'mousemove' , this, false );
    this.container.addEventListener( 'mouseup'   , this, false );
    this.handleTouchStart(event);
};

ListSwipe.prototype.mousemove = function (event) {
    this.handleTouchMove(event);
};

ListSwipe.prototype.mouseup = function (event) {
	this.container.removeEventListener( 'mousemove' , this, false );
    this.container.removeEventListener( 'mouseup'   , this, false );
    this.handleTouchEnd();
};

ListSwipe.prototype.touchstart = function (event) {
    this.container.addEventListener( 'touchmove'  , this, false );
    this.container.addEventListener( 'touchend'   , this, false );
    this.container.addEventListener( 'touchcancel', this, false );
    this.handleTouchStart(event);
};

ListSwipe.prototype.touchmove = function (event) {
    this.handleTouchMove(event);
};

ListSwipe.prototype.touchend = function (event) {
	this.container.removeEventListener( 'touchmove'  , this, false );
    this.container.removeEventListener( 'touchend'   , this, false );
    this.container.removeEventListener( 'touchcancel', this, false );
    this.handleTouchEnd();
};

ListSwipe.prototype.touchcancel = function (event) {
	this.container.removeEventListener( 'touchmove'  , this, false );
    this.container.removeEventListener( 'touchend'   , this, false );
    this.container.removeEventListener( 'touchcancel', this, false );
    this.handleTouchEnd();
};

ListSwipe.prototype.detachObservers = function () {
	this.container.removeEventListener( 'mousemove' , this, false );
    this.container.removeEventListener( 'mouseup'   , this, false );
	this.container.removeEventListener( 'touchmove' , this, false );
    this.container.removeEventListener( 'touchend'  , this, false );
};

/********  END: ListSwipe  ********/ 
/********  END: ListSwipe  ********/ 
/********  END: ListSwipe  ********/