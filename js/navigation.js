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
		 * This is TRUE if a Drag'n'Drop event is active
		 */
		_dragDropActive: false,

		/**
		 * The Path-ID where the element may be dropped on
		 */
		_dragDropElementId: null,

		/**
		 * The main navigation container
		 */
		$el: null,

		/**
		 * The Breadcrumb container with the create dropdown-
		 */
		$breadcrumb: null,

		/**
		 * Initializes the navigation from the given container
		 * @param $el element containing the navigation
		 */
		initialize: function($el, $bc) {
			this.$el = $el;
			this.$breadcrumb = $bc;
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
			data = data || {};
			this.$el.trigger(new $.Event(eventName, { eventData: data }));
		},

		/**
		 * Setup UI events
		 */
		_setupEvents: function() {
			// Folder structure manipulation
			this.on('update', _.bind(this._replaceSection, this));
			this.on('insert', _.bind(this._insertSection, this));
			this.on('delete', _.bind(this._deleteSection, this));
			
			// Change the path by clicking on a section or by an external event.
			this.$el.on('click', 'li', _.bind(this._onClickItem, this));
			this.on('sectionChange', _.bind(function(ev) {
				this.setActiveItem(ev.itemId);
				this.trigger('');
			}, this));
			this.on('sectionChanged', _.bind(this._onSectionChanged, this));
			
			// Section functions
			this.$el.on('click', 'li nav.path-menu a', _.bind(this._onClickMenuItem, this));
			
			// Breadcrumb menu for create new things
			this.$breadcrumb.on('click', '#new a', _.bind(this._onClickNew, this));
			this.$breadcrumb.on('click', '#new ul li', _.bind(this._onClickNewEntry, this));
			
			// Connect home breadcrumb entry to change the path as well
			this.$breadcrumb.on('click', '.breadcrumb .crumb.home a', _.bind(function(ev) {
				var $target = $(ev.currentTarget).parent();
				this.setActiveItem($target.data('dir'));
				return false;
			}, this));
			
			// Passphrase dialog
			this.$breadcrumb.on('click', '.icon-toggle', _.bind(function(ev) {
				var $target = $(ev.currentTarget);
				if ($target.hasClass('active')) {
					this.trigger('clearPassphrase');
				}
				else {
					this.trigger('openPassphraseDialog');
				}
			}, this));
			
			// Set/Unset the passphrase
			this.on('passphraseSet', _.bind(function() {
				$('.icon-toggle', this.$breadcrumb).addClass('active');
			}, this));
			this.on('passphraseUnset', _.bind(function() {
				$('.icon-toggle', this.$breadcrumb).removeClass('active');
			}, this));
			
			// Drag'n'Drop entries
			this.on('cancelDragAndDrop', _.bind(function() {
				this._dragDropActive = false;
				this._dragDropElementId = null;
			}, this));
			this.on('dropEntry', _.bind(function(ev) {
				this._dragDropActive = false;
				this._dragDropElementId = ev.eventData;
			}, this));
			this.on('dragAndDropEntry', _.bind(function(ev) {
				this._dragDropActive = true;
			}, this));
			this.$el.on('mouseenter', 'li .path-label', _.bind(function(ev) {
				if (this._dragDropElementId !== null) {
					var pathId = $(ev.currentTarget).parent().data('id');
					this.trigger('moveContent', { id: this._dragDropElementId, path: pathId });
					this._dragDropElementId = null;
				}
			}, this));
		},

		/**
		 * Returns the currently active section id or an empty string
		 * 
		 * @return item ID
		 */
		getActiveItem: function() {
			return this._activeItem || '-1';
		},

		/**
		 * Switch the currently selected path, mark it as selected and fire up
		 * the sectionChanged event which can be used to update the container.
		 *
		 * @param string itemId ID of the selected section
		 */
		setActiveItem: function(itemId) {
			var oldItemId = this._activeItem;
			this._activeItem = itemId;
			
			// Change the active label
			this.$el.find('.path-label.active').removeClass('active');
			this.$el.find('#path-entry-' + itemId + ' > .path-label').addClass('active');
			
			// Add the active class to the child-list and all parents expect the top container
			var $childs = this.$el.find('#path-entry-' + itemId + ' > ul');
			$childs.parents('ul.path-childs').addClass('active');
			this.$el.find('.level-0.path-childs').removeClass('active');
			
			// Add or remove the avtive class on the element itself to show/hode the children
			if (oldItemId !== this._activeItem) {
				this.trigger('sectionChanged', { section: itemId, previousSection: oldItemId});
				$childs.addClass('active');
			}
			else {
				$childs.toggleClass('active');
			}
		},

		/**
		 * Event handler for when clicking on an item.
		 * 
		 * @param Object ev
		 */
		_onClickItem: function(ev) {
			var $target = $(ev.currentTarget);
			this.setActiveItem($target.data('id'));
			return false;
		},

		/**
		 * Event handler for when a section is changed to update the breadcrumb
		 * 
		 * @param Object ev
		 */
		_onSectionChanged:function(ev) {
			var $selected = this.$el.find('#path-entry-' + ev.eventData.section), $parents = $selected.parents('.icon-filetype-folder');
			var $bc = $('.breadcrumb', this.$breadcrumb)
			$('.last', $bc).removeClass('last');
			$('.child', $bc).remove();
			
			// Create the new breadcrumb
			$parents.each(function(idx, parent) {
				var $parent = $(parent);
				$bc.append($('<div class="crumb child" data-dir="' + $parent.data('id') + '"><a>' + $('> .path-label .path-label-name', $parent).text() + '</a></div>'));
			});
			if ($selected.length > 0) {
				$bc.append($('<div class="crumb child last" data-dir="' + $selected.data('id') + '"><a>' + $('> .path-label .path-label-name', $selected).text() + '</a></div>'));
			}
			else {
				$('.crumb.home', $bc).addClass('last');
			}
			
			// Connect all breadcrumb entries to change the path as well
			$bc.on('click', '.crumb.child a', _.bind(function(ev) {
				var $target = $(ev.currentTarget).parent();
				this.setActiveItem($target.data('dir'));
				return false;
			}, this));
		},

		/**
		 * Event handler for when clicking on the "new" function to show/hide the popup-menu
		 * 
		 * @param Object ev
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
		 * 
		 * @param Object ev
		 */
		_onClickNewEntry: function(ev) {
			var $target = $(ev.currentTarget), $p = $target.find('p'), label = $p.text();
			var val = $target.data('new-value'), type = $target.data('type');

			var $input = $('<input type="text" value="' + val + '" name="new-' + type + '" />');
			$p.empty().append($input);

			$input.focus().select();
			$input.on('blur keydown', _.bind(function(ev) {
				// Only grab ENTER
				if ((ev.type == 'keydown') && (ev.which !== 13)) {
					return true;
				}

				// Save the value
				var value = $input.val();
				$p.empty().text(label);
				if (value !== label) {
					switch (type) {
						case 'folder':
							this.trigger('createSection', { parentId: this.getActiveItem(), name: value });
							break;
						case 'container':
							this.trigger('createContent', { section: this.getActiveItem(), name: value });
							break;
					}
				}

				// Hides the "popup" menu again
				this._onClickNew();
			}, this));
		},
 
		/**
		 * Insert the section given in the event data
		 * 
		 * @param Object ev The triggered Event
		 */
		_insertSection: function(ev) {
			$.each(ev.eventData, _.bind(function(k, entry) {
				var $child, $parent = $('#path-entry-' + entry.parent), $childs = $('#path-childs-' + entry.parent);
				if (entry.parent == 0) {
						$parent = $('#app-navigation');
				}
				if ($parent.length > 0) {
					// Attach the childs container if not already existing
					if ($childs.length == 0) {
						$childs = $('<ul id="path-childs-' + entry.parent + '" class="level-' + $parent.parents('ul.path-childs').length + ' path-childs"></ul>');
						$parent.append($childs);
					}
					
					// Insert the new child
					$child = $('<li id="path-entry-' + entry.id + '" class="icon-filetype-folder svg"><span class="path-label"><span class="path-label-name">' + entry.name + '</span></span></li>');
					$child.data('id', entry.id);
					$child.find('.path-label').append('<nav class="path-menu" data-id="' + entry.id + '"><a href="#" class="path-edit icon-settings svg" data-action="edit">' + t('secure_container', 'Edit') + '</a><a href="#" class="path-delete icon-delete svg" data-action="delete">' + t('secure_container', 'Delete') + '</a></nav>');
					$child.append('<ul id="path-childs-' + entry.id + '" class="level-' + ($parent.parents('ul.path-childs').length + 1) + ' path-childs"></ul>');
					
					$child.on('click', _.bind(this._onClickItem, this));
					$child.on('click', 'nav.path-menu a', _.bind(this._onClickMenuItem, this));
					
					$childs.append($child);
				}
			}, this));
		},
 
		/**
		 * Replaces the section given in the event data with new data
		 * 
		 * @param Object ev The triggered Event
		 */
		_replaceSection: function(ev) {
			$.each(ev.eventData, _.bind(function(k, entry) {
				var $entry = $('#path-entry-' + entry.id + ' > .path-label .path-label-name');
				if ($entry.length > 0) {
					$entry.empty().text(entry.name);
				}
			}, this));
		},

		/**
		 * Removes the section from the path-tree
		 * 
		 * @param Object ev The triggered Event
		 */
		_deleteSection: function(ev) {
			$.each(ev.eventData, _.bind(function(k, id) {
				$('#path-entry-' + id).remove();
				if (id == this._activeItem) {
					this.trigger('sectionDeleted');
					this._activeItem = null;
				}
			}, this));
		},

		/**
		 * Event handler for when clicking on a function on the Path-Functions
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickMenuItem: function(ev) {
			var $target = $(ev.currentTarget), id = $target.parent().data('id');
			ev.stopImmediatePropagation();
			
			switch ($target.data('action')) {
				case 'edit':
					this._showPathEdit(id);
					break;
				case 'delete':
					this._deletePath(id);
					break;
			}
			
			return false;
		},

		/**
		 * Shows an edit field for the given section and changes the value after
		 * 
		 * @param int id The Path-ID to show the change field for
		 */
		_showPathEdit: function(id) {
			var $edit, $cont = $('#path-entry-' + id + ' > .path-label .path-label-name');
			if ($cont.length > 0) {
				$edit = $('<input type="text" value="' + $cont.text() + '" class="path-label-name" data-original="' + $cont.text() + '" />');
				$edit.on('click', function(ev) { ev.stopImmediatePropagation(); });
				$edit.on('blur keydown', _.bind(function(ev) {
					// Only grab ENTER and ESC
					if (ev.type == 'keydown') {
						// If the user pressed ESC, cancel the edit process.
						if (ev.which === 27) {
							$edit.replaceWith('<span class="path-label-name">' + $edit.data('original') + '</span>');
							return false;
						}
						
						// Return on all except ENTER to let the suer write something :)
						if (ev.which !== 13) {
							return true;
						}
					}
					
					// Save the value
					var value = $edit.val();
					$edit.replaceWith('<span class="path-label-name">' + value + '</span>');
					this.trigger('changeSection', { section: id, name: value });
				}, this));
				
				$cont.replaceWith($edit);
				$edit.focus().select();
			}
		},

		/**
		 * Shows a confirm dialog and asks what to do with the entries
		 * 
		 * @param int id The Path-ID to delete
		 */
		_deletePath: function(id) {
			var $cont = $('#path-entry-' + id + ' > .path-label .path-label-name');
			
			var $dialog = OC.dialogs.confirm(t('secure_container', 'Do you really want to remove this section and all it\'s children?'), t('secure_container', 'Delete'), _.bind(function(ok, value) {
				if (ok) {
					var $dialog2 = OC.dialogs.confirm(t('secure_container', 'Shall the entries be moved to trash instead? If not, the data are lost forever.'), t('secure_container', 'Delete'), _.bind(function(ok, value) {
						this.trigger('deleteSection', { section: id, moveToTrash: ok });
					}, this), true);
				}
			}, this), true);
		},

		last: null
	};

	OCA.SecureContainer.Navigation = Navigation;
})(jQuery, OC);
