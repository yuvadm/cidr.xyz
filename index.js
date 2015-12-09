import './style.scss'

import React from 'react'
import ReactDOM from 'react-dom'

class IPAddress extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      octets: [10, 88, 135, 24],
      cidr: 36,
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
    return <form class="ip-address">
      {[...Array(4)].map((x, octet) =>
        <input class="octet" type="text" data-octet={octet} onChange={this.handleChange} value={this.state.octets[octet]}/>
      )}
      <input class="cidr" type="text" data-octet="cidr" onChange={this.handleChange} value={this.state.cidr}/>
      <h2>Result: {pretty}</h2>

      <ol>
        {[...Array(4)].map((x, octet) =>
          <li class="octet">
            <ol>
              {[...Array(8)].map((x, bit) =>
                <li class="bit">{(this.state.octets[octet] & (1 << (7-bit))) >> (7-bit)}</li>
              )}
            </ol>
          </li>
        )}
      </ol>
    </form>
  }
}

ReactDOM.render(<IPAddress />, document.getElementById('app'))
