<?php
/**
 * ownCloud - Secure Container
 *
 * @author Lukas Zurschmiede
 * @copyright 2014 Lukas Zurschmiede <l.zurschmiede@ranta.ch>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Public interface of ownCloud for apps to use.
 * secure_container\Http\ScriptResponse class
 */

namespace OCA\secure_container\Http;

use \OCP\AppFramework\Http;
use \OCP\AppFramework\Http\Response;

/**
 * A generic ScriptResponse class that is used to return javascript responses.
 */
class ScriptResponse extends Response {
	
	/**
	 * Response data
	 * @var string
	 */
	protected $data = '';
	
	/**
	 * Class constructor
	 * 
	 * @param string $data The script content to render
	 */
	public function __construct($data) {
		$this->data = $data;
		$this->addHeader('Content-Type', 'application/javascript');
		$this->setStatus(Http::STATUS_OK);
	}
	
	/**
	 * Renders the script out as plain text.
	 * 
	 * @return string
	 */
	public function render() {
		return $this->data;
	}
}
