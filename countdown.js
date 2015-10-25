var countdown = $("#countdown").countdown360({
  radius: 30,
  seconds: 30,
  fontColor: '#000',
  autostart: false,
  onComplete: function() {
      console.log('done')
  }
});
countdown.start();
console.log('countdown360 ', countdown);