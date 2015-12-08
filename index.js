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
    octets[+event.target.attributes['data-octet'].value] = +event.target.value
    this.setState({
      octets: octets
    })
  }

  render() {
    return <form>
      <input type="text" data-octet="0" onChange={this.handleChange} value={this.state.octets[0]}/>.
      <input type="text" data-octet="1" onChange={this.handleChange} value={this.state.octets[1]}/>.
      <input type="text" data-octet="2" onChange={this.handleChange} value={this.state.octets[2]}/>.
      <input type="text" data-octet="3" onChange={this.handleChange} value={this.state.octets[3]}/>/
      <input type="text" onChange={this.handleChange} value={this.state.cidr}/>
      <h2></h2>
    </form>
  }
}

const app = document.createElement('div')
document.body.appendChild(app)
ReactDOM.render(<IPAddress />, app)
