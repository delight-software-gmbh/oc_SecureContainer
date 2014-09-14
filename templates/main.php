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

\OCP\Util::addScript('secure_container', '3rdparty/sjcl/sjcl');
\OCP\Util::addScript('secure_container', 'container');
\OCP\Util::addScript('secure_container', 'navigation');
\OCP\Util::addScript('secure_container', 'app');

\OCP\Util::addStyle('secure_container', 'style');
?>

<div id="app-navigation">
	Files categories
</div>

<main id="app-content">
	<div id="controls">
		<nav class="breadcrumb">
			<div class="crumb svg last" data-dir="/">
				<a href="">
					<img class="svg" src="<?php print(\OCP\Util::imagePath('core', 'places/home.svg')); ?>">
				</a>
			</div>
		</nav>
		
		<section class="actions creatable">
			<div id="new" class="button">
				<a>Neu</a>
				<ul>
					<li class="icon-filetype-folder svg" data-new-value="<?php p($l->t('New Folder')); ?>" data-type="folder">
						<p><?php p($l->t('New Folder')); ?></p>
					</li>
					<li class="icon-filetype-text svg" data-new-value="<?php p($l->t('New Crypto-Entry')); ?>" data-type="container">
						<p><?php p($l->t('New Crypto-Entry')); ?></p>
					</li>
				</ul>
			</div>
		</div>
	</section>
	<main id="contents">
	</main>
</main>