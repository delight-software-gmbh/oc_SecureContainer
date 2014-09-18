/**
 * Copyright (c) 2014, Lukas Zurschmiede, http://ranta.ch
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/**
 * Utility class for secure_container related navigation operations
 */
(function ($, OC) {
	'use strict'

	if (!OCA.SecureContainer) {
		OCA.SecureContainer = {};
	};

	var Navigation = function($el, $bc) {
		this.initialize($el, $bc);
	};

	Navigation.prototype = {
		/**
		 * Currently selected item in the list
		 */
		_activeItem: null,

		/**
		 * The main navigation container
		 */
		$el: null,

		/**
		 * The Breadcrumb container with the create dropdown-
		 */
		$breadcrumb: null,

		/**
		 * Currently selected container
		 */
		$currentContent: null,

		/**
		 * Initializes the navigation from the given container
		 * @param $el element containing the navigation
		 */
		initialize: function($el, $bc) {
			this.$el = $el;
			this.$breadcrumb = $bc;
			this.$currentContent = null;
			this._activeItem = null;
			this._setupEvents();
		},

		/**
		 * Adds an event handler
		 *
		 * @param string eventName event name
		 * @param Function callback
		 */
		on: function(eventName, callback) {
			this.$el.on(eventName, callback);
		},

		/**
		 * Removes an event handler
		 *
		 * @param string eventName event name
		 * @param Function callback
		 */
		off: function(eventName, callback) {
			this.$el.off(eventName, callback);
		},

		/**
		 * Triggers an event for all subscribers
		 * 
		 * @param string eventName event name
		 * @param Object data Event data
		 */
		trigger: function(eventName, data) {
			data.section = data.section || this.getActiveItem();
			this.$el.trigger(new $.Event(eventName, { eventData: data }));
		},

		/**
		 * Setup UI events
		 */
		_setupEvents: function() {
			this.$el.on('click', 'li a', _.bind(this._onClickItem, this));
			this.$breadcrumb.on('click', '#new a', _.bind(this._onClickNew, this));
			this.$breadcrumb.on('click', '#new ul li', _.bind(this._onClickNewEntry, this));
		},

		/**
		 * Returns the container of the currently active app.
		 *
		 * @return app container
		 */
		getActiveContainer: function() {
			return this.$currentContent;
		},

		/**
		 * Returns the currently active section id or an empty string
		 * 
		 * @return item ID
		 */
		getActiveItem: function() {
			return this._activeItem || '0';
		},

		/**
		 * Switch the currently selected path, mark it as selected and fire up
		 * the sectionChanged event which can be used to update the container.
		 *
		 * @param string itemId ID of the selected section
		 */
		setActiveItem: function(itemId) {
			var oldItemId = this._activeItem;
			if (itemId === this._activeItem) {
				return;
			}

			this.$el.find('li').removeClass('active');
			this._activeItem = itemId;
			this.$el.find('li[data-id=' + itemId + ']').addClass('active');
			this.trigger('sectionChanged', { section: itemId, previousSection: oldItemId});
		},

		/**
		 * Event handler for when clicking on an item.
		 */
		_onClickItem: function(ev) {
			var $target = $(ev.currentTarget);
			this.setActiveItem($target.attr('data-id'));
			return false;
		},

		/**
		 * Event handler for when clicking on the "new" function
		 */
		_onClickNew: function(ev) {
			var $target = this.$breadcrumb.find('#new ul');
			if ($target.hasClass('active')) {
				$target.removeClass('active');
			} else {
				$target.addClass('active');
			}
		},

		/**
		 * Event handler for when clicking on an entry inside the"new" menu
		 */
		_onClickNewEntry: function(ev) {
			var $target = $(ev.currentTarget), $p = $target.find('p'), label = $p.text();
			var val = $target.data('new-value'), type = $target.data('type');

			var $input = $('<input type="text" value="' + val + '" name="new-' + type + '" />');
			$p.empty().append($input);

			$input.focus();
			$input.on('blur', _.bind(function(ev) {
				var value = $input.val();
				$p.empty().text(label);
				if (value !== label) {
					switch (type) {
						case 'folder':
							this.trigger('createSection', { name: value });
							break;
						case 'container':
							this.trigger('createContent', { name: value });
							break;
					}
				}
				this._onClickNew();
			}, this));
		},
 
		last: null
	};

	OCA.SecureContainer.Navigation = Navigation;
})(jQuery, OC);