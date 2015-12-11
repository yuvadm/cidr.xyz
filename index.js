import './style.scss'

import { Netmask } from 'netmask'
import React from 'react'
import ReactDOM from 'react-dom'

class IPAddress extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      octets: [10, 88, 135, 144],
      cidr: 28,
    }
  }

  handleChange = (event) => {
    var octets = this.state.octets
    var val = +event.target.value.replace(/[^0-9]/g, '')
    var octet = event.target.attributes['data-octet'].value
    if (octet == 'cidr') {
      if (val <= 32) {
        this.setState({
          cidr: val
        })
      }
    }
    else {
      if (val <= 255) {
        octets[+octet] = val
        this.setState({
          octets: octets
        })
      }
    }
  }

  getPretty = () => {
    return this.state.octets.join('.') + '/' + this.state.cidr
  }

  getNetmask = () => {
    var block = new Netmask(this.getPretty())
    return block.mask
  }

  getRange = () => {
    var block = new Netmask(this.getPretty())
    return block.first + ' - ' + block.last
  }

  getCount = () => {
    var block = new Netmask(this.getPretty())
    return block.size
  }

  render() {
    return <div className="ip-address">
      <div className="address">
        {[...Array(4)].map((x, octet) =>
          <span className="octet">
            <input className="octet" type="text" data-octet={octet} onChange={this.handleChange} value={this.state.octets[octet]}/>
            <span className="dot">{octet == '3' ? '/' : '.'}</span>
          </span>
        )}
        <input className="cidr" type="text" data-octet="cidr" onChange={this.handleChange} value={this.state.cidr}/>
      </div>

      <div className="bits">
        <ol>
          {[...Array(4)].map((x, octet) =>
            <li className="octet">
              <ol>
                {[...Array(8)].map((x, bit) =>
                  <li className={((octet*8)+bit) > this.state.cidr-1 ? 'bit masked' : 'bit unmasked'}>{(this.state.octets[octet] & (1 << (7-bit))) >> (7-bit)}</li>
                )}
              </ol>
            </li>
          )}
        </ol>
      </div>

      <div className="details">
        <span className="netmask">
          <span className="value">{this.getNetmask()}</span>
          <span className="label">Netmask</span>
        </span>
        <span className="range">
          <span className="value">{this.getRange()}</span>
          <span className="label">Range</span>
        </span>
        <span className="count">
          <span className="value">{this.getCount().toLocaleString()}</span>
          <span className="label">Addresses</span>
        </span>
      </div>

    </div>
  }
}

ReactDOM.render(<IPAddress />, document.getElementById('app'))
