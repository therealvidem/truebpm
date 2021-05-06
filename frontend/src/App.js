import React, { Component } from 'react';
import {Line} from 'react-chartjs-2';
import Select from 'react-select';
import Slider from 'rc-slider';
import SongInfo from "./SongInfo";
import queryString from 'query-string';
import 'rc-slider/assets/index.css';
import './App.css';

const SliderWithTooltip = Slider.createSliderWithTooltip(Slider);

const updateHash = (param, value) => {
  var hash = queryString.parse(window.location.hash);
  hash[param] = value;
  window.location.hash = "#" + queryString.stringify(hash);
}

const getSimfiles = () => {
  return fetch(`/api/v1/simfiles`)
    .then((response) => {
      return response.json();
    });
}

const chartOptions = {
  scales: {
    yAxes: [{
      scaleLabel: {
        display: true,
        labelString: 'BPM'
      }
    }],
    xAxes: [{
      scaleLabel: {
        display: true,
        labelString: 'Measure'
      }
    }]
  }     
}
class App extends Component {
  constructor() {
    super();

    var hash = queryString.parse(window.location.hash);
    var readSpeed = hash.readSpeed;

    if (readSpeed) {
      // Override local storage if read speed is provided in the hash
      localStorage.setItem('preferredReadSpeed', readSpeed);
    } else {
      readSpeed = localStorage.getItem('preferredReadSpeed');
    }

    this.state = {
      songList: null,
      selectedSong: null,
      songInfo: null,
      preferredReadSpeed: readSpeed ? readSpeed : 573,
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Stops',
            fill: false,
            showLine: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(202,58,221,0.4)',
            borderColor: 'rgba(180,47,196,1)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(202,58,221,0.4)',
            pointBackgroundColor: 'rgba(202,58,221,0.4)',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(202,58,221,1)',
            pointHoverBorderColor: 'rgba(202,58,221,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 5,
            pointHitRadius: 10,
            data: []
          },
          {
            label: 'BPM',
            fill: false,
            steppedLine: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(95,212,230,0.4)',
            borderColor: 'rgba(79,178,195,1)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(95,212,230,0.4)',
            pointBackgroundColor: 'rgba(95,212,230,0.4)',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(90,201,18,1)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [],
          },
        ]
      },
    };

    if (hash.song) {
      this.fetchSuggestions({'label': hash.song});
    }

    this.fetchSuggestions = this.fetchSuggestions.bind(this);
    this.onSliderChange = this.onSliderChange.bind(this);
    this.onSliderSelect = this.onSliderSelect.bind(this);
  }

  componentDidMount() {
    getSimfiles().then(songList => {
      this.setState({ songList });
    });
  }

  onSliderChange(value) {
    this.setState({'preferredReadSpeed': value});
    localStorage.setItem('preferredReadSpeed', value);
  }

  onSliderSelect(value) {
    if (this.state.selectedSong) {
      this.fetchSuggestions(this.state.selectedSong);
    }
  }

  fetchSuggestions(song) {
    this.setState({'selectedSong': song});
    updateHash('song', song.label);
    updateHash('readSpeed', this.state.preferredReadSpeed);
    return fetch(`/api/v1/simfiles/` + encodeURIComponent(song.label) + `?style=Single&difficulty=Hard&preferred_rate=` + this.state.preferredReadSpeed + `&speed_change_threshold=4`)
      .then((response) => {
        return response.json();
      }).then(function(info) {
        this.setState({'songInfo': info});

        var chartData = this.state.chartData;
        chartData.datasets[0].data = info.result.line_chart_data.stop;
        chartData.datasets[1].data = info.result.line_chart_data.bpm;
        chartData.labels = [...Array(info.result.number_of_measures).keys()]
        this.setState({'chartData': chartData});
      }.bind(this));
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h3><a href='/'>true BPM</a></h3>
        </div>
        <div className="Content">
          <p className="description">
            figure out the actual BPM of a chart on DDR.
          </p>
          <small><i>preferred read speed:</i></small>
          <SliderWithTooltip
            min={50}
            max={800}
            defaultValue={573}
            value={this.state.preferredReadSpeed}
            step={5}
            onChange={this.onSliderChange}
            onAfterChange={this.onSliderSelect}
          />
          <br />
          <Select
            name="form-field-name"
            value="one"
            options={this.state.songList}
            isLoading={!this.state.songList}
            onChange={this.fetchSuggestions}
          />
        </div>
        <SongInfo songInfo={this.state.songInfo} />
        <Line data={this.state.chartData} options={chartOptions} />
        <div className="footer">
          <br />
          <a href='https://github.com/zachwalton/truebpm'><img alt="github" height="24" width="24" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" /></a>
          &nbsp;
          <a href='https://twitter.com/hoofed_locust'><img alt="twitter" height="24" width="24" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/twitter.svg" /></a>
          <br />
        </div>
      </div>
    );
  }
}

export default App;
