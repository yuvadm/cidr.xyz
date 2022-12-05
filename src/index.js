import './style.scss';

import { Netmask } from 'netmask';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class IPAddress extends Component {
  constructor(props) {
    super(props);
    this.state = {
      octets: [10, 88, 135, 144],
      cidr: 28
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    const params = new URLSearchParams(window.location.search);
    if (params.has("ip")) {
      this.parse(params.get("ip"));
    }
  }

  handleChange(event) {
    var octets = this.state.octets;
    var val = +event.target.value.replace(/[^0-9]/g, '');
    var octet = event.target.attributes['data-octet'].value;
    if (octet == 'cidr') {
      if (val <= 32) {
        this.setState({
          cidr: val
        });
      }
    } else {
      if (val <= 255) {
        octets[+octet] = val;
        this.setState({
          octets: octets
        });
      }
    }
  }

  handleKeyDown(event) {
    var lowerOctetValue = 0;
    var higherOctetValue = event.target.dataset.octet === 'cidr' ? 32 : 255;
    if (event.key === 'ArrowDown' && event.target.value > lowerOctetValue) {
      event.target.value = +event.target.value - 1;
      this.handleChange(event);
    }
    if (event.key === 'ArrowUp' && event.target.value < higherOctetValue) {
      event.target.value = +event.target.value + 1;
      this.handleChange(event);
    }
    if (event.key === '.') {
      event.preventDefault()
      var octet_input = event.target.parentNode.nextSibling.firstChild
      if (octet_input instanceof HTMLInputElement) {
        octet_input.select()
        octet_input.focus()
      }
    }
    if (event.key === '/') {
      event.preventDefault()
      var mask_input = event.target.parentNode.nextSibling
      if (mask_input instanceof HTMLInputElement) {
        mask_input.select()
        mask_input.focus()
      }
    }
  }

  handleWheel(event) {
    var lowerOctetValue = 0;
    var higherOctetValue = event.target.dataset.octet === 'cidr' ? 32 : 255;
    if (event.deltaY > 0 && event.target.value > lowerOctetValue) {
      event.target.value = +event.target.value - 1;
      this.handleChange(event);
    }
    if (event.deltaY < 0 && event.target.value < higherOctetValue) {
      event.target.value = +event.target.value + 1;
      this.handleChange(event);
    }
  }

  parse(string) {
    // Create a regular expression to match the IP range in the query string
    const regex = /(\d{1,3}\.){3}\d{1,3}\/\d{1,2}/;

    // Use the regex to search the query string for the IP range
    const matches = string.match(regex);

    // Split the IP range into its components (IP address and subnet mask)
    const [ip, subnet] = matches[0].split("/");

    this.state.octets = ip.split(".").map(octet => parseInt(octet, 10))
    this.state.cidr = parseInt(subnet, 10)
  }

  getPretty() {
    return this.state.octets.join('.') + '/' + this.state.cidr;
  }

  render() {
    var details = new Netmask(this.getPretty());

    return (
      <div className="ip-address">
        <div className="address">
          {[...Array(4)].map((x, octet) => (
            <span className="octet">
              <input
                className="octet"
                type="text"
                data-octet={octet}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                onWheel={this.handleWheel}
                value={this.state.octets[octet]}
              />
              <span className="dot">{octet == '3' ? '/' : '.'}</span>
            </span>
          ))}
          <input
            className="cidr"
            type="text"
            data-octet="cidr"
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onWheel={this.handleWheel}
            value={this.state.cidr}
          />
        </div>

        <div className="bits">
          <ol>
            {[...Array(4)].map((x, octet) => (
              <li className="octet">
                <ol>
                  {[...Array(8)].map((x, bit) => (
                    <li
                      className={
                        octet * 8 + bit > this.state.cidr - 1
                          ? 'bit masked'
                          : 'bit unmasked'
                      }
                    >
                      {(this.state.octets[octet] & (1 << (7 - bit))) >>
                        (7 - bit)}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>

        <div className="details">
          <span className="netmask">
            <span className="value">{details.mask}</span>
            <span className="label">Netmask</span>
          </span>
          <span className="first">
            <span className="value">{details.first}</span>
            <span className="label">First Usable IP</span>
          </span>
          <span className="last">
            <span className="value">{details.last}</span>
            <span className="label">Last Usable IP</span>
          </span>
          <span className="count">
            <span className="value">{details.size.toLocaleString()}</span>
            <span className="label">Count</span>
          </span>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<IPAddress />, document.getElementById('app'));
