/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * 
 * pw_set_sample_rate
 * by Alanpasi - 28/09/2023
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Pipewire Extension'));
            this.add_child(new St.Icon({
                gicon: Gio.icon_new_for_string('/home/alanpasi/.local/share/gnome-shell/extensions/pw_ssr@alanpasi.com/pw_icon.png'),
            }));

            // Define Label Item Menu 'Sample Rate'
            let pmLabelSR = new PopupMenu.PopupMenuItem('Sample Rate', {
                style_class: 'preset-submenu-item',
            });
            pmLabelSR.sensitive = false;
            this.menu.addMenuItem(pmLabelSR);

            // Define itens do menu Sample Rate
            let pmSR44 = new PopupMenu.PopupMenuItem('44100 Hz');
            this.menu.addMenuItem(pmSR44);
            let pmSR48 = new PopupMenu.PopupMenuItem('48000 Hz');
            this.menu.addMenuItem(pmSR48);
            let pmSR88 = new PopupMenu.PopupMenuItem('88000 Hz');
            this.menu.addMenuItem(pmSR88);
            let pmSR96 = new PopupMenu.PopupMenuItem('96000 Hz');
            this.menu.addMenuItem(pmSR96);

            // Initial Sample Rate value
            setSrOrnamentNone();
            pmSR96.setOrnament(PopupMenu.Ornament.CHECK);
            GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-rate 96000');

            // Separator
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Define Label Item Menu 'Buffer Size'
            let pmLabelBS = new PopupMenu.PopupMenuItem('Buffer Size', {
                style_class: 'preset-submenu-item',
            });
            pmLabelBS.sensitive = false;
            this.menu.addMenuItem(pmLabelBS);


            // Define itens do menu Buffer Size
            let pmBS128 = new PopupMenu.PopupMenuItem('128');
            this.menu.addMenuItem(pmBS128);
            let pmBS256 = new PopupMenu.PopupMenuItem('256');
            this.menu.addMenuItem(pmBS256);
            let pmBS512 = new PopupMenu.PopupMenuItem('512');
            this.menu.addMenuItem(pmBS512);
            let pmBS1024 = new PopupMenu.PopupMenuItem('1024');
            this.menu.addMenuItem(pmBS1024);
            let pmBS2048 = new PopupMenu.PopupMenuItem('2048');
            this.menu.addMenuItem(pmBS2048);
            let pmBS4096 = new PopupMenu.PopupMenuItem('4096');
            this.menu.addMenuItem(pmBS4096);

            // Initial Buffer Size value
            setBsOrnamentNone();
            pmBS2048.setOrnament(PopupMenu.Ornament.CHECK);
            GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 2048');

            // Set values when clicked
            pmSR44.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-rate 44100');
                setSrOrnamentNone();
                pmSR44.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Sample Rate to 44100 Hz'));
            });
            pmSR48.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-rate 48000');
                setSrOrnamentNone();
                pmSR48.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Sample Rate to 48000 Hz'));
            });
            pmSR88.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-rate 88000');
                setSrOrnamentNone();
                pmSR88.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Sample Rate to 88000 Hz'));
            });
            pmSR96.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-rate 96000');
                setSrOrnamentNone();
                pmSR96.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Sample Rate to 96000 Hz'));
            });
            pmBS128.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 128');
                setBsOrnamentNone();
                pmBS128.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 128'));
            });
            pmBS256.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 256');
                setBsOrnamentNone();
                pmBS256.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 256'));
            });
            pmBS512.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 512');
                setBsOrnamentNone();
                pmBS512.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 512'));
            });
            pmBS1024.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 1024');
                setBsOrnamentNone();
                pmBS1024.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 1024'));
            });
            pmBS2048.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 2048');
                setBsOrnamentNone();
                pmBS2048.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 2048'));
            });
            pmBS4096.connect('activate', () => {
                GLib.spawn_command_line_sync('pw-metadata -n settings 0 clock.force-quantum 4096');
                setBsOrnamentNone();
                pmBS4096.setOrnament(PopupMenu.Ornament.CHECK);
                Main.notify(_('Setting Buffer Size to 4096'));
            });

            // Functions
            function setSrOrnamentNone() {
                pmSR44.setOrnament(PopupMenu.Ornament.NONE);
                pmSR48.setOrnament(PopupMenu.Ornament.NONE);
                pmSR88.setOrnament(PopupMenu.Ornament.NONE);
                pmSR96.setOrnament(PopupMenu.Ornament.NONE);
            }
            function setBsOrnamentNone() {
                pmBS128.setOrnament(PopupMenu.Ornament.NONE);
                pmBS256.setOrnament(PopupMenu.Ornament.NONE);
                pmBS512.setOrnament(PopupMenu.Ornament.NONE);
                pmBS1024.setOrnament(PopupMenu.Ornament.NONE);
                pmBS2048.setOrnament(PopupMenu.Ornament.NONE);
                pmBS4096.setOrnament(PopupMenu.Ornament.NONE);
            }
        }
    });

export default class IndicatorExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
