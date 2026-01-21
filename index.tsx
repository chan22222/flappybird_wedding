/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

// --- Configuration ---
const CONFIG = {
  gravity: 0.08,
  jumpStrength: -3, // slightly floaty for easier play
  pipeSpeed: 1.8,
  pipeSpawnRate: 200, // frames
  pipeGap: 330, // vertical gap
  maxAttempts: 10, // Daily limit
};

const OBSTACLES = [
  { text: '야근', emoji: '🏢' },
  { text: '다이어트', emoji: '🥗' },
  { text: '텅장', emoji: '💸' },
  { text: '지하철지연', emoji: '🚇' },
  { text: '집값폭등', emoji: '📈' },
  { text: '코로나', emoji: '😷' },
  { text: '청첩장오타', emoji: '😱' },
  { text: '태풍', emoji: '🌪️' },
];

// --- Types ---
interface ScoreEntry {
  name: string;
  phone: string;
  score: number;
  timestamp: number;
}

// --- Gemini Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Game Engine ---
class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  
  state: 'MENU' | 'READY' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  score: number = 0;
  frames: number = 0;
  
  // Entities
  bird: { x: number; y: number; velocity: number; radius: number; rotation: number };
  pipes: Array<{ x: number; y: number; width: number; height: number; passed: boolean; type: 'TOP' | 'BOTTOM'; label?: string; emoji?: string }>;
  
  // DOM Elements
  uiMenu: HTMLElement;
  uiGameOver: HTMLElement;
  scoreDisplay: HTMLElement;
  rankDisplay: HTMLElement;
  aiMessageDisplay: HTMLElement;
  attemptsDisplay: HTMLElement;

  // Cheat code tracking
  cheatBuffer: string = '';
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    document.getElementById('app')!.appendChild(this.canvas);
    
    this.createUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Controls
    const jumpAction = (e: Event) => {
      e.preventDefault();
      if (this.state === 'MENU') {
        this.startGame();
      } else if (this.state === 'READY') {
        this.state = 'PLAYING';
        this.jump();
      } else if (this.state === 'PLAYING') {
        this.jump();
      }
    };
    
    this.canvas.addEventListener('mousedown', jumpAction);
    this.canvas.addEventListener('touchstart', jumpAction, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') jumpAction(e);

      // Cheat code detection
      this.cheatBuffer += e.key.toLowerCase();
      if (this.cheatBuffer.length > 10) {
        this.cheatBuffer = this.cheatBuffer.slice(-10);
      }
      if (this.cheatBuffer.includes('coin')) {
        this.addExtraLife();
        this.cheatBuffer = '';
      }
    });

    // Initial Setup
    this.reset();
    this.loop();
  }
  
  createUI() {
    // Menu Overlay
    this.uiMenu = document.createElement('div');
    this.uiMenu.className = 'overlay';
    this.uiMenu.innerHTML = `
      <h1>무사히 예식장까지!</h1>
      <div style="font-size: 4rem; margin: 20px;">🤵❤️👰</div>
      <p>화면을 터치해 장애물을 피하세요!</p>
      <p style="font-size: 0.8rem; color: #888;">하루 최대 ${CONFIG.maxAttempts}회 도전 가능</p>
      <p id="attemptsDisplay" style="font-size: 0.9rem; color: #e91e63; font-weight: bold;"></p>
      <button class="btn" id="startBtn">게임 시작</button>
    `;
    document.getElementById('app')!.appendChild(this.uiMenu);

    this.attemptsDisplay = this.uiMenu.querySelector('#attemptsDisplay')!;
    this.updateAttemptsDisplay();

    this.uiMenu.querySelector('#startBtn')!.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent immediate jump
        this.startGame();
    });

    // Score Display
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-board hidden';
    this.scoreDisplay.innerText = '0';
    document.getElementById('app')!.appendChild(this.scoreDisplay);

    // Game Over Overlay
    this.uiGameOver = document.createElement('div');
    this.uiGameOver.className = 'overlay hidden';
    this.uiGameOver.innerHTML = `
      <h2>게임 종료</h2>
      <div id="finalScore" style="font-size: 2.5rem; color: var(--accent-color); font-weight: bold;">0점</div>
      
      <div class="ai-message" id="aiMessage">
        <span class="loading">AI가 경기 내용을 분석 중입니다...</span>
      </div>

      <div class="input-group">
        <input type="text" id="inputName" placeholder="이름 (예: 홍길동)" maxlength="10">
        <input type="tel" id="inputPhone" placeholder="전화번호 뒷자리 (예: 1234)" maxlength="4">
      </div>
      
      <button class="btn" id="submitScoreBtn">기록 등록하기</button>
      
      <div class="leaderboard" id="leaderboardList">
        <!-- Ranks go here -->
      </div>
      
      <button class="btn" id="restartBtn" style="background: #aaa; font-size: 0.9rem; padding: 10px 20px;">다시 하기</button>
    `;
    document.getElementById('app')!.appendChild(this.uiGameOver);

    // Event Listeners for Game Over UI
    this.uiGameOver.querySelector('#submitScoreBtn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.submitScore();
    });
    
    this.uiGameOver.querySelector('#restartBtn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reset();
        this.uiGameOver.classList.add('hidden');
        this.uiMenu.classList.remove('hidden');
        this.state = 'MENU';
        this.updateAttemptsDisplay();
    });
  }
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  reset() {
    this.bird = {
      x: this.width * 0.2,
      y: this.height / 2,
      velocity: 0,
      radius: 20,
      rotation: 0
    };
    this.pipes = [];
    this.score = 0;
    this.frames = 0;
    this.scoreDisplay.innerText = '0';
  }

  getAttemptsKey(): string {
    const today = new Date().toDateString();
    return `wedding_game_attempts_${today}`;
  }

  getRemainingAttempts(): number {
    const attempts = parseInt(localStorage.getItem(this.getAttemptsKey()) || '0');
    return CONFIG.maxAttempts - attempts;
  }

  updateAttemptsDisplay() {
    const remaining = this.getRemainingAttempts();
    this.attemptsDisplay.innerText = `현재 ${remaining}회 남음`;
  }

  addExtraLife() {
    const storeKey = this.getAttemptsKey();
    const attempts = parseInt(localStorage.getItem(storeKey) || '0');
    if (attempts > 0) {
      localStorage.setItem(storeKey, (attempts - 1).toString());
      this.updateAttemptsDisplay();
      alert('코인 사용! 도전 기회 +1');
    } else {
      alert('이미 최대 횟수입니다!');
    }
  }

  checkAttemptLimit(): boolean {
    const attempts = parseInt(localStorage.getItem(this.getAttemptsKey()) || '0');

    if (attempts >= CONFIG.maxAttempts) {
        alert(`오늘은 기회를 다 썼어요! 내일 다시 도전해주세요. (최대 ${CONFIG.maxAttempts}회)`);
        return false;
    }

    localStorage.setItem(this.getAttemptsKey(), (attempts + 1).toString());
    this.updateAttemptsDisplay();
    return true;
  }
  
  startGame() {
    if (!this.checkAttemptLimit()) return;

    this.state = 'READY';
    this.uiMenu.classList.add('hidden');
    this.uiGameOver.classList.add('hidden');
    this.scoreDisplay.classList.remove('hidden');
    this.reset();
  }
  
  jump() {
    this.bird.velocity = CONFIG.jumpStrength;
  }
  
  endGame(collisionObstacle: string = '바닥') {
    this.state = 'GAMEOVER';
    this.scoreDisplay.classList.add('hidden');
    this.uiGameOver.classList.remove('hidden');
    
    const finalScoreEl = this.uiGameOver.querySelector('#finalScore')!;
    finalScoreEl.textContent = `${this.score}점`;

    // Reset input fields
    (this.uiGameOver.querySelector('#inputName') as HTMLInputElement).value = '';
    (this.uiGameOver.querySelector('#inputPhone') as HTMLInputElement).value = '';
    (this.uiGameOver.querySelector('#submitScoreBtn') as HTMLButtonElement).disabled = false;
    (this.uiGameOver.querySelector('#submitScoreBtn') as HTMLButtonElement).innerText = '기록 등록하기';

    this.renderLeaderboard();
    this.generateAIComment(collisionObstacle);
  }

  async generateAIComment(obstacle: string) {
    const aiContainer = document.getElementById('aiMessage')!;
    aiContainer.innerHTML = '<span class="loading">AI가 경기 내용을 분석 중입니다...</span>';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The user played a Flappy Bird-style wedding game called "Safely to the Wedding". 
            They scored ${this.score} points (distance). 
            They crashed into "${obstacle}".
            Write a funny, witty, short (1 sentence) reaction message in Korean.
            If the score is low (< 5), mock them gently or blame the obstacle.
            If the score is high (> 20), praise them.
            Tone: Friendly, wedding MC style.`,
        });
        
        aiContainer.innerText = `💬 ${response.text.trim()}`;
    } catch (e) {
        console.error(e);
        aiContainer.innerText = "💬 예식장 가는 길이 험난하네요! (AI 연결 실패)";
    }
  }

  submitScore() {
    const nameInput = document.getElementById('inputName') as HTMLInputElement;
    const phoneInput = document.getElementById('inputPhone') as HTMLInputElement;
    const btn = document.getElementById('submitScoreBtn') as HTMLButtonElement;
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || phone.length < 4) {
        alert("이름과 전화번호 뒷자리 4자리를 정확히 입력해주세요.");
        return;
    }

    const entry: ScoreEntry = {
        name,
        phone,
        score: this.score,
        timestamp: Date.now()
    };

    // Save to LocalStorage (Simulating Backend)
    const stored = localStorage.getItem('wedding_game_leaderboard');
    const leaderboard: ScoreEntry[] = stored ? JSON.parse(stored) : [];
    leaderboard.push(entry);
    
    // Sort: High score first, then earliest timestamp
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
    });

    localStorage.setItem('wedding_game_leaderboard', JSON.stringify(leaderboard));
    
    btn.disabled = true;
    btn.innerText = "등록 완료!";
    this.renderLeaderboard(entry);
  }

  renderLeaderboard(currentEntry?: ScoreEntry) {
    const list = document.getElementById('leaderboardList')!;
    list.innerHTML = '';
    
    const stored = localStorage.getItem('wedding_game_leaderboard');
    const leaderboard: ScoreEntry[] = stored ? JSON.parse(stored) : [];
    
    // Show top 5
    const top5 = leaderboard.slice(0, 5);
    
    top5.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'rank-item';
        if (currentEntry && item.timestamp === currentEntry.timestamp && item.name === currentEntry.name) {
            div.classList.add('highlight');
        }
        div.innerHTML = `
            <span>${index + 1}위 ${item.name} (${item.phone})</span>
            <span>${item.score}점</span>
        `;
        list.appendChild(div);
    });

    // If user is not in top 5, show their rank
    if (currentEntry) {
        const userRank = leaderboard.findIndex(i => i.timestamp === currentEntry.timestamp) + 1;
        if (userRank > 5) {
            const div = document.createElement('div');
            div.className = 'rank-item highlight';
            div.style.marginTop = '10px';
            div.style.borderTop = '1px dashed #ccc';
            div.innerHTML = `
                <span>${userRank}위 ${currentEntry.name} (${currentEntry.phone})</span>
                <span>${currentEntry.score}점</span>
            `;
            list.appendChild(div);
            
            // Show gap to next rank
            const prevRankScore = leaderboard[userRank - 2].score;
            const diff = prevRankScore - currentEntry.score;
            const msg = document.createElement('div');
            msg.style.fontSize = '0.8rem';
            msg.style.color = '#888';
            msg.style.textAlign = 'center';
            msg.innerText = `🚀 ${userRank - 1}위와 단 ${diff}점 차이!`;
            list.appendChild(msg);
        }
    }
  }

  update() {
    if (this.state !== 'PLAYING') return;
    
    this.frames++;
    
    // Physics
    this.bird.velocity += CONFIG.gravity;
    this.bird.y += this.bird.velocity;
    
    // Rotation logic
    if (this.bird.velocity < 0) this.bird.rotation = -25 * Math.PI / 180;
    else {
        this.bird.rotation += 2 * Math.PI / 180;
        if (this.bird.rotation > 70 * Math.PI / 180) this.bird.rotation = 70 * Math.PI / 180;
    }

    // Ceiling Collision
    if (this.bird.y - this.bird.radius <= 0) {
        this.endGame('하늘');
        return;
    }

    // Floor Collision
    if (this.bird.y + this.bird.radius >= this.height) {
        this.endGame('바닥');
        return;
    }
    
    // Difficulty Scaling (very gentle)
    const currentSpeed = CONFIG.pipeSpeed;
    const currentGap = CONFIG.pipeGap;
    
    // Pipe Spawning
    if (this.frames % CONFIG.pipeSpawnRate === 0) {
        const obstacleData = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        const minHeight = 50;
        const maxHeight = this.height - currentGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        const bottomY = topHeight + currentGap;
        
        // Add Top Pipe
        this.pipes.push({
            x: this.width,
            y: 0,
            width: 60,
            height: topHeight,
            passed: false,
            type: 'TOP',
            emoji: obstacleData.emoji,
            label: obstacleData.text
        });
        
        // Add Bottom Pipe
        this.pipes.push({
            x: this.width,
            y: bottomY,
            width: 60,
            height: this.height - bottomY,
            passed: false,
            type: 'BOTTOM',
            emoji: obstacleData.emoji,
            label: obstacleData.text
        });
    }
    
    // Pipe Logic
    for (let i = 0; i < this.pipes.length; i++) {
        const p = this.pipes[i];
        p.x -= currentSpeed;
        
        // Collision
        if (
            this.bird.x + this.bird.radius > p.x &&
            this.bird.x - this.bird.radius < p.x + p.width &&
            this.bird.y + this.bird.radius > p.y &&
            this.bird.y - this.bird.radius < p.y + p.height
        ) {
            this.endGame(p.label || '장애물');
            return;
        }
        
        // Scoring (only count top pipe to avoid double counting)
        if (p.type === 'TOP' && p.x + p.width < this.bird.x && !p.passed) {
            this.score++;
            this.scoreDisplay.innerText = this.score.toString();
            p.passed = true;
        }
    }
    
    // Remove off-screen pipes
    if (this.pipes.length > 0 && this.pipes[0].x < -100) {
        this.pipes.shift();
    }
  }
  
  draw() {
    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Background (Simple Cityscape effect)
    this.ctx.fillStyle = '#f0f8ff';
    this.ctx.fillRect(0, this.height - 100, this.width, 100);
    
    // Draw Pipes with modern design
    for (const p of this.pipes) {
        this.ctx.save();

        // Shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;

        // Gradient fill
        const gradient = this.ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(0.5, '#fecfef');
        gradient.addColorStop(1, '#fecfef');

        // Draw rounded rectangle
        const radius = 12;
        this.ctx.beginPath();
        if (p.type === 'TOP') {
            this.ctx.moveTo(p.x + radius, p.y);
            this.ctx.lineTo(p.x + p.width - radius, p.y);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width, p.y + radius);
            this.ctx.lineTo(p.x + p.width, p.y + p.height - radius);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y + p.height, p.x + p.width - radius, p.y + p.height);
            this.ctx.lineTo(p.x + radius, p.y + p.height);
            this.ctx.quadraticCurveTo(p.x, p.y + p.height, p.x, p.y + p.height - radius);
            this.ctx.lineTo(p.x, p.y + radius);
            this.ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
        } else {
            this.ctx.moveTo(p.x + radius, p.y);
            this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + radius);
            this.ctx.lineTo(p.x, p.y + p.height);
            this.ctx.lineTo(p.x + p.width, p.y + p.height);
            this.ctx.lineTo(p.x + p.width, p.y + radius);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width - radius, p.y);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Border
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = '#e91e63';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Inner highlight
        const innerGradient = this.ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(p.x + 5, p.y + 5, 15, p.height - 10);

        this.ctx.restore();

        // Emoji and label with better styling
        this.ctx.save();
        this.ctx.textAlign = 'center';

        if (p.type === 'TOP') {
            // Emoji at bottom of top pipe
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillText(p.emoji || '', p.x + p.width/2, p.height - 15);
        } else {
            // Label badge
            const badgeY = p.y + 25;
            this.ctx.fillStyle = 'rgba(233, 30, 99, 0.9)';
            this.ctx.beginPath();
            this.ctx.roundRect(p.x + 5, badgeY - 12, p.width - 10, 24, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(p.label || '', p.x + p.width/2, badgeY + 4);

            // Emoji below
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillText(p.emoji || '', p.x + p.width/2, p.y + 70);
        }
        this.ctx.restore();
    }
    
    // Draw Bird
    this.ctx.save();
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(this.bird.rotation);
    // Draw Couple Emojis
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🤵👰', 0, 0);
    this.ctx.restore();
    
    // Draw Floor
    /* Drawn as part of background simple rect */

    // Draw Ready Message
    if (this.state === 'READY') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('화면을 터치하면 시작!', this.width / 2, this.height / 2 + 60);

      this.ctx.font = '16px Arial';
      this.ctx.fillText('장애물을 피해 예식장까지!', this.width / 2, this.height / 2 + 95);
    }
  }
  
  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Start Game
window.onload = () => {
  new Game();
};
