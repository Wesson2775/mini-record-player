class MusicPlayer {
  constructor(options = {}) {
    this.songs = options.songs || [];
    this.currentSongIndex = 0;
    this.isPlaying = false;
    this.isCollapsed = false;
    this.isPlaylistOpen = false;
    
    this.initPlayer();
    this.initEvents();
  }

  initPlayer() {
    // Create player DOM
    this.player = document.createElement('div');
    this.player.className = 'record-player';
    this.player.innerHTML = `
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
          <div class="song-details">
            <span class="song-title">未知歌曲</span>
            <span class="song-artist">未知艺术家</span>
          </div>
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
    `;
    
    // Create audio element
    this.audio = document.createElement('audio');
    this.audio.style.display = 'none';
    
    // Append to body
    document.body.appendChild(this.player);
    document.body.appendChild(this.audio);
    
    // Initialize
    if (this.songs.length > 0) {
      this.audio.src = this.songs[this.currentSongIndex].src;
      this.audio.volume = 0.8;
      this.updateSongInfo();
    }
    
    this.initializePlaylist();
  }

  initEvents() {
    // Get elements
    this.recordToggle = this.player.querySelector('#record-toggle');
    this.playBtn = this.player.querySelector('.play-btn');
    this.volumeSlider = this.player.querySelector('.volume-slider');
    this.playlistToggle = this.player.querySelector('#playlist-toggle');
    this.playlist = this.player.querySelector('#playlist');
    this.recordCover = this.player.querySelector('#record-cover');
    this.tonearm = this.player.querySelector('#tonearm');
    this.controlPanel = this.player.querySelector('#control-panel');

    // Event listeners
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.volumeSlider.addEventListener('input', () => this.handleVolume());
    this.playlistToggle.addEventListener('click', () => this.togglePlaylist());
    this.recordToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    // Previous/next buttons
    this.player.querySelectorAll('.control-btn').forEach(btn => {
      if (btn.textContent === '⏮') {
        btn.addEventListener('click', () => this.previousSong());
      } else if (btn.textContent === '⏭') {
        btn.addEventListener('click', () => this.nextSong());
      }
    });

    // Click outside to collapse
    document.addEventListener('click', (e) => {
      if (!this.player.contains(e.target) && !this.isCollapsed) {
        this.toggleCollapse();
      }
    });

    // Prevent clicks inside from collapsing
    this.player.addEventListener('click', (e) => e.stopPropagation());

    // Auto-play next song
    this.audio.addEventListener('ended', () => this.nextSong());
  }

  initializePlaylist() {
    this.playlist.innerHTML = '';
    this.songs.forEach((song, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.innerHTML = `
        <div class="song-details">
          <span class="playlist-title">${song.title}</span>
          <span class="playlist-artist">${song.artist}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        this.currentSongIndex = index;
        this.updateSongInfo();
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.recordToggle.classList.add('playing');
        this.tonearm.classList.add('playing');
        this.audio.src = this.songs[this.currentSongIndex].src;
        this.audio.play();
        this.togglePlaylist();
      });
      this.playlist.appendChild(item);
    });
  }

  updateSongInfo() {
    const song = this.songs[this.currentSongIndex];
    this.player.querySelector('.song-details').innerHTML = `
      <span class="song-title">${song.title}</span>
      <span class="song-artist">${song.artist}</span>
    `;
    this.recordCover.src = song.cover;
    
    // Fix for cover rotation stutter - use will-change
    this.recordCover.style.willChange = 'transform';
  }

  updatePlaylistView() {
    if (this.isPlaylistOpen) {
      this.controlPanel.classList.add('playlist-mode');
      const topSongIndex = this.currentSongIndex;
      const bottomSongIndex = (this.currentSongIndex + 1) % this.songs.length;
      
      this.player.querySelector('.song-details').innerHTML = `
        <span class="song-title">${this.songs[topSongIndex].title}</span>
        <span class="song-artist">${this.songs[topSongIndex].artist}</span>
      `;

      const controls = this.player.querySelector('.controls');
      controls.innerHTML = `
        <div class="song-details" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <span class="playlist-title" style="font-size: 10px;">${this.songs[bottomSongIndex].title}</span>
          <span class="playlist-artist" style="font-size: 10px;">${this.songs[bottomSongIndex].artist}</span>
        </div>
      `;
    } else {
      this.controlPanel.classList.remove('playlist-mode');
      this.player.querySelector('.controls').innerHTML = `
        <button class="control-btn" title="上一曲">⏮</button>
        <button class="control-btn play-btn" title="播放/暂停">${this.isPlaying ? '⏸' : '⏵'}</button>
        <button class="control-btn" title="下一曲">⏭</button>
        <div class="volume-container">
          <span class="volume-icon">🔊</span>
          <input type="range" class="volume-slider" min="0" max="100" value="${this.volumeSlider.value}">
        </div>
        <button class="control-btn playlist-btn" title="播放列表" id="playlist-toggle">≡</button>
      `;
      this.initEvents();
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
      this.recordToggle.classList.add('playing');
      this.tonearm.classList.add('playing');
      this.audio.play();
    } else {
      this.recordToggle.classList.remove('playing');
      this.tonearm.classList.remove('playing');
      this.audio.pause();
    }
  }

  previousSong() {
    this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
    this.updateSongInfo();
    this.isPlaying = true;
    this.playBtn.textContent = '⏸';
    this.recordToggle.classList.add('playing');
    this.tonearm.classList.add('playing');
    this.audio.src = this.songs[this.currentSongIndex].src;
    this.audio.play();
  }

  nextSong() {
    this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
    this.updateSongInfo();
    this.isPlaying = true;
    this.playBtn.textContent = '⏸';
    this.recordToggle.classList.add('playing');
    this.tonearm.classList.add('playing');
    this.audio.src = this.songs[this.currentSongIndex].src;
    this.audio.play();
  }

  handleVolume() {
    this.audio.volume = this.volumeSlider.value / 100;
  }

  toggleCollapse() {
    this.player.classList.toggle('collapsed');
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      if (this.isPlaylistOpen) this.togglePlaylist();
      if (this.isPlaying) {
        this.recordToggle.classList.add('playing');
        this.tonearm.classList.add('playing');
      }
    } else {
      if (this.isPlaying) {
        this.recordToggle.classList.add('playing');
        this.tonearm.classList.add('playing');
      }
    }
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.MusicPlayer = MusicPlayer;
}