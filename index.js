import './style.css'

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
    var val = +event.target.value
    var octet = event.target.attributes['data-octet'].value
    if (octet == 'cidr') {
      this.setState({
        cidr: val
      })
    }
    else {
      octets[+octet] = val
      this.setState({
        octets: octets
      })
    }
  }

  render() {
    var pretty = this.state.octets.join('.') + '/' + this.state.cidr
    return <form>
      <input type="text" data-octet="0" onChange={this.handleChange} value={this.state.octets[0]}/>.
      <input type="text" data-octet="1" onChange={this.handleChange} value={this.state.octets[1]}/>.
      <input type="text" data-octet="2" onChange={this.handleChange} value={this.state.octets[2]}/>.
      <input type="text" data-octet="3" onChange={this.handleChange} value={this.state.octets[3]}/>/
      <input type="text" data-octet="cidr" onChange={this.handleChange} value={this.state.cidr}/>
      <h2>Result: {pretty}</h2>
    </form>
  }
}

const app = document.createElement('div')
document.body.appendChild(app)
ReactDOM.render(<IPAddress />, app)
