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
 * Utility class for secure_container related operations
 */
(function ($, OC) {
	'use strict'
	
	if (!OCA.SecureContainer) {
		OCA.SecureContainer = {};
	}

	var App = {
		navigation: null,
		contents: null,
 
		initialize: function() {
			this.navigation = new OCA.SecureContainer.Navigation($('#app-navigation'), $('#controls'));
			this.contents = new OCA.SecureContainer.Container($('#contents'));
			this._setupEvents();
		},

		/**
		 * Connects all events
		 */
		_setupEvents: function() {
			// Main events for create, update, delete and change
			this.navigation.on('createSection', _.bind(this._createSection, this));
			this.navigation.on('changeSection', _.bind(this._changeSection, this));
			this.navigation.on('deleteSection', _.bind(this._deleteSection, this));
			this.navigation.on('createContent', _.bind(this._createContent, this));
			this.contents.on('saveContent', _.bind(this._saveContent, this));
			
			// Change and delete section
			this.contents.on('deleteContent', _.bind(this._deleteContent, this));
			this.navigation.on('sectionDeleted', _.bind(function() {
				this.contents.trigger('clear');
			}, this));
			this.navigation.on('sectionChanged', _.bind(function(ev) {
				this._sectionChanged(ev);
				this.contents.trigger('sectionChanged', ev.eventData);
			}, this));
			
			// Drag'n'Drop events of entries onto a path in the navigation
			this.contents.on('dragAndDrop', _.bind(function(ev) {
				this.navigation.trigger('dragAndDropEntry', ev.eventData);
			}, this));
			this.contents.on('dragAndDropEnd', _.bind(function(ev) {
				this.navigation.trigger('dropEntry', ev.eventData);
			}, this));
			this.contents.on('cancelDragAndDrop', _.bind(function(ev) {
				this.navigation.trigger('cancelDragAndDrop', ev.eventData);
			}, this));
			this.contents.on('moveContent', _.bind(this._moveContent, this));
			this.navigation.on('moveContent', _.bind(this._moveContent, this));
			
			// Passphrase- and Passphrasedialog-Events
			this.navigation.on('openPassphraseDialog', _.bind(function() {
				this.contents.trigger('openPassphraseDialog', null);
			}, this));
			this.navigation.on('clearPassphrase', _.bind(function() {
				this.contents.trigger('clearPassphrase', null);
			}, this));
			this.contents.on('passphraseSet', _.bind(function() {
				this.navigation.trigger('passphraseSet', null);
			}, this));
			this.contents.on('passphraseUnset', _.bind(function() {
				this.navigation.trigger('passphraseUnset', null);
			}, this));
		},

		/**
		 * Event handler for create a new Section aka Path
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_createSection: function(ev) {
			ev.eventData.section = 'new';
			this._changeSection(ev);
		},

		/**
		 * Event handler for change (and create) a new Section aka Path
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_changeSection: function(ev) {
			var data = ev.eventData;
			var url = OC.generateUrl('/apps/secure_container/create/' + data.section);
			var data = ev.eventData;
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},
 
		/**
		 * Event handler for delete an Entry
		 * 
		 * @param Object ev The event object which was triggered
		 */
		_deleteSection: function(ev) {
			var data = ev.eventData;
			var url = OC.generateUrl('/apps/secure_container/delete_section/' + data.section);
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},

		/**
		 * Event handler if a section is changed: Load all entries
		 * 
		 * @param Event ev event object which was triggered
		 */
		_sectionChanged: function(ev) {
			var section = ev.eventData.section;
			var url = OC.generateUrl('/apps/secure_container/list/' + section);
			$.ajax(url, {
				type: 'GET',
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},

		/**
		 * Event handler for create a new Entry
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_createContent: function(ev) {
			ev.id = 'new';
			this._saveContent(ev);
		},

		/**
		 * Event handler for save an Entry
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_saveContent: function(ev) {
			var data = ev.eventData;
			var url = OC.generateUrl('/apps/secure_container/save/' + data.id);
			data.section = this.navigation.getActiveItem();
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},

		/**
		 * Event handler for delete an Entry
		 * 
		 * @param Object ev The event object which was triggered
		 */
		_deleteContent: function(ev) {
			var data = ev.eventData;
			var url = OC.generateUrl('/apps/secure_container/delete/' + data.id);
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},
 
		/**
		 * Event handler for delete an Entry
		 * 
		 * @param Object ev The event object which was triggered
		 */
		_moveContent: function(ev) {
			var data = ev.eventData;
			var url = OC.generateUrl('/apps/secure_container/move/' + data.id + '/' + data.path);
			$.ajax(url, {
				type: 'GET',
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},

		/**
		 * Parse all responses from an AJAX request and runs the defined commands
		 * 
		 * These commands are in most cases events which where called on the
		 * navigation and content objects.
		 * 
		 * @param Object|string response The JSON Response or a string for some reason
		 */
		_parseResponse: function(response) {
			if ((response !== null) && (typeof(response) === 'object')) {
				if (response.navigation) {
					$.each(response.navigation, _.bind(function(key, value) {
						if (value.event && value.data) {
							this.navigation.trigger(value.event, value.data);
						}
					}, this));
				}
				
				if (response.content) {
					$.each(response.content, _.bind(function(key, value) {
						if (value.event && value.data) {
							this.contents.trigger(value.event, value.data);
						}
					}, this));
				}
			} else {
				console.warn('The response was not of type "Object/JSON". Ther was occurred and error on your server or an invalid action was called.');
			}
		},

		_last: null
	};
	OCA.SecureContainer.App = App;
	
	$(document).ready(function() {
		// wait for other apps/extensions to register their event handlers and file actions
		// in the "ready" clause
		_.defer(function() {
			OCA.SecureContainer.App.initialize();
		});
	});

})(jQuery, OC);
