import './style.css'

import React from 'react'
import ReactDOM from 'react-dom'

class Note extends React.Component {
  render() {
    return <div>Hai!</div>
  }
}

main();

function main() {
  const app = document.createElement('div')
  document.body.appendChild(app)
  ReactDOM.render(<Note />, app)
}