<template>
  <div class="ip">
    <div class="octets" v-for="octet in octets">
      <span class="octet">{{ octet }}</span>
    </div>
    <div class="mask">{{ mask }}</div>
  </div>
</template>

<script>
import { Netmask } from 'netmask'

export default {
  name: 'Cidr',
  data () {
    return {
      octets: [10, 88, 135, 144],
      mask: 28
    }
  }
}
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
