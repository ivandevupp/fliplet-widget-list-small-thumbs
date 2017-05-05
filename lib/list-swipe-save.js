Array.prototype.remove = function() {
  var what, a = arguments,
    L = a.length,
    ax;
  while (L && this.length) {
    what = a[--L];
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1);
    }
  }
  return this;
};

/********  SwipeSaveList  ********/
/********  SwipeSaveList  ********/
/********  SwipeSaveList  ********/

var SwipeSaveList = function(container, opt) {
  var _this = this;

  if (typeof container !== 'undefined' &&
    container !== null &&
    container.classList.contains('list-swipe-initialised')) {
    // Do not run again
    return;
  }
  Object.defineProperty(this, 'SAVED_PV_STRUCT', {
    value: {
      saved_indices: []
    }
  });

  this.defaultOptions = {
    target: '.list-swipe li',
    filter: '.filter-' + container.dataset.filterId,
    savedListLabel: 'My List'
  };

  this.options = JSON.parse(JSON.stringify(this.defaultOptions));
  for (var prop in opt) {
    this.options[prop] = opt[prop];
  }

  this.container = container;

  this.init();

  // Flag the list as initiated
  this.container.classList.add('list-swipe-initialised');
};

SwipeSaveList.prototype.init = function() {

  var _this = this;

  this.listSwipe = new ListSwipe(this.container.querySelector('ul.list-swipe'), {
    actionLeftLabel: 'Remove from ' + this.options.savedListLabel,
    actionLeftSwipedLabel: 'Removed',
    actionLeftCallback: this.unsaveListItem.bind(this),
    actionRightLabel: 'Add to ' + this.options.savedListLabel,
    actionRightSwipedLabel: 'Added',
    actionRightCallback: this.saveListItem.bind(this),
    actionThreshold: 120
  });

  Fliplet.Storage.get('saved_list_' + _this.listSwipe.container.parentNode.dataset.listUuid, {
    defaults: _this.SAVED_PV_STRUCT
  }).then(function(saved) {
    _this.restoreSavedList(saved);
  });

  // If we have the list in a Overlay that has been already
  // loaded we should destroy it so we can instantiate it again
  if ($(this.container).mixItUp('isLoaded')) {
    $(this.container).mixItUp('destroy');
  }

  $(this.container).mixItUp({
    selectors: {
      target: this.options.target,
      filter: this.options.filter
    },
    layout: {
      display: 'block',
      containerClass: 'filter-loaded'
    },
    animation: {
      enable: false,
      effects: 'fade translateX(-100%)',
      reverseOut: false
    },
    callbacks: {
      onMixLoad: function() {
        $(this).mixItUp('setOptions', {
          animation: {
            enable: true
          }
        });
      },
      onMixEnd: function(data) {
        if (data.activeFilter === '.saved') {
          _this.container.querySelector('.label-instruction').classList.add('my');
          if (data.totalShow === 0) {
            _this.container.querySelector('.label-instruction').classList.add('empty');
          }
          //_this.listSwipe.swipeLeftEnabled = true;
          //_this.listSwipe.swipeRightEnabled = false;
        } else {
          _this.container.querySelector('.label-instruction').classList.remove('my');
          _this.container.querySelector('.label-instruction').classList.remove('empty');
          //_this.listSwipe.swipeLeftEnabled = false;
          //_this.listSwipe.swipeRightEnabled = true;
        }
      }
    }
  });

};

SwipeSaveList.prototype.saveListItem = function(el, i) {
  var _this = this;

  el.parentNode.classList.add('saved');
  if (this.saved_list.saved_indices.indexOf(i) < 0 && i > -1) {
    this.saved_list.saved_indices.push(i);
    Fliplet.Storage.set('saved_list_' + this.listSwipe.container.parentNode.dataset.listUuid, this.saved_list);
  }
};

SwipeSaveList.prototype.unsaveListItem = function(el, i) {
  var _this = this;
  el.parentNode.classList.remove('saved');
  if (this.saved_list.saved_indices.indexOf(i) > -1 && i > -1) {
    this.saved_list.saved_indices.remove(i);
    Fliplet.Storage.set('saved_list_' + this.listSwipe.container.parentNode.dataset.listUuid, this.saved_list);
  }
  setTimeout(function() {
    var state = $(_this.container).mixItUp('getState');
    if (state.activeFilter === '.saved') {
      $(_this.container).mixItUp('filter', '.saved');
      _this.listSwipe.swipeActionCompleted();
    }
  }, 0);
};

SwipeSaveList.prototype.restoreSavedList = function(data) {
  data = data || {
    saved_indices: []
  };
  this.saved_list = data;
  var listItems = this.listSwipe.container.querySelectorAll('li');
  for (var i = 0, l = this.saved_list.saved_indices.length; i < l; i++) {
    if (this.saved_list.saved_indices[i] > -1) {
      listItems[this.saved_list.saved_indices[i]].classList.add('saved');
    }
  }
};

/********  END: SwipeSaveList  ********/
/********  END: SwipeSaveList  ********/
/********  END: SwipeSaveList  ********/
