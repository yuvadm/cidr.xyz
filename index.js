import './style.scss'

import React from 'react'
import ReactDOM from 'react-dom'

class IPAddress extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      octets: [10, 88, 135, 24],
      cidr: 32,
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

  render() {
    var pretty = this.state.octets.join('.') + '/' + this.state.cidr

    return <div className="ip-address">
      <div className="address">
        {[...Array(4)].map((x, octet) =>
          <input className="octet" type="text" data-octet={octet} onChange={this.handleChange} value={this.state.octets[octet]}/>
        )}
        <span className="slash">&#47;</span>
        <input className="cidr" type="text" data-octet="cidr" onChange={this.handleChange} value={this.state.cidr}/>
      </div>

      <div className="bits">
        <ol>
          {[...Array(4)].map((x, octet) =>
            <li className="octet">
              <ol>
                {[...Array(8)].map((x, bit) =>
                  <li className="bit">{(this.state.octets[octet] & (1 << (7-bit))) >> (7-bit)}</li>
                )}
              </ol>
            </li>
          )}
        </ol>
      </div>
    </div>
  }
}

ReactDOM.render(<IPAddress />, document.getElementById('app'))
