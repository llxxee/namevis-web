import { el, setChildren } from "redom";

export class StartForm {
  constructor() {
    <form this="el" class="pure-form pure-form-aligned">
      <fieldset>
        <div class="pure-control-group">
          <label htmlFor="start_device">Device</label>
          <select this="$device" id="start_device">
            <option value="">loading</option>
          </select>
          <button this="$capture" type="submit" class="pure-button pure-button-primary">Capture</button>
        </div>
        <div class="pure-control-group">
          <label htmlFor="start_file">File</label>
          <select this="$file" id="start_file">
            <option value="">loading</option>
          </select>
          <button this="$read" type="submit" class="pure-button">Read</button>
        </div>
        <div class="pure-control-group">
          <label htmlFor="start_prefixlen">Prefix length</label>
          <input this="$prefixlen" id="start_prefixlen" type="number" min="0" value="0"/>
          <span class="pure-form-message-inline">Prefix components collapsed in name hierarchy.</span>
        </div>
        <div class="pure-control-group">
          <label htmlFor="start_suffixlen">Suffix length</label>
          <input this="$suffixlen" id="start_suffixlen" type="number" min="0" value="0"/>
          <span class="pure-form-message-inline">Suffix components stripped in name hierarchy.</span>
        </div>
      </fieldset>
    </form>;

    this.el.addEventListener("submit", (evt) => {
      evt.preventDefault();
      if (!this.selected) {
        return;
      }
      this.callback?.({
        prefixlen: Number.parseInt(this.$prefixlen.value, 10),
        suffixlen: Number.parseInt(this.$suffixlen.value, 10),
        ...this.selected,
      });
      this.selected = undefined;
    });
    this.$capture.addEventListener("click", () => {
      if (this.$device.value === "") {
        return;
      }
      this.selected = {
        device: this.$device.value,
      };
    });
    this.$read.addEventListener("click", () => {
      if (this.$file.value === "") {
        return;
      }
      this.selected = {
        file: this.$file.value,
      };
    });
  }

  update({ devices, files, callback }) {
    setChildren(this.$device, devices?.map((
        { name, addresses }) => (<option value={name}>{`${name} (${addresses ? addresses.join(" ") : "no IP address"})`}</option>),
    ));
    setChildren(this.$file, files?.map((
        filename) => (<option value={filename}>{filename}</option>),
    ));
    this.callback = callback;
  }
}
