import { get as hashGet } from "hashquery";
import { el } from "redom";

export class ConnectForm {
  constructor() {
    <form this="el" class="pure-form">
    <h2>Server Endpoint</h2>
      <fieldset>
        <input this="$server" type="text" id="t_server" class="pure-input-1-2" value={hashGet("server") ?? "http://127.0.0.1:6847"}/>
        <button type="submit" class="pure-button pure-button-primary">Connect</button>
      </fieldset>
    </form>;

    this.el.addEventListener("submit", (evt) => {
      evt.preventDefault();
      this.callback?.(this.$server.value);
    });
  }

  update({ callback }) {
    this.callback = callback;
  }
}
