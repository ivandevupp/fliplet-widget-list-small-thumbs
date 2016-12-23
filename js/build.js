$('.linked[data-list-thumb-s-id]').click(function (event) {
    event.preventDefault();

    var data = Fliplet.Widget.getData($(this).parents('[data-thumb-s-item-id]').data('thumb-s-item-id'));

    var itemData = _.find(data.items,{id: $(this).data('thumb-s-item-id')});

    if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
        Fliplet.Navigate.to(itemData.linkAction);
    }
});
