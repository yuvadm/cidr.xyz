<template>
  <div id="app">
    <Cidr/>
  </div>
</template>

<script>
import Cidr from './components/Cidr'

export default {
  name: 'App',
  components: {
    Cidr
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
