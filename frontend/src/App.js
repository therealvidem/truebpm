import React, { useEffect, useState } from 'react';
import {Line} from 'react-chartjs-2';
import Select from 'react-select';
import Slider from 'rc-slider';
import SongInfo from "./SongInfo";
import queryString from 'query-string';
import 'rc-slider/assets/index.css';
import './App.css';

const SliderWithTooltip = Slider.createSliderWithTooltip(Slider);

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const updateHash = (param, value) => {
  var hash = queryString.parse(window.location.hash);
  hash[param] = value;
  window.location.hash = "#" + queryString.stringify(hash);
}

const getSimfiles = async () => {
  const response = await fetch(`/api/v1/simfiles`);
  return await response.json();
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

const MIN_READ_SPEED = 50;
const MAX_READ_SPEED = 800;

function App() {
  var hash = queryString.parse(window.location.hash);
  var readSpeed = hash.readSpeed;

  if (readSpeed) {
    // Override local storage if read speed is provided in the hash
    localStorage.setItem('preferredReadSpeed', readSpeed);
  } else {
    readSpeed = localStorage.getItem('preferredReadSpeed');
  }

  const [songList, setSongList] = useState(null);
  const [selectedSong, setSelectedSong] = useState(hash.song ? {'label': hash.song} : null);
  const [songInfo, setSongInfo] = useState(null);
  const [preferredReadSpeed, setPreferredReadSpeed] = useState(readSpeed ? readSpeed : 573);
  const [chartData, setChartData] = useState({
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
  });

  useEffect(() => {
    getSimfiles().then(songList => {
      setSongList(songList);
    });
  }, []);

  useEffect(() => {
    if (!selectedSong) return;
    if (preferredReadSpeed < MIN_READ_SPEED || preferredReadSpeed > MAX_READ_SPEED) return;
    console.log('SONG', selectedSong, 'PREFERRED READ SPEED', preferredReadSpeed);
    updateHash('song', selectedSong.label);
    updateHash('readSpeed', preferredReadSpeed);
    fetch(`/api/v1/simfiles/` + encodeURIComponent(selectedSong.label) + `?style=Single&difficulty=Hard&preferred_rate=` + preferredReadSpeed + `&speed_change_threshold=4`)
      .then((response) => {
        return response.json();
      }).then(function(info) {
        setSongInfo(info);

        setChartData(chartData => ({
          ...chartData,
          labels: [...Array(info.result.number_of_measures).keys()],
          datasets: [
            {
              ...chartData.datasets[0],
              data: info.result.line_chart_data.stop,
            },
            {
              ...chartData.datasets[1],
              data: info.result.line_chart_data.bpm,
            }
          ],
        }));
      });
  }, [preferredReadSpeed, selectedSong]);

  function onSliderChange(value) {
    setPreferredReadSpeed(value);
    localStorage.setItem('preferredReadSpeed', value);
  }

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
        <br />
        <input
          type="number"
          min={MIN_READ_SPEED}
          max={MAX_READ_SPEED}
          value={preferredReadSpeed}
          onChange={(e) => onSliderChange(e.target.value)}
        />
        <br />
        <SliderWithTooltip
          min={MIN_READ_SPEED}
          max={MAX_READ_SPEED}
          defaultValue={573}
          value={preferredReadSpeed}
          step={5}
          onChange={onSliderChange}
        />
        <br />
        <Select
          name="form-field-name"
          value="one"
          options={songList}
          isLoading={!songList}
          onChange={(song) => setSelectedSong(song)}
        />
      </div>
      <SongInfo songInfo={songInfo} />
      <Line data={chartData} options={chartOptions} />
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

export default App;
