// VARS
var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData() || {
    items: []
  },
  linkPromises = [];

if (_.isUndefined(data.items)) {
  data.items = [];
}
_.forEach(data.items, function(item) {
  if (_.isObject(item.linkAction)) {
    initLinkProvider(item);
  }
  initColorPicker(item);
});

var accordionCollapsed = false;

var $accordionContainer = $('#accordion');
var templates = {
  panel: template('list-item-thumb-s')
};

var $testElement = $('#testelement');

enableSwipeSave();
checkPanelLength();

setTimeout(function() {
  // SORTING PANELS
  $('.panel-group').sortable({
    handle: ".panel-heading",
    cancel: ".icon-delete",
    tolerance: 'pointer',
    revert: 150,
    placeholder: 'panel panel-default placeholder tile',
    cursor: '-webkit-grabbing; -moz-grabbing;',
    axis: 'y',
    start: function(event, ui) {
      $('.panel-collapse.in').collapse('hide');
      ui.item.addClass('focus').css('height', ui.helper.find('.panel-heading').outerHeight() + 2);
      $('.panel').not(ui.item).addClass('faded');
    },
    stop: function(event, ui) {
      ui.item.removeClass('focus');

      var sortedIds = $(".panel-group").sortable("toArray", {
        attribute: 'data-id'
      });
      data.items = _.sortBy(data.items, function(item) {
        return sortedIds.indexOf(item.id);
      });
      save();
      $('.panel').not(ui.item).removeClass('faded');
    },
    sort: function(event, ui) {
      $('.panel-group').sortable('refresh');
      $('.tab-content').trigger('scroll');
    }
  });
}, 1000);

$('#help_tip').on('click', function() {
  alert("During beta, please use live chat and let us know what you need help with.");
});

// EVENTS
$(".tab-content")
  .on('click', '.icon-delete', function() {

    var $item = $(this).closest("[data-id], .panel"),
      id = $item.data('id');

    _.remove(data.items, {
      id: id
    });
    _.remove(linkPromises, {
      id: id
    });

    $(this).parents('.panel').remove();
    checkPanelLength();
    save();

    $(this).parents('.panel').remove();
    checkPanelLength();
  })
  .on('click', '.list-item-set-link', function() {

    var $item = $(this).closest("[data-id], .panel"),
      id = $item.data('id'),
      item = _.find(data.items, {
        id: id
      });

    initLinkProvider(item);

    if ($(this).siblings().hasClass('hidden')) {
      $(this).siblings().removeClass('hidden');
    }
    $(this).addClass('hidden');
    $(this).siblings('.link-remove').show();

  })
  .on('click', '.add-image', function() {

    var $item = $(this).closest("[data-id], .panel"),
      id = $item.data('id'),
      item = _.find(data.items, {
        id: id
      });

    initImageProvider(item);

    $(this).text('Replace image');
    if ($(this).siblings('.thumb-holder').hasClass('hidden')) {
      $(this).siblings('.thumb-holder').removeClass('hidden');
    }
  })
  .on('click', '.link-remove', function() {

    var $item = $(this).closest("[data-id], .panel"),
      id = $item.data('id'),
      item = _.find(data.items, {
        id: id
      });

    _.remove(linkPromises, {
      id: id
    });
    item.linkAction = null;
    $('[data-id="' + item.id + '"] .add-link').empty();
    $(this).addClass('hidden');
    $(this).siblings('.list-item-set-link').removeClass('hidden');
    save();
  })
  .on('click', '.image-remove', function() {

    var $item = $(this).closest("[data-id], .panel"),
      id = $item.data('id'),
      item = _.find(data.items, {
        id: id
      });

    item.imageConf = null;
    $(this).parents('.add-image-holder').find('.add-image').text('Add image');
    $(this).parents('.add-image-holder').find('.thumb-holder').addClass('hidden');
    save();
  })
  .on('keyup change paste', '.list-item-title', function() {
    var $listItem = $(this).parents('.panel');
    setListItemTitle($listItem.index(), $(this).val());
    debounceSave();
  }).on('keyup change paste', '.list-item-desc', function() {
    debounceSave();
  }).on('click', '.expand-items', function() {
    // Update accordionCollapsed if all panels are collapsed/expanded
    if (!$('.panel-collapse.in').length) {
      accordionCollapsed = true;
    } else if ($('.panel-collapse.in').length == $('.panel-collapse').length) {
      accordionCollapsed = false;
    }

    if (accordionCollapsed) {
      expandAccordion();
    } else {
      collapseAccordion();
    }
  })
  .on('click', '.new-list-item', function() {
    var item = {};
    item.id = makeid(8);
    item.linkAction = null;
    item.title = 'Panel item ' + ($('#accordion .panel').length + 1);
    item.description = "";
    data.items.push(item);

    addListItem(item);

    checkPanelLength();

    save();
  })
  .on('show.bs.collapse', '.panel-collapse', function() {
    $(this).siblings('.panel-heading').find('.fa-chevron-right').removeClass('fa-chevron-right').addClass('fa-chevron-down');
  })
  .on('hide.bs.collapse', '.panel-collapse', function() {
    $(this).siblings('.panel-heading').find('.fa-chevron-down').removeClass('fa-chevron-down').addClass('fa-chevron-right');
  })
  .on('shown.bs.collapse hidden.bs.collapse', '.panel-collapse', function() {
    $('.tab-content').trigger('scroll');
  })
  .on('change', 'input[name="enable_list_saving"]:radio', function() {
    enableSwipeSave();
  });

var contentHeight = $('body > .form-horizontal').outerHeight();
var tabPaneTopPadding = 78;

$('body > .form-horizontal').scroll(function(event) {
  var tabContentScrollPos = Math.abs($('.tab-pane-content').position().top - tabPaneTopPadding);
  var tabPaneHeight = tabPaneTopPadding + $('.tab-pane-content').height();

  if (tabPaneHeight - tabContentScrollPos > contentHeight) {
    $('body').addClass('controls-sticky-on');
  } else {
    $('body').removeClass('controls-sticky-on');
  }
});

// FUNCTIONS
function enableSwipeSave() {
  if ($('#swipe-to-save-yes').is(':checked')) {
    $('#saved-list-field').addClass('show');
    data.swipeToSave = true;
  } else if ($('#swipe-to-save-no').is(':checked')) {
    $('#saved-list-field').removeClass('show');
    data.swipeToSave = false;
  }
}

function initLinkProvider(item) {

  item.linkAction = item.linkAction || {};
  item.linkAction.provId = item.id;

  var linkActionProvider = Fliplet.Widget.open('com.fliplet.link', {
    // If provided, the iframe will be appended here,
    // otherwise will be displayed as a full-size iframe overlay
    selector: '[data-id="' + item.id + '"] .add-link',
    // Also send the data I have locally, so that
    // the interface gets repopulated with the same stuff
    data: item.linkAction,
    // Events fired from the provider
    onEvent: function(event, data) {
      if (event === 'interface-validate') {
        Fliplet.Widget.toggleSaveButton(data.isValid === true);
      }
    },
    closeOnSave: false
  });

  linkActionProvider.then(function(data) {
    item.linkAction = data ? data.data : {};
    return Promise.resolve();
  });

  linkActionProvider.id = item.id;
  linkPromises.push(linkActionProvider);
}

var imageProvider;

function initImageProvider(item) {
  imageProvider = Fliplet.Widget.open('com.fliplet.image-manager', {
    // Also send the data I have locally, so that
    // the interface gets repopulated with the same stuff
    data: item.imageConf,
    // Events fired from the provider
    onEvent: function(event, data) {
      if (event === 'interface-validate') {
        Fliplet.Widget.toggleSaveButton(data.isValid === true);
      }
    },
    single: true,
    type: 'image'
  });

  Fliplet.Widget.toggleCancelButton(false);

  window.addEventListener('message', function(event) {
    if (event.data === 'cancel-button-pressed') {
      Fliplet.Widget.toggleCancelButton(true);
      imageProvider.close();
      if (_.isEmpty(item.imageConf)) {
        $('[data-id="' + item.id + '"] .add-image-holder').find('.add-image').text('Add image');
        $('[data-id="' + item.id + '"] .add-image-holder').find('.thumb-holder').addClass('hidden');
      }
    }
  });

  Fliplet.Studio.emit('widget-save-label-update', {
    text: 'Select & Save'
  });

  imageProvider.then(function(data) {
    if (data.data) {
      item.imageConf = data.data;
      $('[data-id="' + item.id + '"] .thumb-image img').attr("src", data.data.thumbnail);
      save();
    }
    imageProvider = null;
    Fliplet.Studio.emit('widget-save-label-reset');
    return Promise.resolve();
  });
}

function template(name) {
  return Handlebars.compile($('#template-' + name).html());
}

function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function expandAccordion() {
  accordionCollapsed = false;
  $('.panel-collapse').collapse('show');
}

function collapseAccordion() {
  accordionCollapsed = true;
  $('.panel-collapse').collapse('hide');
}

function setListItemTitle(index, title) {
  $('#accordion').find('.panel:eq(' + index + ') .panel-title-text').html(title);
}

function addListItem(data) {
  var $newPanel = $(templates.panel(data));
  $accordionContainer.append($newPanel);
  initColorPicker(data);

  $newPanel.find('.form-control:eq(0)').select();
  $('.form-horizontal').stop().animate({
    scrollTop: $('.tab-content').height()
  }, 200, function() {
    $('.form-horizontal').trigger('scroll');
  });
}

function initColorPicker(item) {
  var picker = new CP(document.querySelector('#list-item-color-' + item.id));

  $('#list-item-color-' + item.id).on('keyup change paste', function() {
    picker.set(this.value);
    picker.trigger("change", [this.value.substring(1)], 'main-change');
    debounceSave();
  });

  picker.on("change", function(color) {
    this.target.value = '#' + color;
    $($(this.target).siblings('div')[0]).css('background-color', '#' + color);
    debounceSave();
  }, 'main-change');

  var colors = ['1d3f68', '00abd2', '036b95', 'ffd21d', 'ed9119', 'e03629', '831811', '5e0f0f', '23a437', '076c31'],
    box;

  for (var i = 0, len = colors.length; i < len; ++i) {
    box = document.createElement('span');
    box.className = 'color-picker-box';
    box.title = '#' + colors[i];
    box.style.backgroundColor = '#' + colors[i];
    box.addEventListener("click", function(e) {
      picker.set(this.title);
      picker.trigger("change", [this.title.slice(1)], 'main-change');
      e.stopPropagation();
    }, false);
    picker.picker.firstChild.appendChild(box);
  }
}

function checkPanelLength() {
  if ($('.panel').length > 0) {
    if ($('.panel').length > 1) {
      $('.expand-items').removeClass("hidden");
    } else {
      $('.expand-items').addClass("hidden");
    }
    $('#list-items').removeClass('list-items-empty');
  } else {
    $('.expand-items').addClass("hidden");
    $('#list-items').addClass('list-items-empty');
  }
}

Fliplet.Widget.onSaveRequest(function() {
  if (imageProvider) {
    imageProvider.forwardSaveRequest();
  } else {
    save(true);
  }
});

var debounceSave = _.debounce(save, 500);

function save(notifyComplete) {
  _.forEach(data.items, function(item) {
    item.description = $('#list-item-desc-' + item.id).val();
    item.title = $('#list-item-title-' + item.id).val();
    item.color = $('#list-item-color-' + item.id).val();
  });

  data.swipeToSaveLabel =
    (data.swipeToSave && $('[name="saved_list_label"]').val().length) ?
    $('[name="saved_list_label"]').val() :
    'My List';

  if (notifyComplete) {
    Fliplet.Widget.all(linkPromises).then(function() {
      // when all providers have finished
      Fliplet.Widget.save(data).then(function() {
        // Close the interface for good
        Fliplet.Widget.complete();
      });
    });

    // forward save request to all providers
    linkPromises.forEach(function(promise) {
      promise.forwardSaveRequest();
    });
  } else {
    Fliplet.Widget.save(data).then(function() {
      Fliplet.Studio.emit('reload-widget-instance', widgetId);
    });
  }

}
