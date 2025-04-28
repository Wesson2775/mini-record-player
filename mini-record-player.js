(function() {
    // 默认配置
    const defaultConfig = {
        position: 'bottom-left', // 或 'bottom-right'
        autoPlay: false,
        defaultVolume: 0.8,
        debug: false
    };

    // 创建唱片机
    function createRecordPlayer(config, songs) {
        // 合并配置
        config = {...defaultConfig, ...config};
        
        // 创建DOM元素
        const recordPlayerHTML = `
        <div class="record-player collapsed" id="mini-record-player">
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
                    <span class="song-text">加载中...</span>
                </div>
                <div class="controls">
                    <button class="control-btn" title="上一曲">⏮</button>
                    <button class="control-btn play-btn" title="播放/暂停">⏵</button>
                    <button class="control-btn" title="下一曲">⏭</button>
                    <div class="volume-container">
                        <span class="volume-icon">🔊</span>
                        <input type="range" class="volume-slider" min="0" max="100" value="${config.defaultVolume * 100}">
                    </div>
                    <button class="control-btn playlist-btn" title="播放列表" id="playlist-toggle">≡</button>
                </div>
                <div class="playlist" id="playlist"></div>
            </div>
        </div>
        <audio id="audio-player" style="display: none;"></audio>`;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
        .record-player {
            position: fixed;
            bottom: 20px;
            left: ${config.position.includes('left') ? '20px' : 'auto'};
            right: ${config.position.includes('right') ? '20px' : 'auto'};
            display: flex;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(43, 43, 43, 0.5);
            border-radius: 25px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        /* 其他样式与原始代码相同，省略以节省空间 */
        `;
        
        // 添加到文档
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', recordPlayerHTML);
        
        // 初始化播放器
        initPlayer(config, songs);
    }
    
    // 初始化播放器逻辑
    function initPlayer(config, songs) {
        const recordToggle = document.getElementById('record-toggle');
        const playBtn = document.querySelector('.play-btn');
        const volumeSlider = document.querySelector('.volume-slider');
        const playlistToggle = document.getElementById('playlist-toggle');
        const playlist = document.getElementById('playlist');
        const recordCover = document.getElementById('record-cover');
        const tonearm = document.getElementById('tonearm');
        const recordPlayer = document.getElementById('mini-record-player');
        const audioPlayer = document.getElementById('audio-player');
        
        let isPlaying = false;
        let isCollapsed = true;
        let isPlaylistOpen = false;
        let currentSongIndex = 0;
        
        // 设置初始音量
        audioPlayer.volume = config.defaultVolume;
        
        // 检查歌曲列表
        if (!songs || songs.length === 0) {
            console.error('MiniRecordPlayer: 没有提供歌曲列表');
            songs = [{
                title: "没有歌曲",
                artist: "请提供歌曲列表",
                cover: "https://via.placeholder.com/30/333?text=No+Songs",
                src: ""
            }];
        }
        
        // 初始化音频播放器
        if (songs[0].src) {
            audioPlayer.src = songs[0].src;
        }
        
        // 更新歌曲信息
        function updateSongInfo() {
            const song = songs[currentSongIndex];
            const songInfo = document.querySelector('.song-info');
            songInfo.innerHTML = `
                <span class="song-text">${song.title} - ${song.artist}</span>
            `;
            applyMarquee(songInfo);
            recordCover.src = song.cover || 'https://via.placeholder.com/30';
        }
        
        // 应用跑马灯效果
        function applyMarquee(element) {
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
        
        // 初始化播放列表
        function initializePlaylist() {
            playlist.innerHTML = '';
            songs.forEach((song, index) => {
                const item = document.createElement('div');
                item.className = 'playlist-item';
                item.innerHTML = `
                    <span class="song-text">${song.title} - ${song.artist}</span>
                `;
                applyMarquee(item);
                item.addEventListener('click', () => {
                    currentSongIndex = index;
                    updateSongInfo();
                    isPlaying = true;
                    playBtn.textContent = '⏸';
                    tonearm.classList.add('playing');
                    audioPlayer.src = songs[currentSongIndex].src;
                    setTimeout(() => {
                        recordToggle.classList.add('playing');
                        audioPlayer.play();
                    }, 300);
                    togglePlaylist();
                });
                playlist.appendChild(item);
            });
        }
        
        // 切换播放列表可见性
        function togglePlaylist() {
            isPlaylistOpen = !isPlaylistOpen;
            playlist.classList.toggle('open', isPlaylistOpen);
            updatePlaylistView();
        }
        
        // 更新播放列表视图
        function updatePlaylistView() {
            const controlPanel = document.getElementById('control-panel');
            if (isPlaylistOpen) {
                controlPanel.classList.add('playlist-mode');
            } else {
                controlPanel.classList.remove('playlist-mode');
                updateControls();
                updateSongInfo();
            }
        }
        
        // 更新控制按钮
        function updateControls() {
            const controls = document.querySelector('.controls');
            controls.innerHTML = `
                <button class="control-btn" title="上一曲">⏮</button>
                <button class="control-btn play-btn" title="播放/暂停">${isPlaying ? '⏸' : '⏵'}</button>
                <button class="control-btn" title="下一曲">⏭</button>
                <div class="volume-container">
                    <span class="volume-icon">🔊</span>
                    <input type="range" class="volume-slider" min="0" max="100" value="${volumeSlider.value}">
                </div>
                <button class="control-btn playlist-btn" title="播放列表" id="playlist-toggle">≡</button>
            `;
            
            // 重新绑定事件
            document.querySelector('.play-btn').addEventListener('click', togglePlay);
            document.querySelectorAll('.control-btn').forEach(btn => {
                if (btn.textContent === '⏮') {
                    btn.addEventListener('click', previousSong);
                } else if (btn.textContent === '⏭') {
                    btn.addEventListener('click', nextSong);
                }
            });
            document.getElementById('playlist-toggle').addEventListener('click', togglePlaylist);
            document.querySelector('.volume-slider').addEventListener('input', handleVolume);
        }
        
        // 播放/暂停切换
        function togglePlay() {
            isPlaying = !isPlaying;
            playBtn.textContent = isPlaying ? '⏸' : '⏵';
            if (isPlaying) {
                tonearm.classList.add('playing');
                setTimeout(() => {
                    recordToggle.classList.add('playing');
                    audioPlayer.play();
                }, 300);
            } else {
                recordToggle.classList.remove('playing');
                tonearm.classList.remove('playing');
                audioPlayer.pause();
            }
        }
        
        // 上一曲
        function previousSong() {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            updateSongInfo();
            isPlaying = true;
            playBtn.textContent = '⏸';
            tonearm.classList.add('playing');
            audioPlayer.src = songs[currentSongIndex].src;
            setTimeout(() => {
                recordToggle.classList.add('playing');
                audioPlayer.play();
            }, 300);
        }
        
        // 下一曲
        function nextSong() {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            updateSongInfo();
            isPlaying = true;
            playBtn.textContent = '⏸';
            tonearm.classList.add('playing');
            audioPlayer.src = songs[currentSongIndex].src;
            setTimeout(() => {
                recordToggle.classList.add('playing');
                audioPlayer.play();
            }, 300);
        }
        
        // 音量控制
        function handleVolume() {
            audioPlayer.volume = this.value / 100;
        }
        
        // 歌曲结束自动播放下一首
        audioPlayer.addEventListener('ended', function() {
            if (config.autoPlay) {
                nextSong();
            } else {
                isPlaying = false;
                playBtn.textContent = '⏵';
                recordToggle.classList.remove('playing');
                tonearm.classList.remove('playing');
            }
        });
        
        // 切换展开/折叠
        function toggleCollapse() {
            isCollapsed = !isCollapsed;
            recordPlayer.classList.toggle('collapsed', isCollapsed);
            
            if (isCollapsed && isPlaylistOpen) {
                togglePlaylist();
            }
        }
        
        // 事件绑定
        recordToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleCollapse();
        });
        
        document.addEventListener('click', function(e) {
            if (!recordPlayer.contains(e.target) && !isCollapsed && e.target !== recordToggle) {
                toggleCollapse();
            }
        });
        
        recordPlayer.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        playBtn.addEventListener('click', togglePlay);
        volumeSlider.addEventListener('input', handleVolume);
        
        document.querySelectorAll('.control-btn').forEach(btn => {
            if (btn.textContent === '⏮') {
                btn.addEventListener('click', previousSong);
            } else if (btn.textContent === '⏭') {
                btn.addEventListener('click', nextSong);
            }
        });
        
        playlistToggle.addEventListener('click', togglePlaylist);
        
        // 初始化
        initializePlaylist();
        updateSongInfo();
        
        // 自动播放
        if (config.autoPlay && songs[0].src) {
            togglePlay();
        }
        
        // 调试日志
        if (config.debug) {
            console.log('MiniRecordPlayer 初始化完成', {
                config,
                songs,
                version: '1.0.0'
            });
        }
    }
    
    // 公开API
    window.MiniRecordPlayer = {
        init: function(config = {}, songs = []) {
            createRecordPlayer(config, songs);
        },
        
        // 可以添加更多方法，如添加歌曲、切换歌曲等
        addSongs: function(newSongs) {
            // 实现添加歌曲逻辑
        },
        
        play: function() {
            // 实现播放方法
        },
        
        pause: function() {
            // 实现暂停方法
        }
    };
})();