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
 * pw_ssr (Set Pipewire metadata - Sample Rate and Buffer Size)
 * by Alanpasi - 28/09/2023
 * Improved version by Claude 3.7 Sonnet Thinking
 */

import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// PipeWire service class to handle all PipeWire operations
class PipewireService {
  constructor() {
    this._currentSampleRate = null;
    this._currentBufferSize = null;
    this._updateCurrentSettings();
  }

  // Get current PipeWire settings
  _updateCurrentSettings() {
    try {
      const [success, stdout] = this._runCommand(
        "pw-metadata -n settings 0 clock.force-rate",
      );
      if (success) {
        const output = new TextDecoder().decode(stdout).trim();
        const match = output.match(/"(\d+)"/);
        if (match && match[1]) {
          this._currentSampleRate = parseInt(match[1], 10);
        }
      }

      const [successBS, stdoutBS] = this._runCommand(
        "pw-metadata -n settings 0 clock.force-quantum",
      );
      if (successBS) {
        const output = new TextDecoder().decode(stdoutBS).trim();
        const match = output.match(/"(\d+)"/);
        if (match && match[1]) {
          this._currentBufferSize = parseInt(match[1], 10);
        }
      }
    } catch (e) {
      console.error(`Error getting PipeWire settings: ${e.message}`);
    }

    // Use default values if couldn't get current settings
    if (!this._currentSampleRate) this._currentSampleRate = 48000;
    if (!this._currentBufferSize) this._currentBufferSize = 1024;

    return {
      sampleRate: this._currentSampleRate,
      bufferSize: this._currentBufferSize,
    };
  }

  // Run command safely and return result
  _runCommand(command) {
    try {
      return GLib.spawn_command_line_sync(command);
    } catch (e) {
      console.error(`Error running command "${command}": ${e.message}`);
      return [false, null];
    }
  }

  // Check if PipeWire is running
  isPipewireRunning() {
    try {
      const [success, stdout] = this._runCommand(
        "systemctl --user is-active pipewire",
      );
      if (success) {
        const output = new TextDecoder().decode(stdout).trim();
        return output === "active";
      }
      return false;
    } catch (e) {
      console.error(`Error checking PipeWire status: ${e.message}`);
      return false;
    }
  }

  // Set sample rate
  setSampleRate(rate) {
    const [success] = this._runCommand(
      `pw-metadata -n settings 0 clock.force-rate ${rate}`,
    );
    if (success) {
      this._currentSampleRate = rate;
      return true;
    }
    return false;
  }

  // Set buffer size
  setBufferSize(size) {
    const [success] = this._runCommand(
      `pw-metadata -n settings 0 clock.force-quantum ${size}`,
    );
    if (success) {
      this._currentBufferSize = size;
      return true;
    }
    return false;
  }

  // Restart PipeWire service
  restartService() {
    return this._runCommand(
      "systemctl --user restart wireplumber pipewire pipewire-pulse",
    )[0];
  }

  // Get current settings
  getCurrentSettings() {
    this._updateCurrentSettings();
    return {
      sampleRate: this._currentSampleRate,
      bufferSize: this._currentBufferSize,
    };
  }
}

// Indicator class for the panel
const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extension) {
      super._init(0.0, _("Pipewire Sample Rate and Buffer Size"));

      this._extension = extension;
      this._pipewireService = new PipewireService();

      // Settings
      this._settings = extension.getSettings();

      // Sample rates and buffer sizes options
      this._sampleRates = [44100, 48000, 88000, 96000];
      this._bufferSizes = [128, 256, 512, 1024, 2048, 4096];

      // Menu items references
      this._srMenuItems = {};
      this._bsMenuItems = {};

      this._buildUI();
      this._setupInitialState();
      this._bindEvents();
    }

    _buildUI() {
      // Icon
      this._icon = new St.Icon({ style_class: "pw_icon" });
      this._icon.gicon = Gio.icon_new_for_string(
        `${this._extension.path}/pw_icon.png`,
      );
      this.add_child(this._icon);

      // Sample Rate section
      let pmLabelSR = new PopupMenu.PopupMenuItem(_("Sample Rate"), {
        style_class: "preset-submenu-label",
      });
      pmLabelSR.sensitive = false;
      this.menu.addMenuItem(pmLabelSR);

      // Sample Rate options
      this._sampleRates.forEach((rate) => {
        const menuItem = new PopupMenu.PopupMenuItem(`${rate} Hz`, {
          style_class: "preset-submenu-item",
        });
        this._srMenuItems[rate] = menuItem;
        this.menu.addMenuItem(menuItem);
      });

      // Separator
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Buffer Size section
      let pmLabelBS = new PopupMenu.PopupMenuItem(_("Buffer Size"), {
        style_class: "preset-submenu-label",
      });
      pmLabelBS.sensitive = false;
      this.menu.addMenuItem(pmLabelBS);

      // Buffer Size options
      this._bufferSizes.forEach((size) => {
        const menuItem = new PopupMenu.PopupMenuItem(`${size}`, {
          style_class: "preset-submenu-item",
        });
        this._bsMenuItems[size] = menuItem;
        this.menu.addMenuItem(menuItem);
      });

      // Separator
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Restart Pipewire Service
      this._restartMenuItem = new PopupMenu.PopupMenuItem(
        _("Restart Pipewire Service"),
        {
          style_class: "preset-submenu-restartpw",
        },
      );
      this.menu.addMenuItem(this._restartMenuItem);

      // Status item (optional for showing current values)
      this._statusMenuItem = new PopupMenu.PopupMenuItem("", {
        style_class: "preset-submenu-status",
      });
      this._statusMenuItem.sensitive = false;
      this.menu.addMenuItem(this._statusMenuItem);
    }

    _setupInitialState() {
      // Get current settings
      const { sampleRate, bufferSize } =
        this._pipewireService.getCurrentSettings();

      // Update the UI to match current settings
      this._updateSampleRateUI(sampleRate);
      this._updateBufferSizeUI(bufferSize);
      this._updateStatusText();
    }

    _bindEvents() {
      // Sample Rate events
      Object.entries(this._srMenuItems).forEach(([rate, menuItem]) => {
        menuItem.connect("activate", () => {
          const rateValue = parseInt(rate, 10);
          if (this._pipewireService.setSampleRate(rateValue)) {
            this._updateSampleRateUI(rateValue);
            this._updateStatusText();
            Main.notify(_(`Sample Rate set to ${rateValue} Hz`));
          } else {
            Main.notify(_("Failed to set Sample Rate"));
          }
        });
      });

      // Buffer Size events
      Object.entries(this._bsMenuItems).forEach(([size, menuItem]) => {
        menuItem.connect("activate", () => {
          const sizeValue = parseInt(size, 10);
          if (this._pipewireService.setBufferSize(sizeValue)) {
            this._updateBufferSizeUI(sizeValue);
            this._updateStatusText();
            Main.notify(_(`Buffer Size set to ${sizeValue}`));
          } else {
            Main.notify(_("Failed to set Buffer Size"));
          }
        });
      });

      // Restart service event
      this._restartMenuItem.connect("activate", () => {
        if (this._pipewireService.restartService()) {
          // Refresh UI after restart
          GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this._setupInitialState();
            return GLib.SOURCE_REMOVE;
          });
          Main.notify(_("Pipewire Service was restarted."));
        } else {
          Main.notify(_("Failed to restart Pipewire Service"));
        }
      });

      // Refresh settings when menu opens
      this.menu.connect("open-state-changed", (menu, open) => {
        if (open) {
          this._setupInitialState();
        }
      });
    }

    _updateSampleRateUI(rate) {
      // Clear all check marks
      Object.values(this._srMenuItems).forEach((item) => {
        item.setOrnament(PopupMenu.Ornament.NONE);
      });

      // Set check mark on the selected rate
      if (this._srMenuItems[rate]) {
        this._srMenuItems[rate].setOrnament(PopupMenu.Ornament.CHECK);
      }
    }

    _updateBufferSizeUI(size) {
      // Clear all check marks
      Object.values(this._bsMenuItems).forEach((item) => {
        item.setOrnament(PopupMenu.Ornament.NONE);
      });

      // Set check mark on the selected size
      if (this._bsMenuItems[size]) {
        this._bsMenuItems[size].setOrnament(PopupMenu.Ornament.CHECK);
      }
    }

    _updateStatusText() {
      const { sampleRate, bufferSize } =
        this._pipewireService.getCurrentSettings();
      this._statusMenuItem.label.text = _(
        `Current: ${sampleRate} Hz, Buffer: ${bufferSize}`,
      );
    }
  },
);

// Main extension class
export default class PipewireSsrExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
  }

  enable() {
    this._indicator = new Indicator(this);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }

  getSettings() {
    // Simple settings implementation
    // For a full implementation, you would use GSettings schema
    return {
      get: (key) => {
        // Default implementation without persistence
        return null;
      },
      set: (key, value) => {
        // Default implementation without persistence
        return;
      },
    };
  }
}
