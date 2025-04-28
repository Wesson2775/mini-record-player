(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory); // AMD (RequireJS)
  } else if (typeof module === 'object' && module.exports) {
      module.exports = factory(); // CommonJS
  } else {
      global.MiniRecordPlayer = factory(); // Browser global
  }
})(typeof window !== 'undefined' ? window : this, function () {
  // Default configuration
  const defaultConfig = {
      container: null, // Required: DOM element to append the player
      songs: [], // Songs provided by third-party page
      volume: 0.8, // Default volume (0 to 1)
      theme: {
          background: '#2a2a2a',
          songInfoBg: '#3a5499',
          controlsBg: '#dd4848',
          playlistBg: '#343b47'
      }
  };

  // CSS styles (injected dynamically)
  const styles = `
      .mini-record-player {
          font-family: 'Arial', sans-serif;
          position: fixed;
          bottom: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(43, 43, 43, 0.5);
          border-radius: 25px;
          overflow: hidden;
          transition: all 0.3s ease;
      }

      .mini-record-player.collapsed {
          border-radius: 25px 0 0 25px;
      }

      .recorderbackground {
          width: 59px;
          height: 44px;
          background: radial-gradient(circle, rgb(122, 122, 122), #5e5e5e 100%);
          border-radius: 22px 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          position: relative;
          box-shadow: inset 0 0 10px rgba(77, 136, 202, 0.7), 0 0 5px rgba(158, 190, 41, 0.3);
          z-index: 1001;
      }

      .record {
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #222 0%, #111 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          border: 2px solid #424242;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.7), 0 0 5px rgba(0, 0, 0, 0.3);
          z-index: 1001;
          will-change: transform;
      }

      .record-cover {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          position: absolute;
          z-index: 1000;
      }

      .record-grooves::before {
          content: '';
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: repeating-radial-gradient(circle, transparent 0px, rgba(255, 255, 255, 0.05) 1px, transparent 2px);
          z-index: 999;
      }

      .record.playing {
          animation: spin 2s linear infinite;
      }

      .tonearm {
          position: absolute;
          width: 20px;
          height: 2px;
          background: linear-gradient(to right, #1937bd, #78bcd1);
          top: 33px;
          left: 50px;
          transform-origin: left center;
          transform: rotate(-90deg);
          transition: transform 0.3s ease-in-out 0.1s;
          z-index: 1003;
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(75, 74, 74, 0.5);
      }

      .tonearm.playing {
          transform: rotate(-125deg);
      }

      .tonearm::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #c0bfbf;
          border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .tonearm::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 5px;
          background: #ff1919;
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(248, 20, 20, 0.5);
      }

      .tonearm-needle {
          position: absolute;
          right: -2px;
          bottom: -4px;
          width: 2px;
          height: 6px;
          background: #ccc;
          transform: rotate(45deg);
      }

      .control-panel {
          width: 160px;
          height: 44px;
          background-color: #2a2a2a;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease, opacity 0.3s ease;
          overflow: hidden;
          position: relative;
          z-index: 1001;
      }

      .mini-record-player.collapsed .control-panel {
          width: 0;
          opacity: 0;
      }

      .song-info {
          height: 22px;
          background-color: #3a5499;
          display: flex;
          align-items: center;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          padding: 0 5px;
      }

      .controls {
          height: 22px;
          display: flex;
          align-items: center;
          background-color: #dd4848;
          gap: 8px;
          padding: 0 5px;
          overflow: hidden;
      }

      .song-text {
          color: #ddd;
          white-space: nowrap;
      }

      .song-text.marquee {
          animation: marquee 10s linear infinite;
          padding-right: 20px;
          display: inline-block;
      }

      .song-text.marquee:hover {
          animation-play-state: paused;
      }

      .control-btn {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
      }

      .control-btn:hover {
          color: #fff;
      }

      .volume-container {
          display: flex;
          align-items: center;
          margin-left: auto;
      }

      .volume-icon {
          font-size: 10px;
          color: #ccc;
      }

      .volume-slider {
          width: 40px;
          height: 3px;
          -webkit-appearance: none;
          background: #444;
          outline: none;
          border-radius: 2px;
      }

      .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 8px;
          height: 8px;
          background: #ccc;
          border-radius: 50%;
          cursor: pointer;
      }

      .playlist-btn {
          font-size: 10px;
          color: #ccc;
      }

      .playlist {
          display: none;
          width: 160px;
          height: 44px;
          background-color: #343b47;
          overflow-y: auto;
          z-index: 1002;
      }

      .playlist.open {
          display: block;
      }

      .playlist::-webkit-scrollbar {
          width: 4px;
      }

      .playlist::-webkit-scrollbar-track {
          background: #333;
      }

      .playlist::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 2px;
      }

      .playlist::-webkit-scrollbar-thumb:hover {
          background: #777;
      }

      .playlist-item {
          padding: 5px 10px;
          font-size: 10px;
          color: #ccc;
          cursor: pointer;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #333;
          height: 22px;
          overflow: hidden;
          box-sizing: border-box;
      }

      .playlist-item:last-child {
          border-bottom: none;
      }

      .playlist-item:hover {
          background-color: #3d4a63;
          color: #fff;
      }

      .playlist-item .song-text {
          width: 100%;
      }

      .playlist-item:hover .song-text.marquee {
          animation: marquee 10s linear infinite;
          padding-right: 20px;
          display: inline-block;
      }

      .playlist-item .song-text {
          transition: transform 0.3s ease;
      }

      .playlist-item:not(:hover) .song-text.marquee {
          animation: none;
          transform: translateX(0);
      }

      .playlist-mode .song-info,
      .playlist-mode .controls {
          display: none;
      }

      .playlist-mode .playlist {
          display: block;
      }

      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }

      @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
      }
  `;

  // Inject styles into document
  function injectStyles() {
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
  }

  // Create player HTML structure
  function createPlayerHTML() {
      return `
          <div class="mini-record-player collapsed">
              <div class="recorderbackground">
                  <div class="record" id="record-toggle">
                      <img class="record-cover" id="record-cover" src="https://via.placeholder.com/30" alt="Cover">
                      <div class="record-grooves"></div>
                  </div>
                  <div class="tonearm" id="tonearm">
                      <div class="tonearm-needle"></div>
                  </div>
              </div>
              <div class="control-panel" id="control-panel">
                  <div class="song-info">
                      <span class="song-text">未知歌曲 - 未知艺术家</span>
                  </div>
                  <div class="controls">
                      <button class="control-btn" title="上一曲">⏮</button>
                      <button class="control-btn play-btn" title="播放/暂停">⏵</button>
                      <button class="control-btn" title="下一曲">⏭</button>
                      <div class="volume-container">
                          <span class="volume-icon">🔊</span>
                          <input type="range" class="volume-slider" min="0" max="100" value="80">
                      </div>
                      <button class="control-btn playlist-btn" title="播放列表" id="playlist-toggle">≡</button>
                  </div>
                  <div class="playlist" id="playlist"></div>
              </div>
          </div>
          <audio id="audio-player" style="display: none;"></audio>
      `;
  }

  // MiniRecordPlayer class
  class MiniRecordPlayer {
      constructor(config) {
          this.config = Object.assign({}, defaultConfig, config);
          if (!this.config.container) {
              throw new Error('Container element is required');
          }
          if (!this.config.songs || this.config.songs.length === 0) {
              throw new Error('At least one song is required');
          }
          this.init();
      }

      init() {
          // Inject styles
          injectStyles();

          // Inject player HTML
          this.config.container.innerHTML = createPlayerHTML();

          // DOM elements
          this.recordToggle = this.config.container.querySelector('#record-toggle');
          this.controlPanel = this.config.container.querySelector('#control-panel');
          this.playBtn = this.config.container.querySelector('.play-btn');
          this.volumeSlider = this.config.container.querySelector('.volume-slider');
          this.playlistToggle = this.config.container.querySelector('#playlist-toggle');
          this.playlist = this.config.container.querySelector('#playlist');
          this.recordCover = this.config.container.querySelector('#record-cover');
          this.tonearm = this.config.container.querySelector('#tonearm');
          this.recordPlayer = this.config.container.querySelector('.mini-record-player');
          this.audioPlayer = this.config.container.querySelector('#audio-player');

          // State
          this.isPlaying = false;
          this.isCollapsed = true;
          this.isPlaylistOpen = false;
          this.currentSongIndex = 0;

          // Initialize audio player
          this.audioPlayer.src = this.config.songs[this.currentSongIndex].src;
          this.audioPlayer.volume = this.config.volume;
          this.volumeSlider.value = this.config.volume * 100;

          // Apply theme
          this.applyTheme();

          // Initialize playlist
          this.initializePlaylist();

          // Update song info
          this.updateSongInfo();

          // Bind events
          this.bindEvents();
      }

      applyTheme() {
          this.controlPanel.style.backgroundColor = this.config.theme.background;
          this.controlPanel.querySelector('.song-info').style.backgroundColor = this.config.theme.songInfoBg;
          this.controlPanel.querySelector('.controls').style.backgroundColor = this.config.theme.controlsBg;
          this.controlPanel.querySelector('.playlist').style.backgroundColor = this.config.theme.playlistBg;
      }

      applyMarquee(element) {
          const parentWidth = element.offsetWidth;
          const text = element.querySelector('.song-text');

          function checkOverflow(el) {
              if (!el) return false;
              const tempSpan = document.createElement('span');
              tempSpan.style.visibility = 'hidden';
              tempSpan.style.position = 'absolute';
              tempSpan.style.whiteSpace = 'nowrap';
              tempSpan.style.fontSize = getComputedStyle(el).fontSize;
              tempSpan.textContent = el.textContent;
              document.body.appendChild(tempSpan);
              const textWidth = tempSpan.offsetWidth;
              document.body.removeChild(tempSpan);
              return textWidth > parentWidth / 2;
          }

          if (checkOverflow(text)) {
              text.classList.add('marquee');
          } else {
              text.classList.remove('marquee');
          }
      }

      initializePlaylist() {
          this.playlist.innerHTML = '';
          this.config.songs.forEach((song, index) => {
              const item = document.createElement('div');
              item.className = 'playlist-item';
              item.innerHTML = `
                  <span class="song-text">${song.title} - ${song.artist}</span>
              `;
              this.applyMarquee(item);
              item.addEventListener('click', () => {
                  this.currentSongIndex = index;
                  this.updateSongInfo();
                  this.isPlaying = true;
                  this.playBtn.textContent = '⏸';
                  this.tonearm.classList.add('playing');
                  this.audioPlayer.src = this.config.songs[this.currentSongIndex].src;
                  setTimeout(() => {
                      this.recordToggle.classList.add('playing');
                      this.audioPlayer.play();
                  }, 300);
                  this.togglePlaylist();
              });
              this.playlist.appendChild(item);
          });
      }

      updateSongInfo() {
          const song = this.config.songs[this.currentSongIndex];
          const songInfo = this.controlPanel.querySelector('.song-info');
          songInfo.innerHTML = `
              <span class="song-text">${song.title} - ${song.artist}</span>
          `;
          this.applyMarquee(songInfo);
          this.recordCover.src = song.cover;
      }

      updatePlaylistView() {
          if (this.isPlaylistOpen) {
              this.controlPanel.classList.add('playlist-mode');
          } else {
              this.controlPanel.classList.remove('playlist-mode');
              this.controlPanel.querySelector('.controls').innerHTML = `
                  <button class="control-btn" title="上一曲">⏮</button>
                  <button class="control-btn play-btn" title="播放/暂停">${this.isPlaying ? '⏸' : '⏵'}</button>
                  <button class="control-btn" title="下一曲">⏭</button>
                  <div class="volume-container">
                      <span class="volume-icon">🔊</span>
                      <input type="range" class="volume-slider" min="0" max="100" value="${this.volumeSlider.value}">
                  </div>
                  <button class="control-btn playlist-btn" title="播放列表" id="playlist-toggle">≡</button>
              `;
              this.playBtn = this.controlPanel.querySelector('.play-btn');
              this.volumeSlider = this.config.container.querySelector('.volume-slider');
              this.playlistToggle = this.controlPanel.querySelector('#playlist-toggle');
              this.bindControlEvents();
              this.updateSongInfo();
          }
      }

      togglePlaylist() {
          this.isPlaylistOpen = !this.isPlaylistOpen;
          this.playlist.classList.toggle('open', this.isPlaylistOpen);
          this.updatePlaylistView();
      }

      togglePlay() {
          this.isPlaying = !this.isPlaying;
          this.playBtn.textContent = this.isPlaying ? '⏸' : '⏵';
          if (this.isPlaying) {
              this.tonearm.classList.add('playing');
              setTimeout(() => {
                  this.recordToggle.classList.add('playing');
                  this.audioPlayer.play();
              }, 300);
          } else {
              this.recordToggle.classList.remove('playing');
              this.tonearm.classList.remove('playing');
              this.audioPlayer.pause();
          }
      }

      previousSong() {
          this.currentSongIndex = (this.currentSongIndex - 1 + this.config.songs.length) % this.config.songs.length;
          this.updateSongInfo();
          this.isPlaying = true;
          this.playBtn.textContent = '⏸';
          this.tonearm.classList.add('playing');
          this.audioPlayer.src = this.config.songs[this.currentSongIndex].src;
          setTimeout(() => {
              this.recordToggle.classList.add('playing');
              this.audioPlayer.play();
          }, 300);
      }

      nextSong() {
          this.currentSongIndex = (this.currentSongIndex + 1) % this.config.songs.length;
          this.updateSongInfo();
          this.isPlaying = true;
          this.playBtn.textContent = '⏸';
          this.tonearm.classList.add('playing');
          this.audioPlayer.src = this.config.songs[this.currentSongIndex].src;
          setTimeout(() => {
              this.recordToggle.classList.add('playing');
              this.audioPlayer.play();
          }, 300);
      }

      handleVolume() {
          this.audioPlayer.volume = this.volumeSlider.value / 100;
      }

      toggleCollapse() {
          this.isCollapsed = !this.isCollapsed;
          this.recordPlayer.classList.toggle('collapsed', this.isCollapsed);
          if (this.isCollapsed) {
              if (this.isPlaylistOpen) this.togglePlaylist();
              if (this.isPlaying) {
                  this.tonearm.classList.add('playing');
                  setTimeout(() => this.recordToggle.classList.add('playing'), 300);
              }
          } else {
              if (this.isPlaying) {
                  this.tonearm.classList.add('playing');
                  setTimeout(() => this.recordToggle.classList.add('playing'), 300);
              }
          }
      }

      bindControlEvents() {
          this.playBtn.addEventListener('click', () => this.togglePlay());
          this.volumeSlider.addEventListener('input', () => this.handleVolume());
          this.controlPanel.querySelectorAll('.control-btn').forEach(btn => {
              if (btn.textContent === '⏮') {
                  btn.addEventListener('click', () => this.previousSong());
              } else if (btn.textContent === '⏭') {
                  btn.addEventListener('click', () => this.nextSong());
              }
          });
          this.playlistToggle.addEventListener('click', () => this.togglePlaylist());
      }

      bindEvents() {
          this.recordToggle.addEventListener('click', e => {
              e.stopPropagation();
              this.toggleCollapse();
          });

          document.addEventListener('click', e => {
              if (!this.recordPlayer.contains(e.target) && !this.isCollapsed && e.target !== this.recordToggle) {
                  this.toggleCollapse();
              }
          });

          this.recordPlayer.addEventListener('click', e => {
              e.stopPropagation();
          });

          this.audioPlayer.addEventListener('ended', () => this.nextSong());

          this.bindControlEvents();
      }
  }

  // Factory function to create player instance
  function init(config) {
      return new MiniRecordPlayer(config);
  }

  return init;
});