$('.linked[data-thumb-s-item-id]').click(function (event) {
    event.preventDefault();

    var data = Fliplet.Widget.getData($(this).parents('[data-list-thumb-s-id]').data('list-thumb-s-id'));

    var itemData = _.find(data.items,{id: $(this).data('thumb-s-item-id')});

    if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
        Fliplet.Navigate.to(itemData.linkAction);
    }
});
