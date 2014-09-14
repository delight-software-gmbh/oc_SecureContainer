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

namespace OCA\secure_container\Controller;

use \OCP\IRequest;
use \OCP\IConfig;
use \OCP\AppFramework\Http;
use \OCP\AppFramework\Http\TemplateResponse;
use \OCP\AppFramework\Http\JSONResponse;
use \OCP\AppFramework\Http\XMLResponse;
use \OCP\AppFramework\Controller;

use OCA\secure_container\Db\PathMapper;
use OCA\secure_container\Db\ContentMapper;
use OCA\secure_container\Db\Path;
use OCA\secure_container\Db\Content;

class PageController extends Controller {
	private $userId;
	private $config;
	private $pathMapper;
	private $contentMapper;

	public function __construct($appName, IRequest $request, $userId, IConfig $config, PathMapper $pathMapper, ContentMapper $contentMapper){
		parent::__construct($appName, $request);
		
		$this->userId = $userId;
		$this->config = $config;
		$this->pathMapper = $pathMapper;
		$this->contentMapper = $contentMapper;
	}

	/**
	 * The main index page which shows the path tree on left and the encrypted
	 * containers in the content - above a breadcrumb like in the files section.
	 * 
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {
		$params = array('user' => $this->userId);
		
		// Sytstem wide values
		//$this->config->setSystemValue('foo', 'bar');
		//$this->config->getSystemValue('foo');
		
		// Application global values
		//$this->config->setAppValue($this->appName, 'foo', 'bar');
		//$this->config->getAppValue($this->appName, 'foo');
		
		// User valuesinside the application
		//$this->config->setSystemValue($this->userId, $this->appName, 'foo', 'bar');
		//$this->config->getSystemValue($this->userId, $this->appName, 'foo');
		
		// templates/main.php
		return new TemplateResponse($this->appName, 'main', $params);
	}

	/**
	 * Simple method which posts back all entries from inside a path.
	 * 
	 * @param string $path Path to return the main elements from
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function entries($path) {
		$response = array('foo' => 'bar');
		
		$this->registerResponder('xml', function($value) {
			return new XMLResponse($value);
		});
		
		return new JSONResponse($response);
	}
	
	/**
	 * Returns a single SecureContainer entry
	 * 
	 * @param string $guid The ID of the entry to get the details from.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function show($guid) {
		$response = (object) array('foo' => 'bar');
		
		return new JSONResponse($response);
	}
	
	/**
	 * Create and update a SecureContainer element
	 * 
	 * @param string $guid The ID of the entry to get the details from.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function save($guid) {
		$data = $this->request->post;
		try {
			$response = (object) array('foo' => 'bar');
			
			return new JSONResponse($response);
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'content', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}
	
	/**
	 * Simple method which posts back all sections aka paths.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function sections() {
		$response = array('foo' => 'bar');
		
		$this->registerResponder('xml', function($value) {
			return new XMLResponse($value);
		});
		
		return new JSONResponse($response);
	}
	
	/**
	 * Create and update a SecureContainer path
	 * 
	 * @param string $guid The ID of the path to upgrade - or null for a new one
	 * 
	 * @return JSONResponse
	 * 
	 * @NoAdminRequired
	 */
	public function section($guid) {
		try {
			// Check for a valid post data format
			$data = (object) $this->request->post;
			if (!is_object($data) || !isset($data->name)) {
				throw new \Exception('Invalid data posted for create a new pathin SecureContainer.');
			}
			
			// Create or Update the entity.
			if ($this->pathMapper->exists($guid)) {
				$entity = $this->pathMapper->find($guid);
				$entity->setName($data->name);
				$entity->setParent(intval($data->section));
				$entity = $this->pathMapper->update($entity);
			}
			else {
				$entity = new Path();
				$entity->setUid($this->userId);
				$entity->setName($data->name);
				$entity->setParent(intval($data->section));
				$entity = $this->pathMapper->insert($entity);
			}
			
			// Create the response
			$response = $this->getResponseSkeleton('section');
			$this->appendNavigationEvent('update', array(
				'guid' => $entity->getId(),
				'parent' => $entity->getParent(),
				'name' => $entity->getName(),
			), $response);
			
			return new JSONResponse($response);
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'section', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}
	
	/**
	 * Returns the base response Skeleton for any JSON or XML request.
	 * 
	 * @param string callee The called function/route
	 * 
	 * @return object
	 */
	private function getResponseSkeleton($callee) {
		return (object) array(
			'type' => 'response',
			'callee' => $callee,
		);
	}
	
	/**
	 * Appends a navigation event ot the response
	 * 
	 * @param string event The event to trigger
	 * @param object|array The event data to send
	 * @param object response Reference to the response object
	 */
	private function appendNavigationEvent($event, $data, &$response) {
		if (!isset($response->navigation) || !is_array($response->navigation)) {
			$response->navigation = array();
		}
		$response->navigation[] = (object) array(
			'event' => $event,
			'data' => (object) $data,
			);
	}
	
	/**
	 * Appends a content event ot the response
	 * 
	 * @param string event The event to trigger
	 * @param object|array The event data to send
	 * @param object response Reference to the response object
	 */
	private function appendContentEvent($event, $data, &$response) {
		if (!isset($response->content) || !is_array($response->content)) {
			$response->content = array();
		}
		$response->content[] = (object) array(
			'event' => $event,
			'data' => (object) $data,
			);
	}
	
	/**
	 * Creates a standard response with exception data
	 * 
	 * @param \Exception ex The exception to send back
	 * @param string callee The calle function/route
	 * @param int code HTTP Status code to return, default to Http::STATUS_INTERNAL_SERVER_ERROR
	 * 
	 * @return JSONResponse
	 */
	private function createResponseException(\Exception $ex, $callee, $code = Http::STATUS_INTERNAL_SERVER_ERROR) {
		$response = new JSONResponse((object) array(
			'type' => 'error',
			'callee'=> $callee,
			'exception' => get_class($ex),
			'message' => $ex->getMessage(),
		));
		$response->setStatus($code);
		return $response;
	}
}
