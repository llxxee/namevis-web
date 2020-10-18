import { el, setChildren } from "redom";

export class CaptureForm {
  constructor() {
    <form this="el" class="pure-form pure-form-aligned">
      <fieldset>
        <div class="pure-control-group">
          <label htmlFor="capture_device">Device</label>
          <select this="$device" id="capture_device">
            <option value="">loading</option>
          </select>
        </div>
        <div class="pure-control-group">
          <label htmlFor="capture_prefixlen">Collapse prefix length</label>
          <input this="$prefixlen" id="capture_prefixlen" type="number" min="0" value="4"/>
        </div>
        <div class="pure-control-group">
          <label htmlFor="capture_suffixlen">Strip prefix length</label>
          <input this="$suffixlen" id="capture_suffixlen" type="number" min="0" value="2"/>
        </div>
        <div class="pure-controls">
          <button type="submit" class="pure-button pure-button-primary">Start</button>
        </div>
      </fieldset>
    </form>;

    this.el.addEventListener("submit", (evt) => {
      evt.preventDefault();
      if (this.$device.value === "") {
        return;
      }
      this.callback?.({
        device: this.$device.value,
        prefixlen: Number.parseInt(this.$prefixlen.value, 10),
        suffixlen: Number.parseInt(this.$suffixlen.value, 10),
      });
    });
  }

  update({ devices, callback }) {
    setChildren(this.$device, devices.map((
        { name, addresses }) => (<option value={name}>{`${name} (${addresses ? addresses.join(" ") : "no IP address"})`}</option>),
    ));
    this.callback = callback;
  }
}
