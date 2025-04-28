// 自动加载播放器所需的CSS和JS文件
(function() {
  // 防止重复加载CSS
  const cssId = 'music-player-css';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://你的GitHub用户名.github.io/仓库名/music-player.css';
    document.head.appendChild(link);
  }

  // 按顺序加载配置文件和播放器脚本
  const script1 = document.createElement('script');
  script1.src = 'https://wesson2775.github.io/music-player/songs-config.js';
  
  const script2 = document.createElement('script');
  script2.src = 'https://wesson2775.github.io/music-player/music-player.js';
  
  // 确保配置文件加载完成后才加载播放器
  script1.onload = function() {
    document.body.appendChild(script2);
    script2.onload = function() {
      // 初始化播放器
      new MusicPlayer({ songs: songsConfig });
    };
  };
  
  document.body.appendChild(script1);
})();